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

const app = express();

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

app.get("/", (req, res) => {
  res.send("Hello");
});

//GLOBAL ERROR HANDLER
app.use(errorHandler);

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
