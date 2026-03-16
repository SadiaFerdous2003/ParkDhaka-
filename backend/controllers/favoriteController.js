const User = require("../models/user");
const GarageSpace = require("../models/garageSpace");

// POST /api/favorites/:garageSpaceId — toggle favorite
exports.toggleFavorite = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;
    const { garageSpaceId } = req.params;

    // Validate garage space exists
    const space = await GarageSpace.findById(garageSpaceId);
    if (!space) return res.status(404).json({ message: "Garage space not found" });

    const user = await User.findById(driverId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const idx = user.favoriteGarages.indexOf(garageSpaceId);
    let isFavorited;

    if (idx === -1) {
      // Add to favorites
      user.favoriteGarages.push(garageSpaceId);
      isFavorited = true;
    } else {
      // Remove from favorites
      user.favoriteGarages.splice(idx, 1);
      isFavorited = false;
    }

    await user.save();

    res.json({
      message: isFavorited ? "Garage added to favorites" : "Garage removed from favorites",
      isFavorited,
      favoriteGarages: user.favoriteGarages
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/favorites — get all favorites
exports.getFavorites = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;
    const user = await User.findById(driverId).populate({
      path: "favoriteGarages",
      populate: { path: "host", select: "name email" }
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.favoriteGarages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/favorites/ids — get just the IDs (for quick check)
exports.getFavoriteIds = async (req, res) => {
  try {
    const driverId = req.user && req.user.userId;
    const user = await User.findById(driverId).select("favoriteGarages");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.favoriteGarages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
