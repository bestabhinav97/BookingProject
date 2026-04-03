const mysql = require("mysql2/promise"); // use promise version

// Create a pool
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "abhi12345",
  database: "bookingProject",
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
