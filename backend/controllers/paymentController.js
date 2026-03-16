const Payment = require("../models/payment");
const Booking = require("../models/booking");
const Notification = require("../models/notification");

exports.processPayment = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ message: "bookingId and amount are required" });
    }

    const booking = await Booking.findById(bookingId).populate("garageSpace");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Mock payment processing
    const payment = new Payment({
      booking: bookingId,
      amount,
      status: "completed"
    });

    await payment.save();

    // Notify Host about payment
    try {
      const newNotification = new Notification({
        host: booking.garageSpace.host,
        message: `Payment of ৳${amount} completed for booking ${bookingId}`,
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
