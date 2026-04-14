/**
 * ========== ROOM CONTROLLER ==========
 * Handles room-related queries:
 * - Getting available rooms for date range and bed requirements
 */

const dayjs = require("dayjs");
const roomModel = require("../model/room");
const helperFunction = require("../utils/helperFunctions");

/**
 * getAllAvailableRoom - Fetch available rooms for requested dates and bed count
 *
 * FLOW:
 * 1. Extract query parameters: fromDate, toDate, noOfBedsRequired
 * 2. Validate number of beds required (must be >= 1)
 * 3. Validate date range (valid format, not in past, check-out after check-in)
 * 4. Format dates to YYYY-MM-DD for database query
 * 5. Query database for rooms with >= requested beds that aren't booked
 * 6. Return matching rooms or empty array if none available
 *
 * REQUEST BODY:
 *   - fromDate: Check-in date (YYYY-MM-DD)
 *   - toDate: Check-out date (YYYY-MM-DD)
 *   - noOfBedsRequired: Minimum number of beds needed
 *
 * RETURNS: Array of available room objects with details
 */
module.exports.getAllAvailableRoom = async (req, res, next) => {
  const { fromDate, toDate, noOfBedsRequired } = req.body;

  // Parse dates for comparison
  const startDate = dayjs(fromDate);
  const endDate = dayjs(toDate);
  const today = dayjs().startOf("day"); // Current date at 00:00:00

  try {
    // ===== VALIDATION STEP 1: VALIDATE BED COUNT =====
    if (noOfBedsRequired <= 0) {
      return res
        .status(404)
        .json({ success: false, message: "No of beds should be atleast 1" });
    }

    // ===== VALIDATION STEP 2: VALIDATE DATES =====
    // Checks: valid format, not in past, check-out after check-in
    const checkDate = helperFunction.checkDates(fromDate, toDate);
    if (checkDate.success == false) {
      return res
        .status(400)
        .json({ success: false, message: checkDate.message });
    }

    // ===== FORMAT DATES FOR SQL QUERY =====
    const dbStartDate = startDate.format("YYYY-MM-DD");
    const dbEndDate = endDate.format("YYYY-MM-DD");

    // ===== QUERY DATABASE FOR AVAILABLE ROOMS =====
    // Pass dates in order expected by SQL query (see room.js model)
    const result = await roomModel.getAllAvailableRooms(
      noOfBedsRequired,
      dbEndDate,
      dbStartDate,
    );

    // ===== RETURN RESULTS =====
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
