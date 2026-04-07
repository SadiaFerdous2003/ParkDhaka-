// Minimal overstay manager to prevent server crash.
// Starts a periodic task that can be expanded to check DB for overstays.

const mongoose = require("mongoose");

let intervalId = null;

// Config
const DEFAULT_INTERVAL_MS = 60 * 1000; // 1 minute
const GRACE_MINUTES = 5; // grace period before fines apply
const OVERSTAY_MULTIPLIER = 1.5; // charge 1.5x of normal per-hour rate for overstays

function parseEndDate(booking) {
  // booking.date is stored at midnight of booking day
  const endParts = (booking.endTime || "00:00").split(":").map(Number);
  let [endH, endM] = endParts;

  // Adjust day overflow if endH >= 24
  let date = new Date(booking.date);
  if (Number.isFinite(endH) && endH >= 24) {
    const extraDays = Math.floor(endH / 24);
    endH = endH % 24;
    date.setDate(date.getDate() + extraDays);
  }

  date.setHours(endH, endM || 0, 0, 0);
  return date;
}

async function checkOverstays() {
  try {
    // Skip check if MongoDB is not connected
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    const Booking = mongoose.model("Booking");
    const GarageSpace = mongoose.model("GarageSpace");
    const Notification = mongoose.model("Notification");
    const Payment = mongoose.model("Payment");

    const now = new Date();

    // Find active confirmed bookings that may be overstayed
    const candidates = await Booking.find({ status: "confirmed" }).limit(500);

    for (const booking of candidates) {
      // Compute booking end datetime
      const endDate = parseEndDate(booking);

      // Compute minutes overdue after grace
      const overdueMs = now.getTime() - endDate.getTime() - GRACE_MINUTES * 60 * 1000;
      const overdueMinutes = Math.floor(overdueMs / (60 * 1000));

      if (overdueMinutes <= 0) continue; // not overstayed yet

      // Load garage space to compute fine rate
      const space = await GarageSpace.findById(booking.garageSpace);
      const baseHourly = (space && space.price) ? Number(space.price) : 0;

      // Per-minute rate with multiplier
      const perMinuteRate = (baseHourly / 60) * OVERSTAY_MULTIPLIER;
      const fine = Math.round(perMinuteRate * overdueMinutes);

      // Update booking when first detected or when fine increased
      let shouldSave = false;

      if (!booking.isOverstayed) {
        booking.isOverstayed = true;
        booking.overstayDuration = overdueMinutes;
        booking.overstayFine = fine;
        booking.paymentStatus = "pending";
        shouldSave = true;
      } else if (overdueMinutes > (booking.overstayDuration || 0)) {
        booking.overstayDuration = overdueMinutes;
        booking.overstayFine = fine;
        booking.paymentStatus = "pending";
        shouldSave = true;
      }

      if (shouldSave) {
        await booking.save();

        // Create or update a pending Payment record for bookkeeping
        try {
          await Payment.findOneAndUpdate(
            { booking: booking._id, status: "pending" },
            { booking: booking._id, amount: fine, status: "pending" },
            { upsert: true, new: true }
          );
        } catch (payErr) {
          console.error("overstayManager: failed to create/update Payment", payErr);
        }

        // Notify the driver about the overstay and required payment
        try {
          const message = `Your booking ${booking._id} has an overstay of ${booking.overstayDuration} minutes. Fine: ৳${booking.overstayFine}. Please pay to clear the hold.`;
          const note = new Notification({ host: booking.driver, message, type: "payment", relatedId: booking._id });
          await note.save();
        } catch (notifyErr) {
          console.error("overstayManager: failed to create notification", notifyErr);
        }
      }
    }

    console.log('[overstayManager] completed check at', new Date().toISOString());
  } catch (err) {
    // Silently skip on DB connection errors (expected during network issues)
    if (err.name === 'MongoServerSelectionError' || err.message.includes('ENOTFOUND')) {
      return;
    }
    console.error('[overstayManager] error during check:', err.message);
  }
}

function startOverstayChecker(intervalMs = DEFAULT_INTERVAL_MS) {
  if (intervalId) return;
  console.log('[overstayManager] starting overstay checker');
  checkOverstays();
  intervalId = setInterval(checkOverstays, intervalMs);
}

function stopOverstayChecker() {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
  console.log('[overstayManager] stopped overstay checker');
}

module.exports = { startOverstayChecker, stopOverstayChecker, checkOverstays };
