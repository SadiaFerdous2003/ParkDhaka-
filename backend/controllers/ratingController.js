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
      if (booking.driver.toString() !== fromUserId) {
        return res.status(403).json({ message: "Unauthorized to rate this booking" });
      }
      targetGarage = toGarageId || booking.garageSpace;
      if (!targetGarage) {
        return res.status(400).json({ message: "Garage target is required for driver ratings" });
      }
    } else if (userRole === "GarageHost") {
      if (booking.garageSpace.host.toString() !== fromUserId) {
        return res.status(403).json({ message: "Unauthorized to rate this booking" });
      }
      targetUser = toUserId || booking.driver;
      if (!targetUser) {
        return res.status(400).json({ message: "Driver target is required for host ratings" });
      }
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

exports.getUserRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ toUser: req.params.userId }).populate("fromUser", "name");
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
