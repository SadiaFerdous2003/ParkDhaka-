const mongoose = require("mongoose");
require("dotenv").config(); // Paths updated because script is now inside backend/
const User = require("./models/user");
const GarageSpace = require("./models/garageSpace");
const Booking = require("./models/bookingModel");
const Notification = require("./models/notificationModel");
const Payment = require("./models/paymentModel");

async function runTest() {
  try {
    // Connect using URI from .env
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // 1. Create a dummy host and driver
    let host = await User.findOne({ email: "host@test.com" });
    if (!host) {
      host = await User.create({ 
        name: "Test Host", 
        email: "host@test.com", 
        password: "password", 
        role: "GarageHost" 
      });
    }

    let driver = await User.findOne({ email: "driver@test.com" });
    if (!driver) {
      driver = await User.create({ 
        name: "Test Driver", 
        email: "driver@test.com", 
        password: "password", 
        role: "Driver" 
      });
    }

    // 2. Create a dummy garage space if none exists for this host
    let space = await GarageSpace.findOne({ host: host._id });
    if (!space) {
      space = await GarageSpace.create({
        host: host._id,
        price: 50,
        vehicleTypes: ["Car"],
        status: "Open"
      });
    }

    // 3. Fake a booking to trigger the 'booking' notification
    const newBooking = await Booking.create({
      driver: driver._id,
      garage: space._id,
      status: "Active"
    });
    console.log("Created Booking record:", newBooking._id);

    await Notification.create({
      host: host._id,
      message: `A driver has booked your garage space (ID: ${space._id}).`,
      type: "booking"
    });
    console.log("Notification: Booking created.");

    // 4. Fake a cancellation
    newBooking.status = "Cancelled";
    await newBooking.save();
    await Notification.create({
      host: host._id,
      message: `A driver has cancelled their booking for your garage space (ID: ${space._id}).`,
      type: "cancellation"
    });
    console.log("Notification: Cancellation created.");

    // 5. Fake a payment
    await Payment.create({
      booking: newBooking._id,
      amount: 50,
      status: "Completed"
    });
    
    await Notification.create({
      host: host._id,
      message: `A payment of $50 was completed for your garage space.`,
      type: "payment"
    });
    console.log("Notification: Payment created.");

    console.log("\nSuccess! Done generating test data.");
    console.log("You can now log in as host@test.com / password to see the notifications.");
    process.exit(0);

  } catch (e) {
    console.error("Test Script Error:", e.message);
    process.exit(1);
  }
}

runTest();
