const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  garageSpace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GarageSpace",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true // "HH:mm" e.g. "09:00"
  },
  duration: {
    type: String,
    enum: ["hourly", "half-day", "full-day"],
    required: true
  },
  endTime: {
    type: String // computed before save
  },
  totalPrice: {
    type: Number // computed before save
  },
  status: {
    type: String,
    enum: ["confirmed", "cancelled", "completed"],
    default: "confirmed"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Duration config
const DURATION_MAP = {
  hourly:    { hours: 1,  multiplier: 1 },
  "half-day": { hours: 6,  multiplier: 5 },
  "full-day": { hours: 12, multiplier: 9 }
};

// Compute endTime & totalPrice before saving
bookingSchema.pre("validate", async function (next) {
  const config = DURATION_MAP[this.duration];
  if (!config) return next(new Error("Invalid duration"));

  // Compute endTime
  const [h, m] = this.startTime.split(":").map(Number);
  const endH = h + config.hours;
  this.endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  // Compute totalPrice
  if (this.totalPrice == null) {
    const Subscription = mongoose.model("Subscription");
    const activeSub = await Subscription.findOne({
      user: this.driver,
      garageSpace: this.garageSpace,
      status: "active",
      endDate: { $gt: new Date() }
    });
    
    if (activeSub) {
      this.totalPrice = 0; // Free for subscribed commuters (monthly pass)
    } else {
      const GarageSpace = mongoose.model("GarageSpace");
      const space = await GarageSpace.findById(this.garageSpace);
      if (space) {
        this.totalPrice = space.price * config.multiplier;
      }
    }
  }

  next();
});

// Static helper: duration map access
bookingSchema.statics.DURATION_MAP = DURATION_MAP;

module.exports = mongoose.model("Booking", bookingSchema);
