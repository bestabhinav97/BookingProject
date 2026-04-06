require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
const dayjs = require("dayjs");
const helperFunction = require("../utils/helperFunctions");
const bookingModel = require("../model/bookings");
const roomModel = require("../model/room");
const emailHelper = require("../utils/email");

module.exports.initiateBooking = async (req, res, next) => {
  try {
    const user = req.user;
    const { roomNumber, fromDate, toDate } = req.body;

    const startDate = dayjs(fromDate);
    const endDate = dayjs(toDate);

    const dbStartDate = startDate.format("YYYY-MM-DD");
    const dbEndDate = endDate.format("YYYY-MM-DD");

    // CHECK DATE FORMATS
    const checkDates = helperFunction.checkDates(fromDate, toDate);
    if (checkDates.success == false) {
      return res
        .status(400)
        .json({ success: false, message: checkDates.message });
    }

    // VERIFY AVAILABILITY
    const checkAvailability = await bookingModel.checkAvailability(
      roomNumber,
      dbStartDate,
      dbEndDate,
    );
    console.log("Check result:", checkAvailability);

    if (checkAvailability) {
      console.log("NICE GOOD JOB");
      const roomDetails = await roomModel.getRoomDetails(roomNumber);
      if (!roomDetails) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }
      const roomCost = roomDetails.pricePerNight;
      const nights = endDate.diff(startDate, "day");
      const totalCost = roomCost * nights;

      // CREATE NEW BOOKING IN DB
      const newBookingId = await bookingModel.createNewBooking(
        user.userId,
        roomNumber,
        dbStartDate,
        dbEndDate,
        totalCost,
      );

      // CREATE STRIPE SESSION
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        success_url: "https://google.com",
        cancel_url: "https://stripe.com",
        metadata: {
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
              unit_amount: totalCost * 100, // STRIPE NEEDS PAYMENT IN CENTS
            },
            quantity: 1,
          },
        ],
      });

      return res.status(200).json({
        success: true,
        url: session.url,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "ROOM ALREADY BOOKED" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// CONST WEBHOOK TO VERIFY PAYMENT
module.exports.handleWebHook = async (req, res, next) => {
  // Added next here

  // GET SINGATURE
  const sig = req.headers["stripe-signature"];
  let event;

  // CONSTRUCT EVENT
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_KEY,
    );
  } catch (error) {
    console.log("❌ Webhook Signature Error:", error.message);
    return next(error); // Return here so the code stops if signature fails
  }

  // 1. FIXED TYPO: "checkout.session.completed" (with a 'k' and 'ed')
  // 2. FIXED OPERATOR: Use === (comparison) not = (assignment)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // PULL THE ID FROM THE METADATA
    const bookingId = session.metadata.bookingId;
    const customerEmail = session.customer_details.email;

    if (bookingId) {
      console.log(`✅ BOOKING CONFIRMED FOR ${bookingId}`);
      try {
        await bookingModel.confirmBooking(bookingId);

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

  // Move this OUTSIDE the if block so Stripe gets a 200 for every event
  res.json({ received: true });
};

// GET USER BOOKINGS

module.exports.getUserBookings = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user.userId) {
      return res.status(400).json({
        success: false,
        message: "INVALID USERID",
      });
    }

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

// CANCEL USER BOOKINGS

module.exports.cancelUserBooking = async (req, res, next) => {
  try {
    const user = req.user;
    const bookingId = req.params.bookingId;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "INVALID USER",
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "INVALID OR NO BOOKING ID",
      });
    }

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
