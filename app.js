/**
 * ========== HOTEL BOOKING SYSTEM - MAIN APPLICATION FILE ==========
 * This is the entry point of the Express application.
 * Sets up middleware, routes, and initializes external services (Redis, Database).
 *
 * FLOW:
 * 1. Initialize dependencies and services
 * 2. Configure Stripe webhook endpoint (must be raw JSON)
 * 3. Apply middleware (parsing, security, auth)
 * 4. Register route handlers
 * 5. Apply global error handler
 * 6. Start server on port 3000
 */

// ===== DEPENDENCIES =====
const express = require("express");
const db = require("./db/db");
const helmet = require("helmet");
const errorHandler = require("./middlewear/errorHandler");
const cookie = require("cookie-parser");
const bookingController = require("./controller/bookingController");
const { connectClient } = require("./reddis");

// ===== INITIALIZE REDIS CLIENT =====
// Connect to Redis for distributed locks and rate limiting
connectClient();

// ===== IMPORT ROUTE HANDLERS =====
// Each router handles a specific resource (auth, rooms, bookings, admin)
const authRouter = require("./routes/authRoute");
const roomRouter = require("./routes/roomRoute");
const bookingRouter = require("./routes/bookingsRoute");
const adminRouter = require("./routes/adminRoute");

// ===== INITIALIZE EXPRESS APP =====
const app = express();

// ===== STRIPE WEBHOOK ENDPOINT =====
// IMPORTANT: This must come BEFORE express.json() middleware
// Stripe webhooks use HMAC (Hash-based Message Authentication Code) for security.
// This requires a byte-for-byte match of the payload to verify the signature.
// Raw JSON body is needed for signature verification.
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  bookingController.handleWebHook,
);

// ===== MIDDLEWARE STACK =====
// Applied to ALL routes except the webhook endpoint above
app.use(express.json()); // Parse incoming JSON bodies
app.use(helmet()); // Set security HTTP headers
app.use(cookie()); // Parse cookies from requests

// ===== ROUTE HANDLERS =====
// Each route prefix directs requests to the appropriate router
app.use("/auth", authRouter); // Authentication routes (signup, login)
app.use("/room", roomRouter); // Room availability routes
app.use("/bookings", bookingRouter); // User booking routes
// ===== HEALTH CHECK ROUTE =====
app.get("/", (req, res) => {
  res.send("Hello");
});

// ===== GLOBAL ERROR HANDLER =====
// This middleware catches errors from all routes and sends standardized error responses
app.use(errorHandler);

// ===== START SERVER =====//GLOBAL ERROR HANDLER
app.use(errorHandler);

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
