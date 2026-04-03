const validator = require("validator");
const userModel = require("../model/user");
const jwt = require("jsonwebtoken");

module.exports.signUp = async (req, res, next) => {
  console.log("HELLO SIGN UP");
  const { name, email, password } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: "MISSING NAME" });
  }
  if (!email) {
    return res.status(400).json({ success: false, message: "MISSING EMAIL" });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email" });
  }
  if (!password) {
    return res
      .status(400)
      .json({ success: false, message: "MISSING PASSWORD" });
  }

  try {
    const result = await userModel.checkExistingEmail(email);
    console.log(result);
    if (result.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "EMAIL ALREADY EXIST" });
    } else {
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

const loginKey = "LOGINKEY";

module.exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "MISSING EMAIL" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "MISSING PASSWORD" });
    }

    const result = await userModel.login(email, password);

    if (result == false) {
      return res
        .status(404)
        .json({ success: false, message: "INVALID EMAIL OR PASSWORD" });
    } else {
      // 1. Sign the token
      const token = jwt.sign(result, loginKey, {
        expiresIn: "1h",
      });

      // 2. Set the cookie
      res.cookie("token", token, {
        httpOnly: true, // Protects against XSS (JavaScript can't read this)
        sameSite: "Lax", // Protects against CSRF
        maxAge: 3600000, // 1 hour in milliseconds (matches JWT)
      });

      // 3. Send response (Notice we don't strictly need to send 'data: token' anymore)
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

// LOGOUT
module.exports.logout = async (req, res, next) => {
  try {
    // Clear the 'token' cookie
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
