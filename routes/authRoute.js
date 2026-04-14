/**
 * ========== AUTH ROUTES ==========
 * Routes for user authentication (signup, login, logout)
 * No authentication required for signup/login (public endpoints)
 */

const express = require("express");
const authRouter = express.Router();
const authController = require("../controller/authController");

// ===== PUBLIC ROUTES =====

/**
 * POST /auth/signUp
 * Register a new user account
 *
 * REQUEST BODY:
 *   - name: User's full name
 *   - email: Email address (must be unique)
 *   - password: Account password (will be hashed)
 *
 * RESPONSE: New user object or error message
 */
authRouter.post("/signUp", authController.signUp);

/**
 * POST /auth/login
 * Authenticate user and create session
 *
 * REQUEST BODY:
 *   - email: Registered email address
 *   - password: Account password
 *
 * RESPONSE: JWT token (in httpOnly cookie) + user data
 */
authRouter.post("/login", authController.login);

// NOTE: Logout route is commented out (logout can be done client-side by clearing cookie)
// Additional routes can be added here as needed

module.exports = authRouter;
