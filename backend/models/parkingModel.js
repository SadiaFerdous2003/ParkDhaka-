const mongoose = require("mongoose");

// simple parking model (not currently used by UI).
// structure resembles garage space but may be extended later.
const parkingSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  location: String,
  capacity: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Parking", parkingSchema);
