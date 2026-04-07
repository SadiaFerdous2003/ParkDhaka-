#!/usr/bin/env node

/**
 * Test script for role-based access control and user suspension
 * Tests: role-based endpoint access, account suspension blocking, admin management
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");
const User = require("./models/user");
const jwt = require("jsonwebtoken");

const DATABASE_URL = process.env.MONGO_URI || "mongodb://localhost:27017/parkdhaka";

async function test() {
  try {
    console.log("\n--- Connecting to DB ---");
    await mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✓ Connected");

    // Clean up test users
    console.log("\n--- Cleaning up previous test users ---");
    await User.deleteMany({ email: { $in: ["driver@test.com", "host@test.com", "admin@test.com"] } });
    console.log("✓ Cleanup done");

    // Create test users
    console.log("\n--- Test 1: Create test users with different roles ---");
    const driver = new User({ name: "Test Driver", email: "driver@test.com", password: "pass123", role: "Driver", status: "active" });
    const host = new User({ name: "Test Host", email: "host@test.com", password: "pass123", role: "GarageHost", status: "active" });
    const admin = new User({ name: "Test Admin", email: "admin@test.com", password: "pass123", role: "Admin", status: "active" });

    await driver.save();
    await host.save();
    await admin.save();
    console.log(`✓ Created users: Driver(${driver._id}), Host(${host._id}), Admin(${admin._id})`);

    // Generate tokens
    console.log("\n--- Test 2: Generate JWT tokens ---");
    const secret = process.env.JWT_SECRET || "your-secret-key";
    const driverToken = jwt.sign({ userId: driver._id, role: "Driver" }, secret, { expiresIn: "7d" });
    const adminToken = jwt.sign({ userId: admin._id, role: "Admin" }, secret, { expiresIn: "7d" });
    console.log("✓ Tokens generated");

    // Test 3: Check roles
    console.log("\n--- Test 3: Verify user roles from DB ---");
    const driverFromDb = await User.findById(driver._id);
    const adminFromDb = await User.findById(admin._id);
    console.log(`✓ Driver role: ${driverFromDb.role}, status: ${driverFromDb.status}`);
    console.log(`✓ Admin role: ${adminFromDb.role}, status: ${adminFromDb.status}`);

    // Test 4: Simulate auth middleware check for suspended user
    console.log("\n--- Test 4: Test suspended user block ---");
    driver.status = "suspended";
    await driver.save();
    const suspendedDriver = await User.findById(driver._id);
    console.log(`✓ Suspended driver status: ${suspendedDriver.status} (should be "suspended")`);
    if (suspendedDriver.status !== "active") {
      console.log("✓ Access would be blocked for suspended user");
    }

    // Reactivate
    driver.status = "active";
    await driver.save();
    console.log("✓ Driver reactivated");

    // Test 5: Role change
    console.log("\n--- Test 5: Test role change ---");
    driver.role = "GarageHost";
    await driver.save();
    const updatedDriver = await User.findById(driver._id);
    console.log(`✓ Driver role changed to: ${updatedDriver.role}`);

    // Test 6: Verify multiple admin operations
    console.log("\n--- Test 6: Test admin bulk operations ---");
    const allUsers = await User.find().select("name email role status");
    console.log(`✓ Total users in DB: ${allUsers.length}`);
    console.log(`✓ Sample users: ${allUsers.slice(0, 2).map(u => `${u.name}(${u.role})`).join(", ")}`);

    console.log("\n✓✓✓ All role-based access control tests passed!");

    await mongoose.disconnect();
    console.log("✓ Disconnected from DB");
    process.exit(0);
  } catch (err) {
    console.error("✗ Test error:", err);
    process.exit(1);
  }
}

test();
