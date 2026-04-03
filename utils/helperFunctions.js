const dayjs = require("dayjs");

module.exports.checkDates = (fromDate, toDate) => {
  const startDate = dayjs(fromDate);
  const endDate = dayjs(toDate);
  const today = dayjs().startOf("day");

  // 1. CHECK IF VALID DATE
  if (!startDate.isValid() || !endDate.isValid()) {
    return {
      success: false,
      message: "Invalid date format. Please use YYYY-MM-DD.",
    };
  }

  // 2. CHECK IF DATES ARE IN THE PAST
  if (startDate.isBefore(today)) {
    return {
      success: false,
      message: "Check-in date cannot be in the past.",
    };
  }

  // 3. CHECK CHRONOLOGY
  if (!endDate.isAfter(startDate)) {
    return {
      success: false,
      message: "Check-out must be at least 1 day after check-in.",
    };
  }

  // ✅ SUCCESS CASE
  return {
    success: true,
    message: "Dates are valid.",
  };
};
