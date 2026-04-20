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
const bookingController = require("../controllers/bookingController");
const waitlistController = require("../controllers/waitlistController");
const notificationController = require("../controllers/notificationController");
const paymentController = require("../controllers/paymentController");
const subscriptionController = require("../controllers/subscriptionController");
const withdrawalController = require("../controllers/withdrawalController");

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

router.put(
  "/garage-spaces/:id/toggle",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  parkingController.toggleGarageStatus
);


router.delete(
  "/garage-spaces/:id",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  parkingController.deleteGarageSpace
);

// Get all garage spaces (for viewing all listed garages)
router.get(
  "/garage-spaces/all",
  authMiddleware,
  parkingController.getAllGarageSpaces
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

// ── Booking endpoints (FR-7, FR-8) ──
router.post(
  "/bookings",
  authMiddleware,
  roleMiddleware(["Driver"]),
  bookingController.createBooking
);
router.get(
  "/bookings/my",
  authMiddleware,
  roleMiddleware(["Driver"]),
  bookingController.getMyBookings
);
router.put(
  "/bookings/:id/cancel",
  authMiddleware,
  roleMiddleware(["Driver"]),
  bookingController.cancelBooking
);
router.put(
  "/bookings/:id/reschedule",
  authMiddleware,
  roleMiddleware(["Driver"]),
  bookingController.rescheduleBooking
);
router.get(
  "/bookings/host",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  bookingController.getHostBookings
);

// ── Waitlist endpoints (FR-9) ──
router.post(
  "/waitlist",
  authMiddleware,
  roleMiddleware(["Driver"]),
  waitlistController.joinWaitlist
);
router.get(
  "/waitlist/my",
  authMiddleware,
  roleMiddleware(["Driver"]),
  waitlistController.getMyWaitlist
);
router.delete(
  "/waitlist/:id",
  authMiddleware,
  roleMiddleware(["Driver"]),
  waitlistController.leaveWaitlist
);

// ── Notification endpoints ──
router.get(
  "/notifications",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  notificationController.getNotifications
);
router.put(
  "/notifications/:id/read",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  notificationController.markAsRead
);

// ── Payment endpoints ──
router.post(
  "/payments/initiate",
  authMiddleware,
  roleMiddleware(["Driver"]),
  paymentController.initiatePayment
);

router.get(
  "/payments/callback",
  paymentController.handlePaymentCallback
);

router.get(
  "/payments/verify/:bookingId",
  authMiddleware,
  roleMiddleware(["Driver"]),
  paymentController.verifyPayment
);

router.get(
  "/payments/user",
  authMiddleware,
  roleMiddleware(["Driver"]),
  paymentController.getUserPayments
);

router.get(
  "/payments/host",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  paymentController.getHostPayments
);


// ── Subscription Pass (FR-11) ──
router.post(
  "/subscriptions/purchase",
  authMiddleware,
  roleMiddleware(["Driver"]),
  subscriptionController.purchasePass
);
router.get(
  "/subscriptions/my",
  authMiddleware,
  roleMiddleware(["Driver"]),
  subscriptionController.getMySubscription
);


// ── Host Earnings & Withdrawals (FR-16) ──
router.get(
  "/host/earnings-stats",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  withdrawalController.getEarningsStats
);
router.get(
  "/host/banking",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  withdrawalController.getBankingInfo
);
router.post(
  "/host/banking",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  withdrawalController.updateBankingInfo
);
router.get(
  "/host/withdrawals",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  withdrawalController.getHostWithdrawals
);
router.post(
  "/host/withdrawals",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  withdrawalController.requestWithdrawal
);

// Admin / Simulation
router.put(
  "/admin/withdrawals/:id/approve",
  authMiddleware,
  roleMiddleware(["Admin"]),
  withdrawalController.adminApproveWithdrawal
);


module.exports = router;