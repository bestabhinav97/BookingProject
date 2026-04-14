/**
 * ========== BOOKING ROUTES ==========
 * Routes for booking management (create, retrieve, cancel)
 * All routes require: authenticated user
 * Some routes also have: rate limiting middleware
 */

const express = require("express");
const bookingRouter = express.Router();
const bookingController = require("../controller/bookingController");
const authMiddleWear = require("../middlewear/authMiddleWear");
const redisMiddleWear = require("../middlewear/redisMiddleWear");

// ===== APPLY AUTHENTICATION MIDDLEWARE TO ALL ROUTES =====
// All booking routes require valid JWT token
bookingRouter.use(authMiddleWear.checkLogin);

/**
 * POST /bookings/initiate
 * Start a new booking (create pending booking, generate Stripe session)
 *
 * REQUIRES: JWT authentication + rate limiting (max 5 requests per 5 min)
 *
 * REQUEST BODY:
 *   - roomNumber: Room to book
 *   - fromDate: Check-in date (YYYY-MM-DD)
 *   - toDate: Check-out date (YYYY-MM-DD)
 *
 * RESPONSE: Stripe checkout session URL for payment
 *
 * RATE LIMITING: Prevents users from spamming booking requests
 * Max 5 booking attempts per user per 5-minute window
 */
bookingRouter.post(
  "/initiate",
  redisMiddleWear.rateLimit,
  bookingController.initiateBooking,
);

/**
 * GET /bookings/getBookings
 * Retrieve all pending and confirmed bookings for authenticated user
 *
 * REQUIRES: JWT authentication
 *
 * RESPONSE: Array of user's bookings with details (room, dates, status, cost)
 */
bookingRouter.get("/getBookings", bookingController.getUserBookings);

/**
 * GET /bookings/cancelBooking/:bookingId
 * Cancel a user's booking
 *
 * REQUIRES: JWT authentication
 * URL PARAMS: bookingId - ID of booking to cancel
 *
 * NOTE: Only user's own bookings can be cancelled (security check in controller)
 *
 * RESPONSE: Success/failure message
 */
bookingRouter.get(
  "/cancelBooking/:bookingId",
  bookingController.cancelUserBooking,
);

module.exports = bookingRouter;
