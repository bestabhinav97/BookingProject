const mysql = require("mysql2/promise"); // use promise version
require("dotenv").config();

// Create a pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DB,
});

// Test connection
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log("CONNECTED TO DATABASE");
    connection.release(); // release the connection back to the pool
  } catch (err) {
    console.error("DB CONNECTION FAILED:", err);
  }
}

testConnection();

module.exports = db;
