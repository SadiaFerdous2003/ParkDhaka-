const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  contact: { type: String, required: true }, // email or phone
  code: { type: String, required: true },
  purpose: { type: String, enum: ["login", "register"], required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Otp", otpSchema);
