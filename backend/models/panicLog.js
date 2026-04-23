const mongoose = require("mongoose");

const panicLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  status: { type: String, enum: ["Active", "Resolved"], default: "Active" },
  resolutionNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
});

module.exports = mongoose.model("PanicLog", panicLogSchema);
