/**
 * ========== GLOBAL ERROR HANDLER MIDDLEWARE ==========
 * Catches all errors thrown by route handlers and sends consistent error responses
 *
 * ERROR FLOW:
 * 1. Any route handler throws error or calls next(error)
 * 2. Express passes to this error middleware (note: 4 parameters including err)
 * 3. Handler logs error to console for debugging
 * 4. Extracts status code and message from error
 * 5. Sends JSON error response to client
 *
 * IMPORTANT: Must have 4 parameters (err, req, res, next) for Express to recognize as error middleware
 */

/**
 * Express Error Handler
 * @param {Error} err - The error object thrown by route handlers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object for sending error response
 * @param {Function} next - Next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log full error for server-side debugging
  console.error(err);

  // Extract status code from error, default to 500 (Internal Server Error) if not set
  const statusCode = err.statusCode || 500;
  // Extract error message, use generic message if not provided
  const message = err.message || "Something went wrong";

  // Send consistent error response to client
  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
