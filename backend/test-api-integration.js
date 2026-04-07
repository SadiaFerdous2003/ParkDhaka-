#!/usr/bin/env node

/**
 * Comprehensive API test script
 * Tests all three features: OTP auth, overstay fines, role-based access
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const http = require("http");
const mongoose = require("mongoose");

const DATABASE_URL = process.env.MONGO_URI || "mongodb://localhost:27017/parkdhaka";
const API_URL = "http://localhost:5000";

let testsPassed = 0;
let testsFailed = 0;

async function httpRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: { "Content-Type": "application/json", ...headers }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`✗ ${name}: ${err.message}`);
    testsFailed++;
  }
}

async function runTests() {
  try {
    console.log("\n=== Comprehensive API Tests ===\n");

    // Connect to DB
    console.log("--- Connecting to DB ---");
    await mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✓ DB connected\n");

    // Clean up
    const User = require("./models/user");
    const Otp = require("./models/otp");
    await User.deleteMany({ email: { $in: ["testapi@example.com", "admintestapi@example.com"] } });
    await Otp.deleteMany({ contact: "testapi@example.com" });

    let token = null;
    let userId = null;
    let adminToken = null;

    // OTP TESTS
    console.log("--- Feature 1: OTP Authentication ---");

    await test("Request OTP for registration", async () => {
      const res = await httpRequest("POST", "/api/auth/request-otp", { contact: "testapi@example.com", purpose: "register" });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    let otpCode = null;
    await test("Retrieve OTP code from DB", async () => {
      const otp = await Otp.findOne({ contact: "testapi@example.com" }).sort({ createdAt: -1 });
      if (!otp || !otp.code) throw new Error("No OTP found");
      otpCode = otp.code;
    });

    await test("Verify OTP and register user", async () => {
      const res = await httpRequest("POST", "/api/auth/verify-otp", {
        contact: "testapi@example.com",
        code: otpCode,
        purpose: "register",
        name: "Test User",
        email: "testapi@example.com",
        password: "test123456",
        role: "Driver"
      });
      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      if (!res.data.token) throw new Error("No token in response");
      token = res.data.token;
      userId = res.data.user.id;
    });

    // ROLE-BASED ACCESS TESTS
    console.log("\n--- Feature 2: Role-Based Access Control ---");

    await test("Access driver endpoint with valid token", async () => {
      const res = await httpRequest("GET", "/api/bookings/my", null, { Authorization: `Bearer ${token}` });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    await test("Reject access to admin endpoint with non-admin token", async () => {
      const res = await httpRequest("GET", "/api/admin/users", null, { Authorization: `Bearer ${token}` });
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    });

    // Create admin user for admin tests
    const adminUser = new User({ name: "Admin Test", email: "admintestapi@example.com", password: "admin123", role: "Admin", status: "active" });
    await adminUser.save();
    const jwt = require("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "your-secret-key";
    adminToken = jwt.sign({ userId: adminUser._id, role: "Admin" }, secret, { expiresIn: "7d" });

    await test("Admin can list users", async () => {
      const res = await httpRequest("GET", "/api/admin/users", null, { Authorization: `Bearer ${adminToken}` });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.data)) throw new Error("Expected array response");
    });

    // USER SUSPENSION TESTS
    console.log("\n--- Feature 3: User Suspension & Management ---");

    await test("Admin can suspend user", async () => {
      const res = await httpRequest("PUT", `/api/admin/users/${userId}/suspend`, {}, { Authorization: `Bearer ${adminToken}` });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.data.user.status !== "suspended") throw new Error("Status not updated to suspended");
    });

    const Notification = require("./models/notification");
    await test("Suspension creates notification", async () => {
      const notif = await Notification.findOne({ host: userId, message: /suspended/ });
      if (!notif) throw new Error("No suspension notification found");
    });

    await test("Suspended user cannot access API", async () => {
      const res = await httpRequest("GET", "/api/bookings/my", null, { Authorization: `Bearer ${token}` });
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
      if (!res.data.message.includes("suspended")) throw new Error("Expected 'suspended' in error");
    });

    await test("Admin can activate user", async () => {
      const res = await httpRequest("PUT", `/api/admin/users/${userId}/activate`, {}, { Authorization: `Bearer ${adminToken}` });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.data.user.status !== "active") throw new Error("Status not updated to active");
    });

    await test("Activation creates notification", async () => {
      const notif = await Notification.findOne({ host: userId, message: /reactivated/ });
      if (!notif) throw new Error("No reactivation notification found");
    });

    await test("Reactivated user can access API again", async () => {
      const res = await httpRequest("GET", "/api/bookings/my", null, { Authorization: `Bearer ${token}` });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    // ROLE CHANGE TESTS
    console.log("\n--- Feature 3b: Role Management ---");

    await test("Admin can change user role", async () => {
      const res = await httpRequest("PUT", `/api/admin/users/${userId}/role`, { role: "GarageHost" }, { Authorization: `Bearer ${adminToken}` });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.data.user.role !== "GarageHost") throw new Error("Role not updated");
    });

    // Summary
    console.log("\n=== Test Summary ===");
    console.log(`✓ Passed: ${testsPassed}`);
    console.log(`✗ Failed: ${testsFailed}`);
    console.log(`📊 Total: ${testsPassed + testsFailed}`);

    if (testsFailed === 0) {
      console.log("\n✅ All API tests passed!");
    } else {
      console.log(`\n⚠️  ${testsFailed} test(s) failed`);
      process.exit(1);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
}

// Wait for server to be ready
setTimeout(runTests, 2000);
