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

          <div class="card admin-nav-card" id="nav-emergency-panic" style="cursor: pointer; text-align: center;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">🚨</h3>
            <h3 style="color: #d82b38;">Emergency Panic</h3>
            <p>Configure trusted contacts and trigger SOS.</p>
          </div>

          <div class="card admin-nav-card" id="nav-weather-alerts" style="cursor: pointer; text-align: center; border-bottom: 4px solid #eb3b5a;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">🌧️</h3>
            <h3>Weather Alerts</h3>
            <p>View active flood and road condition alerts.</p>
          </div>

          <div class="card admin-nav-card" id="nav-favorite-garages" style="cursor: pointer; text-align: center; border-bottom: 4px solid #ff4757;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">❤️</h3>
            <h3>Favorite Garages</h3>
            <p>Your saved garages for quick rebooking.</p>
          </div>

          <div class="card admin-nav-card" id="nav-payment-history" style="cursor: pointer; text-align: center; border-bottom: 4px solid #667eea;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">💳</h3>
            <h3>Payment History</h3>
            <p>View your past payments and digital receipts.</p>
          </div>

          <div class="card admin-nav-card" id="nav-nid-verify" style="cursor: pointer; text-align: center; border-bottom: 4px solid #102a43;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">🆔</h3>
            <h3>NID Verification</h3>
            <p>Verify your identity for trusted profile.</p>
          </div>

        </div>
      </div>
    `;
    containerEl.innerHTML = html;
  }

  function renderGarageHostDashboard(data) {
    const d = data.data;
    const html = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🏢 Garage Host Dashboard</h1>
          <div class="header-actions">
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>

        <div class="dashboard-content" style="margin-bottom: 30px;">
          <div class="card">
            <h3>Total Spaces</h3>
            <p class="stat">${d.totalSpaces}</p>
          </div>
          <div class="card">
            <h3>Occupied Today</h3>
            <p class="stat">${d.occupiedSpaces}</p>
          </div>
          <div class="card">
            <h3>Monthly Revenue</h3>
            <p class="stat">${d.monthlyRevenue}</p>
          </div>
        </div>

        <h2 style="color: #102a43; margin-bottom: 20px; font-weight: 700;">Host Management Hub</h2>
        <div class="dashboard-content" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; width: 100%;">

          <div class="card admin-nav-card" id="host-nav-my-garages" style="cursor: pointer; text-align: center; border-bottom: 4px solid #00b569;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">🏗️</h3>
            <h3>My Garages</h3>
            <p>View, edit and manage your listed spaces.</p>
          </div>

          <div class="card admin-nav-card" id="host-nav-add-garage" style="cursor: pointer; text-align: center; border-bottom: 4px solid #667eea;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">➕</h3>
            <h3>List New Garage</h3>
            <p>Add a new parking space to the platform.</p>
          </div>

          <div class="card admin-nav-card" id="host-nav-statistics" style="cursor: pointer; text-align: center; border-bottom: 4px solid #f093fb;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">📊</h3>
            <h3>Booking Statistics</h3>
            <p>Daily, weekly and monthly income summaries.</p>
          </div>

          <div class="card admin-nav-card" id="host-nav-notifications" style="cursor: pointer; text-align: center; border-bottom: 4px solid #feca57;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">🔔</h3>
            <h3>Notifications</h3>
            <p>View booking alerts and activity updates.</p>
          </div>

          <div class="card admin-nav-card" id="host-nav-weather-alerts" style="cursor: pointer; text-align: center; border-bottom: 4px solid #eb3b5a;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">🌧️</h3>
            <h3>Weather Alerts</h3>
            <p>Check active flood and road condition warnings.</p>
          </div>

          <div class="card admin-nav-card" id="host-nav-ratings" style="cursor: pointer; text-align: center; border-bottom: 4px solid #ff9f43;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">⭐</h3>
            <h3>My Ratings</h3>
            <p>See reviews and ratings from your guests.</p>
          </div>

          <div class="card admin-nav-card" id="host-nav-browse" style="cursor: pointer; text-align: center; border-bottom: 4px solid #48dbfb;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">🅿️</h3>
            <h3>Browse All Garages</h3>
            <p>See all listings across the platform.</p>
          </div>

          <div class="card admin-nav-card" id="host-nav-earnings" style="cursor: pointer; text-align: center; border-bottom: 4px solid #00b569;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">💸</h3>
            <h3>Earnings & Withdrawals</h3>
            <p>Track your revenue and request payouts.</p>
          </div>

          <div class="card admin-nav-card" id="host-nav-nid" style="cursor: pointer; text-align: center; border-bottom: 4px solid #102a43;">
            <h3 style="font-size: 2.5rem; margin-bottom: 10px;">🆔</h3>
            <h3>NID Verification</h3>
            <p>Mandatory for hosting your space.</p>
          </div>

        </div>
      </div>
    `;
    containerEl.innerHTML = html;
  }

  // ── Host: Manage Spaces page ──
  function renderHostManageSpaces(spaces) {
    let spacesHtml = "<p class='no-bookings'>No spaces added yet. Go to 'List New Garage' to get started.</p>";
    if (spaces && spaces.length) {
      spacesHtml = `<table class="spaces-table">
          <thead><tr><th>Images</th><th>Price</th><th>Vehicle Types</th><th>Hours</th><th>Availability</th><th>Actions</th></tr></thead>
          <tbody>${spaces.map(s => {
            const imgs = (s.images || []).map(u => `<img src="${u}" alt="space" class="thumb"/>`).join(" ");
            const types = (s.vehicleTypes || []).join(", ");
            const hours = s.availableHours ? `${s.availableHours.start} - ${s.availableHours.end}` : "—";
            const isChecked = s.status === "Open" ? "checked" : "";
            return `<tr data-id="${s._id}">
              <td>${imgs || "<span style='color:#9fb3c8;'>No images</span>"}</td>
              <td>৳${s.price}</td>
              <td>${types || "—"}</td>
              <td>${hours}</td>
              <td>
                <label class="switch">
                  <input type="checkbox" class="toggle-availability" data-id="${s._id}" ${isChecked}>
                  <span class="slider"></span>
                </label>
                <span class="status-label status-${s.status}">${s.status}</span>
              </td>
              <td>
                <button class="edit-space-btn" data-id="${s._id}">Edit</button>
                <button class="delete-space-btn" data-id="${s._id}">Delete</button>
              </td>
            </tr>`;
          }).join("")}</tbody>
        </table>`;
    }

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🏗️ My Garages</h1>
          <div class="header-actions">
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="bookings-container">${spacesHtml}</div>
      </div>
    `;
  }

  // ── Host: Statistics page ──
  function renderHostStats(data) {
    const stats = data.data.stats;
    let statsHtml = "<p class='no-bookings'>No booking data available yet.</p>";

    if (stats) {
      const { daily, weekly, monthly, last7Days } = stats;
      const maxIncome   = Math.max(...(last7Days || []).map(d => d.income), 1);
      const maxBookings = Math.max(...(last7Days || []).map(d => d.bookings), 1);

      const barChartIncome = (last7Days || []).map(d => {
        const pct = Math.round((d.income / maxIncome) * 100);
        return `
          <div class="chart-bar-group">
            <div class="chart-bar-wrap">
              <div class="chart-bar income-bar" style="height:${Math.max(pct, d.income > 0 ? 6 : 0)}%">
                <span class="bar-tooltip">৳${d.income.toFixed(0)}</span>
              </div>
            </div>
            <div class="chart-label">${d.label.split(",")[0]}</div>
          </div>`;
      }).join("");

      const barChartBookings = (last7Days || []).map(d => {
        const pct = Math.round((d.bookings / maxBookings) * 100);
        return `
          <div class="chart-bar-group">
            <div class="chart-bar-wrap">
              <div class="chart-bar bookings-bar" style="height:${Math.max(pct, d.bookings > 0 ? 8 : 0)}%">
                <span class="bar-tooltip">${d.bookings}</span>
              </div>
            </div>
            <div class="chart-label">${d.label.split(",")[0]}</div>
          </div>`;
      }).join("");

      statsHtml = `
        <div class="host-stats-section">
          <div class="stats-period-grid">
            <div class="stats-period-card daily-card">
              <div class="period-icon">📅</div>
              <div class="period-label">Today</div>
              <div class="period-bookings">${daily.bookings}<span>booking${daily.bookings !== 1 ? 's' : ''}</span></div>
              <div class="period-income">৳${daily.income.toFixed(2)}</div>
            </div>
            <div class="stats-period-card weekly-card">
              <div class="period-icon">📆</div>
              <div class="period-label">This Week</div>
              <div class="period-bookings">${weekly.bookings}<span>booking${weekly.bookings !== 1 ? 's' : ''}</span></div>
              <div class="period-income">৳${weekly.income.toFixed(2)}</div>
            </div>
            <div class="stats-period-card monthly-card">
              <div class="period-icon">🗓️</div>
              <div class="period-label">This Month</div>
              <div class="period-bookings">${monthly.bookings}<span>booking${monthly.bookings !== 1 ? 's' : ''}</span></div>
              <div class="period-income">৳${monthly.income.toFixed(2)}</div>
            </div>
          </div>

          <div class="chart-tabs-container">
            <div class="chart-tab-bar">
              <button class="chart-tab active" data-chart="income">💰 Income</button>
              <button class="chart-tab" data-chart="bookings">📋 Bookings</button>
            </div>
            <div id="chart-income" class="chart-panel" style="display:flex;">
              <div class="chart-title">Income — Last 7 Days</div>
              <div class="bar-chart">${barChartIncome || '<p style="color:#888;padding:2rem;text-align:center;">No data yet</p>'}</div>
            </div>
            <div id="chart-bookings" class="chart-panel" style="display:none;">
              <div class="chart-title">Bookings — Last 7 Days</div>
              <div class="bar-chart">${barChartBookings || '<p style="color:#888;padding:2rem;text-align:center;">No data yet</p>'}</div>
            </div>
          </div>
        </div>
      `;
    }

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>📊 Booking Statistics &amp; Income</h1>
          <div class="header-actions">
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="bookings-container">${statsHtml}</div>
      </div>
    `;

    // Wire chart tab switching
    document.querySelectorAll(".chart-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".chart-tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".chart-panel").forEach(p => { p.style.display = "none"; });
        tab.classList.add("active");
        const panel = document.getElementById(`chart-${tab.dataset.chart}`);
        if (panel) panel.style.display = "flex";
      });
    });
  }

  // ── Host: Notifications page ──
  function renderHostNotifications(notifications) {
    let notifHtml;
    if (!notifications || notifications.length === 0) {
      notifHtml = "<p class='no-bookings'>No notifications yet.</p>";
    } else {
      notifHtml = `<div class="bookings-list">
        ${notifications.map(n => `
          <div class="booking-card ${n.readStatus ? '' : 'unread-notif'}">
            <div class="booking-card-header">
              <span class="booking-date">${new Date(n.timestamp).toLocaleString()}</span>
              ${!n.readStatus ? `<span class="booking-status status-confirmed">NEW</span>` : ''}
            </div>
            <div class="booking-card-body">
              <p>${n.message}</p>
            </div>
            ${!n.readStatus ? `
            <div class="booking-card-actions">
              <button class="btn-mark-read btn btn-primary" data-id="${n._id}" style="width:auto; padding:0.5rem 1rem;">✓ Mark as Read</button>
            </div>` : ''}
          </div>
        `).join("")}
      </div>`;
    }

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🔔 Notifications</h1>
          <div class="header-actions">
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="bookings-container">${notifHtml}</div>
      </div>
    `;
  }

  function renderWeatherAlertsPage(alerts, role) {
    const hasAlerts = alerts && alerts.length > 0;
    const contentHtml = hasAlerts ? alerts.map(alert => `
      <div class="weather-alert-card severity-${alert.severity.toLowerCase()}" style="margin-bottom: 14px;">
        <div style="display:flex; align-items:center; gap: 12px;">
          <div style="font-size: 24px;">${alert.type === 'Flood' ? '🌊' : '🚧'}</div>
          <div style="flex:1;">
            <h3 style="margin:0; font-size: 16px;">${alert.title} — ${alert.area}</h3>
            <p style="margin:6px 0 0; color:#535b62; font-size:14px;">${alert.description}</p>
          </div>
          <div style="font-weight:700; color:${alert.severity === 'Critical' ? '#d82b38' : '#f6ad55'}; font-size:12px; text-transform:uppercase;">${alert.severity}</div>
        </div>
      </div>
    `).join('') : '<p class="no-bookings">No active weather alerts at the moment.</p>';

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🌧️ Weather Alerts</h1>
          <div class="header-actions">
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content" style="margin-bottom: 24px;">
          <p style="margin:0; color:#334e68;">These alerts include flood warnings and road condition advisories during monsoon season. Drivers with active bookings in affected areas are notified automatically.</p>
        </div>
        <div class="bookings-container">${contentHtml}</div>
      </div>
    `;
  }

  function renderAdminWeatherAlerts(alerts) {
    const hasAlerts = alerts && alerts.length > 0;
    const alertsHtml = hasAlerts ? alerts.map(alert => `
      <div class="weather-alert-card severity-${alert.severity.toLowerCase()}" style="margin-bottom: 16px; padding: 18px; border-radius: 12px; background:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <div style="display:flex; justify-content:space-between; gap: 12px; align-items:center;">
          <div>
            <h3 style="margin:0; font-size: 16px;">${alert.title} — ${alert.area}</h3>
            <p style="margin: 8px 0 0; color:#475569; font-size: 14px;">${alert.description}</p>
            <small style="color:#7b8794;">Type: ${alert.type} · Severity: ${alert.severity}</small>
          </div>
          <button class="btn btn-danger btn-deactivate-weather-alert" data-id="${alert._id}" style="padding: 0.5rem 0.85rem; font-size: 0.95rem;">Deactivate</button>
        </div>
      </div>
    `).join('') : '<p class="no-bookings">No active weather alerts are currently published.</p>';

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🌧️ Admin Weather Alerts</h1>
          <div class="header-actions">
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <section class="dashboard-content" style="margin-bottom: 24px;">
          <div class="card" style="padding: 20px;">
            <h3 style="margin-top: 0;">Publish New Alert</h3>
            <div class="form-group">
              <label>Title</label>
              <input type="text" id="alert-title" placeholder="Flood alert for Gulshan" />
            </div>
            <div class="form-group">
              <label>Area</label>
              <input type="text" id="alert-area" placeholder="Gulshan, Dhaka" />
            </div>
            <div class="form-group">
              <label>Type</label>
              <select id="alert-type">
                <option value="Flood">Flood</option>
                <option value="RoadCondition">Road Condition</option>
              </select>
            </div>
            <div class="form-group">
              <label>Severity</label>
              <select id="alert-severity">
                <option value="Warning">Warning</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="alert-description" rows="3" placeholder="Describe the affected area and expected conditions."></textarea>
            </div>
            <div id="alert-form-error" class="error-message"></div>
            <button id="create-weather-alert-btn" class="btn btn-primary">Publish Alert</button>
          </div>
        </section>
        <div class="bookings-container">
          <h2 style="margin-bottom: 16px;">Active Alerts</h2>
          ${alertsHtml}
        </div>
      </div>
    `;
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
            <small class="helper-text">Enter direct image URLs (e.g., https://i.imgur.com/abc123.jpg). Album links like imgur.com/a/... won't display properly. For Imgur albums, right-click images and copy image address.</small>
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

          <div class="card admin-nav-card" id="nav-weather-alerts" style="cursor: pointer; text-align: center; border-bottom: 4px solid #eb3b5a;">
            <h3 style="font-size: 2rem; margin-bottom: 10px;">🌧️</h3>
            <h3>Weather Alerts</h3>
            <p>Manage active flood and road alerts.</p>
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
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
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
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
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
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
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
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
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
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
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
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
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
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
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
                    ${userRole === "Driver" ? `<button class="btn-toggle-favorite" data-id="${s._id}" title="Add to Favorites">❤️</button>` : ""}
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
                <p><strong>Payment:</strong> <span class="status-${b.paymentStatus === 'paid' ? 'Open' : 'Closed'}" style="padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${b.paymentStatus.toUpperCase()} ${b.paymentMethod !== 'None' ? `(${b.paymentMethod})` : ''}</span></p>
                ${b.overstayFine > 0 ? `
                  <p style="margin-top: 10px; color: #d82b38;"><strong>Overstay Fine:</strong> ৳${b.overstayFine} (${b.overstayHours}h late)</p>
                ` : ``}
              </div>
              <div class="booking-card-actions">
                ${b.status === "confirmed" && b.paymentStatus === "pending" ? `
                  <button class="btn btn-primary btn-pay-booking" data-id="${b._id}" data-amount="${b.totalPrice}" style="background: #00b569; border: none;">Pay Now</button>
                ` : ''}
                ${b.status === "confirmed" ? `
                  <button class="btn-cancel-booking ${canModify ? '' : 'disabled'}" data-id="${b._id}" ${canModify ? '' : 'disabled title="Cannot modify within 1 hour of start"'}>Cancel</button>
                  <button class="btn-reschedule-booking ${canModify ? '' : 'disabled'}" data-id="${b._id}" ${canModify ? '' : 'disabled title="Cannot modify within 1 hour of start"'}>Reschedule</button>
                ` : ''}
              </div>
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

  function renderSubscriptionPasses(data) {
    const { subscriptions } = data;

    let subscriptionsHtml = '';
    if (subscriptions && subscriptions.length > 0) {
      subscriptionsHtml = `
        <div class="card" style="margin-bottom: 30px; width: 100%; max-width: 600px;">
          <h3 style="color: #28a745; margin-bottom: 20px;">Your Active Passes</h3>
          ${subscriptions.map(sub => {
            const expDate = new Date(sub.endDate).toLocaleDateString();
            const startDate = new Date(sub.startDate).toLocaleDateString();
            return `
              <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #f9f9f9;">
                <p style="margin: 5px 0;"><strong>Pass ID:</strong> ${sub._id}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #28a745; text-transform: uppercase;">${sub.status}</span></p>
                <p style="margin: 5px 0;"><strong>Start Date:</strong> ${startDate}</p>
                <p style="margin: 5px 0;"><strong>Valid Until:</strong> ${expDate}</p>
                <p style="margin: 5px 0;"><strong>Price:</strong> ৳${sub.price}</p>
                <button class="btn btn-danger cancel-subscription-btn" data-subscription-id="${sub._id}" style="margin-top: 10px;">Cancel Pass</button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    const purchaseCard = `
      <div class="card" style="text-align: center; padding: 40px; width: 100%; max-width: 500px;">
        <h2>💳 Monthly Parking Pass</h2>
        <p style="font-size: 1.2rem; margin: 20px 0;">Get unlimited access to select parking spots for 30 days.</p>
        <p style="font-size: 2.5rem; font-weight: bold; color: #28a745; margin-bottom: 20px;">৳5000<span style="font-size: 1rem; color: #666;"> / month</span></p>
        <button id="purchase-pass-btn" class="btn btn-primary" style="font-size: 1.2rem; padding: 12px 30px; border-radius: 8px;">Purchase Pass</button>
        <div id="subscription-status-msg" style="margin-top: 20px; font-weight: bold;"></div>
      </div>
    `;

    const html = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🎟️ Subscription Passes</h1>
          <div class="header-actions">
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content" style="flex-direction: column; align-items: center;">
          ${subscriptionsHtml}
          ${purchaseCard}
        </div>
      </div>
    `;
    containerEl.innerHTML = html;
  }

  // ── FR-21: Rating Modal ──
  function renderRatingModal(booking, userRole) {
    const target = userRole === "Driver"
      ? booking.garageSpace?.location?.address || `৳${booking.garageSpace?.price}/hr garage`
      : booking.driver?.name || "Driver";
    const title = userRole === "Driver" ? "Rate the Garage" : "Rate the Driver";

    const existing = document.getElementById("rating-modal-overlay");
    if (existing) existing.remove();

    const html = `
      <div class="booking-modal-overlay" id="rating-modal-overlay">
        <div class="booking-modal">
          <button class="modal-close" id="rating-modal-close">&times;</button>
          <h2>⭐ ${title}</h2>
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
  function renderMyRatings(pendingBookings, userRole, receivedRatings = []) {
    let pendingHtml = "";
    if (!pendingBookings || pendingBookings.length === 0) {
      pendingHtml = "<p class='no-bookings'>No completed bookings to rate yet.</p>";
    } else {
      pendingHtml = `<div class="bookings-list">
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

    let receivedHtml = "";
    if (userRole === "GarageHost") {
      if (!receivedRatings || receivedRatings.length === 0) {
        receivedHtml = "<p class='no-bookings'>No driver ratings received yet.</p>";
      } else {
        receivedHtml = `<div class="ratings-received">
          <h2>Ratings Received from Drivers</h2>
          <div class="ratings-list">
            ${receivedRatings.map(r => {
            const dateStr = r.booking && r.booking.date
              ? new Date(r.booking.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : new Date(r.createdAt || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            const driverName = r.fromUser?.name || "Driver";
            const garageAddress = r.booking?.garageSpace?.location?.address || "Your garage";
            const stars = Array.from({ length: 5 }, (_, idx) => idx < r.rating ? "★" : "☆").join("");
            return `
              <div class="booking-card">
                <div class="booking-card-header">
                  <span class="booking-date">${dateStr}</span>
                  <span class="booking-status status-completed">RECEIVED</span>
                </div>
                <div class="booking-card-body">
                  <p><strong>From:</strong> ${driverName}</p>
                  <p><strong>Garage:</strong> ${garageAddress}</p>
                  <p><strong>Rating:</strong> <span class="rating-stars">${stars}</span></p>
                  <p><strong>Review:</strong> ${r.comment || "No review provided."}</p>
                </div>
              </div>
            `;
          }).join("")}
          </div>
        </div>`;
      }
    }

    const pageTitle = userRole === "Driver"
      ? "⭐ Rate Your Garage Experiences"
      : "⭐ Rate Your Drivers";

    const hostHeader = userRole === "GarageHost"
      ? "<p style=\"margin-top:8px; color:#555;\">Here are the driver ratings you have received and the completed bookings waiting for your review.</p>"
      : "";

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <div>
            <h1>${pageTitle}</h1>
            ${hostHeader}
          </div>
          <div class="header-actions">
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        ${userRole === "GarageHost" ? `<div class="dashboard-section">${receivedHtml}</div>` : ""}
        <div class="dashboard-section">
          <h2>${userRole === "Driver" ? "Bookings to Rate" : "Bookings to Rate Drivers"}</h2>
          ${pendingHtml}
        </div>
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
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
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

  // ── Favorite Garages Page ──
  function renderFavoriteGarages(favorites) {
    let favoritesHtml = "<p class='no-favorites'>You haven't saved any favorite garages yet. Browse garages and tap the heart icon to save them!</p>";

    if (favorites && favorites.length > 0) {
      favoritesHtml = `<div class="garage-grid">
        ${favorites.filter(s => s !== null).map(s => {
        const imgs = (s.images || []).map(u => `<img src="${u}" alt="garage" class="garage-thumb"/>`).join(" ");
        const types = (s.vehicleTypes || []).join(", ");
        const address = s.location?.address || "Not specified";
        const hostName = s.host?.name || "Unknown";

        return `
            <div class="garage-card favorite-card">
              <div class="garage-images">${imgs || "<p>No images</p>"}</div>
              <div class="garage-info">
                <h3>৳${s.price}/hour</h3>
                <p><strong>Address:</strong> ${address}</p>
                <p><strong>Vehicle Types:</strong> ${types || "Not specified"}</p>
                <p><strong>Host:</strong> ${hostName}</p>
                <div class="garage-card-actions">
                  <button class="btn-book-now btn-quick-rebook" data-space-id="${s._id}" data-price="${s.price}">⚡ Quick Rebook</button>
                  <button class="btn-remove-favorite" data-id="${s._id}">💔 Remove</button>
                </div>
              </div>
            </div>
          `;
      }).join("")}
      </div>`;
    }

    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>❤️ Favorite Garages</h1>
          <div class="header-actions">
            <button id="back-to-dashboard-btn" class="btn btn-secondary">Back to Dashboard</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content">${favoritesHtml}</div>
      </div>
    `;
  }

  function renderPaymentModal(bookingId, amount) {
    const modalHtml = `
      <div id="payment-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px);">
        <div class="card" style="width: 90%; max-width: 500px; padding: 40px; text-align: center; position: relative; animation: slideUp 0.4s ease-out;">
          <button id="payment-modal-close" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #627d98;">&times;</button>
          
          <div style="font-size: 4rem; margin-bottom: 20px;">💳</div>
          <h2 style="color: #102a43; margin-bottom: 10px;">Select Payment Method</h2>
          <p style="color: #627d98; margin-bottom: 30px;">Total Amount to Pay: <span style="font-weight: bold; color: #102a43;">৳${amount}</span></p>

          <div id="payment-error" class="error-message" style="display:none; margin-bottom: 15px;"></div>
          <div id="payment-success" class="success-message" style="display:none; margin-bottom: 15px; color: #00b569; font-weight: bold;"></div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; text-align: left;">
            <label class="payment-option" style="display: flex; align-items: center; gap: 10px; padding: 15px; border: 1px solid #dae1e7; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
              <input type="radio" name="payment-method" value="bKash" checked>
              <span>bKash</span>
            </label>
            <label class="payment-option" style="display: flex; align-items: center; gap: 10px; padding: 15px; border: 1px solid #dae1e7; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
              <input type="radio" name="payment-method" value="Nagad">
              <span>Nagad</span>
            </label>
            <label class="payment-option" style="display: flex; align-items: center; gap: 10px; padding: 15px; border: 1px solid #dae1e7; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
              <input type="radio" name="payment-method" value="Rocket">
              <span>Rocket</span>
            </label>
            <label class="payment-option" style="display: flex; align-items: center; gap: 10px; padding: 15px; border: 1px solid #dae1e7; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
              <input type="radio" name="payment-method" value="Card">
              <span>Debit/Credit Card</span>
            </label>
            <label class="payment-option" style="grid-column: span 2; display: flex; align-items: center; gap: 10px; padding: 15px; border: 1px solid #dae1e7; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: #f8fafc;">
              <input type="radio" name="payment-method" value="Cash">
              <span>Pay with Cash at Garage</span>
            </label>
          </div>

          <button id="pay-now-btn" class="btn btn-primary" data-booking-id="${bookingId}" data-amount="${amount}" style="width: 100%; padding: 15px; font-size: 1.1rem;">Proceed to Pay</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  function renderReceipt(payment) {
    const modalHtml = `
      <div id="receipt-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px);">
        <div class="card" id="receipt-card" style="width: 90%; max-width: 450px; padding: 0; text-align: center; position: relative; overflow: hidden; background: white;">
           <div style="background: #102a43; color: white; padding: 20px;">
             <h2 style="margin: 0;">Payment Receipt</h2>
           </div>
           
           <div style="padding: 30px;">
             <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">ParkDhaka - Smart Parking</div>
             <div style="color: #627d98; font-size: 0.9rem; margin-bottom: 25px;">Official Digital Transaction Copy</div>
             
             <div style="border-top: 2px dashed #dae1e7; border-bottom: 2px dashed #dae1e7; padding: 20px 0; margin-bottom: 25px; text-align: left;">
               <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                 <span style="color: #627d98;">Transaction ID:</span>
                 <span style="font-weight: bold;">${payment.transactionId || 'CASH_PAYMENT'}</span>
               </div>
               <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                 <span style="color: #627d98;">Date & Time:</span>
                 <span>${new Date(payment.timestamp).toLocaleString()}</span>
               </div>
               <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                 <span style="color: #627d98;">Payment Method:</span>
                 <span style="font-weight: bold;">${payment.paymentMethod}</span>
               </div>
               <div style="display: flex; justify-content: space-between;">
                 <span style="color: #627d98;">Status:</span>
                 <span style="color: #00b569; font-weight: bold;">${payment.status}</span>
               </div>
             </div>

             <div style="text-align: left; margin-bottom: 30px;">
                <div style="color: #627d98; font-size: 0.8rem; margin-bottom: 5px;">Garage Details:</div>
                <div style="font-weight: bold;">${payment.booking && payment.booking.garageSpace ? payment.booking.garageSpace.title : (payment.garage ? payment.garage.title : 'N/A')}</div>
                <div style="color: #627d98; font-size: 0.9rem;">${payment.booking && payment.booking.garageSpace ? payment.booking.garageSpace.location : (payment.garage ? payment.garage.location : '')}</div>
             </div>

             <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8fafc; border-radius: 12px; margin-bottom: 30px;">
                <span style="font-size: 1.1rem; font-weight: bold;">Total Paid:</span>
                <span style="font-size: 1.5rem; font-weight: bold; color: #102a43;">৳${payment.amount}</span>
             </div>

             <div style="display: flex; gap: 10px;">
               <button id="print-receipt-btn" class="btn btn-secondary" style="flex: 1; padding: 12px;">Print Receipt</button>
               <button id="receipt-modal-close" class="btn btn-primary" style="flex: 1; padding: 12px;">Close</button>
             </div>
           </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  function renderPaymentHistory(payments) {
    const containerEl = document.getElementById('app');
    let historyHtml = '<p style="text-align: center; color: #627d98; padding: 40px;">No transaction history found.</p>';
    if (payments && payments.length > 0) {
      historyHtml = `
        <table class="data-table">
          <thead>
            <tr><th>Date</th><th>Transaction ID</th><th>Method</th><th>Amount</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${payments.map(p => `
              <tr>
                <td>${new Date(p.timestamp).toLocaleString()}</td>
                <td>${p.transactionId || 'N/A'}</td>
                <td>${p.paymentMethod}</td>
                <td style="font-weight: bold;">৳${p.amount}</td>
                <td><span class="status-label ${p.status === 'Paid' ? 'status-Open' : (p.status === 'Pending' ? 'status-Pending' : 'status-Closed')}">${p.status}</span></td>
                <td><button class="btn btn-secondary btn-view-receipt" data-id="${p._id}" style="padding: 6px 12px; font-size: 12px;">🧾 Receipt</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>💳 Payment History</h1>
          <div class="header-actions">
            <button class="btn btn-secondary" id="back-to-hub">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="card" style="width: 100%; text-align: left;">
          <h2 style="color: #102a43; margin-bottom: 20px; font-size: 1.5rem;">Recent Transactions</h2>
          ${historyHtml}
        </div>
      </div>
    `;
  }

  function renderHostEarnings(stats) {
    const containerEl = document.getElementById('app');
    const d = stats;
    let historyHtml = '<p style="text-align: center; color: #627d98; padding: 20px;">No earnings history found.</p>';
    if (d.payments && d.payments.length > 0) {
      historyHtml = `
        <table class="data-table">
          <thead><tr><th>Date</th><th>Guest</th><th>Amount</th><th>Method</th></tr></thead>
          <tbody>
            ${d.payments.map(p => `
              <tr>
                <td>${new Date(p.timestamp).toLocaleDateString()}</td>
                <td>${p.user ? p.user.name : 'Guest'}</td>
                <td style="font-weight: bold; color: #00b569;">৳${p.amount}</td>
                <td>${p.paymentMethod}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>💸 Host Earnings</h1>
          <div class="header-actions">
            <button class="btn btn-secondary" id="back-to-hub">Back to Hub</button>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          </div>
        </header>
        <div class="dashboard-content" style="margin-bottom: 30px;">
          <div class="card"><h3>Total Lifetime Earnings</h3><p class="stat" style="color: #00b569;">৳${d.totalEarnings}</p></div>
          <div class="card"><h3>Available for Withdrawal</h3><p class="stat" style="color: #667eea;">৳${d.availableBalance}</p></div>
        </div>
        <div class="card" style="width: 100%; margin-bottom: 30px;">
          <h2 style="color: #102a43; margin-bottom: 20px; font-size: 1.5rem;">Request Payout</h2>
          <p style="color: #627d98; margin-bottom: 20px;">Withdraw your earnings to your linked mobile banking account (bKash/Nagad).</p>
          <button id="withdraw-funds-btn" class="btn btn-primary" ${d.availableBalance <= 0 ? 'disabled' : ''}>Request Withdrawal</button>
        </div>
        <div class="card" style="width: 100%; text-align: left;">
          <h2 style="color: #102a43; margin-bottom: 20px; font-size: 1.5rem;">Earnings History</h2>
          ${historyHtml}
        </div>
      </div>
    `;
  }

  function renderNidVerification(status) {
    const containerEl = document.getElementById('app');
    let content = '';
    if (status.isNidVerified) {
      content = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 5rem; margin-bottom: 20px;">✅</div>
          <h2 style="color: #102a43; margin-bottom: 10px;">Verified Identity</h2>
          <p style="color: #627d98; margin-bottom: 30px;">Your account is verified with NID: <strong>${status.nidNumber.replace(/\d(?=\d{4})/g, '*')}</strong></p>
          <button class="btn btn-secondary" id="back-to-hub" style="width: auto; padding: 12px 30px;">Back to Hub</button>
        </div>
      `;
    } else {
      content = `
        <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="font-size: 4rem; text-align: center; margin-bottom: 20px;">🆔</div>
          <h2 style="color: #102a43; text-align: center; margin-bottom: 10px;">Identity Verification</h2>
          <p style="color: #627d98; text-align: center; margin-bottom: 30px;">Please enter your 10-digit National ID number for verification.</p>
          <div class="card" style="text-align: left; padding: 30px;">
            <div class="form-group"><label>NID Number</label><input type="text" id="nid-number-input" placeholder="e.g., 1234567890" maxlength="10" /><small style="color: #829ab1; display: block; margin-top: 5px;">Must be exactly 10 digits.</small></div>
            <div id="nid-error" class="error-message" style="display:none; margin-bottom: 15px;"></div>
            <button id="submit-nid-btn" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Verify Now</button>
          </div>
          <div style="text-align: center; margin-top: 20px;"><button class="btn btn-secondary" id="back-to-hub" style="width: auto; background: none; color: #627d98; box-shadow: none;">Skip for now</button></div>
        </div>
      `;
    }
    containerEl.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🆔 Identity Verification</h1>
          <div class="header-actions"><button class="btn btn-secondary" id="back-to-hub">Back to Hub</button><button id="logout-btn" class="btn btn-danger">Logout</button></div>
        </header>
        <div class="card" style="width: 100%;">${content}</div>
      </div>
    `;
  }

  return {
    renderAuthPage,
    renderDriverDashboard,
    renderGarageHostDashboard,
    renderHostManageSpaces,
    renderHostStats,
    renderHostNotifications,
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
    showError,
    renderFavoriteGarages,
    renderPaymentModal,
    renderReceipt,
    renderPaymentHistory,
    renderHostEarnings,
    renderNidVerification,
    renderWeatherAlertsPage,
    renderAdminWeatherAlerts,
    renderWeatherAlerts: (alerts) => {
      if (!alerts || alerts.length === 0) return "";
      return `
        <div class="weather-alerts-container" style="margin-bottom: 25px;">
          ${alerts.map(alert => `
            <div class="weather-alert-card severity-${alert.severity.toLowerCase()}" style="display: flex; align-items: center; gap: 15px; background: rgba(255, 255, 255, 0.9); padding: 15px; border-radius: 12px; border-left: 5px solid ${alert.severity === 'Critical' ? '#d82b38' : '#f6ad55'}; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 10px;">
              <div style="font-size: 24px;">${alert.type === 'Flood' ? '🌊' : '🚧'}</div>
              <div style="flex-grow: 1;">
                <h4 style="margin: 0; color: #102a43; font-size: 16px;">${alert.title} - ${alert.area}</h4>
                <p style="margin: 4px 0 0; color: #486581; font-size: 13px;">${alert.description}</p>
              </div>
              <div style="font-weight: 700; color: ${alert.severity === 'Critical' ? '#d82b38' : '#f6ad55'}; font-size: 12px; text-transform: uppercase;">${alert.severity}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
  };
})();