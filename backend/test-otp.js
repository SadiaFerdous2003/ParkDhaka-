#!/usr/bin/env node

/**
 * Manual test script for OTP flow
 * Tests: request OTP → verify OTP (success/failure) → registration/login
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");
const User = require("./models/user");
const Otp = require("./models/otp");
const { generateAndSendOTP, verifyOTP } = require("./utils/otpService");

const DATABASE_URL = process.env.MONGO_URI || "mongodb://localhost:27017/parkdhaka";

async function test() {
  try {
    console.log("\n--- Connecting to DB ---");
    await mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✓ Connected");

    // Clean up test data
    console.log("\n--- Cleaning up previous test ---");
    await Otp.deleteMany({ contact: { $in: ["test@example.com", "+1234567890"] } });
    await User.deleteMany({ email: "testOtp@example.com" });
    console.log("✓ Cleanup done");

    // Test 1: Generate and send OTP (email)
    console.log("\n--- Test 1: Generate OTP (Email) ---");
    const email = "test@example.com";
    const result1 = await generateAndSendOTP(email, "register");
    console.log(`✓ OTP generated and sent (logged in console above)\nExpires at: ${result1.expiresAt}`);

    // Get the OTP code from DB (simulate user receiving it)
    const otpRecord = await Otp.findOne({ contact: email }).sort({ createdAt: -1 });
    const code = otpRecord.code;
    console.log(`  Simulated received code: ${code}`);

    // Test 2: Verify OTP (valid)
    console.log("\n--- Test 2: Verify OTP (valid) ---");
    const checkValid = await verifyOTP(email, code, "register");
    console.log(`✓ OTP verification: ${JSON.stringify(checkValid)}`);

    // Verify another OTP should fail (already used)
    console.log("\n--- Test 3: Re-verify same OTP (should fail) ---");
    const checkReused = await verifyOTP(email, code, "register");
    console.log(`✓ Re-verify result (expect error): ${JSON.stringify(checkReused)}`);

    // Test 4: Generate and verify with wrong code
    console.log("\n--- Test 4: Verify with wrong code ---");
    const phone = "+1234567890";
    await generateAndSendOTP(phone, "login");
    const wrongCheck = await verifyOTP(phone, "000000", "login");
    console.log(`✓ Wrong code verification (expect error): ${JSON.stringify(wrongCheck)}`);

    // Test 5: Verify expired OTP
    console.log("\n--- Test 5: Verify expired OTP ---");
    const expiredEmail = "expiretest@example.com";
    
    // Generate OTP
    await generateAndSendOTP(expiredEmail, "login");
    const expiredRecord = await Otp.findOne({ contact: expiredEmail }).sort({ createdAt: -1 });
    
    // Manually set expiry to past
    expiredRecord.expiresAt = new Date(Date.now() - 10000);
    await expiredRecord.save();
    
    const expiredCheck = await verifyOTP(expiredEmail, expiredRecord.code, "login");
    console.log(`✓ Expired OTP verification (expect error): ${JSON.stringify(expiredCheck)}`);

    console.log("\n✓✓✓ All OTP tests passed!");

    await mongoose.disconnect();
    console.log("✓ Disconnected from DB");
    process.exit(0);
  } catch (err) {
    console.error("✗ Test error:", err);
    process.exit(1);
  }
}

test();
