const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { generateAndSendOTP, verifyOTP } = require("../utils/otpService");
const Otp = require("../models/otp");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["Driver", "GarageHost", "Admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = new User({ name, email, password, role });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if account is suspended BEFORE issuing token
    if (user.status !== "active") {
      return res.status(403).json({ message: "Account suspended. Please contact support." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/request-otp
exports.requestOtp = async (req, res) => {
  try {
    const { contact, purpose } = req.body; // contact: email or phone
    if (!contact || !purpose || !["login", "register"].includes(purpose)) {
      return res.status(400).json({ message: "contact and purpose (login|register) are required" });
    }

    await generateAndSendOTP(contact, purpose);
    res.json({ message: "OTP sent if the contact exists or is deliverable" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/verify-otp
// For 'register' purpose, also create the user (requires name,email,password,role)
exports.verifyOtp = async (req, res) => {
  try {
    const { contact, code, purpose, name, email, password, role } = req.body;
    if (!contact || !code || !purpose) return res.status(400).json({ message: "contact, code and purpose are required" });

    const result = await verifyOTP(contact, code, purpose);
    if (!result.valid) {
      const status = result.reason === "expired" ? 410 : 400;
      return res.status(status).json({ message: `OTP ${result.reason || 'invalid'}` });
    }

    // Successful OTP validation
    if (purpose === "login") {
      // find user by email or phone
      const user = await User.findOne({ $or: [{ email: contact }, { phone: contact }] });
      if (!user) return res.status(404).json({ message: "User not found for contact" });

      const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });
      return res.json({ message: "Login via OTP successful", token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }

    if (purpose === "register") {
      // Require registration fields
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "name, email, password and role are required for registration" });
      }

      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: "Email already registered" });

      const user = new User({ name, email, password, role });
      // If contact was a phone number, attach it
      if (!contact.includes("@")) user.phone = contact;
      await user.save();

      const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });
      return res.status(201).json({ message: "Registration successful", token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }

    res.status(400).json({ message: "Invalid purpose" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};