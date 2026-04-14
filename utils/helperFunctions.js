/**
 * ========== HELPER FUNCTIONS ==========
 * Utility functions for common operations across the application
 */

const dayjs = require("dayjs");

/**
 * checkDates - Validate booking date range
 *
 * VALIDATIONS:
 * 1. Dates must be in valid format (YYYY-MM-DD)
 * 2. Check-in date cannot be in the past
 * 3. Check-out must be at least 1 day after check-in (no same-day bookings)
 *
 * @param {string} fromDate - Check-in date (YYYY-MM-DD)
 * @param {string} toDate - Check-out date (YYYY-MM-DD)
 * @returns {object} {success: boolean, message: string}
 */
module.exports.checkDates = (fromDate, toDate) => {
  const startDate = dayjs(fromDate);
  const endDate = dayjs(toDate);
  const today = dayjs().startOf("day"); // Current date at 00:00:00

  // ===== VALIDATION 1: CHECK IF VALID DATE FORMAT =====
  if (!startDate.isValid() || !endDate.isValid()) {
    return {
      success: false,
      message: "Invalid date format. Please use YYYY-MM-DD.",
    };
  }

  // ===== VALIDATION 2: CHECK IF DATES ARE IN THE PAST =====
  if (startDate.isBefore(today)) {
    return {
      success: false,
      message: "Check-in date cannot be in the past.",
    };
  }

  // ===== VALIDATION 3: CHECK CHRONOLOGY (checkout after checkin) =====
  if (!endDate.isAfter(startDate)) {
    return {
      success: false,
      message: "Check-out must be at least 1 day after check-in.",
    };
  }

  // ===== SUCCESS CASE =====
  // All validations passed
  return {
    success: true,
    message: "Dates are valid.",
  };
};
