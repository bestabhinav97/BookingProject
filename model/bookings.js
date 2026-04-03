const { toDate } = require("validator");
const db = require("../db/db");
module.exports.checkAvailability = async (roomNumber, fromDate, toDate) => {
  try {
    const query = `
      SELECT * FROM bookings
      WHERE roomNumber = ?
      AND status = 'confirmed'
      AND NOT (toDate <= ? OR fromDate >= ?)
    `;

    const [result] = await db.execute(query, [
      roomNumber,
      fromDate, // start date
      toDate, // end date
    ]);

    // If no rows → room is available
    return result.length === 0;
  } catch (error) {
    console.log("Availability error:", error);
    throw error;
  }
};

module.exports.createNewBooking = async (
  userId,
  roomNumber,
  fromDate,
  toDate,
  totalCost,
) => {
  try {
    const query = `
      INSERT INTO bookings (userId, roomNumber,status, fromDate, toDate, totalCost)
      VALUES (?, ?, ?, ?, ?,?)
    `;

    const [result] = await db.execute(query, [
      userId,
      roomNumber,
      "pending",
      fromDate,
      toDate,
      totalCost,
    ]);

    // Return the inserted ID
    return result.insertId;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports.confirmBooking = async (bookingId) => {
  const query = "UPDATE bookings SET status = 'confirmed' WHERE bookingId = ?";
  const [result] = await db.execute(query, [bookingId]);
  return result;
};
