const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const GarageSpace = require("./models/garageSpace");

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const spaces = await GarageSpace.find({});
  console.log("Number of spaces:", spaces.length);
  if (spaces.length > 0) {
    console.log("First space:", spaces[0]);
  }
  process.exit(0);
}
check().catch(console.error);
