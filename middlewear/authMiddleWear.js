const jwt = require("jsonwebtoken");
require("dotenv").config();

// CHECK FOR LOGIN
module.exports.checkLogin = (req, res, next) => {
  try {
    // 1. Use req.cookies (plural)
    const token = req.cookies.token;

    // 2. Check if token exists BEFORE verifying
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "LOGIN TO CONTINUE" });
    }

    // 3. Verify the token
    const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (verifiedToken) {
      // Optional: Attach user data to the request for use in next routes
      req.user = verifiedToken;
      next();
    } else {
      res.status(401).json({ success: false, message: "INVALID SESSION" });
    }
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "SESSION EXPIRED OR INVALID" });
  }
};

// CHECK FOR ADMIN STATUS
module.exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "FORBIDDEN: Admin access required",
    });
  }
};
