const Rating = require("../models/rating");
const Booking = require("../models/booking");

exports.submitRating = async (req, res) => {
  try {
    const { bookingId, toUserId, toGarageId, rating, comment } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Check if rating already exists from this user for this booking
    const existing = await Rating.findOne({ booking: bookingId, fromUser: req.user._id });
    if (existing) return res.status(400).json({ message: "Already rated" });

    const newRating = new Rating({
      booking: bookingId,
      fromUser: req.user._id,
      toUser: toUserId,
      toGarage: toGarageId,
      rating,
      comment
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
