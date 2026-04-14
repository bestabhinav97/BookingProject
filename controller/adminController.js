/**
 * ========== ADMIN CONTROLLER ==========
 * Admin-only endpoints for dashboard and booking management
 * All routes require: authenticated user + admin role
 */

const bookingModel = require("../model/bookings");
const roomModel = require("../model/room");

/**
 * getDashboardBookingsSummary - Get booking statistics for admin dashboard
 *
 * RETURNS: Count of upcoming, today's, cancelled, and pending bookings
 * USED FOR: Dashboard to show booking overview
 */
module.exports.getDashboardBookingsSummary = async (req, res, next) => {
  try {
    const user = req.user;

    // Get summary statistics from model (counts by status and date)
    const summary = await bookingModel.getSummaryStatus();

    // Return dashboard JSON with summary
    return res.status(200).json({
      success: true,
      permission: true,
      message: `HELLO ADMIN: ${user.name}`,
      data: summary, // Includes upcomingBookings, todaysBookings, cancelledBookings, etc.
    });
  } catch (error) {
    console.error("Error in getDashboard:", error);
    next(error); // Pass to global error handler
  }
};

/**
 * getDashboardRoomSummary - Get room statistics for admin dashboard
 *
 * RETURNS: Total room count and breakdown by number of beds
 * USED FOR: Dashboard to show inventory overview
 */
module.exports.getDashboardRoomSummary = async (req, res, next) => {
  try {
    const summary = await roomModel.getRoomSummary();
    if (!summary) {
      return res.status(200).json({ success: true, message: "NO ROOMS FOUND" });
    }
    return res
      .status(200)
      .json({ success: true, data: summary, message: "Room summary fetched." });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * getAllBookings - Retrieve all bookings for admin management
 *
 * RETURNS: Complete list of all bookings (all statuses, all users)
 * USED FOR: Admin to manage and view all bookings
 */
module.exports.getAllBookings = async (req, res, next) => {
  try {
    const allBookings = await bookingModel.getAllBookings();
    if (allBookings.length == 0) {
      res.status(200).json({ success: true, message: "NO BOOKINGS FOUND" });
    } else {
      res.status(200).json({ success: true, data: allBookings });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * addRoom - Add new room to inventory
 * (Currently not implemented - TODO)
 */
module.exports.addRoom = async (req, res) => {};
