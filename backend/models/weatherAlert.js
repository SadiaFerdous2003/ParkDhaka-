const mongoose = require("mongoose");

const weatherAlertSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Heavy Waterlogging"
  description: { type: String, required: true },
  area: { type: String, required: true }, // e.g., "Dhanmondi", "Mirpur"
  severity: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
  type: { type: String, enum: ["Flood", "RoadCondition", "Storm"], default: "Flood" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

module.exports = mongoose.model("WeatherAlert", weatherAlertSchema);
