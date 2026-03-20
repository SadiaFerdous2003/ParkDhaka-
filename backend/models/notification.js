const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  host: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["booking", "cancellation", "payment"], 
    required: true 
  },
  relatedId: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  readStatus: { 
    type: Boolean, 
    default: false 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
