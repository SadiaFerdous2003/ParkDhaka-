const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
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
  paymentMethod: {
    type: String,
    enum: ["bKash", "Nagad", "Rocket", "Card", "Cash"],
    required: true
  },
  transactionId: {
    type: String,
    required: false
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["Pending", "Paid", "Failed"], 
    default: "Pending" 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Payment", paymentSchema);
