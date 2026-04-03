const db = require("../db/db");

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

    // Order matters: [beds, user_checkout_date, user_checkin_date]
    const [results] = await db.execute(query, [
      noOfBeds,
      userToDate,
      userFromDate,
    ]);

    // Check if the array has any rooms in it
    if (results.length === 0) {
      return false; // Or return [] depending on how your controller handles it
    }

    return results;
  } catch (error) {
    console.error("Database Error:", error);
    throw error;
  }
};

// GET ROOM DETAILS
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
