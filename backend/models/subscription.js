const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  passType: {
    type: String,
    default: "monthly"
  },
  price: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["active", "expired", "cancelled"],
    default: "active"
  }
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
