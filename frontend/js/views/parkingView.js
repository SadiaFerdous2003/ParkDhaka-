const ParkingView = (function() {
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

  function renderDriverDashboard(data) {
    const html = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🚗 Driver Dashboard</h1>
          <button id="logout-btn" class="btn btn-danger">Logout</button>
        </header>
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

  function renderGarageHostDashboard(data, spaces = [], notifications = []) {
    // build table of spaces
    let spacesHtml = "<p>No spaces added yet.</p>";
    if (spaces.length) {
      spacesHtml = `<table class="spaces-table">
          <thead><tr><th>Images</th><th>Price</th><th>Vehicle Types</th><th>Hours</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${spaces
            .map(s => {
              const imgs = (s.images || []).map(u => `<img src="${u}" alt="space" class="thumb"/>`).join(" ");
              const types = (s.vehicleTypes || []).join(", ");
              const hours = s.availableHours ? `${s.availableHours.start} - ${s.availableHours.end}` : "";
              const statusBadge = `<span class="badge ${s.status === 'Open' ? 'badge-success' : 'badge-danger'}">${s.status || 'Open'}</span>`;
              return `<tr data-id="${s._id}"><td>${imgs}</td><td>${s.price}</td><td>${types}</td><td>${hours}</td><td>${statusBadge}</td><td><button class="toggle-status-btn" data-id="${s._id}">Toggle Status</button> <button class="edit-space-btn" data-id="${s._id}">Edit</button> <button class="delete-space-btn" data-id="${s._id}">Delete</button></td></tr>`;
            })
            .join("")}</tbody>
        </table>`;
      console.log('renderGarageHostDashboard: generated spacesHtml', spacesHtml);
    }
    
    // Build Notification Section
    let notificationHtml = "<p>No recent notifications.</p>";
    if (notifications.length) {
      notificationHtml = `<ul class="notification-list">
        ${notifications.map(n => `
          <li class="notification-item ${n.isRead ? '' : 'unread'}" data-id="${n._id}">
            <div class="notification-content">
              <strong>${n.type.toUpperCase()}:</strong> ${n.message}
              <div class="notification-time"><small>${new Date(n.createdAt).toLocaleString()}</small></div>
            </div>
            ${!n.isRead ? `<button class="mark-read-btn btn btn-sm" data-id="${n._id}">Mark Read</button>` : ''}
          </li>
        `).join("")}
      </ul>`;
    }

    const html = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>🏢 Garage Host Dashboard</h1>
          <button id="logout-btn" class="btn btn-danger">Logout</button>
        </header>
        <div class="dashboard-content">
          <div class="card">
            <h3>Total Spaces</h3>
            <p class="stat">${data.data.totalSpaces}</p>
          </div>
          <div class="card">
            <h3>Occupied Spaces</h3>
            <p class="stat">${data.data.occupiedSpaces}</p>
          </div>
          <div class="card">
            <h3>Monthly Revenue</h3>
            <p class="stat">${data.data.monthlyRevenue}</p>
          </div>
        </div>

        <section class="host-notifications">
          <h2>Notifications</h2>
          ${notificationHtml}
        </section>
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
            <label>Price ($)</label>
            <input type="number" id="space-price" placeholder="e.g. 10" />
          </div>
          <div class="form-group">
            <label>Vehicle Types (comma separated)</label>
            <input type="text" id="space-vehicle-types" placeholder="Car, Bike, SUV" />
          </div>
          <div class="form-group">
            <label>Available Hours Start</label>
            <input type="time" id="space-hour-start" />
          </div>
          <div class="form-group">
            <label>Available Hours End</label>
            <input type="time" id="space-hour-end" />
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
          <button id="logout-btn" class="btn btn-danger">Logout</button>
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

  return {
    renderAuthPage,
    renderDriverDashboard,
    renderGarageHostDashboard,
    renderAdminDashboard,
    showError
  };
})();
