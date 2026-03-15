const Notification = require("../models/notificationModel");

// Get all notifications for the authenticated host
exports.getHostNotifications = async (req, res) => {
  try {
    const hostId = req.user && req.user.userId;
    const notifications = await Notification.find({ host: hostId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark a specific notification as read
exports.markAsRead = async (req, res) => {
  try {
    const hostId = req.user && req.user.userId;
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    // Validate ownership
    if (notification.host.toString() !== hostId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    notification.isRead = true;
    const updated = await notification.save();

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
