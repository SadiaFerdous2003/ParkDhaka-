const Payment = require("../models/payment");
const Booking = require("../models/booking");
const Notification = require("../models/notification");

const crypto = require("crypto");

// 1. initiatePayment
exports.initiatePayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod } = req.body;
    const userId = req.user && req.user.userId;

    if (!bookingId || !amount || !paymentMethod) {
      return res.status(400).json({ message: "bookingId, amount, and paymentMethod are required" });
    }

    const booking = await Booking.findById(bookingId).populate("garageSpace");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Check for existing payment to prevent duplicate
    const existingPayment = await Payment.findOne({ booking: bookingId, status: { $in: ["Pending", "Paid"] } });
    if (existingPayment && existingPayment.status === "Paid") {
      return res.status(400).json({ message: "Payment already completed for this booking." });
    }

    // Create Payment Record (Pending)
    const payment = new Payment({
      user: userId,
      booking: bookingId,
      host: booking.garageSpace.host,
      garage: booking.garageSpace._id,
      amount,
      paymentMethod,
      status: "Pending" // Will be updated to Paid/Failed later
    });

    await payment.save();

    // Specific logic per method
    if (paymentMethod === "Cash") {
      return res.status(200).json({ 
        message: "Pay at garage", 
        payment,
        gatewayUrl: null 
      });
    } else {
      // Simulate Payment Gateway URL redirection
      const tran_id = "TXN_" + crypto.randomBytes(8).toString("hex").toUpperCase();
      payment.transactionId = tran_id;
      await payment.save();

      const redirectUrl = `/api/payments/callback?paymentId=${payment._id}&tran_id=${tran_id}&status=Paid`;
      
      return res.status(200).json({
        message: "Redirecting to payment gateway...",
        payment,
        gatewayUrl: redirectUrl
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. handlePaymentCallback
exports.handlePaymentCallback = async (req, res) => {
  try {
    const { paymentId, tran_id, status } = req.query;

    const payment = await Payment.findById(paymentId).populate({
      path: "booking",
      populate: { path: "garageSpace" }
    });

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.status === "Paid") {
       return res.redirect("/#payment-success");
    }

    if (status === "Paid") {
      payment.status = "Paid";
      await payment.save();

      try {
        const newNotification = new Notification({
          host: payment.booking.garageSpace.host,
          message: `Payment of ৳${payment.amount} completed via ${payment.paymentMethod} for booking ${payment.booking._id}`,
          type: "payment",
          relatedId: payment._id
        });
        await newNotification.save();
      } catch (notifyErr) {
        console.error("Failed to create payment notification:", notifyErr);
      }

      res.redirect("/#payment-success");
    } else {
      payment.status = "Failed";
      await payment.save();
      res.redirect("/#payment-failed");
    }
  } catch (err) {
    console.error(err);
    res.redirect("/#payment-failed");
  }
};

// 3. verifyPayment
exports.verifyPayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ booking: req.params.bookingId });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    res.status(200).json({ payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// 4. getUserPayments
exports.getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.userId })
      .populate({
        path: "booking",
        populate: { path: "garageSpace" }
      })
      .populate("garage")
      .sort({ timestamp: -1 });

    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. getHostPayments & Earnings
exports.getHostPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ host: req.user.userId, status: "Paid" })
      .populate("user", "name email")
      .populate("garage")
      .sort({ timestamp: -1 });

    const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({ payments, totalEarnings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
