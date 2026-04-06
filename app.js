// DEPENDENCIES
const express = require("express");
const db = require("./db/db");
const helmet = require("helmet");
const errorHandler = require("./middlewear/errorHandler");
const cookie = require("cookie-parser");
const bookingController = require("./controller/bookingController");

const authRouter = require("./routes/authRoute");
const roomRouter = require("./routes/roomRoute");
const bookingRouter = require("./routes/bookingsRoute");
const adminRouter = require("./routes/adminRoute");

const app = express();

//Stripe webhooks use HMAC (Hash-based Message Authentication Code) for security.
// This requires a byte-for-byte match of the payload to verify the signature
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  bookingController.handleWebHook,
);

//MIDDLEWEAR
app.use(express.json());
app.use(helmet());
app.use(cookie());

//ROUTERS
app.use("/auth", authRouter);
app.use("/room", roomRouter);
app.use("/bookings", bookingRouter);
app.use("/admin", adminRouter);

app.get("/", (req, res) => {
  res.send("Hello");
});

//GLOBAL ERROR HANDLER
app.use(errorHandler);

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
