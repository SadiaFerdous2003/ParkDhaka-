const mongoose = require("mongoose");

const hostBankingSchema = new mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  accountType: {
    type: String,
    enum: ["bKash", "Nagad", "Rocket", "Bank"],
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("HostBanking", hostBankingSchema);
