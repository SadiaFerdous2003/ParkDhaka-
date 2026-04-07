const User = require("../models/user");
const Notification = require("../models/notification");

// GET /api/admin/users — list users (basic info)
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select("name email phone role status createdAt").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/suspend
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "user id required" });

    // Compare IDs as strings to handle ObjectId comparison
    if (req.user.userId.toString() === id.toString()) return res.status(400).json({ message: "Cannot suspend yourself" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = "suspended";
    await user.save();

    // Notify the user (admin action)
    try {
      const note = new Notification({
        host: user._id,
        message: "Your account has been suspended. Please contact support.",
        type: "payment",
        relatedId: user._id
      });
      await note.save();
    } catch (notifyErr) {
      console.error("Failed to notify suspended user:", notifyErr);
    }

    res.json({ message: "User suspended", user: { id: user._id, status: user.status } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/activate
exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "user id required" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = "active";
    await user.save();

    // Notify the user (admin action)
    try {
      const note = new Notification({
        host: user._id,
        message: "Your account has been reactivated. Thank you!",
        type: "payment",
        relatedId: user._id
      });
      await note.save();
    } catch (notifyErr) {
      console.error("Failed to notify reactivated user:", notifyErr);
    }

    res.json({ message: "User activated", user: { id: user._id, status: user.status } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/role — change role
exports.changeRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!id || !role) return res.status(400).json({ message: "user id and role are required" });
    if (!["Driver","GarageHost","Admin"].includes(role)) return res.status(400).json({ message: "invalid role" });
    
    // Prevent admin from changing their own role
    if (req.user.userId.toString() === id.toString()) return res.status(400).json({ message: "Cannot change your own role" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();
    res.json({ message: "User role updated", user: { id: user._id, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
