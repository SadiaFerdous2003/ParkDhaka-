// backend/config/db.js
const mongoose = require("mongoose");

const connectDB = async (retries = 5) => {
  for (let i = 1; i <= retries; i++) {
    try {
      if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not set in environment");
      }
      console.log(`MongoDB connection attempt ${i}/${retries}...`);
      
      // Log connection string (masked for security)
      const maskedUri = process.env.MONGO_URI.replace(/:([^@]+)@/, ":****@");
      console.log("Using Connection URI:", maskedUri);

      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000
        // removed family: 4 to support Atlas / IPv6
      });
      console.log("MongoDB Connected");

      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${i} failed:`, error.message);
      if (i < retries) {
        console.log(`Retrying in 3 seconds...`);
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        console.error("All MongoDB connection attempts failed. Server will run without DB.");
      }
    }
  }
};

module.exports = connectDB;