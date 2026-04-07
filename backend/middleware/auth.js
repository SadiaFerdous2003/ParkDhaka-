const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Attach decoded info
    req.user = decoded;

    // Load user from DB to check status and get latest role
    const User = require("../models/user");
    const userRecord = await User.findById(decoded.userId).select("role status");
    if (!userRecord) return res.status(401).json({ message: "User not found" });
    if (userRecord.status !== "active") return res.status(403).json({ message: "Account suspended" });

    // Ensure role matches latest DB record
    req.user.role = userRecord.role;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized - invalid role" });
    }
    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };