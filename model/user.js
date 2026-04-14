/**
 * ========== USER MODEL ==========
 * Database layer for user authentication operations
 * Handles signup, login, and password hashing
 */

const db = require("../db/db");
const bcrypt = require("bcrypt");

/**
 * checkExistingEmail - Check if email already exists in database
 *
 * USED FOR: Registration form to prevent duplicate accounts
 * @param {string} email - Email address to check
 * @returns {array} Array of user records (empty if email not registered)
 */
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

/**
 * signUp - Register new user account
 *
 * FLOW:
 * 1. Hash password using bcrypt (10 rounds for security)
 * 2. Insert user record with hashed password (never store plain text!)
 * 3. Fetch and return the newly created user record
 * 4. Password is not included in return for security
 *
 * @param {string} name - User's full name
 * @param {string} email - User's email address (should be unique)
 * @param {string} password - Plain text password (will be hashed)
 * @returns {object} New user object (without password)
 */
module.exports.signUp = async (name, email, password) => {
  try {
    // Hash password with 12 salt rounds (bcrypt standard)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user record with hashed password
    const [result] = await db.execute(
      "INSERT INTO user (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
    );

    // Fetch and return the newly created user
    const [rows] = await db.execute("SELECT * FROM user WHERE userId = ?", [
      result.insertId,
    ]);

    return rows[0];
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * login - Authenticate user and return user data if credentials valid
 *
 * FLOW:
 * 1. Query database for user with matching email
 * 2. If user not found, return false immediately
 * 3. If user found, compare provided password with stored hash using bcrypt
 * 4. If password matches, remove password field and return user object
 * 5. If password doesn't match, return false
 *
 * @param {string} email - User's email address
 * @param {string} password - Plain text password to verify
 * @returns {object|false} User object if credentials valid, false otherwise
 */
module.exports.login = async (email, password) => {
  try {
    // Query user by email
    const [rows] = await db.execute("SELECT * FROM user WHERE email = ?", [
      email,
    ]);
    const user = rows[0];

    // If no user with this email exists, return false immediately
    if (!user) {
      return false;
    }

    /**
     * Compare provided password with stored hash
     * bcrypt.compare handles the hash comparison securely
     * Returns boolean: true if match, false if no match
     */
    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
      // Password is correct - remove sensitive data before returning
      delete user.password;
      return user;
    }

    // Password is incorrect
    return false;
  } catch (error) {
    // Log internal errors without exposing to client
    console.error("Database error during login:", error);
    throw error;
  }
};
