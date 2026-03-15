const Payment = require("../models/paymentModel");
const Booking = require("../models/bookingModel");
const Notification = require("../models/notificationModel");

// Create a new payment
exports.processPayment = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    const booking = await Booking.findById(bookingId).populate("garage");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const payment = new Payment({
      booking: bookingId,
      amount: amount,
    });

    const saved = await payment.save();

    // Notify Host
    const notification = new Notification({
      host: booking.garage.host,
      message: `A payment of $${amount} was completed for your garage space.`,
      type: "payment",
    });
    await notification.save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
