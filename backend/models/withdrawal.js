const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [1, "Amount must be at least 1"]
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  processedDate: {
    type: Date
  },
  adminNote: {
    type: String
  }
});

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
