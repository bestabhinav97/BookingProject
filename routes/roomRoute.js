const express = require("express");
const roomRouter = express.Router();
const authMiddlewear = require("../middlewear/authMiddleWear");
const roomController = require("../controller/roomController");

roomRouter.use(authMiddlewear.checkLogin);

roomRouter.get("/getAvailableRoom", roomController.getAllAvailableRoom);

module.exports = roomRouter;
