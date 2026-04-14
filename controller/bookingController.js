require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
const dayjs = require("dayjs");
const helperFunction = require("../utils/helperFunctions");
const bookingModel = require("../model/bookings");
const roomModel = require("../model/room");
const emailHelper = require("../utils/email");
const { client } = require("../reddis");

/**
 * ========== BOOKING CONTROLLER ==========
 * Handles all booking-related operations:
 * - Initiating new bookings (checking availability, creating Stripe session)
 * - Processing Stripe webhook payments
 * - Fetching user bookings
 * - Cancelling bookings
 *
 * KEY CONCEPTS:
 * 1. Redis Lock: Prevents race conditions when multiple users book same room
 * 2. Booking States: pending → confirmed (after payment) OR cancelled
 * 3. Stripe Integration: Delegates payment processing, confirms on webhook
 */

/**
 * initiateBooking - Start booking process for a room
 *
 * FLOW:
 * 1. Acquire Redis lock to prevent other users booking same room
 * 2. Validate dates (not past, proper format)
 * 3. Check room availability in database
 * 4. Calculate total cost (pricePerNight * number of nights)
 * 5. Create booking record in DB with 'pending' status
 * 6. Generate Stripe checkout session
 * 7. Return Stripe payment URL to client
 * 8. Release Redis lock in finally block
 *
 * REQUEST BODY:
 *   - roomNumber: ID of room to book
 *   - fromDate: Check-in date (YYYY-MM-DD)
 *   - toDate: Check-out date (YYYY-MM-DD)
 *
 * RETURNS: Stripe session URL for user to complete payment
 */
module.exports.initiateBooking = async (req, res, next) => {
  // Extract booking details from request
  const { roomNumber, fromDate, toDate } = req.body;
  // Create unique Redis key for this room's lock
  const redisLock = `roomNumber:${roomNumber}:lock`;
  // Get authenticated user from middleware
  const user = req.user;

  /**
   * REDIS LOCK MECHANISM - Prevent Overselling
   * - NX: Only set if key doesn't exist (atomic operation - race condition safe)
   * - EX: 60 second expiration (prevents deadlock if request fails)
   * - Returns true if lock acquired, null if already locked by another user
   *
   * WHY THIS IS IMPORTANT:
   * Without this lock, two users could simultaneously:
   * 1. Both check room is available ✓
   * 2. Both create bookings ✓
   * 3. Both bookings confirmed by payment ✗ (room oversold!)
   */
  const lock = await client.set(redisLock, String(user.userId), {
    NX: true, // Only set if doesn't exist
    EX: 60, // Expire after 60 seconds
  });

  try {
    // If lock already held by another user, reject this booking attempt
    if (!lock) {
      return res.status(201).json({
        success: true,
        message:
          "Someone else might be trying to book the room please try again later.",
      });
    }

    // Parse dates using dayjs (timezone-aware date library)
    const startDate = dayjs(fromDate);
    const endDate = dayjs(toDate);

    // Format dates to YYYY-MM-DD for database queries
    const dbStartDate = startDate.format("YYYY-MM-DD");
    const dbEndDate = endDate.format("YYYY-MM-DD");

    // ===== STEP 1: VALIDATE DATES =====
    // Checks: valid format, not in past, check-out after check-in
    const checkDates = helperFunction.checkDates(fromDate, toDate);
    if (checkDates.success == false) {
      return res
        .status(400)
        .json({ success: false, message: checkDates.message });
    }

    // ===== STEP 2: CHECK ROOM AVAILABILITY =====
    // Query database for existing confirmed/recent pending bookings that overlap these dates
    const checkAvailability = await bookingModel.checkAvailability(
      roomNumber,
      dbStartDate,
      dbEndDate,
    );

    // If room is available, proceed with booking
    if (checkAvailability) {
      console.log("NICE GOOD JOB");

      // ===== STEP 3: GET ROOM DETAILS & CALCULATE COST =====
      const roomDetails = await roomModel.getRoomDetails(roomNumber);
      if (!roomDetails) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      // Calculate total cost: price per night × number of nights
      const roomCost = roomDetails.pricePerNight;
      const nights = endDate.diff(startDate, "day"); // Difference in days
      const totalCost = roomCost * nights;

      // ===== STEP 4: CREATE BOOKING RECORD IN DATABASE =====
      // Status = 'pending' until payment is confirmed via Stripe webhook
      const newBookingId = await bookingModel.createNewBooking(
        user.userId,
        roomNumber,
        dbStartDate,
        dbEndDate,
        totalCost,
      );

      // ===== STEP 5: CREATE STRIPE CHECKOUT SESSION =====
      // User will be redirected to Stripe's hosted checkout page
      // On successful payment, Stripe sends webhook to our /webhook endpoint
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        success_url: "https://google.com",
        cancel_url: "https://stripe.com",
        metadata: {
          // Store bookingId in metadata so we can retrieve it from webhook
          bookingId: newBookingId.toString(),
        },
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "sek",
              product_data: {
                name: `ROOM ${roomNumber} RESERVATION`,
                description: `Booking from ${dbStartDate} to ${dbEndDate}`,
              },
              // Stripe expects amount in cents, so multiply by 100
              unit_amount: totalCost * 100,
            },
            quantity: 1,
          },
        ],
      });

      // Return Stripe checkout URL to client
      // Client redirects to this URL for payment
      return res.status(200).json({
        success: true,
        url: session.url,
      });
    } else {
      // Room is unavailable for these dates
      return res
        .status(400)
        .json({ success: false, message: "ROOM ALREADY BOOKED" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  } finally {
    // ===== CLEANUP: RELEASE REDIS LOCK =====
    // Always runs after try/catch, even if errors occur
    // Ensures other users can attempt to book this room
    if (lock) {
      const currentOwner = await client.get(redisLock);

      // Only delete lock if we still own it (safeguard against multiple deletes)
      if (currentOwner === String(user.userId)) {
        await client.del(redisLock);
      }
    }
  }
};

/**
 * handleWebHook - Stripe webhook handler for payment confirmation
 *
 * FLOW:
 * 1. Extract Stripe signature from request headers
 * 2. Verify signature matches expected value (prevents unauthorized requests)
 * 3. Parse webhook event from request body
 * 4. Check if event is 'checkout.session.completed' (payment successful)
 * 5. Extract bookingId from session metadata
 * 6. Update booking status from 'pending' to 'confirmed'
 * 7. Send confirmation email to customer
 *
 * IMPORTANT: This endpoint should return HTTP 200 for ALL requests (even errors)
 * because Stripe will keep retrying if it doesn't get 200 response
 */
module.exports.handleWebHook = async (req, res, next) => {
  // ===== STEP 1: VALIDATE WEBHOOK SIGNATURE =====
  // Extract signature from Stripe request headers
  const sig = req.headers["stripe-signature"];
  let event;

  // Verify the webhook is actually from Stripe (not a spoofed request)
  // Cannot be spoofed because it uses HMAC-SHA256 with our webhook secret
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_KEY,
    );
  } catch (error) {
    console.log("❌ Webhook Signature Error:", error.message);
    // Return to stop processing if signature doesn't match
    return next(error);
  }

  // ===== STEP 2: CHECK IF PAYMENT WAS COMPLETED =====
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Extract bookingId from metadata (stored when creating session)
    const bookingId = session.metadata.bookingId;
    const customerEmail = session.customer_details.email;

    if (bookingId) {
      console.log(`✅ BOOKING CONFIRMED FOR ${bookingId}`);
      try {
        // Update booking status from 'pending' to 'confirmed'
        await bookingModel.confirmBooking(bookingId);

        // Send confirmation email to customer
        await emailHelper.sendEmail({
          email: customerEmail,
          subject: "Reservation Confirmed!",
          message: `Your payment was successful! Your booking ID is ${bookingId}. We look forward to seeing you.`,
        });
      } catch (dbError) {
        console.log("❌ Database Error:", dbError.message);
        return next(dbError);
      }
    }
  }

  // Return 200 OK for ALL Stripe events
  // This tells Stripe the webhook was successfully received
  res.json({ received: true });
};

