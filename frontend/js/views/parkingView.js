const ParkingView = (function () {
  const statusEl = document.getElementById('status');

  function renderStatus(data) {
    statusEl.innerHTML = `<h2>API Status</h2><p>${data.message}</p>`;
  }

  function renderError(err) {
    statusEl.innerHTML = `<h2>Error</h2><p>${err.message}</p>`;
  }

  return { renderStatus, renderError };
})();
