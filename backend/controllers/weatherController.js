const WeatherAlert = require("../models/weatherAlert");
const Notification = require("../models/notification");
const Booking = require("../models/booking");
const GarageSpace = require("../models/garageSpace");

exports.createAlert = async (req, res) => {
  try {
    const { title, description, area, severity, type } = req.body;
    const alert = new WeatherAlert({ title, description, area, severity, type });
    await alert.save();

    // ── Notify users with active bookings in this area ──
    // 1. Find garages in this area
    const affectedGarages = await GarageSpace.find({ 
      "location.address": { $regex: area, $options: "i" } 
    });
    
    const garageIds = affectedGarages.map(g => g._id);

    // 2. Find active bookings for these garages
    const activeBookings = await Booking.find({
      garageSpace: { $in: garageIds },
      status: "Confirmed"
    });

    // 3. Create notifications for affected drivers
    const notificationPromises = activeBookings.map(booking => {
      const notification = new Notification({
        user: booking.user,
        title: `⚠️ Monsoon Alert: ${title}`,
        message: `Your booking at ${area} may be affected by ${type.toLowerCase()}. Condition: ${description}`,
        type: "System"
      });
      return notification.save();
    });

    await Promise.all(notificationPromises);

    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getActiveAlerts = async (req, res) => {
  try {
    const alerts = await WeatherAlert.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deactivateAlert = async (req, res) => {
  try {
    const alert = await WeatherAlert.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.json(alert);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
