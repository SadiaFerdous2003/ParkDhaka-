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

    const now = new Date();

    // ── Today ──
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    const todayBookings = await Booking.find({
      garageSpace: { $in: spaceIds },
      status: { $in: ["confirmed", "completed"] },
      date: { $gte: todayStart, $lte: todayEnd }
    });
    const dailyBookings = todayBookings.length;
    const dailyIncome   = todayBookings.reduce((s, b) => s + (b.totalPrice || 0), 0);

    // ── This Week (Mon–Sun) ──
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);

    const weeklyBookingDocs = await Booking.find({
      garageSpace: { $in: spaceIds },
      status: { $in: ["confirmed", "completed"] },
      date: { $gte: weekStart, $lte: todayEnd }
    });
    const weeklyBookings = weeklyBookingDocs.length;
    const weeklyIncome   = weeklyBookingDocs.reduce((s, b) => s + (b.totalPrice || 0), 0);

    // ── This Month ──
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyBookingDocs = await Booking.find({
      garageSpace: { $in: spaceIds },
      status: { $in: ["confirmed", "completed"] },
      date: { $gte: monthStart, $lte: todayEnd }
    });
    const monthlyBookings = monthlyBookingDocs.length;
    const monthlyIncome   = monthlyBookingDocs.reduce((s, b) => s + (b.totalPrice || 0), 0);

    // ── Occupied today (confirmed only) ──
    const occupiedSpaces = await Booking.countDocuments({
      garageSpace: { $in: spaceIds },
      status: "confirmed",
      date: { $gte: todayStart, $lte: todayEnd }
    });

    // ── Last 7 days per-day chart data ──
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = new Date(d); ds.setHours(0, 0, 0, 0);
      const de = new Date(d); de.setHours(23, 59, 59, 999);
      const dayDocs = await Booking.find({
        garageSpace: { $in: spaceIds },
        status: { $in: ["confirmed", "completed"] },
        date: { $gte: ds, $lte: de }
      });
      last7.push({
        label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        bookings: dayDocs.length,
        income: dayDocs.reduce((s, b) => s + (b.totalPrice || 0), 0)
      });
    }

    res.json({
      message: "Garage Host Dashboard",
      data: {
        totalSpaces,
        occupiedSpaces,
        monthlyRevenue: `৳${monthlyIncome.toFixed(2)}`,
        stats: {
          daily:   { bookings: dailyBookings,   income: dailyIncome },
          weekly:  { bookings: weeklyBookings,  income: weeklyIncome },
          monthly: { bookings: monthlyBookings, income: monthlyIncome },
          last7Days: last7
        }
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