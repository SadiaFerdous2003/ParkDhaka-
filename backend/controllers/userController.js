const User = require("../models/user");
const GarageSpace = require("../models/garageSpace");

// ── Toggle Favorite Garage ──
exports.toggleFavorite = async (req, res) => {
  try {
    const { garageId } = req.params;
    // JWT payload uses `userId` (set in authController)
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Use .toString() to safely compare Mongoose ObjectIds with string garageId
    const index = user.favorites.findIndex(
      (fav) => fav.toString() === garageId
    );

    if (index === -1) {
      user.favorites.push(garageId);
      await user.save();
      return res.status(200).json({ message: "Added to favorites", favorites: user.favorites });
    } else {
      user.favorites.splice(index, 1);
      await user.save();
      return res.status(200).json({ message: "Removed from favorites", favorites: user.favorites });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get Favorite Garages ──
exports.getFavorites = async (req, res) => {
  const userId = req.user.userId;
  console.log("Fetching favorites for user:", userId);
  try {
    const user = await User.findById(userId).populate({
      path: "favorites",
      populate: { path: "host", select: "name email" }
    });

    if (!user) {
      console.warn("User not found in getFavorites:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out any nulls (deleted garages)
    const validFavorites = user.favorites.filter((f) => f !== null);
    console.log(`Found ${validFavorites.length} favorites`);
    res.status(200).json(validFavorites);
  } catch (error) {
    console.error("Error in getFavorites:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── Get Trusted Contact ──
exports.getTrustedContact = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("trustedContact");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.trustedContact || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Update Trusted Contact ──
exports.updateTrustedContact = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email, phone } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.trustedContact = {
      name: name || "",
      email: email || "",
      phone: phone || ""
    };

    await user.save();
    res.json({ message: "Trusted contact updated", trustedContact: user.trustedContact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get My Pending Ratings (completed bookings not yet rated) ──
exports.getMyPendingRatings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const Booking = require("../models/booking");
    const Rating = require("../models/rating");

    let bookings = [];

    if (userRole === "Driver") {
      bookings = await Booking.find({
        driver: userId,
        status: "completed"
      })
        .populate("garageSpace")
        .populate("driver", "name");
    } else if (userRole === "GarageHost") {
      const garageSpaces = await GarageSpace.find({ host: userId }).select("_id");
      const spaceIds = garageSpaces.map((s) => s._id);

      bookings = await Booking.find({
        garageSpace: { $in: spaceIds },
        status: "completed"
      })
        .populate("garageSpace")
        .populate("driver", "name");
    }

    // Filter out already-rated bookings by this user
    const rated = await Rating.find({ fromUser: userId }).distinct("booking");
    const ratedIds = rated.map((id) => id.toString());

    const pending = bookings.filter((b) => !ratedIds.includes(b._id.toString()));

    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── FR-20: NID Verification Logic ──
exports.getNidStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("nidNumber isNidVerified");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      nidNumber: user.nidNumber || "",
      isNidVerified: user.isNidVerified
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyNid = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { nidNumber } = req.body;
    if (!nidNumber || nidNumber.length < 10) {
      return res.status(400).json({ message: "Invalid NID format" });
    }
    const user = await User.findById(userId);
    user.nidNumber = nidNumber;
    user.isNidVerified = true;
    await user.save();
    res.json({ message: "NID Verified successfully", isNidVerified: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
