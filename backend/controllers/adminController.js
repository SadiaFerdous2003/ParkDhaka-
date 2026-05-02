const GarageSpace = require("../models/garageSpace");
const User = require("../models/user");
const Booking = require("../models/booking");
const Rating = require("../models/rating");
const Complaint = require("../models/complaint");

// ── Garage Approvals ──
exports.getGarages = async (req, res) => {
  try {
    const spaces = await GarageSpace.find().populate("host", "name email").sort({ createdAt: -1 });
    res.json(spaces);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateGarageApprovalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body;
    
    if (!["Pending", "Approved", "Rejected"].includes(approvalStatus)) {
      return res.status(400).json({ message: "Invalid approval status" });
    }

    const space = await GarageSpace.findByIdAndUpdate(
      id,
      { approvalStatus },
      { new: true }
    );
    if (!space) return res.status(404).json({ message: "Garage space not found" });

    res.json(space);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── User Monitoring ──
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleUserBan = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = user.status === "Active" ? "Banned" : "Active";
    await user.save();
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Booking Monitoring ──
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("driver", "name email")
      .populate({
        path: "garageSpace",
        select: "price location",
        populate: { path: "host", select: "name email" }
      })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Revenue Analytics ──
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: { $in: ["confirmed", "completed"] } });
    
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
    // Group by month
    const monthlyData = {};
    bookings.forEach(b => {
      const date = new Date(b.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      monthlyData[monthYear] += (b.totalPrice || 0);
    });

    res.json({
      totalRevenue,
      monthlyData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Aggregated Ratings ──
exports.getAggregatedRatings = async (req, res) => {
  try {
    // Basic aggregation: calculate average rating across the platform
    const ratings = await Rating.find();
    let averageRating = 0;
    if (ratings.length > 0) {
      averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    }

    res.json({
      totalRatings: ratings.length,
      averageRating: averageRating.toFixed(1)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Complaints & Disputes ──
exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resolveComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status: "Resolved", resolutionNotes },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── System Performance ──
exports.getSystemPerformance = async (req, res) => {
  try {
    // Return mock system metrics for demonstration
    const os = require("os");
    
    const performanceData = {
      uptime: os.uptime(), // seconds
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuLoad: os.loadavg()[0] // 1 minute load average
    };

    res.json(performanceData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
