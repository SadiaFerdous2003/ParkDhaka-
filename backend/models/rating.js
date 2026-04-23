const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // For host rating driver
  toGarage: { type: mongoose.Schema.Types.ObjectId, ref: "GarageSpace" }, // For driver rating garage
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Rating", ratingSchema);
