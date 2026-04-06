const db = require("../db/db");
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

// CONFIRM USER BOOKING
module.exports.confirmBooking = async (bookingId) => {
  const query = "UPDATE bookings SET status = 'confirmed' WHERE bookingId = ?";
  const [result] = await db.execute(query, [bookingId]);
  return result;
};

// GET USER BOOKINGS
module.exports.getUserBookings = async (userId) => {
  try {
    const query = "SELECT * from bookings where userId = ?";
    const [result] = await db.execute(query, [userId]);

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

// CANCEL USER BOOKINGS
module.exports.cancelUserBooking = async (userId, bookingId) => {
  try {
    const query =
      "UPDATE bookings SET status = ? WHERE userId = ? and bookingId = ?";

    const [result] = await db.execute(query, ["cancelled", userId, bookingId]);
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
