/**
 * ========== REDIS CONNECTION SETUP ==========
 * Configures and exports a Redis client for:
 * - Distributed session management
 * - Rate limiting
 * - Booking lock management (prevents overselling)
 *
 * Redis is used for atomic operations that require consistency across servers.
 */

const { createClient } = require("redis");

// ===== CONFIGURE REDIS CLIENT =====
// Connection parameters for Redis cloud instance
const client = createClient({
  username: "default",
  password: "H0xoRm4kchWS4BGOKvDa9AXKllhELR7w",
  socket: {
    host: "redis-14184.crce220.us-east-1-4.ec2.cloud.redislabs.com",
    port: 14184,
  },
});

// ===== ERROR HANDLING =====
// Listen for connection errors and log them
client.on("error", (err) => {
  console.error("Redis Client Error", err);
});

/**
 * Establishes connection to Redis server
 * Only connects if not already connected (checks client.isOpen)
 * Async function to handle connection promises
 */
async function connectClient() {
  // Check if already connected to avoid duplicate connections
  if (!client.isOpen) {
    await client.connect();
    console.log("Redis client connected");
  }
}

// Export client and connection function for use throughout the app
module.exports = { client, connectClient };
