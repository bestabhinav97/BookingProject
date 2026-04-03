const { toDate } = require("validator");
const db = require("../db/db");
module.exports.checkAvailability = async (roomNumber, fromDate, toDate) => {
  try {
    const query =
      "SELECT * from bookings WHERE roomNumber = ? AND status = 'confirmed' AND (fromDate  < ? AND toDate > ?)";
    const [result] = await db.execute(query, [roomNumber, fromDate, toDate]);
    return result.length === 0;
  } catch (error) {
    console.log(error);
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
      VALUES (?, ?, ?, ?, ?)
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
