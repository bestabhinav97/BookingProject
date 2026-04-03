const stripe = require("stripe");
const dayjs = require("dayjs");
const helperFunction = require("../utils/helperFunctions");
const bookingModel = require("../model/bookings");
const roomModel = require("../model/room");

module.exports.initiateBooking = async (req, res, next) => {
  try {
    const user = req.user;
    const { roomNumber, fromDate, toDate } = req.body;

    const startDate = dayjs(fromDate);
    const endDate = dayjs(toDate);

    const dbStartDate = startDate.format("YYYY-MM-DD");
    const dbEndDate = endDate.format("YYYY-MM-DD");

    const checkDates = helperFunction.checkDates(fromDate, toDate);
    if (checkDates.success == false) {
      return res
        .status(400)
        .json({ success: false, message: checkDates.message });
    }

    const checkAvailability = await bookingModel.checkAvailability(
      roomNumber,
      dbStartDate,
      dbEndDate,
    );

    if (checkAvailability) {
      console.log("NICE GOOD JOB");
      const roomDetails = await roomModel.getRoomDetails(roomNumber);
      if (!roomDetails) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }
      const roomCost = roomDetails.pricePerNight;
      const nights = endDate.diff(startDate, "day");
      const totalCost = roomCost * nights;

      const newBookingId = await bookingModel.createNewBooking(
        user.userId,
        roomNumber,
        dbStartDate,
        dbEndDate,
        totalCost,
      );
    } else {
      return res
        .status(400)
        .json({ success: false, message: "ROOM ALREADY BOOKED" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
