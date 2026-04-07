const Booking = require("../models/booking");
const GarageSpace = require("../models/garageSpace");
const Waitlist = require("../models/waitlist");
const Notification = require("../models/notification");
const User = require("../models/user");

const DURATION_MAP = Booking.DURATION_MAP;

// Helper: check if two time-ranges overlap
function timesOverlap(startA, endA, startB, endB) {
  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return toMin(startA) < toMin(endB) && toMin(startB) < toMin(endA);
}

// POST /api/bookings — create a new booking
exports.createBooking = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;
    const { garageSpaceId, date, startTime, duration } = req.body;

    if (!garageSpaceId || !date || !startTime || !duration) {
      return res.status(400).json({ message: "garageSpaceId, date, startTime, and duration are required" });
    }

    // Validate garage space exists
    const space = await GarageSpace.findById(garageSpaceId);
    if (!space) return res.status(404).json({ message: "Garage space not found" });

    if (space.status === "Closed") {
      return res.status(400).json({ message: "This garage is currently closed and cannot be booked." });
    }

    const config = DURATION_MAP[duration];
    if (!config) return res.status(400).json({ message: "Invalid duration. Use hourly, half-day, or full-day" });

    // Compute end time for conflict check
    const [h, m] = startTime.split(":").map(Number);
    const newEndH = h + config.hours;
    const newEndTime = `${String(newEndH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    // Check for overlapping confirmed bookings on the same space + date
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const existingBookings = await Booking.find({
      garageSpace: garageSpaceId,
      date: bookingDate,
      status: "confirmed"
    });

    const conflict = existingBookings.some((b) =>
      timesOverlap(startTime, newEndTime, b.startTime, b.endTime)
    );

    if (conflict) {
      return res.status(409).json({
        message: "This time slot is already booked. You can join the waitlist instead.",
        conflict: true
      });
    }

    const booking = new Booking({
      driver: driverId,
      garageSpace: garageSpaceId,
      date: bookingDate,
      startTime,
      duration
    });

    const saved = await booking.save();
    const populated = await Booking.findById(saved._id)
      .populate("garageSpace")
      .populate("driver", "name email");

    res.status(201).json(populated);

    // Notification for Host
    try {
      const driver = await User.findById(driverId);
      const newNotification = new Notification({
        host: space.host,
        message: `New booking from ${driver.name} for space ${space.location.address || space._id}`,
        type: "booking",
        relatedId: saved._id
      });
      await newNotification.save();
    } catch (notifyErr) {
      console.error("Failed to create notification:", notifyErr);
    }

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/bookings/my — driver's own bookings
exports.getMyBookings = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;
    const bookings = await Booking.find({ driver: driverId })
      .populate("garageSpace")
      .sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/bookings/:id/cancel
exports.cancelBooking = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.driver.toString() !== driverId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Only confirmed bookings can be cancelled" });
    }

    // Policy: must cancel at least 1 hour before start
    const bookingStart = new Date(booking.date);
    const [h, m] = booking.startTime.split(":").map(Number);
    bookingStart.setHours(h, m, 0, 0);

    const now = new Date();
    const diffMs = bookingStart.getTime() - now.getTime();
    const oneHourMs = 60 * 60 * 1000;

    if (diffMs < oneHourMs) {
      return res.status(400).json({
        message: "Cannot cancel within 1 hour of the booking start time"
      });
    }

    booking.status = "cancelled";
    await booking.save();

    // Notify first person on the waitlist for this space + date
    const dateStr = booking.date.toISOString().split("T")[0];
    const waitlistEntry = await Waitlist.findOneAndUpdate(
      { garageSpace: booking.garageSpace, date: dateStr, notified: false },
      { notified: true },
      { sort: { createdAt: 1 }, new: true }
    );

    res.json({
      message: "Booking cancelled successfully",
      booking,
      waitlistNotified: waitlistEntry ? true : false
    });

    // Notification for Host
    try {
      const populatedBooking = await Booking.findById(booking._id).populate("garageSpace").populate("driver", "name");
      const newNotification = new Notification({
        host: populatedBooking.garageSpace.host,
        message: `Booking cancelled by ${populatedBooking.driver.name} for space ${populatedBooking.garageSpace.location.address || populatedBooking.garageSpace._id}`,
        type: "cancellation",
        relatedId: booking._id
      });
      await newNotification.save();
    } catch (notifyErr) {
      console.error("Failed to create cancellation notification:", notifyErr);
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/bookings/:id/reschedule
exports.rescheduleBooking = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.driver.toString() !== driverId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Only confirmed bookings can be rescheduled" });
    }

    // Policy: must reschedule at least 1 hour before original start
    const bookingStart = new Date(booking.date);
    const [oh, om] = booking.startTime.split(":").map(Number);
    bookingStart.setHours(oh, om, 0, 0);

    const now = new Date();
    const diffMs = bookingStart.getTime() - now.getTime();
    const oneHourMs = 60 * 60 * 1000;

    if (diffMs < oneHourMs) {
      return res.status(400).json({
        message: "Cannot reschedule within 1 hour of the booking start time"
      });
    }

    const { date, startTime, duration } = req.body;
    if (!date || !startTime || !duration) {
      return res.status(400).json({ message: "date, startTime, and duration are required" });
    }

    const config = DURATION_MAP[duration];
    if (!config) return res.status(400).json({ message: "Invalid duration" });

    const [h, m] = startTime.split(":").map(Number);
    const newEndTime = `${String(h + config.hours).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    // Check availability for the new slot (exclude current booking)
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);

    const existingBookings = await Booking.find({
      garageSpace: booking.garageSpace,
      date: newDate,
      status: "confirmed",
      _id: { $ne: booking._id }
    });

    const conflict = existingBookings.some((b) =>
      timesOverlap(startTime, newEndTime, b.startTime, b.endTime)
    );

    if (conflict) {
      return res.status(409).json({ message: "The new time slot is already booked", conflict: true });
    }

    booking.date = newDate;
    booking.startTime = startTime;
    booking.duration = duration;
    // totalPrice and endTime will be re-computed by pre-validate hook
    booking.totalPrice = undefined;

    await booking.save();

    const populated = await Booking.findById(booking._id).populate("garageSpace");
    res.json({ message: "Booking rescheduled successfully", booking: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/bookings/host — all bookings for host's spaces
exports.getHostBookings = async (req, res) => {
  try {
    const hostId = req.user && req.user.userId;
    const spaces = await GarageSpace.find({ host: hostId }).select("_id");
    const spaceIds = spaces.map((s) => s._id);

    const bookings = await Booking.find({ garageSpace: { $in: spaceIds } })
      .populate("garageSpace")
      .populate("driver", "name email")
      .sort({ date: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/bookings/quote — get a price quote before booking
exports.getBookingQuote = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;
    const { garageSpaceId, date, startTime, duration } = req.body;
    const { calculateDynamicPrice } = require("../utils/pricingEngine");
    const Subscription = require("../models/subscription");

    if (!garageSpaceId || !date || !startTime || !duration) {
      return res.status(400).json({ message: "garageSpaceId, date, startTime, and duration are required" });
    }

    const space = await GarageSpace.findById(garageSpaceId);
    if (!space) return res.status(404).json({ message: "Garage space not found" });

    // 1. Check for Active Subscription
    const activeSub = await Subscription.findOne({
      user: driverId,
      garageSpace: garageSpaceId,
      status: "active",
      endDate: { $gt: new Date() }
    });

    if (activeSub) {
      return res.json({
        totalPrice: 0,
        pricingBreakdown: { base: 0, peak: 0, surge: 0, discount: 0 },
        indicators: ["Active Subscription - Free"],
        colorTag: "green",
        isSubscribed: true
      });
    }

    // 2. Dynamic Price Calculation
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const concurrentCount = await Booking.countDocuments({
      garageSpace: garageSpaceId,
      date: bookingDate,
      status: "confirmed"
    });

    const pricingInfo = calculateDynamicPrice(
      space,
      concurrentCount,
      startTime,
      duration
    );

    res.json({
      totalPrice: pricingInfo.finalPrice,
      pricingBreakdown: pricingInfo.breakdown,
      indicators: pricingInfo.indicators,
      colorTag: pricingInfo.color,
      demandRatio: pricingInfo.demandRatio,
      isSubscribed: false
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/bookings/:id/pay-fine — pay overstay fine
exports.payFine = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.driver.toString() !== driverId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (!booking.isOverstayed) {
      return res.status(400).json({ message: "No overstay fine detected for this booking" });
    }

    booking.paymentStatus = "paid";
    await booking.save();

    res.json({ message: "Fine paid successfully", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
