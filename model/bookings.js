/**
 * ========== BOOKINGS MODEL ==========
 * Database layer for all booking operations
 * Handles SQL queries related to creating, updating, and retrieving bookings
 */

const db = require("../db/db");
const dayjs = require("dayjs");

/**
 * checkAvailability - Check if room is available for requested dates
 *
 * LOGIC:
 * 1. Find all bookings for this room with overlapping dates
 * 2. Include:
 *    - Confirmed bookings (definitely booked)
 *    - Pending bookings < 15 minutes old (user in checkout process)
 * 3. Exclude older pending bookings (likely abandoned, lock expired)
 * 4. Check for date overlap using date range logic
 * 5. Return true if NO overlapping bookings (room available)
 *
 * DATE OVERLAP EXPLANATION:
 * NOT (toDate <= ? OR fromDate >= ?)
 * - booking.toDate <= userFromDate: booking ends before user starts (✓ no overlap)
 * - booking.fromDate >= userToDate: booking starts after user ends (✓ no overlap)
 * - Otherwise: overlap detected (✗ room unavailable)
 *
 * @param {number} roomNumber - Room ID to check
 * @param {string} fromDate - User check-in date (YYYY-MM-DD)
 * @param {string} toDate - User check-out date (YYYY-MM-DD)
 * @returns {boolean} true if available, false if booked
 */
module.exports.checkAvailability = async (roomNumber, fromDate, toDate) => {
  try {
    const query = `
      SELECT * FROM bookings
      WHERE roomNumber = ?
      AND (
        status = 'confirmed'
        OR (status = 'pending' AND createdAt > NOW() - INTERVAL 15 MINUTE)
      )
      AND NOT (toDate <= ? OR fromDate >= ?)
    `;

    // Execute query with parameterized values (prevents SQL injection)
    const [result] = await db.execute(query, [
      roomNumber,
      fromDate, // Check-in comparison
      toDate, // Check-out comparison
    ]);

    // If no overlapping bookings found, room is available
    return result.length === 0;
  } catch (error) {
    console.log("Availability error:", error);
    throw error;
  }
};

/**
 * createNewBooking - Create a pending booking in database
 *
 * FLOW:
 * 1. Insert booking record with status = 'pending'
 * 2. Set all dates and cost information
 * 3. Return the auto-generated bookingId for later reference
 *
 * @param {number} userId - Booking user's ID
 * @param {number} roomNumber - Room being booked
 * @param {string} fromDate - Check-in date (YYYY-MM-DD)
 * @param {string} toDate - Check-out date (YYYY-MM-DD)
 * @param {number} totalCost - Total cost in currency (will be 100x for Stripe)
 * @returns {number} insertId - The new booking ID
 */
