/**
 * ========== ROOM MODEL ==========
 * Database layer for room-related queries
 * Handles SQL queries for room availability and details
 */

const db = require("../db/db");

/**
 * getAllAvailableRooms - Find rooms available for requested dates with minimum beds
 *
 * LOGIC:
 * 1. Filter rooms by minimum bed count (>= requested beds)
 * 2. Exclude rooms that have overlapping bookings
 * 3. Date overlap check: booking.fromDate < userToDate AND booking.toDate > userFromDate
 * 4. Return matching room objects (roomNumber, pricePerNight, noOfBeds, etc.)
 *
 * IMPORTANT: Date parameters are in specific order due to SQL logic
 * - userToDate is compared as <= check-in boundary
 * - userFromDate is compared as >= check-out boundary
 *
 * @param {number} noOfBeds - Minimum beds required
 * @param {string} userFromDate - User check-in (YYYY-MM-DD)
 * @param {string} userToDate - User check-out (YYYY-MM-DD)
 * @returns {array|false} Array of available rooms, false if none available
 */
module.exports.getAllAvailableRooms = async (
  noOfBeds,
  userFromDate,
  userToDate,
) => {
  try {
    const query = `
      SELECT * FROM room
      WHERE noOfBeds >= ?
      AND roomNumber NOT IN (
        SELECT roomNumber
        FROM bookings
        WHERE fromDate < ? AND toDate > ?
      )
    `;

    // Execute with parameterized values
    // Order: [beds, user_checkout_date, user_checkin_date]
    const [results] = await db.execute(query, [
      noOfBeds,
      userToDate,
      userFromDate,
    ]);

    // Return false if no rooms available, otherwise return array
    if (results.length === 0) {
      return false;
    }

    return results;
  } catch (error) {
    console.error("Database Error:", error);
    throw error;
  }
};

/**
 * getRoomDetails - Get full details for a specific room
 *
 * @param {number} roomNumber - Room ID to fetch
 * @returns {object} Room object (roomNumber, noOfBeds, pricePerNight, amenities, etc.)
 */
module.exports.getRoomDetails = async (roomNumber) => {
  try {
    const query = "SELECT * FROM room WHERE roomNumber = ?";
    const [result] = await db.execute(query, [roomNumber]);
    const roomDetails = result[0];
    return roomDetails;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * ========== ADMIN-ONLY FUNCTIONS ==========
 */

/**
 * getRoomSummary - Get room inventory statistics for admin dashboard
 *
 * RETURNS: Total room count and breakdown by bed type (1, 2, 3, 4 beds)
 * USED FOR: Admin dashboard inventory overview
 */
module.exports.getRoomSummary = async () => {
  try {
    // Query: Get total room count
    const totalQuery = "SELECT COUNT(*) as count FROM room";
    const [totalResult] = await db.execute(totalQuery);
    const totalRoomCount = totalResult[0].count;

    // Query: Count rooms by bed type
    const bedTypeCounts = {};
    for (let i = 1; i <= 4; i++) {
      const query = `SELECT COUNT(*) as count FROM room WHERE noOfBeds = ?`;
      const [result] = await db.execute(query, [i]);
      bedTypeCounts[`${i}Beds`] = result[0].count;
    }

    // Return summary object with total and breakdown
    return {
      totalRooms: totalRoomCount,
      byBedType: bedTypeCounts,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * addRoom - Add new room to inventory
 * (Currently not implemented - TODO)
 */
module.exports.addRoom = async () => {};
