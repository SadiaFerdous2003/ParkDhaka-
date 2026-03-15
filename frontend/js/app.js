const API_BASE_URL = "http://localhost:5000/api";

const App = (function () {
  const parkingView = ParkingView;
  let currentUser = null;
  let currentSpaces = []; // store fetched spaces for host
  let hostListenerAdded = false;

  // Initialize the application
  function init() {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        loadDashboard(currentUser.role);
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showAuthPage();
      }
    } else {
      showAuthPage();
    }
  }

  function showAuthPage() {
    parkingView.renderAuthPage();
    setupAuthEventListeners();
  }

  function setupAuthEventListeners() {
    // Toggle between register and login
    const showLoginLink = document.getElementById("show-login-link");
    const showRegisterLink = document.getElementById("show-register-link");
    const registerSection = document.getElementById("register-section");
    const loginSection = document.getElementById("login-section");

    if (showLoginLink) {
      showLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        registerSection.style.display = "none";
        loginSection.style.display = "block";
      });
    }

    if (showRegisterLink) {
      showRegisterLink.addEventListener("click", (e) => {
        e.preventDefault();
        loginSection.style.display = "none";
        registerSection.style.display = "block";
      });
    }

    // Register button
    const registerBtn = document.getElementById("register-btn");
    if (registerBtn) {
      registerBtn.addEventListener("click", handleRegister);
    }

    // Login button
    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) {
      loginBtn.addEventListener("click", handleLogin);
    }

    // Enter key support
    const registerForm = document.getElementById("register-section");
    const loginForm = document.getElementById("login-section");

    if (registerForm) {
      registerForm.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleRegister();
      });
    }

    if (loginForm) {
      loginForm.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleLogin();
      });
    }
  }

  async function handleRegister() {
    const name = document.getElementById("register-name")?.value.trim();
    const email = document.getElementById("register-email")?.value.trim();
    const password = document.getElementById("register-password")?.value;
    const role = document.getElementById("register-role")?.value;

    if (!name || !email || !password || !role) {
      parkingView.showError("register", "All fields are required");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        currentUser = data.user;

        // Redirect to appropriate dashboard
        loadDashboard(data.user.role);
      } else {
        parkingView.showError("register", data.message || "Registration failed");
      }
    } catch (error) {
      parkingView.showError("register", "Network error. Please try again.");
      console.error("Registration error:", error);
    }
  }

  async function handleLogin() {
    const email = document.getElementById("login-email")?.value.trim();
    const password = document.getElementById("login-password")?.value;

    if (!email || !password) {
      parkingView.showError("login", "Email and password are required");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        currentUser = data.user;

        // Redirect to appropriate dashboard
        loadDashboard(data.user.role);
      } else {
        parkingView.showError("login", data.message || "Login failed");
      }
    } catch (error) {
      parkingView.showError("login", "Network error. Please try again.");
      console.error("Login error:", error);
    }
  }

  async function loadDashboard(role) {
    const token = localStorage.getItem("token");

    if (!token) {
      showAuthPage();
      return;
    }

    let endpoint = "";
    switch (role) {
      case "Driver":
        endpoint = "/dashboard/driver";
        break;
      case "GarageHost":
        endpoint = "/dashboard/garage-host";
        break;
      case "Admin":
        endpoint = "/dashboard/admin";
        break;
      default:
        parkingView.showError("auth", "Invalid role");
        return;
    }

    try {
      console.log('loadDashboard: requesting', endpoint);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();

        // if garage host we also fetch spaces
        if (role === "GarageHost") {
          console.log('loadDashboard: role is GarageHost, fetching spaces');
          try {
            const [spacesRes, notificationsRes] = await Promise.all([
              fetch(`${API_BASE_URL}/garage-spaces`, {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
                }
              }),
              fetch(`${API_BASE_URL}/notifications`, {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
                }
              })
            ]);

            let spaces = [];
            let notifications = [];

            if (spacesRes.ok) {
              spaces = await spacesRes.json();
            }
            if (notificationsRes.ok) {
              notifications = await notificationsRes.json();
            }

            console.log('loadDashboard: spaces payload', spaces);
            parkingView.renderGarageHostDashboard(data, spaces, notifications);
            console.log('loadDashboard: rendered GarageHost dashboard, spaces count=', spaces.length);
            currentSpaces = spaces;
            setupGarageHostListeners();
          } catch (err) {
            console.error("Error loading garage spaces or notifications", err);
            currentSpaces = [];
            parkingView.renderGarageHostDashboard(data, [], []);
            console.log('loadDashboard: rendered GarageHost dashboard with empty spaces');
            setupGarageHostListeners();
          }
        } else {
          // Render appropriate dashboard based on role
          switch (role) {
            case "Driver":
              parkingView.renderDriverDashboard(data);
              break;
            case "Admin":
              parkingView.renderAdminDashboard(data);
              break;
          }
        }

        // Setup logout button
        setupLogoutButton();
      } else if (response.status === 401) {
        // Token expired or invalid
        logout();
      } else if (response.status === 403) {
        parkingView.showError("auth", "Unauthorized - invalid role");
        logout();
      } else {
        const data = await response.json();
        console.error("Dashboard error:", data.message);
      }
    } catch (error) {
      console.error("Dashboard load error:", error);
    }
  }

  function setupLogoutButton() {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    currentUser = null;
    showAuthPage();
  }

  // garage host helpers
  function setupGarageHostListeners() {
    const addBtn = document.getElementById("add-space-btn");
    if (addBtn) addBtn.addEventListener("click", handleAddSpace);

    // Use event delegation for edit/delete to ensure handlers attach after render
    function hostSpacesClickHandler(e) {
      const target = e.target;
      if (target.matches('.edit-space-btn')) {
        handleEditSpace(target.dataset.id);
      } else if (target.matches('.delete-space-btn')) {
        handleDeleteSpace(target.dataset.id);
      } else if (target.matches('.toggle-status-btn')) {
        handleToggleSpaceStatus(target.dataset.id);
      } else if (target.matches('.mark-read-btn')) {
        handleMarkNotificationRead(target.dataset.id);
      }
    }

    if (!hostListenerAdded) {
      document.addEventListener('click', hostSpacesClickHandler);
      hostListenerAdded = true;
    }
  }

  async function handleToggleSpaceStatus(id) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/garage-spaces/${id}/status`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        loadDashboard(currentUser.role);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to toggle status");
      }
    } catch (err) {
      console.error("Toggle status error", err);
      alert("Network error");
    }
  }

  async function handleMarkNotificationRead(id) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        // Just reload the dashboard to get updated notifications list and correct styling
        loadDashboard(currentUser.role);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to mark as read");
      }
    } catch (err) {
      console.error("Mark read error", err);
      alert("Network error");
    }
  }

  async function handleAddSpace() {
    const token = localStorage.getItem("token");
    const fileInput = document.getElementById("space-images");
    const urlInput = document.getElementById("space-image-urls");
    const price = parseFloat(document.getElementById("space-price").value);
    const typesRaw = document.getElementById("space-vehicle-types").value;
    const start = document.getElementById("space-hour-start").value;
    const end = document.getElementById("space-hour-end").value;

    const errorEl = document.getElementById("space-error");
    if (errorEl) errorEl.textContent = "";

    if (isNaN(price)) {
      if (errorEl) errorEl.textContent = "Valid price is required";
      return;
    }

    const vehicleTypes = typesRaw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const files = fileInput?.files;
    const hasFiles = files && files.length > 0;
    const urlValue = urlInput?.value?.trim() || "";
    const hasUrls = urlValue.length > 0;

    try {
      let res;

      if (hasFiles) {
        // Use multipart/form-data for file uploads
        const formData = new FormData();
        formData.append("price", price);
        formData.append("vehicleTypes", vehicleTypes.join(","));
        formData.append("availableHours", JSON.stringify({ start, end }));

        for (let i = 0; i < files.length; i++) {
          formData.append("images", files[i]);
        }

        res = await fetch(`${API_BASE_URL}/garage-spaces`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });
      } else if (hasUrls) {
        // Use JSON for URL-based images (backwards compatibility)
        const images = urlValue
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);

        res = await fetch(`${API_BASE_URL}/garage-spaces`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ images, price, vehicleTypes, availableHours: { start, end } })
        });
      } else {
        // No images provided - still allow creating space
        res = await fetch(`${API_BASE_URL}/garage-spaces`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ images: [], price, vehicleTypes, availableHours: { start, end } })
        });
      }

      const data = await res.json();
      if (res.ok) {
        // Clear form inputs
        if (fileInput) fileInput.value = "";
        if (urlInput) urlInput.value = "";
        document.getElementById("space-price").value = "";
        document.getElementById("space-vehicle-types").value = "";
        document.getElementById("space-hour-start").value = "";
        document.getElementById("space-hour-end").value = "";

        // reload dashboard to refresh numbers and list
        loadDashboard(currentUser.role);
      } else {
        if (errorEl) errorEl.textContent = data.message || "Failed to add space";
      }
    } catch (err) {
      console.error("Add space error", err);
      if (errorEl) errorEl.textContent = "Network error";
    }
  }

  async function handleEditSpace(id) {
    const space = currentSpaces.find(s => s._id === id);
    if (!space) return;
    const newPrice = prompt("New price:", space.price);
    if (newPrice === null) return;
    const newTypes = prompt("Vehicle types (comma separated):", (space.vehicleTypes || []).join(", "));
    const newStart = prompt("Available hour start:", space.availableHours?.start || "");
    const newEnd = prompt("Available hour end:", space.availableHours?.end || "");

    const body = {};
    if (newPrice !== null) body.price = parseFloat(newPrice);
    if (newTypes !== null) body.vehicleTypes = newTypes.split(",").map(s => s.trim()).filter(Boolean);
    if (newStart !== null && newEnd !== null) body.availableHours = { start: newStart, end: newEnd };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/garage-spaces/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        loadDashboard(currentUser.role);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update");
      }
    } catch (err) {
      console.error("Edit space error", err);
      alert("Network error");
    }
  }

  async function handleDeleteSpace(id) {
    if (!confirm("Are you sure you want to delete this space?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/garage-spaces/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        loadDashboard(currentUser.role);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete space error", err);
      alert("Network error");
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init,
    logout
  };
})();
