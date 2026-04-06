const express = require("express");
const adminRouter = express.Router();
const authMiddleWear = require("../middlewear/authMiddleWear");

adminRouter.use(authMiddleWear.checkLogin);
adminRouter.use(authMiddleWear.isAdmin);

adminRouter.get("/adminDashboard", adminController.getDashboard);

module.exports = adminRouter;
