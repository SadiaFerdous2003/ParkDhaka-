/**
 * test-notifications.js
 * 
 * This script allows you to manually create a test notification for a host 
 * to verify that the Host Dashboard UI is correctly displaying them.
 * 
 * Usage: 
 * 1. Make sure you have MONGO_URI in your .env or set in your environment.
 * 2. Run: node test-notifications.js <host_email>
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Notification = require("./models/notification");
const User = require("./models/user");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/parkdhaka";

async function createTestNotification() {
  const hostEmail = process.argv[2];

  if (!hostEmail) {
    console.error("Please provide a host email: node test-notifications.js <email>");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const host = await User.findOne({ email: hostEmail, role: "GarageHost" });
    if (!host) {
      console.error(`Host with email ${hostEmail} not found or is not a GarageHost.`);
      process.exit(1);
    }

    const testNotification = new Notification({
      host: host._id,
      message: "This is a TEST notification from the verification script! 🚀",
      type: "booking",
      readStatus: false
    });

    await testNotification.save();
    console.log(`✅ Success! Notification created for host ${host.name} (${host.email})`);
    console.log("Please refreshing your Host Dashboard to see the notification.");

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

createTestNotification();
