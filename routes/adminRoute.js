const express = require("express");
const adminRouter = express.Router();
const authMiddleWear = require("../middlewear/authMiddleWear");
const adminController = require("../controller/adminController");

adminRouter.use(authMiddleWear.checkLogin);
adminRouter.use(authMiddleWear.isAdmin);

// GET SUMMARY STAUS FOR THE DASHBOARD
adminRouter.get("/adminDashboard", adminController.getDashboard);

// GET ALL BOOKINGS WHEN USER CLICKS 'MANAGE ALL BOOKINGS'
adminRouter.get(
  "/adminDashboard/getAllBookings",
  adminController.getAllBookings,
);

module.exports = adminRouter;
