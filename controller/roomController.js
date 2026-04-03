const dayjs = require("dayjs"); // Changed to lowercase 'dayjs' (standard)
const roomModel = require("../model/room");
const helperFunction = require("../utils/helperFunctions");

// GET ALL AVAILABLE ROOMS
module.exports.getAllAvailableRoom = async (req, res, next) => {
  try {
    const { fromDate, toDate, noOfBedsRequired } = req.body;
    const user = req.user;

    const startDate = dayjs(fromDate);
    const endDate = dayjs(toDate);
    const today = dayjs().startOf("day"); // Current date at 00:00:00

    const checkDate = helperFunction.checkDates(fromDate, toDate);

    if (checkDate.success == false) {
      return res
        .status(400)
        .json({ success: false, message: checkDate.message });
    }

    // 4. FORMAT FOR SQL
    const dbStartDate = startDate.format("YYYY-MM-DD");
    const dbEndDate = endDate.format("YYYY-MM-DD");

    // 5. CALL MODEL
    // Note: We pass dbEndDate first to match the 'fromDate < ?' in our SQL logic
    const result = await roomModel.getAllAvailableRooms(
      noOfBedsRequired,
      dbEndDate,
      dbStartDate,
    );

    if (!result || result.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No rooms available for these dates.",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "ROOMS FETCHED",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
