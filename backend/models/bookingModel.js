const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  garage: { type: mongoose.Schema.Types.ObjectId, ref: "GarageSpace", required: true },
  status: { type: String, enum: ["Active", "Cancelled"], default: "Active" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);