/**
 * getUserBookings - Retrieve all bookings for authenticated user
 *
 * FLOW:
 * 1. Extract userId from authenticated request (set by auth middleware)
 * 2. Query database for all bookings by this user
 * 3. Return booking records to client
 */
module.exports.getUserBookings = async (req, res, next) => {
  try {
    const user = req.user;

    // Validate userId exists
    if (!user.userId) {
      return res.status(400).json({
        success: false,
        message: "INVALID USERID",
      });
    }

    // Query all bookings for this user
    const userBookings = await bookingModel.getUserBookings(user.userId);
    if (userBookings == false) {
      return res.status(200).json({
        success: true,
        message: "NO BOOKINGS FOUND",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "BOOKINGS FOUND",
        data: userBookings,
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * cancelUserBooking - Cancel a booking
 *
 * FLOW:
 * 1. Extract userId from auth middleware and bookingId from URL params
 * 2. Validate both exist
 * 3. Call model to cancel booking (update status to 'cancelled')
 * 4. Only booking's owner can cancel their own booking
 */
module.exports.cancelUserBooking = async (req, res, next) => {
  try {
    const user = req.user;
    const bookingId = req.params.bookingId;

    // Validate user exists
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "INVALID USER",
      });
    }

    // Validate bookingId provided
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "INVALID OR NO BOOKING ID",
      });
    }

    // Cancel the booking (sets status to 'cancelled')
    const result = await bookingModel.cancelUserBooking(user.userId, bookingId);
    if (result == false) {
      return res
        .status(200)
        .json({ success: false, message: "NO BOOKINGS FOUND" });
    } else {
      return res
        .status(200)
        .json({ success: true, message: "BOOKING CANCELLED SUCCESSFULLY" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