module.exports.createNewBooking = async (
  userId,
  roomNumber,
  fromDate,
  toDate,
  totalCost,
) => {
  try {
    const query = `
      INSERT INTO bookings (userId, roomNumber, status, fromDate, toDate, totalCost)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      userId,
      roomNumber,
      "pending", // Initial status until payment confirmed
      fromDate,
      toDate,
      totalCost,
    ]);

    // Return the auto-generated booking ID for later reference
    return result.insertId;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * confirmBooking - Update booking status from 'pending' to 'confirmed'
 *
 * CALLED BY: Stripe webhook after payment success
 * @param {number} bookingId - Booking to confirm
 * @returns {object} Database result object
 */
module.exports.confirmBooking = async (bookingId) => {
  const query = "UPDATE bookings SET status = 'confirmed' WHERE bookingId = ?";
  const [result] = await db.execute(query, [bookingId]);
  return result;
};

/**
 * getUserBookings - Fetch all bookings for a specific user
 *
 * @param {number} userId - User's ID
 * @returns {array|false} Array of booking objects, or false if no bookings
 */
module.exports.getUserBookings = async (userId) => {
  try {
    const query = "SELECT * FROM bookings WHERE userId = ?";
    const [result] = await db.execute(query, [userId]);

    // Return false if no bookings, array otherwise
    if (result.length == 0) {
      return false;
    } else {
      return result;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * cancelUserBooking - Cancel a user's booking
 *
 * FLOW:
 * 1. Update booking status to 'cancelled'
 * 2. Only allow cancellation of user's own booking (userId check)
 * 3. Return true if successful, false if booking not found/not owned
 *
 * @param {number} userId - User making cancellation request
 * @param {number} bookingId - Booking to cancel
 * @returns {boolean} true if cancelled, false if not found/unauthorized
 */
module.exports.cancelUserBooking = async (userId, bookingId) => {
  try {
    const query =
      "UPDATE bookings SET status = ? WHERE userId = ? AND bookingId = ?";

    const [result] = await db.execute(query, ["cancelled", userId, bookingId]);

    // affectedRows = 0 means booking not found or not owned by user
    if (result.affectedRows == 0) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * ========== ADMIN-ONLY FUNCTIONS ==========
 * These functions return data for the admin dashboard
 */

/**
 * getSummaryStatus - Get comprehensive booking statistics for admin dashboard
 *
 * Returns statistics by:
 * - Timeline: upcoming, today, next 7 days
 * - Status: confirmed, pending, cancelled
 * - Revenue: total and by period
 */
module.exports.getSummaryStatus = async () => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = dayjs();
    const dbToday = today.format("YYYY-MM-DD");

    // Query: Upcoming bookings (after today) with confirmed status
    const upcomingBookingQuery =
      "SELECT COUNT(*) AS count FROM bookings WHERE DATE(fromDate) > ? AND status = ?";
    const [upcomingResult] = await db.execute(upcomingBookingQuery, [
      dbToday,
      "confirmed",
    ]);
    const upcomingBookings = upcomingResult[0].count;

    // Query: Today's bookings (check-in today) with confirmed status
    const todaysBookingQuery =
      "SELECT COUNT(*) AS count FROM bookings WHERE DATE(fromDate) = ? AND status = ?";
    const [todayResult] = await db.execute(todaysBookingQuery, [
      dbToday,
      "confirmed",
    ]);
    const todaysBookings = todayResult[0].count;

    // Query: Cancelled bookings in future dates
    const cancelledBookingQuery =
      "SELECT COUNT(*) AS count FROM bookings WHERE status = ? AND DATE(fromDate) > ?";
    const [cancelledBookingResult] = await db.execute(cancelledBookingQuery, [
      "cancelled",
      dbToday,
    ]);
    const cancelledBookings = cancelledBookingResult[0].count;

    // Query: Pending bookings in future dates
    const pendingBookingQuery = `
      SELECT COUNT(*) AS count
      FROM bookings
      WHERE status = ?
        AND fromDate > ?
    `;
    const [pendingBookingResult] = await db.execute(pendingBookingQuery, [
      "pending",
      dbToday,
    ]);
    const pendingBookings = pendingBookingResult[0].count;

    // Query: Total bookings (all time, all statuses)
    const totalBookingQuery = `
      SELECT COUNT(*) AS count
      FROM bookings
    `;
    const [totalBookingResult] = await db.execute(totalBookingQuery);
    const totalBookings = totalBookingResult[0].count;

    // Query: Confirmed bookings in next 7 days
    const next7DaysQuery = `
      SELECT COUNT(*) AS count
      FROM bookings
      WHERE fromDate BETWEEN ? AND DATE_ADD(?, INTERVAL 7 DAY)
        AND status = ?
    `;
    const [next7DaysResult] = await db.execute(next7DaysQuery, [
      today,
      today,
      "confirmed",
    ]);
    const next7DaysBookings = next7DaysResult[0].count;

    // Query: Total revenue from confirmed bookings
    const totalRevenueQuery = `
      SELECT SUM(totalCost) AS totalRevenue
      FROM bookings
      WHERE status = ?
    `;
    const [totalRevenueResult] = await db.execute(totalRevenueQuery, [
      "confirmed",
    ]);
    const totalRevenue = parseFloat(totalRevenueResult[0].totalRevenue) || 0;

    // Query: Revenue from confirmed bookings in next 7 days
    const next7DaysRevenueQuery = `
      SELECT SUM(totalCost) AS next7DaysRevenue
      FROM bookings
      WHERE status = ?
        AND fromDate > ?
        AND fromDate <= DATE_ADD(?, INTERVAL 7 DAY)
    `;
    const [next7DaysRevenueResult] = await db.execute(next7DaysRevenueQuery, [
      "confirmed",
      today,
      today,
    ]);
    const next7DaysRevenue =
      parseFloat(next7DaysRevenueResult[0].next7DaysRevenue) || 0;

    // Return summary object with all statistics for dashboard
    return {
      upcomingBookings, // Future check-ins (confirmed)
      todaysBookings, // Check-ins today (confirmed)
      cancelledBookings, // Cancelled future bookings
      pendingBookings, // Awaiting payment
      totalBookings, // All bookings ever made
      next7DaysBookings, // Confirmations in next 7 days
      totalRevenue, // Sum of all confirmed booking costs
      next7DaysRevenue, // Revenue from next 7 days
    };
  } catch (error) {
    console.error("Error fetching summary status:", error);
    throw error;
  }
};

/**
 * getAllBookings - Get complete list of all bookings for admin management
 *
 * @returns {array} All bookings (all users, all statuses)
 */
module.exports.getAllBookings = async () => {
  try {
    const getAllBookingsQuery = "SELECT * FROM bookings";
    // Execute query and return all bookings
    const [allBookings] = await db.execute(getAllBookingsQuery);
    return allBookings;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
