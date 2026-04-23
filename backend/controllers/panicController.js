const PanicLog = require("../models/panicLog");
const User = require("../models/user");

exports.triggerPanic = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    const log = new PanicLog({
      user: req.user._id,
      location: { lat, lng }
    });
    await log.save();

    // In a real app, this would send SMS/email to trusted contact and admins
    const user = await User.findById(req.user._id);
    let contactInfo = null;
    if (user.trustedContact && user.trustedContact.phone) {
      contactInfo = user.trustedContact;
    }

    res.status(201).json({ 
      message: "Panic alert triggered! Authorities & trusted contact will be notified.", 
      log,
      notifiedContact: contactInfo ? true : false
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPanicLogs = async (req, res) => {
  try {
    const logs = await PanicLog.find().populate("user", "name email trustedContact").sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.resolvePanic = async (req, res) => {
  try {
    const { notes } = req.body;
    const log = await PanicLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Log not found" });

    log.status = "Resolved";
    log.resolutionNotes = notes;
    log.resolvedAt = new Date();
    await log.save();

    res.json({ message: "Panic log resolved", log });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
