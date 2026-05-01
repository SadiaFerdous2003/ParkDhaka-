const Complaint = require("../models/complaint");

exports.submitComplaint = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subject, description } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ message: "Subject and description are required" });
    }

    const complaint = new Complaint({
      user: userId,
      subject,
      description
    });

    await complaint.save();
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
