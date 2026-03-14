const mongoose = require("mongoose");

const waitlistSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  garageSpace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GarageSpace",
    required: true
  },
  date: {
    type: String, // "YYYY-MM-DD"
    required: true
  },
  notified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate waitlist entries for same driver + space + date
waitlistSchema.index({ driver: 1, garageSpace: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Waitlist", waitlistSchema);
