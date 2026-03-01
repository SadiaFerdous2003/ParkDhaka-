const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  }
});

const parkingController = require("../controllers/parkingController");
const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");

// auth
router.post("/register", authController.register);
router.post("/login", authController.login);

// existing parking endpoints
router.get("/parkings", parkingController.getParkings);
router.post("/parkings", parkingController.addParking);

// garage host space management (FR-17)
router.get(
  "/garage-spaces",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  parkingController.getGarageSpaces
);
router.post(
  "/garage-spaces",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  upload.array("images", 5), // Accept up to 5 images
  parkingController.addGarageSpace
);

// modify / delete
router.put(
  "/garage-spaces/:id",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  parkingController.updateGarageSpace
);

router.delete(
  "/garage-spaces/:id",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  parkingController.deleteGarageSpace
);

// dashboards
router.get(
  "/dashboard/driver",
  authMiddleware,
  roleMiddleware(["Driver"]),
  dashboardController.getDriverDashboard
);
router.get(
  "/dashboard/garage-host",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  dashboardController.getGarageHostDashboard
);
router.get(
  "/dashboard/admin",
  authMiddleware,
  roleMiddleware(["Admin"]),
  dashboardController.getAdminDashboard
);

module.exports = router;