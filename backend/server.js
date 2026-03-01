// backend/server.js
require("dotenv").config(); // ✅ must be first line
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

app.get("/", (req, res) => {
  res.send("ParkDhaka API running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));