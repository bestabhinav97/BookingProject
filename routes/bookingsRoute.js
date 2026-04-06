const exresss = require("express");
const bookingRouter = exresss.Router();
const bookingController = require("../controller/bookingController");
const authMiddleWear = require("../middlewear/authMiddleWear");

bookingRouter.use(authMiddleWear.checkLogin);

// INITIATE BOOKING
bookingRouter.post("/initiate", bookingController.initiateBooking);

//GET USER BOOKINGS
bookingRouter.get("/getBookings", bookingController.getUserBookings);

// CANCELL USER BOOKINGS
bookingRouter.get(
  "/cancelBooking/:bookingId",
  bookingController.cancelUserBooking,
);

module.exports = bookingRouter;
