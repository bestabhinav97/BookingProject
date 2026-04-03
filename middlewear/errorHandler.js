// middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
  console.error(err); // logs error to console for debugging

  const statusCode = err.statusCode || 500; // default to 500 if not set
  const message = err.message || "Something went wrong";

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
