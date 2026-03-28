const DURATION_MAP = {
  hourly:    { hours: 1,  multiplier: 1 },
  "half-day": { hours: 6,  multiplier: 5 },
  "full-day": { hours: 12, multiplier: 9 }
};

/**
 * Checks if a given time is in peak hours (e.g., 08:00–11:00 or 17:00–20:00).
 */
function isPeakHour(time) {
  if (!time) return false;
  const [h] = time.split(":").map(Number);
  return (h >= 8 && h <= 10) || (h >= 17 && h <= 19);
}

/**
 * Calculates dynamic price based on garage price, demand, and time.
 * @param {Object} garageSpace - The space model
 * @param {number} concurrentBookings - Current confirmed bookings for the same day/slot
 * @param {string} startTime - "HH:mm"
 * @param {string} duration - "hourly", "half-day", "full-day"
 */
function calculateDynamicPrice(garageSpace, concurrentBookings, startTime, duration) {
  const basePricePerHour = garageSpace.price;
  const config = DURATION_MAP[duration] || DURATION_MAP.hourly;
  
  // Initial price based on duration multiplier
  let finalPrice = basePricePerHour * config.multiplier;
  
  const breakdown = {
    base: finalPrice,
    surge: 0,
    peak: 0,
    discount: 0
  };
  
  const indicators = [];
  let color = "green"; // Default signal (Low/Normal Demand)

  // 1. Peak Hour Multiplier (+30%)
  if (isPeakHour(startTime)) {
    breakdown.peak = finalPrice * 0.3;
    finalPrice += breakdown.peak;
    indicators.push("Peak Hour (+30%)");
    color = "yellow";
  }

  // 2. Demand Calculation
  const capacity = garageSpace.capacity || 1;
  const demandRatio = (concurrentBookings / capacity) * 100;

  if (demandRatio >= 80) {
    // High Demand (+50%)
    const highDemandSurge = finalPrice * 0.5;
    breakdown.surge += highDemandSurge;
    finalPrice += highDemandSurge;
    indicators.push("High Demand (+50%)");
    color = "red";
  } else if (demandRatio >= 50) {
    // Moderate Demand (+20%)
    const modDemandSurge = finalPrice * 0.2;
    breakdown.surge += modDemandSurge;
    finalPrice += modDemandSurge;
    indicators.push("Busy Time (+20%)");
    color = "yellow";
  } else if (demandRatio < 20 && concurrentBookings > 0) {
    // Low Demand Discount (-10%) if not completely empty
    breakdown.discount = finalPrice * 0.1;
    finalPrice -= breakdown.discount;
    indicators.push("Off-Peak Discount (-10%)");
    color = "green";
  } else {
    indicators.push("Normal Price");
  }

  return {
    finalPrice: Math.round(finalPrice),
    breakdown: {
      base: Math.round(breakdown.base),
      peak: Math.round(breakdown.peak),
      surge: Math.round(breakdown.surge),
      discount: Math.round(breakdown.discount)
    },
    indicators,
    color,
    demandRatio: Math.round(demandRatio)
  };
}

module.exports = { calculateDynamicPrice, isPeakHour };
