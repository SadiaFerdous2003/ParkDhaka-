const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/user");
const Notification = require("./models/notificationModel");

async function seedNotificationForEmail(email) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User with email ${email} not found!`);
      process.exit(1);
    }

    if (user.role !== "GarageHost") {
      console.log(`User ${email} is not a GarageHost. Notifications are for Hosts.`);
      process.exit(1);
    }

    // Create a notification for this specific user
    const notification = new Notification({
      host: user._id,
      message: `Direct Test: Your garage was viewed by a potential driver!`,
      type: "booking"
    });

    await notification.save();
    console.log(`Success! Sent a test notification to ${email}.`);
    console.log("Refresh your dashboard to see it!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

const targetEmail = process.argv[2];
if (!targetEmail) {
  console.log("Usage: node notify_host.js <your_host_email>");
  process.exit(1);
}

seedNotificationForEmail(targetEmail);
