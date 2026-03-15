const Booking = require("../models/bookingModel");
const GarageSpace = require("../models/garageSpace");
const Notification = require("../models/notificationModel");

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;
    const { garageId } = req.body;

    const garage = await GarageSpace.findById(garageId);
    if (!garage) return res.status(404).json({ message: "Garage not found" });

    const booking = new Booking({
      driver: driverId,
      garage: garageId,
    });

    const saved = await booking.save();

    // Notify Host
    const notification = new Notification({
      host: garage.host,
      message: `A driver has booked your garage space (ID: ${garageId}).`,
      type: "booking",
    });
    await notification.save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate("garage");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "Cancelled";
    const updated = await booking.save();

    // Notify Host
    const notification = new Notification({
      host: booking.garage.host,
      message: `A driver has cancelled their booking for your garage space (ID: ${booking.garage._id}).`,
      type: "cancellation",
    });
    await notification.save();

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
