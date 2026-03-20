const Notification = require("../models/notification");

exports.getNotifications = async (req, res) => {
  try {
    const hostId = req.user && req.user.userId;
    const notifications = await Notification.find({ host: hostId })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const hostId = req.user && req.user.userId;
    const { id } = req.params;
    
    const notification = await Notification.findOne({ _id: id, host: hostId });
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    notification.readStatus = true;
    await notification.save();
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
