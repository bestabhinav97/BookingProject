const db = require("../db/db");
const dayjs = require("dayjs");
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

// ==========================================================================================
// ONLY FOR THE ADMIN

// GET SUMMARY STATUS FOR THE DASHBOARD
module.exports.getSummaryStatus = async () => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = dayjs();
    const dbToday = today.format("YYYY-MM-DD");

    // Query to get upcoming bookings (after today) with status 'confirmed'
    const upcomingBookingQuery =
      "SELECT COUNT(*) AS count FROM bookings WHERE DATE(fromDate) > ? AND status = ?";
    const [upcomingResult] = await db.execute(upcomingBookingQuery, [
      dbToday,
      "confirmed",
    ]);
    const upcomingBookings = upcomingResult[0].count;

    // Query to get today's bookings with status 'confirmed'
    const todaysBookingQuery =
      "SELECT COUNT(*) AS count FROM bookings WHERE DATE(fromDate) = ? AND status = ?";
    const [todayResult] = await db.execute(todaysBookingQuery, [
      dbToday,
      "confirmed",
    ]);
    const todaysBookings = todayResult[0].count;

    // QUERY TO GET CANCELLED BOOKING
    const cancelledBookingQuery =
      "SELECT COUNT(*) AS count FROM bookings WHERE status = ? AND DATE(fromDate) > ? ";
    const [cancelledBookingResult] = await db.execute(cancelledBookingQuery, [
      "cancelled",
      dbToday,
    ]);
    const cancelledBookings = cancelledBookingResult[0].count;

    // QUERY TO GET PENDING BOOKINGS
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

    // TOTAL BOOKINGS
    const totalBookingQuery = `
  SELECT COUNT(*) AS count
  FROM bookings
`;
    const [totalBookingResult] = await db.execute(totalBookingQuery);
    const totalBookings = totalBookingResult[0].count;

    // NEXT 7 DAYS
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

    // TOTAL REVENUE
    // Total revenue from confirmed bookings
    const totalRevenueQuery = `
  SELECT SUM(totalCost) AS totalRevenue
  FROM bookings
  WHERE status = ?
`;
    const [totalRevenueResult] = await db.execute(totalRevenueQuery, [
      "confirmed",
    ]);
    const totalRevenue = parseFloat(totalRevenueResult[0].totalRevenue) || 0;

    // REVENUE FOR NEXT 7 DAYS
    // Revenue for confirmed bookings in the next 7 days
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

    // Return a JSON object with both counts
    return {
      upcomingBookings,
      todaysBookings,
      cancelledBookings,
      pendingBookings,
      totalBookings,
      next7DaysBookings,
      totalRevenue,
      next7DaysRevenue,
    };
  } catch (error) {
    console.error("Error fetching summary status:", error);
    throw error;
  }
};

// GET ALL BOOKINGS FOR ADMIN
module.exports.getAllBookings = async () => {
  try {
    const getAllBookingsQuery = "SELECT * from bookings";
    const [allBookings] = await db.execute(getAllBookingsQuery);
    return allBookings;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
