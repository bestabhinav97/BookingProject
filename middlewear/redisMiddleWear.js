/**
 * ========== REDIS RATE LIMITING MIDDLEWARE ==========
 * Prevents abuse by limiting requests per user per IP address
 *
 * FLOW:
 * 1. Create unique Redis key combining userId + IP address
 * 2. Increment counter for this key (atomic operation)
 * 3. If first request, set key to expire after 5 minutes
 * 4. If counter > 5, reject request (429 Too Many Requests)
 * 5. Otherwise, allow request to proceed
 *
 * CALLED ON: Booking initiation endpoint (POST /bookings/initiate)
 * PREVENTS: User spam-clicking booking button or brute force attacks
 */

const { client } = require("../reddis");

/**
 * Rate limit middleware using Redis
 * Allows max 5 requests per user per 5-minute window
 *
 * @returns 429 if limit exceeded, otherwise calls next()
 */
module.exports.rateLimit = async (req, res, next) => {
  // Get user ID and IP address from request
  const userId = req.userId;
  const userIp = req.ip;

  try {
    // Create Redis key: rate:user:123:ip:192.168.1.1
    // This allows different limits per user per IP
    const key = `rate:user:${userId}:ip:${userIp}`;

    /**
     * INCR command:
     * - Increments counter by 1 (atomic operation)
     * - Creates key with value 1 if doesn't exist
     * - Returns new value after increment
     */
    const noOfTries = await client.incr(key);

    // ===== SLIDING WINDOW LOGIC =====
    // Set expiration only on first request (when counter = 1)
    // This ensures 5-minute window resets after last request
    if (noOfTries === 1) {
      await client.expire(key, 300); // 300 seconds = 5 minutes
    }

    // ===== RATE LIMIT CHECK =====
    // If more than 5 requests in 5-minute window, reject
    if (noOfTries > 5) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, try again later",
      });
    }

    // Request is within rate limit, proceed to next middleware
    next();
  } catch (error) {
    // If Redis error, log and pass to error handler
    console.log(error);
    next(error);
  }
};
