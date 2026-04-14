/**
 * ========== DATABASE CONNECTION SETUP ==========
 * Creates a MySQL connection pool for efficient database access.
 *
 * CONNECTION POOL:
 * - Maintains multiple reusable connections
 * - Reduces overhead of creating new connections for each query
 * - Automatically manages connection lifecycle
 * - Uses promise-based API for async/await syntax
 */

const mysql = require("mysql2/promise"); // Use promise version for async/await
require("dotenv").config();

/**
 * Create MySQL connection pool
 * Configuration loaded from .env file for security
 */
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DB,
});

/**
 * Test database connection on startup
 * Logs success/failure to console for debugging
 */
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log("CONNECTED TO DATABASE");
    // Release connection back to pool for reuse
    connection.release();
  } catch (err) {
    console.error("DB CONNECTION FAILED:", err);
  }
}

// Execute connection test when module loads
testConnection();

module.exports = db;
