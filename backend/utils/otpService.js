const Otp = require("../models/otp");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

let twilioClient = null;
if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
  try {
    const twilio = require("twilio");
    twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  } catch (e) {
    console.warn("otpService: twilio not available, SMS will be logged");
  }
}

function generateCode() {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail(to, subject, text) {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    return transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text });
  }

  // Fallback: log to console
  console.log(`[otpService] sendEmail to=${to} subject=${subject} text=${text}`);
  return Promise.resolve();
}

async function sendSms(to, message) {
  if (twilioClient && process.env.TWILIO_FROM) {
    return twilioClient.messages.create({ body: message, to, from: process.env.TWILIO_FROM });
  }

  // Fallback: log to console
  console.log(`[otpService] sendSms to=${to} message=${message}`);
  return Promise.resolve();
}

async function generateAndSendOTP(contact, purpose, expiryMinutes = Number(process.env.OTP_EXPIRE_MINUTES) || 5) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const otp = new Otp({ contact, code, purpose, expiresAt });
  await otp.save();

  const message = `Your ParkDhaka verification code is ${code}. It expires in ${expiryMinutes} minutes.`;

  if (contact.includes("@")) {
    await sendEmail(contact, "ParkDhaka OTP", message);
  } else {
    await sendSms(contact, message);
  }

  return { success: true, expiresAt };
}

async function verifyOTP(contact, code, purpose) {
  const now = new Date();
  const otp = await Otp.findOne({ contact, purpose, used: false }).sort({ createdAt: -1 });
  if (!otp) return { valid: false, reason: "not_found" };
  if (otp.expiresAt.getTime() < now.getTime()) return { valid: false, reason: "expired" };
  if (otp.code !== String(code)) return { valid: false, reason: "invalid" };

  otp.used = true;
  await otp.save();
  return { valid: true };
}

module.exports = { generateAndSendOTP, verifyOTP };
