const GarageSpace = require("../models/garageSpace");
const Booking = require("../models/booking");
const User = require("../models/user");

exports.getDriverDashboard = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;

    // Real counts from bookings collection
    const confirmedBookings = await Booking.find({ driver: driverId, status: "confirmed" });
    const completedBookings = await Booking.find({ driver: driverId, status: "completed" });
    const allPaid = [...confirmedBookings, ...completedBookings];

    const bookedSpots = confirmedBookings.length;
    const totalMoneySpent = allPaid.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const now = new Date();
    const upcomingReservations = confirmedBookings.filter((b) => new Date(b.date) >= now).length;

    res.json({
      message: "Driver Dashboard",
      data: {
        bookedSpots,
        totalMoneySpent: `৳${totalMoneySpent.toFixed(2)}`,
        upcomingReservations
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGarageHostDashboard = async (req, res) => {
  try {
    const hostId = req.user && req.user.userId;
    const totalSpaces = await GarageSpace.countDocuments({ host: hostId });

    // Get all space IDs belonging to this host
    const spaces = await GarageSpace.find({ host: hostId }).select("_id");
    const spaceIds = spaces.map((s) => s._id);

    // Occupied = confirmed bookings for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const occupiedSpaces = await Booking.countDocuments({
      garageSpace: { $in: spaceIds },
      status: "confirmed",
      date: { $gte: todayStart, $lte: todayEnd }
    });

    // Monthly revenue — sum totalPrice of confirmed/completed bookings this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyBookings = await Booking.find({
      garageSpace: { $in: spaceIds },
      status: { $in: ["confirmed", "completed"] },
      date: { $gte: monthStart }
    });
    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    res.json({
      message: "Garage Host Dashboard",
      data: {
        totalSpaces,
        occupiedSpaces,
        monthlyRevenue: `৳${monthlyRevenue.toFixed(2)}`
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGarages = await GarageSpace.countDocuments();
    const totalTransactions = await Booking.countDocuments({
      status: { $in: ["confirmed", "completed"] }
    });

    res.json({
      message: "Admin Dashboard",
      data: {
        totalUsers,
        totalGarages,
        totalTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};