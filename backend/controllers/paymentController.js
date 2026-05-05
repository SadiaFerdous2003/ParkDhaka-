const Payment = require("../models/payment");
const Booking = require("../models/booking");
const Notification = require("../models/notification");
const GarageSpace = require("../models/garageSpace");

exports.processPayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ message: "bookingId and amount are required" });
    }

    const booking = await Booking.findById(bookingId).populate("garageSpace");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Generate a mock transaction ID
    const transactionId = "TXN" + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Create payment record
    const payment = new Payment({
      booking: bookingId,
      amount,
      paymentMethod: paymentMethod || "Digital",
      transactionId: transactionId,
      status: "completed"
    });

    await payment.save();

    // Update Booking status
    booking.paymentStatus = "paid";
    booking.paymentMethod = paymentMethod || "Digital";
    booking.status = "completed";
    await booking.save();

    // Notify Host about payment
    try {
      const newNotification = new Notification({
        host: booking.garageSpace.host,
        message: `Payment of ৳${amount} completed for booking ${bookingId} via ${paymentMethod || 'Digital'}`,
        type: "payment",
        relatedId: payment._id
      });
      await newNotification.save();
    } catch (notifyErr) {
      console.error("Failed to create payment notification:", notifyErr);
    }

    res.status(201).json({ message: "Payment successful", payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── FR-14: Get Driver Payment History ──
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Find all bookings by this driver
    const bookings = await Booking.find({ driver: userId }).select("_id");
    const bookingIds = bookings.map(b => b._id);
    
    const payments = await Payment.find({ booking: { $in: bookingIds } })
      .populate({
        path: "booking",
        populate: { path: "garageSpace" }
      })
      .sort({ timestamp: -1 });
      
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── FR-15: Get Digital Receipt ──
exports.getReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: "booking",
        populate: { path: "garageSpace" }
      });
    if (!payment) return res.status(404).json({ message: "Payment record not found" });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── FR-15: Get Host Earnings ──
exports.getHostPayments = async (req, res) => {
  try {
    const hostId = req.user.userId;
    const garages = await require("../models/garageSpace").find({ host: hostId }).select("_id");
    const garageIds = garages.map(g => g._id);
    
    const bookings = await Booking.find({ garageSpace: { $in: garageIds } }).select("_id");
    const bookingIds = bookings.map(b => b._id);
    
    const payments = await Payment.find({ booking: { $in: bookingIds } })
      .populate({
        path: "booking",
        populate: { path: "driver", select: "name" }
      })
      .sort({ timestamp: -1 });

    const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);
    // Simulate available balance (total minus 5% platform fee)
    const availableBalance = Math.floor(totalEarnings * 0.95);

    res.json({
      totalEarnings,
      availableBalance,
      payments: payments.map(p => ({
        _id: p._id,
        amount: p.amount,
        timestamp: p.timestamp,
        paymentMethod: p.paymentMethod || "Digital",
        user: p.booking ? p.booking.driver : null
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
