const ParkingModel = (function () {
  async function getStatus() {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
  }

  return { getStatus };
})();
