const db = require("../db/db");
const bcrypt = require("bcrypt");

// CHECK EXISTING EMAIL
module.exports.checkExistingEmail = async (email) => {
  try {
    const [result] = await db.execute("SELECT * FROM user WHERE email = ?", [
      email,
    ]);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// SIGN UP
module.exports.signUp = async (name, email, password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      "INSERT INTO user (name,email,password) VALUES (?,?,?)",
      [name, email, hashedPassword],
    );

    const [rows] = await db.execute("SELECT * FROM user WHERE userId = ?", [
      result.insertId,
    ]);

    return rows[0];
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// LOGIN
module.exports.login = async (email, password) => {
  try {
    // 1. Destructure the first element directly from the array
    const [rows] = await db.execute("SELECT * FROM user WHERE email = ?", [
      email,
    ]);
    const user = rows[0];

    // 2. If no user, return false immediately
    if (!user) {
      return false;
    }

    // 3. Compare passwords
    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
      // Remove the password from the object before returning it for safety
      delete user.password;
      return user;
    }

    return false;
  } catch (error) {
    // Log the error for internal debugging, then re-throw
    console.error("Database error during login:", error);
    throw error;
  }
};
