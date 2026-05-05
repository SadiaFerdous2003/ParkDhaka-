const Rating = require("../models/rating");
const Booking = require("../models/booking");

exports.submitRating = async (req, res) => {
  try {
    const { bookingId, toUserId, toGarageId, rating, review, comment } = req.body;
    const booking = await Booking.findById(bookingId).populate("garageSpace").populate("driver", "name");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const fromUserId = req.user.userId;
    const userRole = req.user.role;

    // Check if rating already exists from this user for this booking
    const existing = await Rating.findOne({ booking: bookingId, fromUser: fromUserId });
    if (existing) return res.status(400).json({ message: "Already rated" });

    let targetUser = null;
    let targetGarage = null;

    if (userRole === "Driver") {
      if (!booking.driver || booking.driver._id.toString() !== fromUserId) {
        return res.status(403).json({ message: "Unauthorized to rate this booking" });
      }
      if (!booking.garageSpace) {
        return res.status(400).json({ message: "Garage target is missing from booking data" });
      }
      targetGarage = booking.garageSpace._id || booking.garageSpace;
    } else if (userRole === "GarageHost") {
      if (!booking.garageSpace || !booking.garageSpace.host || booking.garageSpace.host.toString() !== fromUserId) {
        return res.status(403).json({ message: "Unauthorized to rate this booking" });
      }
      if (!booking.driver) {
        return res.status(400).json({ message: "Driver target is missing from booking data" });
      }
      targetUser = booking.driver._id || booking.driver;
    } else {
      return res.status(403).json({ message: "Only drivers and garage hosts may submit ratings" });
    }

    const newRating = new Rating({
      booking: bookingId,
      fromUser: fromUserId,
      toUser: targetUser,
      toGarage: targetGarage,
      rating,
      comment: review || comment || ""
    });

    await newRating.save();
    res.status(201).json({ message: "Rating submitted successfully", rating: newRating });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getGarageRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ toGarage: req.params.garageId }).populate("fromUser", "name");
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMyReceivedRatings = async (req, res) => {
  try {
    const garageSpaces = await GarageSpace.find({ host: req.user.userId }).select("_id");
    const garageIds = garageSpaces.map((space) => space._id);
    if (garageIds.length === 0) return res.json([]);

    const ratings = await Rating.find({ toGarage: { $in: garageIds } })
      .populate("fromUser", "name")
      .populate({
        path: "booking",
        populate: [
          { path: "garageSpace", select: "location price" },
          { path: "driver", select: "name" }
        ]
      })
      .sort({ createdAt: -1 });

    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ toUser: req.params.userId }).populate("fromUser", "name");
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
