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
const ratingController = require("../controllers/ratingController");
const panicController = require("../controllers/panicController");
const adminController = require("../controllers/adminController");
const complaintController = require("../controllers/complaintController");
const userController = require("../controllers/userController");

const { authMiddleware, roleMiddleware } = require("../middleware/auth");

// auth
router.post("/register", authController.register);
router.post("/login", authController.login);
router.put("/profile", authMiddleware, authController.updateProfile);

// favorites
router.get("/favorites", authMiddleware, roleMiddleware(["Driver"]), userController.getFavorites);
router.post("/favorites/:garageId", authMiddleware, roleMiddleware(["Driver"]), userController.toggleFavorite);

// trusted contact (used by panic section)
router.get("/users/trusted-contact", authMiddleware, roleMiddleware(["Driver"]), userController.getTrustedContact);
router.put("/users/trusted-contact", authMiddleware, roleMiddleware(["Driver"]), userController.updateTrustedContact);

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
  "/garages/nearby",
  authMiddleware,
  parkingController.getNearbyGarages
);
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
  "/payments/process",
  authMiddleware,
  roleMiddleware(["Driver"]),
  paymentController.processPayment
);
router.post(
  "/payments/confirm-cash",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  paymentController.confirmCashPayment
);
router.get(
  "/payments/history",
  authMiddleware,
  roleMiddleware(["Driver"]),
  paymentController.getHistory
);
router.get(
  "/payments/receipt/:id",
  authMiddleware,
  paymentController.getReceipt
);
router.get(
  "/payments/host",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  paymentController.getHostPayments
);
router.post(
  "/payments/withdraw",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  paymentController.requestWithdrawal
);
router.get(
  "/payments/withdrawals",
  authMiddleware,
  roleMiddleware(["GarageHost"]),
  paymentController.getHostWithdrawals
);

// ── NID Verification (FR-20) ──
router.get("/users/nid-status", authMiddleware, userController.getNidStatus);
router.post("/users/verify-nid", authMiddleware, userController.verifyNid);

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
router.put(
  "/subscriptions/:id/cancel",
  authMiddleware,
  roleMiddleware(["Driver"]),
  subscriptionController.cancelSubscription
);

// ── Ratings (FR-21) ──
router.post("/ratings", authMiddleware, roleMiddleware(["Driver", "GarageHost"]), ratingController.submitRating);
router.get("/ratings/my-pending", authMiddleware, roleMiddleware(["Driver", "GarageHost"]), userController.getMyPendingRatings);
router.get("/ratings/my-received", authMiddleware, roleMiddleware(["GarageHost"]), ratingController.getMyReceivedRatings);
router.get("/garage-spaces/:garageId/ratings", authMiddleware, ratingController.getGarageRatings);
router.get("/users/:userId/ratings", authMiddleware, ratingController.getUserRatings);

// ── Panic System (FR-22) ──
router.post(
  "/panic",
  authMiddleware,
  roleMiddleware(["Driver"]),
  panicController.triggerPanic
);
// Admin panic logs — frontend calls /panic/logs
router.get(
  "/panic/logs",
  authMiddleware,
  roleMiddleware(["Admin"]),
  panicController.getPanicLogs
);
router.get(
  "/panic",
  authMiddleware,
  roleMiddleware(["Admin"]),
  panicController.getPanicLogs
);
router.put(
  "/panic/:id/resolve",
  authMiddleware,
  roleMiddleware(["Admin"]),
  panicController.resolvePanic
);

// ── Admin Dashboard Routes ──
router.get("/admin/garages", authMiddleware, roleMiddleware(["Admin"]), adminController.getGarages);
router.put("/admin/garages/:id/approve", authMiddleware, roleMiddleware(["Admin"]), adminController.updateGarageApprovalStatus);

router.get("/admin/users", authMiddleware, roleMiddleware(["Admin"]), adminController.getUsers);
router.put("/admin/users/:id/ban", authMiddleware, roleMiddleware(["Admin"]), adminController.toggleUserBan);

router.get("/admin/bookings", authMiddleware, roleMiddleware(["Admin"]), adminController.getAllBookings);
router.get("/admin/revenue", authMiddleware, roleMiddleware(["Admin"]), adminController.getRevenueAnalytics);
router.get("/admin/ratings", authMiddleware, roleMiddleware(["Admin"]), adminController.getAggregatedRatings);
router.get("/admin/complaints", authMiddleware, roleMiddleware(["Admin"]), adminController.getComplaints);
router.put("/admin/complaints/:id/resolve", authMiddleware, roleMiddleware(["Admin"]), adminController.resolveComplaint);
router.get("/admin/performance", authMiddleware, roleMiddleware(["Admin"]), adminController.getSystemPerformance);
router.get("/admin/withdrawals", authMiddleware, roleMiddleware(["Admin"]), adminController.getWithdrawals);
router.put("/admin/withdrawals/:id", authMiddleware, roleMiddleware(["Admin"]), adminController.updateWithdrawalStatus);

// ── User Complaints ──
router.post("/complaints", authMiddleware, complaintController.submitComplaint);


// ── Weather & Monsoon Alerts (FR-23) ──
const weatherController = require("../controllers/weatherController");
router.get("/weather/alerts", authMiddleware, weatherController.getActiveAlerts);
router.post("/weather/alerts", authMiddleware, roleMiddleware(["Admin"]), weatherController.createAlert);
router.patch("/weather/alerts/:id/deactivate", authMiddleware, roleMiddleware(["Admin"]), weatherController.deactivateAlert);

module.exports = router;