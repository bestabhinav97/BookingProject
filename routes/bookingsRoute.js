const exresss = require("express");
const bookingRouter = exresss.Router();
const bookingController = require("../controller/bookingController");
const authMiddleWear = require("../middlewear/authMiddleWear");

bookingRouter.use(authMiddleWear.checkLogin);

bookingRouter.post("/initiate", bookingController.initiateBooking);



module.exports = bookingRouter;
