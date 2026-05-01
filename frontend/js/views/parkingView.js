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
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        ${waitlistBanner}
        
        <div class="dashboard-content" style="margin-bottom: 30px;">
          <div class="card">
            <h3>Booked Spots</h3>
            <p class="stat">${data.data.bookedSpots}</p>
          </div>
          <div class="card">
            <h3>Total Spent</h3>
            <p class="stat">৳${data.data.totalMoneySpent}</p>
          </div>
          <div class="card">
            <h3>Upcoming Reservations</h3>
            <p class="stat">${data.data.upcomingReservations}</p>
          </div>
        </div>

        <h2 style="color: #102a43; margin-bottom: 20px; font-weight: 700;">Navigation Hub</h2>
        <div class="dashboard-content" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; width: 100%;">
          
          <div class="card admin-nav-card" id="nav-find-parking" style="cursor: pointer; text-align: center;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">🔍</h3>
            <h3>Find Parking</h3>
            <p>Search and view available garages.</p>
          </div>

          <div class="card admin-nav-card" id="nav-my-bookings" style="cursor: pointer; text-align: center;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">📅</h3>
            <h3>My Bookings</h3>
            <p>Manage your active and past bookings.</p>
          </div>
          
          <div class="card admin-nav-card" id="nav-monthly-passes" style="cursor: pointer; text-align: center;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">🎟️</h3>
            <h3>Monthly Passes</h3>
            <p>Purchase and manage long-term passes.</p>
          </div>

          <div class="card admin-nav-card" id="nav-my-ratings" style="cursor: pointer; text-align: center;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">⭐</h3>
            <h3>My Ratings</h3>
            <p>Review the garages you have visited.</p>
          </div>

          <div class="card admin-nav-card" id="nav-emergency-panic" style="cursor: pointer; text-align: center; border-bottom: 4px solid #f03a47;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">🚨</h3>
            <h3 style="color: #d82b38;">Emergency Panic</h3>
            <p>Configure trusted contacts and trigger SOS.</p>
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
            <button id="list-new-garage-btn" class="btn btn-primary">➕ List New Garage</button>
            <button id="my-ratings-btn" class="btn btn-primary">⭐ My Ratings</button>
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
      </div>
    `;

    containerEl.innerHTML = html;
  }

  function renderAddGarageSpaceForm() {
    const html = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>➕ List New Garage</h1>
          <div class="header-actions">
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <section class="add-space-section" style="max-width: 800px; margin: 2rem auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
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
          <h1>👨‍💼 Admin Management Hub</h1>
          <div class="header-actions">
            <button id="view-garages-btn" class="btn btn-primary">View Garages</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; width: 100%;">
          
          <div class="card admin-nav-card" id="nav-garage-approvals" style="cursor: pointer; text-align: center;">
            <h3 style="font-size: 2rem; margin-bottom: 10px;">🏢</h3>
            <h3>Garage Approvals</h3>
            <p>Approve or reject new garage listings.</p>
          </div>
          
          <div class="card admin-nav-card" id="nav-user-management" style="cursor: pointer; text-align: center;">
            <h3 style="font-size: 2rem; margin-bottom: 10px;">👥</h3>
            <h3>User Management</h3>
            <p>Monitor and ban/unban users.</p>
          </div>

          <div class="card admin-nav-card" id="nav-booking-monitoring" style="cursor: pointer; text-align: center;">
            <h3 style="font-size: 2rem; margin-bottom: 10px;">📋</h3>
            <h3>Booking Monitoring</h3>
            <p>View all platform bookings.</p>
          </div>

          <div class="card admin-nav-card" id="nav-revenue-analytics" style="cursor: pointer; text-align: center;">
            <h3 style="font-size: 2rem; margin-bottom: 10px;">💰</h3>
            <h3>Revenue Analytics</h3>
            <p>View revenue and financial data.</p>
          </div>

          <div class="card admin-nav-card" id="nav-aggregated-ratings" style="cursor: pointer; text-align: center;">
            <h3 style="font-size: 2rem; margin-bottom: 10px;">⭐</h3>
            <h3>Aggregated Ratings</h3>
            <p>View overall platform ratings.</p>
          </div>

          <div class="card admin-nav-card" id="nav-complaints" style="cursor: pointer; text-align: center;">
            <h3 style="font-size: 2rem; margin-bottom: 10px;">⚖️</h3>
            <h3>Complaints & Disputes</h3>
            <p>Resolve user complaints.</p>
          </div>

          <div class="card admin-nav-card" id="nav-system-performance" style="cursor: pointer; text-align: center;">
            <h3 style="font-size: 2rem; margin-bottom: 10px;">⚙️</h3>
            <h3>System Performance</h3>
            <p>Monitor system health and metrics.</p>
          </div>

        </div>
      </div>
    `;
    containerEl.innerHTML = html;
  }

  function renderAdminGarageApprovals(garages) {
    let listHtml = "<p>No garages found.</p>";
    if (garages && garages.length > 0) {
      listHtml = `<table class="spaces-table">
        <thead><tr><th>Host</th><th>Location</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${garages.map(g => `
          <tr>
            <td>${g.host?.name || "Unknown"} (${g.host?.email || ""})</td>
            <td>${g.location?.address || "N/A"}</td>
            <td>৳${g.price}/hr</td>
            <td><span class="status-label ${g.approvalStatus === 'Approved' ? 'status-Open' : 'status-Closed'}">${g.approvalStatus || 'Approved'}</span></td>
            <td>
              <button class="btn btn-primary btn-approve-garage" data-id="${g._id}" style="width:auto; padding:0.25rem 0.5rem;" ${g.approvalStatus === 'Approved' ? 'disabled' : ''}>Approve</button>
              <button class="btn btn-danger btn-reject-garage" data-id="${g._id}" style="width:auto; padding:0.25rem 0.5rem;" ${g.approvalStatus === 'Rejected' ? 'disabled' : ''}>Reject</button>
            </td>
          </tr>
        `).join("")}</tbody>
      </table>`;
    }

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🏢 Garage Approvals</h1>
          <div class="header-actions">
            <button id="back-to-admin-hub-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content">${listHtml}</div>
      </div>
    `;
  }

  function renderAdminUsers(users) {
    let listHtml = "<p>No users found.</p>";
    if (users && users.length > 0) {
      listHtml = `<table class="spaces-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${users.map(u => `
          <tr>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${u.role}</td>
            <td><span class="status-label ${u.status === 'Active' ? 'status-Open' : 'status-Closed'}">${u.status || 'Active'}</span></td>
            <td>
              <button class="btn btn-primary btn-toggle-ban" data-id="${u._id}" style="width:auto; padding:0.25rem 0.5rem;">${u.status === 'Banned' ? 'Unban' : 'Ban'}</button>
            </td>
          </tr>
        `).join("")}</tbody>
      </table>`;
    }

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>👥 User Management</h1>
          <div class="header-actions">
            <button id="back-to-admin-hub-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content">${listHtml}</div>
      </div>
    `;
  }

  function renderAdminBookings(bookings) {
    let listHtml = "<p>No bookings found.</p>";
    if (bookings && bookings.length > 0) {
      listHtml = `<table class="spaces-table">
        <thead><tr><th>Date</th><th>Driver</th><th>Host</th><th>Duration</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>${bookings.map(b => `
          <tr>
            <td>${new Date(b.date).toLocaleDateString()}</td>
            <td>${b.driver?.name || "Unknown"}</td>
            <td>${b.garageSpace?.host?.name || "Unknown"}</td>
            <td>${b.duration} (${b.startTime} - ${b.endTime})</td>
            <td>৳${b.totalPrice}</td>
            <td><span class="status-label status-${b.status}">${b.status}</span></td>
          </tr>
        `).join("")}</tbody>
      </table>`;
    }

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>📋 Booking Monitoring</h1>
          <div class="header-actions">
            <button id="back-to-admin-hub-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content">${listHtml}</div>
      </div>
    `;
  }

  function renderAdminRevenue(analytics) {
    let monthlyHtml = "";
    if (analytics.monthlyData) {
      monthlyHtml = `<ul style="list-style: none; padding: 0;">`;
      for (const [month, rev] of Object.entries(analytics.monthlyData)) {
        monthlyHtml += `<li style="padding: 10px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between;"><strong>${month}</strong> <span>৳${rev}</span></li>`;
      }
      monthlyHtml += `</ul>`;
    }

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>💰 Revenue Analytics</h1>
          <div class="header-actions">
            <button id="back-to-admin-hub-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content">
          <div class="card" style="width: 100%; margin-bottom: 20px; text-align: center;">
            <h3>Total Lifetime Revenue</h3>
            <p class="stat">৳${analytics.totalRevenue}</p>
          </div>
          <div class="card" style="width: 100%;">
            <h3>Monthly Breakdown</h3>
            ${monthlyHtml}
          </div>
        </div>
      </div>
    `;
  }

  function renderAdminRatings(ratings) {
    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>⭐ Aggregated Ratings</h1>
          <div class="header-actions">
            <button id="back-to-admin-hub-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content">
          <div class="card" style="text-align: center;">
            <h3>Platform Average Rating</h3>
            <p class="stat" style="font-size: 3rem;">${ratings.averageRating} <span style="font-size: 1.5rem; color: #ffc107;">★</span></p>
            <p>Based on ${ratings.totalRatings} total ratings</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderAdminComplaints(complaints) {
    let listHtml = "<p>No complaints found.</p>";
    if (complaints && complaints.length > 0) {
      listHtml = `<table class="spaces-table">
        <thead><tr><th>Date</th><th>User</th><th>Subject</th><th>Description</th><th>Status</th><th>Resolution</th><th>Actions</th></tr></thead>
        <tbody>${complaints.map(c => `
          <tr>
            <td>${new Date(c.createdAt).toLocaleDateString()}</td>
            <td>${c.user?.name || "Unknown"} (${c.user?.role || "Unknown"})</td>
            <td>${c.subject}</td>
            <td>${c.description}</td>
            <td><span class="status-label ${c.status === 'Resolved' ? 'status-Open' : 'status-Closed'}">${c.status}</span></td>
            <td>${c.resolutionNotes || "—"}</td>
            <td>
              ${c.status === 'Open' ? `<button class="btn btn-primary btn-resolve-complaint" data-id="${c._id}" style="width:auto; padding:0.25rem 0.5rem;">Resolve</button>` : ""}
            </td>
          </tr>
        `).join("")}</tbody>
      </table>`;
    }

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>⚖️ Complaints & Disputes</h1>
          <div class="header-actions">
            <button id="back-to-admin-hub-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content">${listHtml}</div>
      </div>
    `;
  }

  function renderAdminPerformance(perf) {
    const uptimeHrs = (perf.uptime / 3600).toFixed(2);
    const totalMemMB = (perf.totalMemory / (1024*1024)).toFixed(0);
    const freeMemMB = (perf.freeMemory / (1024*1024)).toFixed(0);
    const memUsage = ((perf.totalMemory - perf.freeMemory) / perf.totalMemory * 100).toFixed(1);

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>⚙️ System Performance</h1>
          <div class="header-actions">
            <button id="back-to-admin-hub-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content">
          <div class="card">
            <h3>Server Uptime</h3>
            <p class="stat">${uptimeHrs} Hours</p>
          </div>
          <div class="card">
            <h3>Memory Usage</h3>
            <p class="stat">${memUsage}%</p>
            <p>${freeMemMB}MB free of ${totalMemMB}MB</p>
          </div>
          <div class="card">
            <h3>CPU Load (1m)</h3>
            <p class="stat">${perf.cpuLoad.toFixed(2)}</p>
          </div>
        </div>
      </div>
    `;
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

            const bookBtn = userRole === "Driver"
              ? `<button class="btn-book-now" data-space-id="${s._id}" data-price="${s.price}">📅 Book Now</button>`
              : "";

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
            <button id="back-to-driver-hub-btn" class="btn btn-secondary">Back to Hub</button>
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
        
        <div class="garages-container" style="margin-top: 20px;">
          ${garagesHtml}
        </div>
      </div>
    `;
    containerEl.innerHTML = html;
  }

  // Filter function to apply filters and re-render garage listing
  function filterAndRenderGarages(vehicleType, minPrice, maxPrice, userRole) {
    let filtered = allSpaces;

    if (vehicleType) {
      const searchType = vehicleType.toLowerCase().trim();
      filtered = filtered.filter(s => {
        const types = s.vehicleTypes || [];
        return types.some(t => t.toLowerCase().trim().includes(searchType) || searchType.includes(t.toLowerCase().trim()));
      });
    }

    if (minPrice !== null && minPrice !== undefined && minPrice !== '') {
      filtered = filtered.filter(s => s.price >= parseFloat(minPrice));
    }

    if (maxPrice !== null && maxPrice !== undefined && maxPrice !== '') {
      filtered = filtered.filter(s => s.price <= parseFloat(maxPrice));
    }

    renderGarageListing(filtered, userRole);

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
            <button id="back-to-driver-hub-btn" class="btn btn-secondary">Back to Hub</button>
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

  function renderSubscriptionPasses(data) {
    const { hasSubscription, subscription } = data;

    let passHtml = `
      <div class="card" style="text-align: center; padding: 40px; margin: 0 auto; width: 100%; max-width: 500px;">
        <h2>💳 Monthly Parking Pass</h2>
        <p style="font-size: 1.2rem; margin: 20px 0;">Get unlimited access to select parking spots for 30 days.</p>
        <p style="font-size: 2.5rem; font-weight: bold; color: #28a745; margin-bottom: 20px;">৳5000<span style="font-size: 1rem; color: #666;"> / month</span></p>
        <button id="purchase-pass-btn" class="btn btn-primary" style="font-size: 1.2rem; padding: 12px 30px; border-radius: 8px;">Purchase Pass</button>
        <div id="subscription-status-msg" style="margin-top: 20px; font-weight: bold;"></div>
      </div>
    `;

    if (hasSubscription && subscription) {
      const expDate = new Date(subscription.endDate).toLocaleDateString();
      passHtml = `
        <div class="card" style="text-align: center; border: 2px solid #28a745; margin: 0 auto; width: 100%; max-width: 500px;">
          <h2 style="color: #28a745;">✅ Active Monthly Pass</h2>
          <p style="font-size: 1.2rem; margin: 15px 0;">You have an active subscription!</p>
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; display: inline-block; margin-bottom: 20px; width: 100%; box-sizing: border-box;">
            <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #28a745; text-transform: uppercase;">${subscription.status}</span></p>
            <p style="margin: 10px 0;"><strong>Valid Until:</strong> ${expDate}</p>
          </div>
        </div>
      `;
    }

    const html = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🎟️ Subscription Passes</h1>
          <div class="header-actions">
            <button id="back-to-driver-hub-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content" style="justify-content: center; display: flex;">
          ${passHtml}
        </div>
      </div>
    `;
    containerEl.innerHTML = html;
  }

  // ── FR-21: Rating Modal ──
  function renderRatingModal(booking, userRole) {
    const target = userRole === "Driver"
      ? `৳${booking.garageSpace?.price}/hr garage`
      : booking.driver?.name || "Driver";

    const existing = document.getElementById("rating-modal-overlay");
    if (existing) existing.remove();

    const html = `
      <div class="booking-modal-overlay" id="rating-modal-overlay">
        <div class="booking-modal">
          <button class="modal-close" id="rating-modal-close">&times;</button>
          <h2>⭐ Leave a Review</h2>
          <p style="color:#555; margin-bottom:1rem;">Rate your experience with: <strong>${target}</strong></p>

          <div class="form-group">
            <label>Rating</label>
            <div class="star-selector" id="star-selector">
              ${[1, 2, 3, 4, 5].map(i => `
                <span class="star" data-value="${i}" style="font-size:2rem; cursor:pointer; color:#ccc;">★</span>
              `).join("")}
            </div>
            <input type="hidden" id="rating-value" value="0" />
          </div>
          <div class="form-group">
            <label>Review (optional)</label>
            <textarea id="rating-review" rows="3" style="width:100%; padding:0.75rem; border:1px solid #ddd; border-radius:4px; font-size:1rem; resize:vertical;" placeholder="Share your experience..."></textarea>
          </div>

          <div id="rating-error" class="error-message" style="display:none;"></div>
          <div id="rating-success" class="success-message" style="display:none;"></div>

          <button id="submit-rating-btn" class="btn btn-primary" data-booking-id="${booking._id}">Submit Rating</button>
        </div>
      </div>
    `;
    containerEl.insertAdjacentHTML("beforeend", html);
  }

  // ── FR-21: My Ratings Page ──
  function renderMyRatings(pendingBookings, userRole) {
    let html = "";
    if (!pendingBookings || pendingBookings.length === 0) {
      html = "<p class='no-bookings'>No completed bookings to rate yet.</p>";
    } else {
      html = `<div class="bookings-list">
        ${pendingBookings.map(b => {
        const dateStr = new Date(b.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        const target = userRole === "Driver"
          ? `৳${b.garageSpace?.price}/hr garage`
          : b.driver?.name || "Driver";
        return `
            <div class="booking-card">
              <div class="booking-card-header">
                <span class="booking-date">${dateStr}</span>
                <span class="booking-status status-completed">COMPLETED</span>
              </div>
              <div class="booking-card-body">
                <p><strong>Time:</strong> ${b.startTime} — ${b.endTime}</p>
                <p><strong>Total:</strong> ৳${b.totalPrice}</p>
                <p><strong>Rate:</strong> ${target}</p>
              </div>
              <div class="booking-card-actions">
                <button class="btn-rate-booking btn btn-primary" data-booking-id="${b._id}" style="width:auto; padding:0.5rem 1rem;">⭐ Rate</button>
              </div>
            </div>
          `;
      }).join("")}
      </div>`;
    }

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>⭐ Rate Your Experiences</h1>
          <div class="header-actions">
            <button id="back-to-driver-hub-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="bookings-container">${html}</div>
      </div>
    `;
  }

  // ── FR-22: Panic Section ──
  function renderPanicSection(trustedContact) {
    const hasTrusted = trustedContact && trustedContact.email;
    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🚨 Emergency Panic</h1>
          <div class="header-actions">
            <button id="back-to-driver-hub-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content" style="display: block; max-width: 600px; margin: 0 auto;">
          <div class="card" style="border-top: 4px solid #f03a47; padding: 40px; text-align: center; background: rgba(255, 255, 255, 0.9);">
            <div style="margin-bottom: 2rem;">
              <h3 style="color: #d82b38; margin-bottom: 0.5rem; font-size: 1.5rem;">🚨 PANIC MODE</h3>
              <p style="color: #627d98; font-size: 1rem;">Pressing the button below will immediately share your current location with your trusted contact.</p>
            </div>

            <div style="margin-bottom: 2rem;">
              ${hasTrusted
                ? `<div style="background: #e0fdf4; color: #009255; padding: 15px; border-radius: 10px; font-weight: 600; display: inline-block;">✅ Trusted contact: <strong>${trustedContact.name}</strong> (${trustedContact.email})</div>`
                : `<div style="background: #ffe3e3; color: #c53030; padding: 15px; border-radius: 10px; font-weight: 600; display: inline-block;">⚠️ No trusted contact set. Add one below first.</div>`
              }
            </div>

            <button id="panic-btn" class="btn" style="background: linear-gradient(135deg, #f03a47 0%, #d82b38 100%); color: white; padding: 2rem; font-size: 1.8rem; font-weight: 800; border-radius: 20px; box-shadow: 0 10px 30px rgba(240, 58, 71, 0.4);" ${hasTrusted ? '' : 'disabled'}>
              🚨 PANIC
            </button>
            <div id="panic-status" style="margin-top: 1rem; font-weight: bold; min-height: 24px;"></div>

            <div style="margin-top: 3rem; text-align: left; background: #f8fbfd; padding: 25px; border-radius: 12px; border: 1px solid #d9e2ec;">
              <h3 style="margin-bottom: 1.5rem; color: #102a43; font-size: 1.2rem;">⚙️ Trusted Contact Settings</h3>
              <div class="form-group">
                <label>Contact Name</label>
                <input type="text" id="tc-name" value="${trustedContact?.name || ''}" placeholder="e.g. Spouse, Parent" />
              </div>
              <div class="form-group">
                <label>Contact Email</label>
                <input type="email" id="tc-email" value="${trustedContact?.email || ''}" placeholder="trusted@example.com" />
              </div>
              <div class="form-group">
                <label>Contact Phone</label>
                <input type="text" id="tc-phone" value="${trustedContact?.phone || ''}" placeholder="+880..." />
              </div>
              <button id="save-trusted-contact-btn" class="btn btn-primary" style="width: auto;">Update Contact</button>
              <div id="tc-status" style="margin-top: 0.5rem; font-size: 0.9rem;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── FR-22: Admin Panic Logs Page ──
  function renderPanicLogs(logs) {
    let logsHtml = "<p class='no-bookings'>No panic alerts logged.</p>";
    if (logs && logs.length > 0) {
      logsHtml = `<div class="bookings-list">
        ${logs.map(l => {
        const dateStr = new Date(l.createdAt).toLocaleString();
        const mapsLink = l.location?.lat
          ? `https://www.google.com/maps?q=${l.location.lat},${l.location.lng}`
          : null;
        return `
            <div class="booking-card" style="border-left: 4px solid ${l.status === 'active' ? '#e74c3c' : '#28a745'}">
              <div class="booking-card-header">
                <span class="booking-date">${dateStr}</span>
                <span class="booking-status" style="background:${l.status === 'active' ? '#e74c3c' : '#28a745'}; color:white; padding:2px 8px; border-radius:4px;">${l.status.toUpperCase()}</span>
              </div>
              <div class="booking-card-body">
                <p><strong>Driver:</strong> ${l.driver?.name || "Unknown"} (${l.driver?.email || ""})</p>
                <p><strong>Contact Notified:</strong> ${l.trustedContactNotified ? "✅ Yes" : "❌ No"}</p>
                ${mapsLink ? `<p><strong>Location:</strong> <a href="${mapsLink}" target="_blank">View on Maps</a></p>` : "<p><strong>Location:</strong> Not available</p>"}
                ${l.notes ? `<p><strong>Notes:</strong> ${l.notes}</p>` : ""}
              </div>
              ${l.status === "active" ? `
              <div class="booking-card-actions">
                <button class="btn-resolve-panic btn btn-primary" data-id="${l._id}" style="width:auto; padding:0.5rem 1rem;">Mark Resolved</button>
              </div>` : ""}
            </div>
          `;
      }).join("")}
      </div>`;
    }

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🚨 Panic Alert Logs</h1>
          <div class="header-actions">
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="bookings-container">${logsHtml}</div>
      </div>
    `;
  }

  return {
    renderAuthPage,
    renderDriverDashboard,
    renderGarageHostDashboard,
    renderAddGarageSpaceForm,
    renderAdminDashboard,
    renderGarageListing,
    filterAndRenderGarages,
    renderBookingForm,
    renderMyBookings,
    renderSubscriptionPasses,
    renderRescheduleModal,
    renderNotifications,
    renderRatingModal,
    renderMyRatings,
    renderPanicSection,
    renderPanicLogs,
    renderAdminGarageApprovals,
    renderAdminUsers,
    renderAdminBookings,
    renderAdminRevenue,
    renderAdminRatings,
    renderAdminComplaints,
    renderAdminPerformance,
    showError
  };
})();