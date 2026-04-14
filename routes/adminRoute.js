/**
 * ========== ADMIN ROUTES ==========
 * Routes for admin dashboard and booking management
 *
 * MIDDLEWARE STACK (applied in order):
 * 1. authMiddleWear.checkLogin - Verify user is authenticated
 * 2. authMiddleWear.isAdmin - Verify user has admin role
 *
 * Result: Only authenticated admin users can access these routes
 */

const express = require("express");
const adminRouter = express.Router();
const authMiddleWear = require("../middlewear/authMiddleWear");
const adminController = require("../controller/adminController");

// ===== APPLY AUTHENTICATION + ADMIN CHECKS TO ALL ROUTES =====
// 1. Check user is logged in
adminRouter.use(authMiddleWear.checkLogin);
// 2. Check user has admin role (403 error if not admin)
adminRouter.use(authMiddleWear.isAdmin);

/**
 * GET /admin/adminDashboard/getBookingSummary
 * Fetch booking statistics for admin dashboard
 *
 * REQUIRES: Admin authentication
 *
 * RESPONSE: Booking counts by status and period
 *   - upcomingBookings: Future confirmed bookings
 *   - todaysBookings: Check-ins scheduled for today
 *   - cancelledBookings: Cancelled future bookings
 *   - pendingBookings: Awaiting payment
 *   - And more revenue/timeline statistics
 */
adminRouter.get(
  "/adminDashboard/getBookingSummary",
  adminController.getDashboardBookingsSummary,
);

/**
 * GET /admin/adminDashboard/getRoomSummary
 * Fetch room inventory statistics for admin dashboard
 *
 * REQUIRES: Admin authentication
 *
 * RESPONSE: Room count data
 *   - totalRooms: Total rooms in inventory
 *   - byBedType: Breakdown by bed count (1-bed, 2-bed, etc.)
 */
adminRouter.get(
  "/adminDashboard/getRoomSummary",
  adminController.getDashboardRoomSummary,
);

/**
 * GET /admin/adminDashboard/getAllBookings
 * Retrieve ALL bookings (all users, all statuses)
 *
 * REQUIRES: Admin authentication
 *
 * RESPONSE: Complete list of all bookings in system
 * USED FOR: Admin to manage and view all bookings
 */
adminRouter.get(
  "/adminDashboard/getAllBookings",
  adminController.getAllBookings,
);

module.exports = adminRouter;
