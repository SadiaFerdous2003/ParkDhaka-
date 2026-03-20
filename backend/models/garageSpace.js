const mongoose = require("mongoose");

const garageSpaceSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  images: [String],
  price: { type: Number, required: true },
  vehicleTypes: [String],
  location: {
    address: String,
    lat: Number,
    lng: Number
  },
  availableHours: {
    start: String, // could be "08:00"
    end: String    // could be "18:00"
  },
  status: { 
    type: String, 
    enum: ["Open", "Closed"], 
    default: "Open" 
  },
  createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model("GarageSpace", garageSpaceSchema);
