const express = require("express");
const authRouter = express.Router();
const authController = require("../controller/authController");

//SIGN UP POST
authRouter.post("/signUp", authController.signUp);

//LOGIN POST
authRouter.post("/login", authController.login);

// GET USER

module.exports = authRouter;
