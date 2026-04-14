/**
 * ========== ROOM ROUTES ==========
 * Routes for room availability queries
 * All routes require: authenticated user (checkLogin middleware)
 */

const express = require("express");
const roomRouter = express.Router();
const authMiddlewear = require("../middlewear/authMiddleWear");
const roomController = require("../controller/roomController");

// ===== APPLY AUTHENTICATION MIDDLEWARE TO ALL ROUTES =====
// All room routes require valid JWT token
roomRouter.use(authMiddlewear.checkLogin);

/**
 * GET /room/getAvailableRoom
 * Get rooms available for requested dates and bed count
 *
 * REQUIRES: JWT authentication
 *
 * REQUEST BODY:
 *   - fromDate: Check-in date (YYYY-MM-DD)
 *   - toDate: Check-out date (YYYY-MM-DD)
 *   - noOfBedsRequired: Minimum number of beds needed
 *
 * RESPONSE: Array of available rooms with details (price, beds, etc.)
 */
roomRouter.get("/getAvailableRoom", roomController.getAllAvailableRoom);

module.exports = roomRouter;
