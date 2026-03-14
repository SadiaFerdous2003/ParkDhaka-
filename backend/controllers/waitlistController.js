const Waitlist = require("../models/waitlist");

// POST /api/waitlist — join waitlist for a space + date
exports.joinWaitlist = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;
    const { garageSpaceId, date } = req.body;

    if (!garageSpaceId || !date) {
      return res.status(400).json({ message: "garageSpaceId and date are required" });
    }

    const entry = new Waitlist({
      driver: driverId,
      garageSpace: garageSpaceId,
      date // "YYYY-MM-DD"
    });

    const saved = await entry.save();
    res.status(201).json({ message: "Added to waitlist", entry: saved });
  } catch (err) {
    // Duplicate key = already on waitlist
    if (err.code === 11000) {
      return res.status(409).json({ message: "You are already on the waitlist for this space and date" });
    }
    res.status(400).json({ message: err.message });
  }
};

// GET /api/waitlist/my — driver's waitlist entries
exports.getMyWaitlist = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;
    const entries = await Waitlist.find({ driver: driverId })
      .populate("garageSpace")
      .sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/waitlist/:id — leave waitlist
exports.leaveWaitlist = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;
    const entry = await Waitlist.findById(req.params.id);

    if (!entry) return res.status(404).json({ message: "Waitlist entry not found" });
    if (entry.driver.toString() !== driverId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Waitlist.deleteOne({ _id: entry._id });
    res.json({ message: "Removed from waitlist" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
