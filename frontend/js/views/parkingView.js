const ParkingView = (function () {
  const containerEl = document.getElementById("app");

  function renderAuthPage() {
    const html = `
      <div class="auth-container">
        <div id="register-section" class="auth-section active">
          <h2>Register</h2>
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="register-name" placeholder="Enter your name" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="register-email" placeholder="Enter your email" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="register-password" placeholder="Enter password" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select id="register-role">
              <option value="Driver">Driver</option>
              <option value="GarageHost">Garage Host</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <button id="register-btn" class="btn btn-primary">Register</button>
          <div id="register-error" class="error-message"></div>
          <p class="toggle-text">Already have an account? <a href="#" id="show-login-link">Login</a></p>
        </div>

        <div id="login-section" class="auth-section" style="display: none;">
          <h2>Login</h2>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="login-email" placeholder="Enter your email" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="login-password" placeholder="Enter password" />
          </div>
          <button id="login-btn" class="btn btn-primary">Login</button>
          <div id="login-error" class="error-message"></div>
          <p class="toggle-text">Don't have an account? <a href="#" id="show-register-link">Register</a></p>
        </div>
      </div>
    `;
    containerEl.innerHTML = html;
  }

  function renderDriverDashboard(data, waitlistEntries) {
    // Waitlist notification banner
    let waitlistBanner = "";
    const notified = (waitlistEntries || []).filter(e => e.notified);
    if (notified.length > 0) {
      waitlistBanner = `
        <div class="waitlist-banner">
          <h3>🔔 Waitlist Notifications</h3>
          ${notified.map(e => `
            <div class="waitlist-alert">
              <span>A spot opened up on <strong>${e.date}</strong> for a garage you were waiting for!</span>
              <button class="btn-book-from-waitlist" data-space-id="${e.garageSpace?._id || e.garageSpace}" data-waitlist-id="${e._id}">Book Now</button>
              <button class="btn-dismiss-waitlist" data-id="${e._id}">Dismiss</button>
            </div>
          `).join("")}
        </div>
      `;
    }

    const html = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🚗 Driver Dashboard</h1>
          <div class="header-actions">
            <button id="view-garages-btn" class="btn btn-primary">View Garages</button>
            <button id="my-bookings-btn" class="btn btn-primary">My Bookings</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        ${waitlistBanner}
        <div class="dashboard-content">
          <div class="card">
            <h3>Booked Spots</h3>
            <p class="stat">${data.data.bookedSpots}</p>
          </div>
          <div class="card">
            <h3>Total Spent</h3>
            <p class="stat">${data.data.totalMoneySpent}</p>
          </div>
          <div class="card">
            <h3>Upcoming Reservations</h3>
            <p class="stat">${data.data.upcomingReservations}</p>
          </div>
        </div>
      </div>
    `;
    containerEl.innerHTML = html;
  }

  function renderGarageHostDashboard(data, spaces = []) {
    // build table of spaces
    let spacesHtml = "<p>No spaces added yet.</p>";
    if (spaces.length) {
      spacesHtml = `<table class="spaces-table">
          <thead><tr><th>Images</th><th>Price</th><th>Vehicle Types</th><th>Hours</th><th>Availability</th><th>Actions</th></tr></thead>
          <tbody>${spaces
          .map(s => {
            const imgs = (s.images || []).map(u => `<img src="${u}" alt="space" class="thumb"/>`).join(" ");
            const types = (s.vehicleTypes || []).join(", ");
            const hours = s.availableHours ? `${s.availableHours.start} - ${s.availableHours.end}` : "";
            const isChecked = s.status === "Open" ? "checked" : "";
            const statusClass = `status-${s.status}`;
            
            return `<tr data-id="${s._id}">
              <td>${imgs}</td>
              <td>৳${s.price}</td>
              <td>${types}</td>
              <td>${hours}</td>
              <td>
                <label class="switch">
                  <input type="checkbox" class="toggle-availability" data-id="${s._id}" ${isChecked}>
                  <span class="slider"></span>
                </label>
                <span class="status-label ${statusClass}">${s.status}</span>
              </td>
              <td><button class="edit-space-btn" data-id="${s._id}">Edit</button> <button class="delete-space-btn" data-id="${s._id}">Delete</button></td>
            </tr>`;
          })
          .join("")}</tbody>
        </table>`;
    }


    const html = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🏢 Garage Host Dashboard</h1>
          <div class="header-actions">
            <button id="view-garages-btn" class="btn btn-primary">View Garages</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>

        <section class="notifications-section">
          <h2>🔔 Notifications</h2>
          <div id="notifications-list" class="notification-list">
            <p class="no-notifications">Loading notifications...</p>
          </div>
        </section>

        <div class="dashboard-content">
          <div class="card">
            <h3>Total Spaces</h3>
            <p class="stat">${data.data.totalSpaces}</p>
          </div>
          <div class="card">
            <h3>Occupied Today</h3>
            <p class="stat">${data.data.occupiedSpaces}</p>
          </div>
          <div class="card">
            <h3>Monthly Revenue</h3>
            <p class="stat">${data.data.monthlyRevenue}</p>
          </div>
        </div>
        <section class="host-spaces">
          <h2>Your Garage Spaces</h2>
          <div id="spaces-list">
            ${spacesHtml}
          </div>
        </section>
        <section class="add-space-section">
          <h2>Add New Space</h2>
          <div class="form-group">
            <label>Upload Images (max 5)</label>
            <input type="file" id="space-images" accept="image/*" multiple />
            <small class="helper-text">Or enter image URLs below (comma separated)</small>
          </div>
          <div class="form-group">
            <label>Image URLs (alternative)</label>
            <input type="text" id="space-image-urls" placeholder="http://... , http://..." />
          </div>
          <div class="form-group">
            <label>Price (৳/hour)</label>
            <input type="number" id="space-price" placeholder="e.g. 50" />
          </div>
          <div class="form-group">
            <label>Vehicle Types (comma separated)</label>
            <input type="text" id="space-vehicle-types" placeholder="Car, Bike, SUV" />
          </div>
          
          <!-- Location Picker Map (FR-4) -->
          <div class="form-group">
            <label><strong>📍 Select Location on Map</strong></label>
            <p class="helper-text">Click on the map to set your garage location</p>
            <div id="location-picker-map" style="height: 300px; width: 100%; border-radius: 8px; border: 2px solid #ddd; margin-bottom: 10px;"></div>
            <div id="selected-location" style="padding: 10px; background: #e8f5e9; border-radius: 4px; margin-bottom: 15px; display: none;">
              <strong>Selected Location:</strong> <span id="selected-coords"></span>
            </div>
          </div>
          
          <div class="form-group row">
            <div style="flex: 1;">
              <label>Latitude</label>
              <input type="number" step="any" id="space-lat" placeholder="e.g. 23.8103" />
            </div>
            <div style="flex: 1; margin-left: 10px;">
              <label>Longitude</label>
              <input type="number" step="any" id="space-lng" placeholder="e.g. 90.4125" />
            </div>
          </div>
          <div class="form-group">
            <label>Address / Location Name</label>
            <input type="text" id="space-address" placeholder="e.g. Gulshan-2, Dhaka" />
          </div>
          <div class="form-group row">
            <div style="flex: 1;">
              <label>Available Hours Start</label>
              <input type="time" id="space-hour-start" />
            </div>
            <div style="flex: 1; margin-left: 10px;">
              <label>Available Hours End</label>
              <input type="time" id="space-hour-end" />
            </div>
          </div>
          <button id="add-space-btn" class="btn btn-primary">Add Space</button>
          <div id="space-error" class="error-message"></div>
        </section>
      </div>
    `;


    containerEl.innerHTML = html;
  }

  function renderAdminDashboard(data) {
    const html = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>👨‍💼 Admin Dashboard</h1>
          <div class="header-actions">
            <button id="view-garages-btn" class="btn btn-primary">View Garages</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content">
          <div class="card">
            <h3>Total Users</h3>
            <p class="stat">${data.data.totalUsers}</p>
          </div>
          <div class="card">
            <h3>Total Garages</h3>
            <p class="stat">${data.data.totalGarages}</p>
          </div>
          <div class="card">
            <h3>Total Transactions</h3>
            <p class="stat">${data.data.totalTransactions}</p>
          </div>
        </div>
      </div>
    `;
    containerEl.innerHTML = html;
  }

  function showError(section, message) {
    const errorEl = document.getElementById(`${section}-error`);
    if (errorEl) errorEl.textContent = message;
  }

  let allSpaces = []; // Store all spaces for filtering

  function renderGarageListing(spaces, userRole) {
    allSpaces = spaces; // Store for filtering

    // Get price range from available spaces
    const prices = spaces.map(s => s.price).filter(p => p != null);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 1000;

    let garagesHtml = "<p>No garages listed yet.</p>";

    if (spaces && spaces.length > 0) {
      garagesHtml = `<div class="garage-grid">
        ${spaces
          .map(s => {
            const imgs = (s.images || []).map(u => `<img src="${u}" alt="garage" class="garage-thumb"/>`).join(" ");
            const types = (s.vehicleTypes || []).join(", ");
            const hours = s.availableHours ? `${s.availableHours.start} - ${s.availableHours.end}` : "Not specified";
            const hostName = s.host ? s.host.name : "Unknown";
            const hostEmail = s.host ? s.host.email : "";
            const address = s.location && s.location.address ? s.location.address : "Not specified";
            const coords = s.location && s.location.lat && s.location.lng
              ? `${s.location.lat}, ${s.location.lng}`
              : "No coordinates";

            // Book Now button only for drivers
            const bookBtn = userRole === "Driver"
              ? `<button class="btn-book-now" data-space-id="${s._id}" data-price="${s.price}">📅 Book Now</button>`
              : "";

            // View on Map button with Google Maps navigation (FR-6)
            const hasCoords = s.location && s.location.lat && s.location.lng;
            const mapLink = hasCoords 
              ? `https://www.google.com/maps/dir/?api=1&destination=${s.location.lat},${s.location.lng}`
              : `#`;
            const viewOnMapBtn = hasCoords
              ? `<a href="${mapLink}" target="_blank" class="btn-view-on-map" title="Navigate to this garage">📍 View on Map</a>`
              : `<span class="no-coords" title="No coordinates available">📍 View on Map</span>`;

            return `
              <div class="garage-card">
                <div class="garage-images">${imgs || "<p>No images</p>"}</div>
                <div class="garage-info">
                  <h3>৳${s.price}/hour</h3>
                  <p><strong>Address:</strong> ${address}</p>
                  <p><strong>Coordinates:</strong> ${coords}</p>
                  <p><strong>Vehicle Types:</strong> ${types || "Not specified"}</p>
                  <p><strong>Available Hours:</strong> ${hours}</p>
                  <p><strong>Host:</strong> ${hostName}</p>
                  <p><strong>Contact:</strong> ${hostEmail}</p>
                  <p><strong>Listed:</strong> ${new Date(s.createdAt).toLocaleDateString()}</p>
                  <div class="garage-card-actions">
                    ${viewOnMapBtn}
                    ${bookBtn}
                  </div>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>`;
    }

    const html = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🅿️ All Listed Garages</h1>
          <div class="header-actions">
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        
        <!-- Filter Bar (FR-5) -->
        <div class="filter-bar">
          <div class="filter-group">
            <label for="filter-vehicle-type">Vehicle Type:</label>
            <select id="filter-vehicle-type" class="filter-select">
              <option value="">All Types</option>
              <option value="Car">Car</option>
              <option value="SUV">SUV</option>
              <option value="Microbus">Microbus</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="CNG">CNG</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="filter-min-price">Min Price (৳):</label>
            <input type="number" id="filter-min-price" class="filter-input" placeholder="${minPrice}" min="${minPrice}" max="${maxPrice}" />
          </div>
          <div class="filter-group">
            <label for="filter-max-price">Max Price (৳):</label>
            <input type="number" id="filter-max-price" class="filter-input" placeholder="${maxPrice}" min="${minPrice}" max="${maxPrice}" />
          </div>
          <button id="apply-filters-btn" class="btn btn-primary">Apply Filters</button>
          <button id="clear-filters-btn" class="btn btn-secondary">Clear</button>
        </div>
        
        <!-- Map Toggle Button (FR-4) -->
        <div class="map-toggle-container">
          <button id="toggle-map-btn" class="btn btn-toggle-map" onclick="toggleMap()">
            <span class="toggle-icon">📍</span> Show Nearby Garages Map
          </button>
        </div>
        
        <!-- Collapsible Map Container (FR-4) -->
        <div id="map-container-wrapper" class="map-container-wrapper collapsed">
          <div id="garages-map" style="height: 400px; width: 100%; border-radius: 8px; z-index: 1;"></div>
          <div class="map-legend">
            <span class="legend-item"><span class="marker-available"></span> Available</span>
            <span class="legend-item"><span class="marker-booked"></span> Booked</span>
            <button id="refresh-map-btn" class="btn-refresh" title="Refresh availability">🔄 Live Update</button>
          </div>
        </div>
      </div>
    `;
    containerEl.innerHTML = html;
  }

  // Filter function to apply filters and re-render garage listing
  function filterAndRenderGarages(vehicleType, minPrice, maxPrice, userRole) {
    let filtered = allSpaces;

    // Filter by vehicle type (case-insensitive, trim whitespace)
    if (vehicleType) {
      const searchType = vehicleType.toLowerCase().trim();
      filtered = filtered.filter(s => {
        const types = s.vehicleTypes || [];
        return types.some(t => t.toLowerCase().trim().includes(searchType) || searchType.includes(t.toLowerCase().trim()));
      });
    }

    // Filter by price range
    if (minPrice !== null && minPrice !== undefined && minPrice !== '') {
      filtered = filtered.filter(s => s.price >= parseFloat(minPrice));
    }

    if (maxPrice !== null && maxPrice !== undefined && maxPrice !== '') {
      filtered = filtered.filter(s => s.price <= parseFloat(maxPrice));
    }

    renderGarageListing(filtered, userRole);

    // Re-initialize map after re-render
    setTimeout(() => {
      if (typeof initGaragesMap === 'function') {
        initGaragesMap(filtered, userRole);
      }
    }, 100);
  }

  // ── Booking Form Modal ──
  function renderBookingForm(space) {
    const html = `
      <div class="booking-modal-overlay" id="booking-modal-overlay">
        <div class="booking-modal">
          <button class="modal-close" id="booking-modal-close">&times;</button>
          <h2>📅 Book a Parking Spot</h2>
          <p class="booking-space-info">Price: <strong>৳${space.price}/hour</strong></p>

          <div class="form-group">
            <label>Date</label>
            <input type="date" id="booking-date" min="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label>Start Time</label>
            <input type="time" id="booking-start-time" />
          </div>
          <div class="form-group">
            <label>Duration</label>
            <div class="duration-selector">
              <button class="duration-pill active" data-duration="hourly">🕐 Hourly (1h) — ×1</button>
              <button class="duration-pill" data-duration="half-day">🌤️ Half-Day (6h) — ×5</button>
              <button class="duration-pill" data-duration="full-day">☀️ Full-Day (12h) — ×9</button>
            </div>
          </div>
          <div class="price-preview" id="price-preview">
            <span>Estimated Total:</span>
            <span class="price-amount" id="price-amount">৳${space.price}</span>
          </div>

          <div id="booking-error" class="error-message" style="display:none;"></div>
          <div id="booking-success" class="success-message" style="display:none;"></div>

          <div class="booking-actions">
            <button id="confirm-booking-btn" class="btn btn-primary" data-space-id="${space._id}" data-price="${space.price}">Confirm Booking</button>
            <button id="join-waitlist-btn" class="btn btn-secondary" data-space-id="${space._id}" style="display:none;">Join Waitlist</button>
          </div>
        </div>
      </div>
    `;
    containerEl.insertAdjacentHTML("beforeend", html);
  }

  // ── My Bookings Page ──
  function renderMyBookings(bookings) {
    let bookingsHtml = "<p class='no-bookings'>You have no bookings yet. Browse garages and make your first booking!</p>";

    if (bookings && bookings.length > 0) {
      bookingsHtml = `<div class="bookings-list">
        ${bookings.map(b => {
        const spaceName = b.garageSpace ? `৳${b.garageSpace.price}/hr garage` : "Unknown Garage";
        const dateStr = new Date(b.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        const statusClass = `status-${b.status}`;

        // Determine if within 1hr (disable cancel/reschedule)
        const bookingStart = new Date(b.date);
        const [bh, bm] = b.startTime.split(":").map(Number);
        bookingStart.setHours(bh, bm, 0, 0);
        const canModify = b.status === "confirmed" && (bookingStart.getTime() - Date.now()) >= 3600000;

        const durationLabel = { hourly: "1 Hour", "half-day": "Half-Day (6h)", "full-day": "Full-Day (12h)" }[b.duration] || b.duration;

        return `
            <div class="booking-card">
              <div class="booking-card-header">
                <span class="booking-date">${dateStr}</span>
                <span class="booking-status ${statusClass}">${b.status.toUpperCase()}</span>
              </div>
              <div class="booking-card-body">
                <p><strong>Time:</strong> ${b.startTime} — ${b.endTime}</p>
                <p><strong>Duration:</strong> ${durationLabel}</p>
                <p><strong>Total:</strong> ৳${b.totalPrice}</p>
                <p><strong>Garage:</strong> ${spaceName}</p>
              </div>
              ${b.status === "confirmed" ? `
              <div class="booking-card-actions">
                <button class="btn-cancel-booking ${canModify ? '' : 'disabled'}" data-id="${b._id}" ${canModify ? '' : 'disabled title="Cannot modify within 1 hour of start"'}>Cancel</button>
                <button class="btn-reschedule-booking ${canModify ? '' : 'disabled'}" data-id="${b._id}" ${canModify ? '' : 'disabled title="Cannot modify within 1 hour of start"'}>Reschedule</button>
              </div>
              ` : ''}
            </div>
          `;
      }).join("")}
      </div>`;
    }

    const html = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>📋 My Bookings</h1>
          <div class="header-actions">
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="bookings-container">
          ${bookingsHtml}
        </div>
      </div>
    `;
    containerEl.innerHTML = html;
  }

  // ── Reschedule Modal ──
  function renderRescheduleModal(booking) {
    const html = `
      <div class="booking-modal-overlay" id="reschedule-modal-overlay">
        <div class="booking-modal">
          <button class="modal-close" id="reschedule-modal-close">&times;</button>
          <h2>🔄 Reschedule Booking</h2>

          <div class="form-group">
            <label>New Date</label>
            <input type="date" id="reschedule-date" min="${new Date().toISOString().split('T')[0]}" value="${new Date(booking.date).toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label>New Start Time</label>
            <input type="time" id="reschedule-start-time" value="${booking.startTime}" />
          </div>
          <div class="form-group">
            <label>New Duration</label>
            <div class="duration-selector">
              <button class="duration-pill ${booking.duration === 'hourly' ? 'active' : ''}" data-duration="hourly">🕐 Hourly</button>
              <button class="duration-pill ${booking.duration === 'half-day' ? 'active' : ''}" data-duration="half-day">🌤️ Half-Day</button>
              <button class="duration-pill ${booking.duration === 'full-day' ? 'active' : ''}" data-duration="full-day">☀️ Full-Day</button>
            </div>
          </div>

          <div id="reschedule-error" class="error-message" style="display:none;"></div>
          <div id="reschedule-success" class="success-message" style="display:none;"></div>

          <button id="confirm-reschedule-btn" class="btn btn-primary" data-id="${booking._id}">Confirm Reschedule</button>
        </div>
      </div>
    `;
    containerEl.insertAdjacentHTML("beforeend", html);
  }

  function renderNotifications(notifications) {
    const listEl = document.getElementById("notifications-list");
    if (!listEl) return;

    if (!notifications || notifications.length === 0) {
      listEl.innerHTML = '<p class="no-notifications">No notifications yet.</p>';
      return;
    }

    listEl.innerHTML = notifications.map(n => `
      <div class="notification-item ${n.readStatus ? '' : 'unread'}" data-id="${n._id}">
        <div class="notification-content">
          <span class="notification-msg">${n.message}</span>
          <span class="notification-time">${new Date(n.timestamp).toLocaleString()}</span>
        </div>
        <div class="notification-actions">
          ${n.readStatus ? '' : `<button class="btn-mark-read" data-id="${n._id}">Mark as Read</button>`}
        </div>
      </div>
    `).join("");
  }

  return {
    renderAuthPage,
    renderDriverDashboard,
    renderGarageHostDashboard,
    renderAdminDashboard,
    renderGarageListing,
    filterAndRenderGarages,
    renderBookingForm,
    renderMyBookings,
    renderRescheduleModal,
    renderNotifications,
    showError
  };
})();

