const Payment = require("../models/payment");
const Booking = require("../models/booking");
const Notification = require("../models/notification");
const GarageSpace = require("../models/garageSpace");
const Withdrawal = require("../models/withdrawal");

exports.processPayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ message: "bookingId and amount are required" });
    }

    const booking = await Booking.findById(bookingId).populate("garageSpace");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // For digital methods, mark as completed immediately
    // For Cash, keep as pending until host confirms
    const isCash = paymentMethod === "Cash";
    const transactionId = isCash ? "" : "TXN" + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Create payment record
    const payment = new Payment({
      booking: bookingId,
      amount,
      paymentMethod: paymentMethod || "Digital",
      transactionId: transactionId,
      status: isCash ? "pending" : "completed"
    });

    await payment.save();

    // Update Booking status
    booking.paymentStatus = isCash ? "pending" : "paid";
    booking.paymentMethod = paymentMethod || "Digital";
    // If digital, booking is completed. If cash, it's confirmed but payment is pending.
    if (!isCash) {
      booking.status = "completed";
    }
    await booking.save();

    // Notify Host about payment or intent to pay cash
    try {
      const message = isCash 
        ? `Driver ${booking.driver?.name || 'someone'} wants to pay ৳${amount} in Cash for booking ${bookingId}`
        : `Payment of ৳${amount} completed for booking ${bookingId} via ${paymentMethod || 'Digital'}`;
      
      const newNotification = new Notification({
        host: booking.garageSpace.host,
        message: message,
        type: "payment",
        relatedId: payment._id
      });
      await newNotification.save();
    } catch (notifyErr) {
      console.error("Failed to create payment notification:", notifyErr);
    }

    res.status(201).json({ 
      message: isCash ? "Cash payment requested. Please pay at the garage." : "Payment successful", 
      payment 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── NEW: Confirm Cash Payment (Host) ──
exports.confirmCashPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const hostId = req.user.userId;

    const booking = await Booking.findById(bookingId).populate("garageSpace");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Verify ownership
    if (booking.garageSpace.host.toString() !== hostId) {
      return res.status(403).json({ message: "Not authorized to confirm this payment" });
    }

    // If not Cash, update it to Cash since the host is manually confirming a physical payment
    if (booking.paymentMethod !== "Cash") {
      booking.paymentMethod = "Cash";
    }

    // Update payment record (find any pending payment for this booking)
    const payment = await Payment.findOne({ booking: bookingId, status: "pending" });
    if (payment) {
      payment.status = "completed";
      payment.transactionId = "CASH-" + Math.random().toString(36).substr(2, 6).toUpperCase();
      await payment.save();
    }

    // Update booking
    booking.paymentStatus = "paid";
    booking.status = "completed";
    await booking.save();

    // Notify Driver
    try {
      const newNotification = new Notification({
        driver: booking.driver,
        message: `Your cash payment for booking at ${booking.garageSpace.location.address || 'garage'} has been confirmed by the host.`,
        type: "payment",
        relatedId: booking._id
      });
      await newNotification.save();
    } catch (notifyErr) {
      console.error("Failed to notify driver about cash confirmation:", notifyErr);
    }

    res.json({ message: "Payment confirmed successfully", booking });
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

// ── FR-15: Request Withdrawal ──
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod, accountNumber } = req.body;
    const hostId = req.user.userId;

    if (!amount || !paymentMethod || !accountNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check available balance
    const garages = await GarageSpace.find({ host: hostId }).select("_id");
    const garageIds = garages.map(g => g._id);
    const bookings = await Booking.find({ garageSpace: { $in: garageIds } }).select("_id");
    const bookingIds = bookings.map(b => b._id);
    const payments = await Payment.find({ booking: { $in: bookingIds } });
    
    const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);
    const availableBalance = Math.floor(totalEarnings * 0.95);

    // Also subtract already withdrawn or pending withdrawals
    const previousWithdrawals = await Withdrawal.find({ 
      host: hostId, 
      status: { $in: ["Pending", "Approved"] } 
    });
    const totalWithdrawn = previousWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    const actualBalance = availableBalance - totalWithdrawn;

    if (amount > actualBalance) {
      return res.status(400).json({ message: `Insufficient balance. Available: ৳${actualBalance}` });
    }

    const withdrawal = new Withdrawal({
      host: hostId,
      amount,
      paymentMethod,
      accountNumber
    });

    await withdrawal.save();
    res.status(201).json({ message: "Withdrawal request submitted", withdrawal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── FR-15: Get Host Withdrawals ──
exports.getHostWithdrawals = async (req, res) => {
  try {
    const hostId = req.user.userId;
    const withdrawals = await Withdrawal.find({ host: hostId }).sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
