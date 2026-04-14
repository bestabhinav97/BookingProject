/**
 * ========== AUTHENTICATION MIDDLEWARE ==========
 * Handles JWT token verification and role-based access control
 *
 * JWT FLOW:
 * 1. Token created on login (stored in httpOnly cookie)
 * 2. Client sends token on each protected request
 * 3. Middleware verifies token hasn't been tampered with
 * 4. If valid, attaches user data to request object
 * 5. If invalid/expired, returns 401 Unauthorized
 */

const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * checkLogin - Middleware to verify user authentication
 *
 * FLOW:
 * 1. Extract JWT token from cookies
 * 2. Check if token exists
 * 3. Verify token using JWT_SECRET (validates signature & expiration)
 * 4. Attach decoded user data to req.user for next middleware/route
 * 5. If any step fails, return 401 Unauthorized
 *
 * CALLED ON: All protected routes (rooms, bookings, admin)
 */
module.exports.checkLogin = (req, res, next) => {
  try {
    // Extract JWT token from request cookies
    // Token was set as httpOnly cookie during login for security
    const token = req.cookies.token;

    // If no token exists, user is not logged in
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "LOGIN TO CONTINUE" });
    }

    /**
     * Verify JWT signature and expiration
     * If signature is invalid or token expired, throws error
     * If valid, returns decoded payload (user data)
     */
    const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (verifiedToken) {
      // Attach decoded user data to request object
      // Accessible as req.user in subsequent middleware/routes
      req.user = verifiedToken;
      next();
    } else {
      res.status(401).json({ success: false, message: "INVALID SESSION" });
    }
  } catch (error) {
    // Token may be expired or tampered with
    res
      .status(401)
      .json({ success: false, message: "SESSION EXPIRED OR INVALID" });
  }
};

/**
 * isAdmin - Middleware to check for admin role
 *
 * CALLED AFTER: checkLogin (req.user is already populated)
 *
 * FLOW:
 * 1. Check if req.user exists (set by checkLogin)
 * 2. Check if user.role === 'admin'
 * 3. If yes, allow access (call next())
 * 4. If no, return 403 Forbidden
 *
 * CALLED ON: Admin-only routes (/admin/*)
 */
module.exports.isAdmin = (req, res, next) => {
  // Both conditions must be true: user authenticated AND user role is admin
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    // 403 = Forbidden (authenticated but lacks permission)
    res.status(403).json({
      success: false,
      message: "FORBIDDEN: Admin access required",
    });
  }
};
