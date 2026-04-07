const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["Driver","GarageHost","Admin"],
    default: "Driver"
  },
  status: {
    type: String,
    enum: ["active", "suspended"],
    default: "active"
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(pw) {
  return bcrypt.compare(pw, this.password);
};

module.exports = mongoose.model("User", userSchema);