/**
 * ========== AUTH CONTROLLER ==========
 * Handles user authentication:
 * - User registration (signUp)
 * - User login and JWT token creation
 * - User logout (cookie clearing)
 */

const validator = require("validator");
const userModel = require("../model/user");
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * signUp - Register a new user
 *
 * FLOW:
 * 1. Validate all required fields exist: name, email, password
 * 2. Validate email format using validator library
 * 3. Check if email already exists in database
 * 4. If exists, return 409 Conflict error
 * 5. If new, hash password and insert into database
 * 6. Return new user record (without password)
 *
 * REQUEST BODY:
 *   - name: User's full name
 *   - email: User's email (must be unique and valid format)
 *   - password: User's password (will be hashed before storage)
 */
module.exports.signUp = async (req, res, next) => {
  console.log("HELLO SIGN UP");
  const { name, email, password } = req.body;

  // ===== VALIDATION =====
  if (!name) {
    return res.status(400).json({ success: false, message: "MISSING NAME" });
  }
  if (!email) {
    return res.status(400).json({ success: false, message: "MISSING EMAIL" });
  }
  // Validate email format (checks for @ symbol, domain, etc.)
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email" });
  }
  if (!password) {
    return res
      .status(400)
      .json({ success: false, message: "MISSING PASSWORD" });
  }

  try {
    // Check if email already registered
    const result = await userModel.checkExistingEmail(email);
    console.log(result);
    if (result.length > 0) {
      // Email already exists
      return res
        .status(409)
        .json({ success: false, message: "EMAIL ALREADY EXIST" });
    } else {
      // Email is new, proceed with registration
      const insertedUser = await userModel.signUp(name, email, password);
      return res.status(201).json({
        success: true,
        message: "Signed Up Successfully",
        data: insertedUser,
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * login - Authenticate user and create JWT token
 *
 * FLOW:
 * 1. Validate email and password provided
 * 2. Query database for user with matching email
 * 3. Compare provided password with stored hashed password
 * 4. If match, create JWT token signed with JWT_SECRET
 * 5. Set token as httpOnly cookie (secure, can't be accessed by JS)
 * 6. Return user object (without password) to client
 *
 * REQUEST BODY:
 *   - email: User's registered email
 *   - password: User's password (will be compared to hash)
 *
 * RESPONSE:
 *   - Sets httpOnly cookie with JWT token
 *   - Returns user data (userId, name, email, role)
 */
module.exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ===== VALIDATION =====
    if (!email) {
      return res.status(400).json({ success: false, message: "MISSING EMAIL" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "MISSING PASSWORD" });
    }

    // ===== AUTHENTICATE USER =====
    // Model compares password with bcrypt hash and returns user if match
    const result = await userModel.login(email, password);

    if (result == false) {
      // Email not found or password doesn't match
      return res
        .status(404)
        .json({ success: false, message: "INVALID EMAIL OR PASSWORD" });
    } else {
      // ===== CREATE JWT TOKEN =====
      // Token contains user data and expires in 1 hour
      const token = jwt.sign(result, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // ===== SET SECURE COOKIE =====
      // httpOnly: JS can't access (prevents XSS attacks)
      // sameSite: Prevents CSRF attacks
      // maxAge: 1 hour in milliseconds (matches JWT expiration)
      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "Lax",
        maxAge: 3600000, // 1 hour
      });

      // ===== RETURN SUCCESS RESPONSE =====
      return res.status(200).json({
        success: true,
        message: "LOGGED IN SUCCESSFULLY",
        user: result,
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * logout - Clear user session by removing token cookie
 *
 * FLOW:
 * 1. Clear 'token' cookie from response
 * 2. Return success message to client
 * 3. Browser will delete the cookie
 * 4. User is logged out (future requests won't have token)
 */
module.exports.logout = async (req, res, next) => {
  try {
    // Clear the 'token' cookie with same options as when setting it
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "Lax",
    });

    return res.status(200).json({
      success: true,
      message: "LOGGED OUT SUCCESSFULLY",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
