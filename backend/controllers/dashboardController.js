exports.getDriverDashboard = async (req, res) => {
  try {
    res.json({
      message: "Driver Dashboard",
      data: {
        bookedSpots: 2,
        totalMoneySpent: "$45.50",
        upcomingReservations: 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const GarageSpace = require("../models/garageSpace");

exports.getGarageHostDashboard = async (req, res) => {
  try {
    const hostId = req.user && req.user.userId;
    // compute some basic stats
    const totalSpaces = await GarageSpace.countDocuments({ host: hostId });
    // no occupancy data currently, default to 0
    const occupiedSpaces = 0;
    // revenue would normally be calculated from reservations; placeholder for now
    const monthlyRevenue = "$0.00";

    res.json({
      message: "Garage Host Dashboard",
      data: {
        totalSpaces,
        occupiedSpaces,
        monthlyRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    res.json({
      message: "Admin Dashboard",
      data: {
        totalUsers: 127,
        totalGarages: 15,
        totalTransactions: 458
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};