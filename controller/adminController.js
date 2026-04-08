const bookingModel = require("../model/bookings");
const roomModel = require("../model/room");

// SUMMARY STATUS FOR DASHBOARD
module.exports.getDashboard = async (req, res, next) => {
  try {
    const user = req.user;

    // Get summary data from the model
    const summary = await bookingModel.getSummaryStatus();

    // Return dashboard JSON with summary
    return res.status(200).json({
      success: true,
      permission: true,
      message: `HELLO ADMIN: ${user.name}`,
      data: summary, // includes upcomingBookings and todaysBookings
    });
  } catch (error) {
    console.error("Error in getDashboard:", error);
    next(error); // pass to global error handler
  }
};

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
