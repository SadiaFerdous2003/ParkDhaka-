const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");

const cors = require("cors");
const connectDB = require("./config/db");
const routes = require("./routes/routes");

const app = express();

// Create uploads directory if it doesn't exist
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(cors());
app.use(express.json());

// serve uploaded images
connectDB();

app.get("/", (req, res) => {
  res.send("ParkDhaka API running...");
});

app.get("/api/status", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date() });
});

// API endpoint to get frontend configuration including Google Maps API key
app.get("/api/config", (req, res) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ""
  });
});

app.use("/api", routes);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`Run this to fix: taskkill /IM node.exe /F`);
    console.error(`Then restart with: npm run dev\n`);
    process.exit(1);
  } else {
    throw err;
  }
});