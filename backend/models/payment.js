const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Booking", 
    required: false 
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    required: false
  },
  paymentType: {
    type: String,
    enum: ["booking", "subscription"],
    default: "booking"
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["pending", "completed", "failed"], 
    default: "pending" 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Payment", paymentSchema);
