const API_BASE_URL = "http://localhost:5000/api";
let googleMapsLoaded = false;
let googleMapsApiKey = "";

const App = (function () {
  const parkingView = ParkingView;
  let currentUser = null;
  let currentSpaces = []; // store fetched spaces for host
  let currentBookings = []; // store fetched bookings for driver
  let currentPendingRatings = []; // store pending rating bookings for driver or host
  let currentReceivedRatings = []; // store ratings received by garage hosts from drivers
  let hostListenerAdded = false;

  // ── Initialize ──
  async function init() {
    try {
      const configRes = await fetch(`${API_BASE_URL}/config`);
      if (configRes.ok) {
        const config = await configRes.json();
        googleMapsApiKey = config.googleMapsApiKey;
        if (googleMapsApiKey && googleMapsApiKey !== "YOUR_GOOGLE_MAPS_API_KEY") {
          loadGoogleMaps();
        }
      }
    } catch (e) {
      console.log("Using Leaflet fallback for maps");
    }

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

  // ── Load Google Maps API ──
  function loadGoogleMaps() {
    if (googleMapsLoaded || !googleMapsApiKey) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => { googleMapsLoaded = true; console.log("Google Maps loaded successfully"); };
    script.onerror = () => { console.log("Failed to load Google Maps, using Leaflet fallback"); };
    document.head.appendChild(script);
  }

  // ── Global Toggle Map Function (FR-4) ──
  let mapToggleData = null;
  window.toggleMap = function () {
    const toggleBtn = document.getElementById("toggle-map-btn");
    const mapWrapper = document.getElementById("map-container-wrapper");
    if (!toggleBtn || !mapWrapper) return;
    const isCollapsed = mapWrapper.classList.contains("collapsed");
    if (isCollapsed) {
      mapWrapper.classList.remove("collapsed");
      toggleBtn.innerHTML = `<span class="toggle-icon">📍</span> Hide Nearby Map`;

      // Wait for the CSS max-height transition (500ms) to fully complete
      // BEFORE initialising Leaflet — otherwise the container is still 0px tall
      // and Leaflet defaults to world-zoom level.
      setTimeout(() => {
        if (!mapToggleData) return;

        const initMap = (lat, lng) => {
          initGaragesMap(mapToggleData.spaces, mapToggleData.userRole, lat, lng);
          // One extra invalidateSize after the map tiles settle
          setTimeout(() => {
            if (window.leafletMapInstance) {
              window.leafletMapInstance.invalidateSize();
            }
          }, 400);
        };

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => initMap(pos.coords.latitude, pos.coords.longitude),
            ()    => initMap(null, null)
          );
        } else {
          initMap(null, null);
        }
      }, 550); // 550ms > 500ms CSS transition
    } else {
      mapWrapper.classList.add("collapsed");
      toggleBtn.innerHTML = `<span class="toggle-icon">📍</span> Show Nearby Garages Map`;
    }
  };

  window.setMapToggleData = function (spaces, userRole) {
    mapToggleData = { spaces, userRole };
  };

  function showAuthPage() {
    // Stop any running live-update interval
    stopLiveUpdate();
    
    parkingView.renderAuthPage();
    setupAuthEventListeners();
  }

  function setupAuthEventListeners() {
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

    const registerBtn = document.getElementById("register-btn");
    if (registerBtn) registerBtn.addEventListener("click", handleRegister);

    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) loginBtn.addEventListener("click", handleLogin);

    const registerForm = document.getElementById("register-section");
    const loginForm = document.getElementById("login-section");
    if (registerForm) registerForm.addEventListener("keypress", (e) => { if (e.key === "Enter") handleRegister(); });
    if (loginForm) loginForm.addEventListener("keypress", (e) => { if (e.key === "Enter") handleLogin(); });
  }

  // ── Auth Handlers ──
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        currentUser = data.user;
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        currentUser = data.user;
        loadDashboard(data.user.role);
      } else {
        parkingView.showError("login", data.message || "Login failed");
      }
    } catch (error) {
      parkingView.showError("login", "Network error. Please try again.");
      console.error("Login error:", error);
    }
  }

  // ── Dashboard ──
  async function loadDashboard(role) {
    // Stop any running live-update interval
    stopLiveUpdate();
    
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }

    let endpoint = "";
    switch (role) {
      case "Driver": endpoint = "/dashboard/driver"; break;
      case "GarageHost": endpoint = "/dashboard/garage-host"; break;
      case "Admin": endpoint = "/dashboard/admin"; break;
      default: parkingView.showError("auth", "Invalid role"); return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();

        if (role === "GarageHost") {
          // Hub: no spaces needed at this level
          parkingView.renderGarageHostDashboard(data);
          setupGarageHostListeners();
        } else if (role === "Driver") {
          let waitlistEntries = [];
          let weatherHtml = "";
          try {
            const [wRes, weatherRes] = await Promise.all([
              fetch(`${API_BASE_URL}/waitlist/my`, {
                headers: { "Authorization": `Bearer ${token}` }
              }),
              fetch(`${API_BASE_URL}/weather/alerts`, {
                headers: { "Authorization": `Bearer ${token}` }
              })
            ]);
            
            if (wRes.ok) waitlistEntries = await wRes.json();
            if (weatherRes.ok) {
              const alerts = await weatherRes.json();
              weatherHtml = parkingView.renderWeatherAlerts(alerts);
            }
          } catch (e) { console.error("Weather fetch error:", e); }
          
          parkingView.renderDriverDashboard(data, waitlistEntries);
          if (weatherHtml) {
            const header = document.querySelector('.dashboard-header');
            if (header) header.insertAdjacentHTML('afterend', weatherHtml);
          }
          setupDriverDashboardListeners();
          setupWaitlistActions();
        } else if (role === "Admin") {
          parkingView.renderAdminDashboard(data);
          setupAdminDashboardListeners();
        }

        setupLogoutButton();
        setupBackToDashboardListener();
        setupMyBookingsButton();
        setupMonthlyPassesButton();
        setupRatingsButton();
        setupPanicLogsButton();
        setupWaitlistActions();
      } else if (response.status === 401) {
        logout();
      } else if (response.status === 403) {
        parkingView.showError("auth", "Unauthorized - invalid role");
        logout();
      }
    } catch (error) {
      console.error("Dashboard load error:", error);
    }
  }

  function setupLogoutButton() {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
  }

  function setupBackToDashboardListener() {
    const viewGaragesBtn = document.getElementById("view-garages-btn");
    if (viewGaragesBtn) viewGaragesBtn.addEventListener("click", loadGarageListing);

    const backIds = ["back-to-dashboard-btn", "back-to-hub"];
    backIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          const role = currentUser?.role || JSON.parse(localStorage.getItem("user"))?.role;
          if (role) {
            loadDashboard(role);
          } else {
            showAuthPage();
          }
        });
      }
    });
  }

  function setupMyBookingsButton() {
    const btn = document.getElementById("my-bookings-btn");
    if (btn) btn.addEventListener("click", loadMyBookings);
  }

  function setupMonthlyPassesButton() {
    const btn = document.getElementById("monthly-passes-btn");
    if (btn) btn.addEventListener("click", loadSubscriptionPasses);
  }

  // ── FR-21: Ratings Button ──
  function setupRatingsButton() {
    const btn = document.getElementById("my-ratings-btn");
    if (btn) btn.addEventListener("click", loadMyRatings);
  }

  // ── FR-22: Panic Logs Button (Admin) ──
  function setupPanicLogsButton() {
    const btn = document.getElementById("panic-logs-btn");
    if (btn) btn.addEventListener("click", loadPanicLogs);
  }

  async function loadSubscriptionPasses() {
    // Stop any running live-update interval
    stopLiveUpdate();
    
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/my`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        parkingView.renderSubscriptionPasses(data);
        setupBackToDashboardListener();
        const purchaseBtn = document.getElementById("purchase-pass-btn");
        if (purchaseBtn) purchaseBtn.addEventListener("click", handlePurchasePass);
        
        // Add event listeners for cancel buttons
        document.querySelectorAll(".cancel-subscription-btn").forEach(btn => {
          btn.addEventListener("click", handleCancelSubscription);
        });
      } else if (response.status === 401) {
        logout();
      }
    } catch (e) { console.error(e); }
  }

  async function handlePurchasePass() {
    const token = localStorage.getItem("token");
    const msgEl = document.getElementById("subscription-status-msg");
    if (msgEl) msgEl.innerHTML = "<span style='color: #007bff'>Processing payment...</span>";

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/purchase`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (response.ok) {
        if (msgEl) msgEl.innerHTML = "<span style='color: #28a745'>Purchase successful! Enjoy your pass.</span>";
        setTimeout(() => loadSubscriptionPasses(), 1500);
      } else {
        if (msgEl) msgEl.innerHTML = `<span style='color: #dc3545'>Error: ${data.message}</span>`;
      }
    } catch (e) {
      if (msgEl) msgEl.innerHTML = "<span style='color: #dc3545'>Network error.</span>";
    }
  }

  async function handleCancelSubscription(event) {
    const subscriptionId = event.target.getAttribute("data-subscription-id");
    const token = localStorage.getItem("token");
    const msgEl = document.getElementById("subscription-status-msg");
    
    if (!confirm("Are you sure you want to cancel this subscription?")) {
      return;
    }

    if (msgEl) msgEl.innerHTML = "<span style='color: #007bff'>Cancelling subscription...</span>";

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}/cancel`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (response.ok) {
        if (msgEl) msgEl.innerHTML = "<span style='color: #28a745'>Subscription cancelled successfully.</span>";
        setTimeout(() => loadSubscriptionPasses(), 1500);
      } else {
        if (msgEl) msgEl.innerHTML = `<span style='color: #dc3545'>Error: ${data.message}</span>`;
      }
    } catch (e) {
      if (msgEl) msgEl.innerHTML = "<span style='color: #dc3545'>Network error.</span>";
    }
  }

  function setupWaitlistActions() {
    document.querySelectorAll(".btn-dismiss-waitlist").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const token = localStorage.getItem("token");
        try {
          await fetch(`${API_BASE_URL}/waitlist/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          loadDashboard(currentUser.role);
        } catch (e) { console.error(e); }
      });
    });

    document.querySelectorAll(".btn-book-from-waitlist").forEach(btn => {
      btn.addEventListener("click", () => {
        const spaceId = btn.dataset.spaceId;
        handleBookNow(spaceId);
      });
    });
  }

  let liveUpdateInterval = null;

  // ── Stop any running garage-listing live-update interval ──
  function stopLiveUpdate() {
    if (liveUpdateInterval) {
      clearInterval(liveUpdateInterval);
      liveUpdateInterval = null;
    }
  }

  async function loadGarageListing() {
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }

    // Clear any existing interval
    stopLiveUpdate();

    // Helper to fetch and render
    const fetchAndRender = async (lat = null, lng = null) => {
      try {
        // ALWAYS fetch ALL spaces for the main listing grid
        const allRes = await fetch(`${API_BASE_URL}/garage-spaces/all`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` }
        });

        let allSpaces = [];
        if (allRes.ok) {
          allSpaces = await allRes.json();
          // Correct image paths for all spaces
          const backendUrl = API_BASE_URL.replace("/api", "");
          allSpaces = allSpaces.map(s => ({
            ...s,
            images: (s.images || []).map(img => {
              if (!img) return img;
              // Already an absolute URL (http/https) — leave as-is
              if (img.startsWith("http://") || img.startsWith("https://")) return img;
              // Relative path with leading slash (e.g. /uploads/dish.png)
              if (img.startsWith("/")) return `${backendUrl}${img}`;
              // Bare filename (e.g. dish.png) — treat as /uploads/<filename>
              return `${backendUrl}/uploads/${img}`;
            })
          }));
        }

        // Initialize mapSpaces with allSpaces as fallback
        let mapSpaces = allSpaces;

        // If coordinates available, fetch NEARBY spaces specifically for the map
        if (lat && lng) {
          try {
            const nearbyRes = await fetch(`${API_BASE_URL}/garages/nearby?lat=${lat}&lng=${lng}`, {
              method: "GET",
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (nearbyRes.ok) {
              const nearbySpaces = await nearbyRes.json();
              // Correct image paths for nearby spaces
              const backendUrl = API_BASE_URL.replace("/api", "");
              mapSpaces = nearbySpaces.map(s => ({
                ...s,
                images: (s.images || []).map(img => {
                  if (!img) return img;
                  if (img.startsWith("http://") || img.startsWith("https://")) return img;
                  if (img.startsWith("/")) return `${backendUrl}${img}`;
                  return `${backendUrl}/uploads/${img}`;
                })
              }));
            }
          } catch (e) {
            console.error("Nearby fetch error:", e);
          }
        }

        // 1. Render the main list with ALL spaces
        parkingView.renderGarageListing(allSpaces, currentUser?.role);

        // 2. Setup standard UI listeners
        setupBackToDashboardListener();
        setupLogoutButton();
        setupBookNowButtons();
        setupFilterBar(allSpaces);
        setupFavoriteToggleButtons();

        // 3. Initialize/Update the Map with MAP spaces (Nearby if available)
        setupMapToggleAndLiveUpdate(mapSpaces, currentUser?.role);
        if (typeof window.setMapToggleData === 'function') {
          window.setMapToggleData(mapSpaces, currentUser?.role);
        }
        initGaragesMap(mapSpaces, currentUser?.role, lat, lng);

        return allSpaces;
      } catch (e) { 
        console.error("Fetch error:", e); 
        parkingView.showError("listing", "Failed to load garage spaces.");
      }
    };

    // Try to get GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          await fetchAndRender(latitude, longitude);
          // Set up live update interval (every 30 seconds)
          liveUpdateInterval = setInterval(() => fetchAndRender(latitude, longitude), 30000);
        },
        async () => {
          // Fallback if denied
          await fetchAndRender();
          liveUpdateInterval = setInterval(() => fetchAndRender(), 30000);
        }
      );
    } else {
      await fetchAndRender();
      liveUpdateInterval = setInterval(() => fetchAndRender(), 30000);
    }
  }

  // ── Filter Bar Setup (FR-5) ──
  function setupFilterBar(spaces) {
    const applyBtn = document.getElementById("apply-filters-btn");
    const clearBtn = document.getElementById("clear-filters-btn");
    const vehicleTypeSelect = document.getElementById("filter-vehicle-type");
    const minPriceInput = document.getElementById("filter-min-price");
    const maxPriceInput = document.getElementById("filter-max-price");

    if (!applyBtn || !clearBtn) return;

    applyBtn.addEventListener("click", () => {
      const vehicleType = vehicleTypeSelect?.value || "";
      const minPrice = minPriceInput?.value || "";
      const maxPrice = maxPriceInput?.value || "";
      parkingView.filterAndRenderGarages(vehicleType, minPrice, maxPrice, currentUser?.role);
      if (currentUser?.role === "Driver") setupBackToDashboardListener();
      else if (currentUser?.role === "Admin") setupBackToDashboardListener();
      setTimeout(() => setupFilterBar(spaces), 150);
    });

    clearBtn.addEventListener("click", () => {
      if (vehicleTypeSelect) vehicleTypeSelect.value = "";
      if (minPriceInput) minPriceInput.value = "";
      if (maxPriceInput) maxPriceInput.value = "";
      parkingView.renderGarageListing(spaces, currentUser?.role);
      if (currentUser?.role === "Driver") setupBackToDashboardListener();
      else if (currentUser?.role === "Admin") setupBackToDashboardListener();
      setTimeout(() => setupFilterBar(spaces), 150);
    });
  }

  // ── Map Toggle & Live Update Setup (FR-4) ──
  function setupMapToggleAndLiveUpdate(spaces, userRole) {
    const refreshBtn = document.getElementById("refresh-map-btn");

    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        refreshBtn.disabled = true;
        refreshBtn.textContent = "🔄 Updating...";
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`${API_BASE_URL}/garage-spaces/all`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            let updatedSpaces = await res.json();
            
            // Fix image paths
            const backendUrl = API_BASE_URL.replace("/api", "");
            updatedSpaces = updatedSpaces.map(s => ({
              ...s,
              images: (s.images || []).map(img => img.startsWith("/") ? `${backendUrl}${img}` : img)
            }));

            if (typeof window.setMapToggleData === 'function') window.setMapToggleData(updatedSpaces, userRole);
            
            // Re-init map with current view's location if available
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => initGaragesMap(updatedSpaces, userRole, pos.coords.latitude, pos.coords.longitude),
                () => initGaragesMap(updatedSpaces, userRole)
              );
            } else {
              initGaragesMap(updatedSpaces, userRole);
            }

            refreshBtn.textContent = "✅ Updated";
            setTimeout(() => { refreshBtn.textContent = "🔄 Live Update"; refreshBtn.disabled = false; }, 2000);
          }
        } catch (error) {
          console.error("Error refreshing map data:", error);
          refreshBtn.textContent = "❌ Error";
          setTimeout(() => { refreshBtn.textContent = "🔄 Live Update"; refreshBtn.disabled = false; }, 2000);
        }
      });
    }
  }

  function setupFavoriteToggleButtons() {
    document.querySelectorAll(".btn-toggle-favorite").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const garageId = btn.dataset.id;
        await handleToggleFavorite(garageId);
        // Toggle icon state
        if (btn.innerText === "❤️") {
          btn.innerText = "🖤";
          btn.title = "Removed from Favorites";
        } else {
          btn.innerText = "❤️";
          btn.title = "Added to Favorites";
        }
      });
    });
  }

  function logout() {
    // Stop any running live-update interval
    stopLiveUpdate();
    
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    currentUser = null;
    showAuthPage();
  }

  // ── Map Integration (FR-4) ──
  function initGaragesMap(spaces, userRole, userLat = null, userLng = null) {
    const mapContainer = document.getElementById("garages-map");
    if (!mapContainer) return;
    mapContainer.innerHTML = '';
    if (googleMapsLoaded && google && google.maps) {
      initGoogleMaps(spaces, userRole, mapContainer, userLat, userLng);
    } else {
      initLeafletMap(spaces, userRole, mapContainer, userLat, userLng);
    }
  }

  function initGoogleMaps(spaces, userRole, mapContainer, userLat, userLng) {
    const dhaka = { lat: 23.8103, lng: 90.4125 };
    const center = (userLat && userLng) ? { lat: userLat, lng: userLng } : dhaka;
    const map = new google.maps.Map(mapContainer, {
      zoom: 14, center: center, mapTypeControl: false, streetViewControl: false, fullscreenControl: true
    });
    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    // User location marker
    if (userLat && userLng) {
      new google.maps.Marker({
        position: center, map, title: "You are here",
        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 6, fillColor: '#4285F4', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }
      });
      bounds.extend(center);
    }

    spaces.forEach(s => {
      if (s.location && s.location.lat && s.location.lng) {
        const lat = parseFloat(s.location.lat);
        const lng = parseFloat(s.location.lng);
        const position = { lat, lng };
        hasMarkers = true;
        bounds.extend(position);

        const hours = s.availableHours ? `${s.availableHours.start} - ${s.availableHours.end}` : "Not specified";
        const isAvailable = s.status === "Open";
        const navLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        const btnHtml = userRole === "Driver"
          ? `<button class="btn-book-now-map" data-space-id="${s._id}" style="margin-top: 8px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">📅 Book Now</button>`
          : '';

        const contentString = `
          <div style="min-width: 200px; padding: 10px;">
            <strong style="font-size: 16px;">৳${s.price}/hour</strong>
            <span style="color: ${isAvailable ? '#28a745' : '#dc3545'}; font-size: 12px; margin-left: 8px;">● ${isAvailable ? 'Available' : 'Booked'}</span><br/>
            ${s.location.address ? `<div style="margin: 8px 0; color: #555;">${s.location.address}</div>` : ''}
            <div style="font-size: 12px; color: #777;">Hours: ${hours}</div>
            <a href="${navLink}" target="_blank" style="display: inline-block; margin-top: 8px; padding: 8px 16px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px; font-size: 13px; width: 100%; text-align: center; box-sizing: border-box;">📍 Navigate</a>
            ${btnHtml}
          </div>
        `;

        const infoWindow = new google.maps.InfoWindow({ content: contentString });
        const marker = new google.maps.Marker({
          position, map, title: `৳${s.price}/hour`, 
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: isAvailable ? '#28a745' : '#dc3545', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }
        });
        marker.addListener("click", () => {
          infoWindow.open(map, marker);
          setTimeout(() => {
            const btn = document.querySelector(`.btn-book-now-map[data-space-id="${s._id}"]`);
            if (btn) btn.addEventListener("click", () => handleBookNow(s._id));
          }, 100);
        });
      }
    });

    if (hasMarkers) map.fitBounds(bounds, { padding: 50 });
  }

  let leafletMap = null;

  function initLeafletMap(spaces, userRole, mapContainer, userLat, userLng) {
    const mapDiv = document.getElementById("garages-map");
    if (!mapDiv) return;

    // ── Force Leaflet CSS injection to ensure alignment ──
    if (!document.getElementById("leaflet-css-fix")) {
      const link = document.createElement("link");
      link.id = "leaflet-css-fix";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // ── Force Container Height ──
    mapDiv.style.height = "400px";
    mapDiv.style.width = "100%";

    if (leafletMap) {
      leafletMap.remove();
      leafletMap = null;
      window.leafletMapInstance = null;
    }
    mapDiv.innerHTML = "";

    // No inner delay needed — toggleMap already waits 550ms for the CSS
    // max-height transition to complete before calling this function.
    const dhakaLat = 23.8103, dhakaLng = 90.4125;
    const lat = (userLat && !isNaN(userLat)) ? parseFloat(userLat) : dhakaLat;
    const lng = (userLng && !isNaN(userLng)) ? parseFloat(userLng) : dhakaLng;
    const center = [lat, lng];

    leafletMap = L.map("garages-map", {
      worldCopyJump: false,
      zoomControl: true,
      maxBounds: [[20.738, 88.007], [26.634, 92.673]], // Bangladesh bounds
      minZoom: 7,
      maxBoundsViscosity: 1.0
    }).setView(center, 12);

    // Expose globally so toggleMap's extra invalidateSize can reach it
    window.leafletMapInstance = leafletMap;

    // ── Use CartoDB Tiles ──
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '©OpenStreetMap ©CartoDB',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(leafletMap);

    let hasMarkers = false;
    const markerLatLngs = []; // collect all points so bounds is always valid

    // User location marker
    if (userLat && userLng) {
      L.circleMarker(center, { radius: 8, fillColor: "#4285F4", color: "#fff", weight: 2, fillOpacity: 1 })
        .addTo(leafletMap).bindPopup("You are here");
      markerLatLngs.push(center);
    }

    const availableIcon = L.divIcon({ className: 'custom-marker available-marker', html: '<div class="marker-pin available"></div>', iconSize: [30, 42], iconAnchor: [15, 42], popupAnchor: [0, -35] });
    const bookedIcon   = L.divIcon({ className: 'custom-marker booked-marker',   html: '<div class="marker-pin booked"></div>',   iconSize: [30, 42], iconAnchor: [15, 42], popupAnchor: [0, -35] });

    spaces.forEach(s => {
      if (s.location && s.location.lat && s.location.lng) {
        const sLat = parseFloat(s.location.lat);
        const sLng = parseFloat(s.location.lng);
        if (isNaN(sLat) || isNaN(sLng)) return;

        hasMarkers = true;
        markerLatLngs.push([sLat, sLng]);

        const hours = s.availableHours ? `${s.availableHours.start} - ${s.availableHours.end}` : "Not specified";
        const isAvailable = s.status === "Open";
        const navLink = `https://www.google.com/maps/dir/?api=1&destination=${sLat},${sLng}`;
        const btnHtml = userRole === "Driver"
          ? `<button class="btn-book-now-map" data-space-id="${s._id}" style="margin-top: 5px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">📅 Book Now</button>`
          : '';

        const popupContent = `
          <div style="min-width: 180px; padding: 5px;">
            <strong style="font-size: 15px;">৳${s.price}/hour</strong>
            <span style="color: ${isAvailable ? '#28a745' : '#dc3545'}; font-size: 12px; margin-left: 5px;">● ${isAvailable ? 'Available' : 'Booked'}</span><br/>
            <div style="margin: 5px 0; font-size: 13px; color: #666;">${s.location.address || "No address"}</div>
            <small>Hours: ${hours}</small><br/>
            <div style="display: flex; gap: 5px; margin-top: 8px;">
              <a href="${navLink}" target="_blank" style="flex: 1; padding: 6px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px; font-size: 11px; text-align: center;">📍 Route</a>
              ${btnHtml ? `<div style="flex: 1;">${btnHtml}</div>` : ''}
            </div>
        `;

        const marker = L.marker([sLat, sLng], { icon: isAvailable ? availableIcon : bookedIcon }).addTo(leafletMap);
        marker.bindPopup(popupContent);
        marker.on('popupopen', () => {
          const btn = document.querySelector(`.btn-book-now-map[data-space-id="${s._id}"]`);
          if (btn) btn.addEventListener("click", () => handleBookNow(s._id));
        });
      }
    });

    // ── Apply initial view ──
    if (hasMarkers && markerLatLngs.length > 0) {
      leafletMap.fitBounds(L.latLngBounds(markerLatLngs), { padding: [50, 50], maxZoom: 15 });
    } else {
      leafletMap.setView(center, 12);
    }

    // ── Re-invalidate and re-fit after paint so zoom is correct ──
    const refitBounds = () => {
      if (!leafletMap) return;
      leafletMap.invalidateSize();
      if (hasMarkers && markerLatLngs.length > 0) {
        leafletMap.fitBounds(L.latLngBounds(markerLatLngs), { padding: [50, 50], maxZoom: 15 });
      }
    };
    setTimeout(refitBounds, 100);
    setTimeout(refitBounds, 350);
    setTimeout(() => { if (leafletMap) leafletMap.invalidateSize(); }, 700);
  }

  // ── Location Picker Map for Garage Host (FR-4) ──
  function initLocationPicker() {
    const mapContainer = document.getElementById("location-picker-map");
    if (!mapContainer) return;
    mapContainer.innerHTML = '';
    const dhaka = { lat: 23.8103, lng: 90.4125 };

    if (googleMapsLoaded && google && google.maps) {
      const map = new google.maps.Map(mapContainer, {
        zoom: 13, center: dhaka, mapTypeControl: false, streetViewControl: false, fullscreenControl: false
      });
      let marker = null;
      map.addListener("click", (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        if (marker) marker.setMap(null);
        marker = new google.maps.Marker({ position: event.latLng, map, draggable: true, animation: google.maps.Animation.DROP });
        document.getElementById("space-lat").value = lat.toFixed(6);
        document.getElementById("space-lng").value = lng.toFixed(6);
        const selectedDiv = document.getElementById("selected-location");
        const coordsSpan = document.getElementById("selected-coords");
        if (selectedDiv && coordsSpan) { selectedDiv.style.display = "block"; coordsSpan.textContent = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`; }
        marker.addListener("dragend", () => {
          const newLat = marker.getPosition().lat();
          const newLng = marker.getPosition().lng();
          document.getElementById("space-lat").value = newLat.toFixed(6);
          document.getElementById("space-lng").value = newLng.toFixed(6);
          if (coordsSpan) coordsSpan.textContent = `Lat: ${newLat.toFixed(6)}, Lng: ${newLng.toFixed(6)}`;
        });
      });
    } else {
      setTimeout(() => {
        const map = L.map("location-picker-map").setView([dhaka.lat, dhaka.lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
        setTimeout(() => map.invalidateSize(), 100);
        let marker = null;
        map.on("click", function (e) {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          if (marker) map.removeLayer(marker);
          marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          document.getElementById("space-lat").value = lat.toFixed(6);
          document.getElementById("space-lng").value = lng.toFixed(6);
          const selectedDiv = document.getElementById("selected-location");
          const coordsSpan = document.getElementById("selected-coords");
          if (selectedDiv && coordsSpan) { selectedDiv.style.display = "block"; coordsSpan.textContent = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`; }
          marker.on("dragend", function () {
            const newLat = marker.getLatLng().lat;
            const newLng = marker.getLatLng().lng;
            document.getElementById("space-lat").value = newLat.toFixed(6);
            document.getElementById("space-lng").value = newLng.toFixed(6);
            if (coordsSpan) coordsSpan.textContent = `Lat: ${newLat.toFixed(6)}, Lng: ${newLng.toFixed(6)}`;
          });
        });
      }, 100);
    }
  }

  // ── Garage Host Helpers ──
  async function loadAddGarageSpaceForm() {
    // Stop any running live-update interval so it doesn't overwrite this page
    stopLiveUpdate();
    // FR-20: Check NID requirement for hosts
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/users/nid-status`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.isNidVerified) {
          alert("NID Verification Required: You must verify your identity before listing a garage space.");
          loadNidVerification();
          return;
        }
      }
    } catch (err) { console.error("NID check failed:", err); }

    parkingView.renderAddGarageSpaceForm();
    const addBtn = document.getElementById("add-space-btn");
    if (addBtn) addBtn.addEventListener("click", handleAddSpace);
    
    const backBtn = document.getElementById("back-to-dashboard-btn");
    if (backBtn) backBtn.addEventListener("click", () => loadDashboard(currentUser.role));
    
    setupLogoutButton();
    setTimeout(() => { if (typeof initLocationPicker === 'function') initLocationPicker(); }, 100);
  }

  function setupGarageHostListeners() {
    // ── Hub nav cards ──
    const navMap = {
      "host-nav-my-garages":   loadHostManageSpaces,
      "host-nav-add-garage":   loadAddGarageSpaceForm,
      "host-nav-statistics":   loadHostStats,
      "host-nav-notifications":loadHostNotifications,
      "host-nav-weather-alerts": loadWeatherAlerts,
      "host-nav-ratings":      loadMyRatings,
      "host-nav-browse":       loadGarageListing,
      "host-nav-earnings":     loadHostEarnings,
      "host-nav-nid":          loadNidVerification
    };
    for (const [id, handler] of Object.entries(navMap)) {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click", handler);
    }

    // Global delegate for edit/delete/toggle (added once)
    if (!hostListenerAdded) {
      document.addEventListener("click", (e) => {
        if (e.target.matches(".edit-space-btn"))   handleEditSpace(e.target.dataset.id);
        if (e.target.matches(".delete-space-btn")) handleDeleteSpace(e.target.dataset.id);
        if (e.target.matches(".btn-mark-read"))    handleMarkNotificationAsRead(e.target.dataset.id);
      });
      document.addEventListener("change", async (e) => {
        if (e.target.matches(".toggle-availability")) handleToggleAvailability(e.target);
      });
      hostListenerAdded = true;
    }
  }

  // ── Host: My Garages page ──
  async function loadHostManageSpaces() {
    stopLiveUpdate();
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/garage-spaces`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const spaces = res.ok ? await res.json() : [];
      currentSpaces = spaces;
      parkingView.renderHostManageSpaces(spaces);
      setupBackToDashboardListener();
      setupLogoutButton();
      // re-attach edit/delete since we replaced innerHTML
    } catch (err) { console.error(err); }
  }

  // ── Host: Statistics page ──
  async function loadHostStats() {
    stopLiveUpdate();
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/garage-host`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        parkingView.renderHostStats(data);
        setupBackToDashboardListener();
        setupLogoutButton();
      }
    } catch (err) { console.error(err); }
  }

  // ── Host: Notifications page ──
  async function loadHostNotifications() {
    stopLiveUpdate();
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const notifications = res.ok ? await res.json() : [];
      parkingView.renderHostNotifications(notifications);
      setupBackToDashboardListener();
      setupLogoutButton();
    } catch (err) { console.error(err); }
  }

  async function loadNotifications() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) { const notifications = await res.json(); parkingView.renderNotifications(notifications); }
    } catch (err) { console.error("Error loading notifications:", err); }
  }

  async function loadWeatherAlerts() {
    stopLiveUpdate();
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/weather/alerts`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const alerts = res.ok ? await res.json() : [];
      parkingView.renderWeatherAlertsPage(alerts, currentUser?.role || "Driver");
      setupBackToDashboardListener();
      setupLogoutButton();
    } catch (err) {
      console.error("Error loading weather alerts:", err);
      parkingView.renderWeatherAlertsPage([], currentUser?.role || "Driver");
      setupBackToDashboardListener();
      setupLogoutButton();
    }
  }

  async function loadAdminWeatherAlerts() {
    stopLiveUpdate();
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/weather/alerts`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const alerts = res.ok ? await res.json() : [];
      parkingView.renderAdminWeatherAlerts(alerts);
      setupBackToDashboardListener();
      setupLogoutButton();
      document.getElementById("create-weather-alert-btn")?.addEventListener("click", handleCreateWeatherAlert);
      document.querySelectorAll(".btn-deactivate-weather-alert").forEach(btn => btn.addEventListener("click", () => handleDeactivateWeatherAlert(btn.dataset.id)));
    } catch (err) {
      console.error("Error loading admin weather alerts:", err);
      parkingView.renderAdminWeatherAlerts([]);
      setupBackToDashboardListener();
      setupLogoutButton();
    }
  }

  async function handleCreateWeatherAlert() {
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }

    const title = document.getElementById("alert-title")?.value.trim();
    const description = document.getElementById("alert-description")?.value.trim();
    const area = document.getElementById("alert-area")?.value.trim();
    const severity = document.getElementById("alert-severity")?.value;
    const type = document.getElementById("alert-type")?.value;
    const errorEl = document.getElementById("alert-form-error");
    if (errorEl) errorEl.textContent = "";

    if (!title || !description || !area || !severity || !type) {
      if (errorEl) errorEl.textContent = "All alert fields are required.";
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/weather/alerts`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, description, area, severity, type })
      });
      if (res.ok) {
        await loadAdminWeatherAlerts();
      } else {
        const data = await res.json();
        if (errorEl) errorEl.textContent = data.message || "Could not create alert.";
      }
    } catch (err) {
      console.error("Error creating weather alert:", err);
      if (errorEl) errorEl.textContent = "Network error while creating alert.";
    }
  }

  async function handleDeactivateWeatherAlert(alertId) {
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/weather/alerts/${alertId}/deactivate`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      if (res.ok) {
        await loadAdminWeatherAlerts();
      }
    } catch (err) {
      console.error("Error deactivating weather alert:", err);
    }
  }

  async function handleToggleAvailability(checkbox) {
    const spaceId = checkbox.dataset.id;
    const newStatus = checkbox.checked ? "Open" : "Closed";
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/garage-spaces/${spaceId}/toggle`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updatedSpace = await res.json();
        const label = checkbox.closest('td').querySelector('.status-label');
        if (label) { label.textContent = updatedSpace.status; label.className = `status-label status-${updatedSpace.status}`; }
      } else { checkbox.checked = !checkbox.checked; alert("Failed to update status"); }
    } catch (err) { console.error(err); checkbox.checked = !checkbox.checked; }
  }

  async function handleMarkNotificationAsRead(id) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: "PUT", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) loadNotifications();
    } catch (err) { console.error(err); }
  }

  async function handleAddSpace() {
    const token = localStorage.getItem("token");
    const fileInput = document.getElementById("space-images");
    const urlInput = document.getElementById("space-image-urls");
    const price = parseFloat(document.getElementById("space-price").value);
    const typesRaw = document.getElementById("space-vehicle-types").value;
    const lat = document.getElementById("space-lat")?.value;
    const lng = document.getElementById("space-lng")?.value;
    const address = document.getElementById("space-address")?.value;
    const start = document.getElementById("space-hour-start").value;
    const end = document.getElementById("space-hour-end").value;

    const errorEl = document.getElementById("space-error");
    if (errorEl) errorEl.textContent = "";
    if (isNaN(price)) { if (errorEl) errorEl.textContent = "Valid price is required"; return; }

    const vehicleTypes = typesRaw.split(",").map(s => s.trim()).filter(Boolean);
    const files = fileInput?.files;
    const hasFiles = files && files.length > 0;
    const urlValue = urlInput?.value?.trim() || "";
    const hasUrls = urlValue.length > 0;

    try {
      let res;
      if (hasFiles) {
        const formData = new FormData();
        formData.append("price", price);
        formData.append("vehicleTypes", vehicleTypes.join(","));
        formData.append("availableHours", JSON.stringify({ start, end }));
        const locPayload = {};
        if (lat) locPayload.lat = parseFloat(lat);
        if (lng) locPayload.lng = parseFloat(lng);
        if (address) locPayload.address = address;
        formData.append("location", JSON.stringify(locPayload));
        for (let i = 0; i < files.length; i++) formData.append("images", files[i]);
        res = await fetch(`${API_BASE_URL}/garage-spaces`, { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData });
      } else if (hasUrls) {
        const images = urlValue.split(",").map(s => s.trim()).filter(Boolean);
        // Validate image URLs
        const invalidUrls = images.filter(url => {
          try {
            const parsed = new URL(url);
            return !/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(parsed.pathname) && !parsed.hostname.includes('i.imgur.com');
          } catch {
            return true;
          }
        });
        if (invalidUrls.length > 0) {
          if (errorEl) errorEl.textContent = "Invalid image URLs. Please use direct image links ending with .jpg, .png, etc., or from i.imgur.com";
          return;
        }
        res = await fetch(`${API_BASE_URL}/garage-spaces`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ images, price, vehicleTypes, availableHours: { start, end }, location: { lat: lat ? parseFloat(lat) : null, lng: lng ? parseFloat(lng) : null, address } })
        });
      } else {
        res = await fetch(`${API_BASE_URL}/garage-spaces`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ images: [], price, vehicleTypes, availableHours: { start, end }, location: { lat: lat ? parseFloat(lat) : null, lng: lng ? parseFloat(lng) : null, address } })
        });
      }
      const data = await res.json();
      if (res.ok) {
        if (fileInput) fileInput.value = "";
        if (urlInput) urlInput.value = "";
        document.getElementById("space-price").value = "";
        document.getElementById("space-vehicle-types").value = "";
        const latEl = document.getElementById("space-lat"); if (latEl) latEl.value = "";
        const lngEl = document.getElementById("space-lng"); if (lngEl) lngEl.value = "";
        const addrEl = document.getElementById("space-address"); if (addrEl) addrEl.value = "";
        document.getElementById("space-hour-start").value = "";
        document.getElementById("space-hour-end").value = "";
        loadDashboard(currentUser.role);
      } else {
        if (errorEl) errorEl.textContent = data.message || "Failed to add space";
      }
    } catch (err) { console.error("Add space error", err); if (errorEl) errorEl.textContent = "Network error"; }
  }

  async function handleEditSpace(id) {
    const space = currentSpaces.find(s => s._id === id);
    if (!space) return;
    const newPrice = prompt("New price:", space.price);
    if (newPrice === null) return;
    const newTypes = prompt("Vehicle types (comma separated):", (space.vehicleTypes || []).join(", "));
    const newStart = prompt("Available hour start:", space.availableHours?.start || "");
    const newEnd = prompt("Available hour end:", space.availableHours?.end || "");
    const newAddress = prompt("Address / Location Name:", space.location?.address || "");
    const newLat = prompt("Latitude (e.g. 23.8103):", space.location?.lat || "");
    const newLng = prompt("Longitude (e.g. 90.4125):", space.location?.lng || "");

    const body = {};
    if (newPrice !== null) body.price = parseFloat(newPrice);
    if (newTypes !== null) body.vehicleTypes = newTypes.split(",").map(s => s.trim()).filter(Boolean);
    if (newStart !== null && newEnd !== null) body.availableHours = { start: newStart, end: newEnd };
    if (newAddress !== null || newLat !== null || newLng !== null) {
      body.location = {
        address: newAddress !== null ? newAddress : space.location?.address,
        lat: newLat ? parseFloat(newLat) : space.location?.lat,
        lng: newLng ? parseFloat(newLng) : space.location?.lng
      };
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/garage-spaces/${id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) loadDashboard(currentUser.role);
      else { const data = await res.json(); alert(data.message || "Failed to update"); }
    } catch (err) { console.error("Edit space error", err); alert("Network error"); }
  }

  async function handleDeleteSpace(id) {
    if (!confirm("Are you sure you want to delete this space?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/garage-spaces/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) loadDashboard(currentUser.role);
      else { const data = await res.json(); alert(data.message || "Failed to delete"); }
    } catch (err) { console.error("Delete space error", err); alert("Network error"); }
  }

  // ── Booking Handlers (FR-7) ──
  function setupBookNowButtons() {
    document.querySelectorAll(".btn-book-now").forEach(btn => {
      btn.addEventListener("click", () => handleBookNow(btn.dataset.spaceId));
    });
  }

  async function handleBookNow(spaceId) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/garage-spaces/all`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      if (!res.ok) return;
      const allSpaces = await res.json();
      const space = allSpaces.find(s => s._id === spaceId);
      if (!space) { alert("Garage space not found"); return; }
      parkingView.renderBookingForm(space);
      setupBookingFormListeners(space);
    } catch (err) { console.error("Error fetching space for booking:", err); }
  }

  function setupBookingFormListeners(space) {
    const closeBtn = document.getElementById("booking-modal-close");
    const overlay = document.getElementById("booking-modal-overlay");
    if (closeBtn) closeBtn.addEventListener("click", () => overlay.remove());
    if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    const pills = document.querySelectorAll(".booking-modal .duration-pill");
    const priceAmountEl = document.getElementById("price-amount");
    const multipliers = { hourly: 1, "half-day": 5, "full-day": 9 };
    let selectedDuration = "hourly";

    pills.forEach(pill => {
      pill.addEventListener("click", () => {
        pills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        selectedDuration = pill.dataset.duration;
        if (priceAmountEl) priceAmountEl.textContent = `৳${space.price * multipliers[selectedDuration]}`;
      });
    });

    const confirmBtn = document.getElementById("confirm-booking-btn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", async () => {
        const date = document.getElementById("booking-date")?.value;
        const startTime = document.getElementById("booking-start-time")?.value;
        const errorEl = document.getElementById("booking-error");
        const successEl = document.getElementById("booking-success");
        const waitlistBtn = document.getElementById("join-waitlist-btn");

        if (errorEl) { errorEl.style.display = "none"; errorEl.textContent = ""; }
        if (successEl) { successEl.style.display = "none"; successEl.textContent = ""; }

        if (!date || !startTime) {
          if (errorEl) { errorEl.textContent = "Please select a date and time"; errorEl.style.display = "block"; }
          return;
        }

        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE_URL}/bookings`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ garageSpaceId: space._id, date, startTime, duration: selectedDuration })
          });
          const data = await res.json();

          if (res.ok) {
            if (successEl) { successEl.textContent = "✅ Booking confirmed! Redirecting to payment..."; successEl.style.display = "block"; }
            confirmBtn.disabled = true;
            confirmBtn.textContent = "Confirmed!";
            
            setTimeout(() => {
              if (overlay) overlay.remove();
              // Show payment modal immediately
              parkingView.renderPaymentModal(data._id, data.totalPrice);
              setupPaymentModalListeners(data._id, data.totalPrice);
            }, 1500);
          } else if (res.status === 409) {
            if (errorEl) { errorEl.textContent = data.message; errorEl.style.display = "block"; }
            if (waitlistBtn) {
              waitlistBtn.style.display = "inline-block";
              waitlistBtn.onclick = async () => {
                try {
                  const wRes = await fetch(`${API_BASE_URL}/waitlist`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ garageSpaceId: space._id, date })
                  });
                  const wData = await wRes.json();
                  if (wRes.ok) {
                    if (successEl) { successEl.textContent = "✅ Added to waitlist! You'll be notified when a space opens."; successEl.style.display = "block"; }
                    waitlistBtn.disabled = true;
                    waitlistBtn.textContent = "On Waitlist";
                  } else {
                    if (errorEl) { errorEl.textContent = wData.message; errorEl.style.display = "block"; }
                  }
                } catch (e) { console.error(e); }
              };
            }
          } else {
            if (errorEl) { errorEl.textContent = data.message || "Booking failed"; errorEl.style.display = "block"; }
          }
        } catch (err) {
          console.error("Booking error:", err);
          if (errorEl) { errorEl.textContent = "Network error"; errorEl.style.display = "block"; }
        }
      });
    }
  }

  // ── My Bookings (FR-7 / FR-8) ──
  async function loadMyBookings() {
    // Stop any running live-update interval
    stopLiveUpdate();
    
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/my`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      if (res.ok) {
        const bookings = await res.json();
        currentBookings = bookings;
        parkingView.renderMyBookings(bookings);
        setupBackToDashboardListener();
        setupBookingActions();
      }
    } catch (err) { console.error("Error loading bookings:", err); }
  }

  function setupBookingActions() {
    document.querySelectorAll(".btn-cancel-booking:not(.disabled)").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;
        const bookingId = btn.dataset.id;
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
          });
          const data = await res.json();
          if (res.ok) {
            alert(data.message + (data.waitlistNotified ? "\nA waitlisted user has been notified." : ""));
            loadMyBookings();
          } else { alert(data.message || "Cannot cancel booking"); }
        } catch (err) { console.error(err); alert("Network error"); }
      });
    });

    document.querySelectorAll(".btn-reschedule-booking:not(.disabled)").forEach(btn => {
      btn.addEventListener("click", () => {
        const bookingId = btn.dataset.id;
        const booking = currentBookings.find(b => b._id === bookingId);
        if (!booking) return;
        parkingView.renderRescheduleModal(booking);
        setupRescheduleModalListeners(booking);
      });
    });

    document.querySelectorAll(".btn-pay-booking").forEach(btn => {
      btn.addEventListener("click", () => {
        const bookingId = btn.dataset.id;
        const amount = btn.dataset.amount;
        parkingView.renderPaymentModal(bookingId, amount);
        setupPaymentModalListeners(bookingId, amount);
      });
    });
  }

  function setupPaymentModalListeners(bookingId, amount) {
    const overlay = document.getElementById("payment-modal-overlay");
    const closeBtn = document.getElementById("payment-modal-close");
    const payBtn = document.getElementById("pay-now-btn");
    const errorEl = document.getElementById("payment-error");
    const successEl = document.getElementById("payment-success");

    if (closeBtn) closeBtn.onclick = () => overlay.remove();
    if (overlay) overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    if (payBtn) {
      payBtn.onclick = async () => {
        const method = document.querySelector('input[name="payment-method"]:checked')?.value;
        if (!method) {
          errorEl.textContent = "Please select a payment method";
          errorEl.style.display = "block";
          return;
        }

        payBtn.disabled = true;
        payBtn.textContent = "Processing...";
        errorEl.style.display = "none";

        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`${API_BASE_URL}/payments/process`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, amount, paymentMethod: method })
          });
          const data = await res.json();
          if (res.ok) {
            successEl.textContent = `Payment Successful via ${method}! Transaction ID: ${data.payment.transactionId}`;
            successEl.style.display = "block";
            setTimeout(() => {
              overlay.remove();
              loadMyBookings();
            }, 2000);
          } else {
            errorEl.textContent = data.message || "Payment failed";
            errorEl.style.display = "block";
            payBtn.disabled = false;
            payBtn.textContent = "Proceed to Pay";
          }
        } catch (err) {
          console.error(err);
          errorEl.textContent = "Network error occurred";
          errorEl.style.display = "block";
          payBtn.disabled = false;
          payBtn.textContent = "Proceed to Pay";
        }
      };
    }
  }

  function setupRescheduleModalListeners(booking) {
    const overlay = document.getElementById("reschedule-modal-overlay");
    const closeBtn = document.getElementById("reschedule-modal-close");
    if (closeBtn) closeBtn.addEventListener("click", () => overlay.remove());
    if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    const pills = overlay.querySelectorAll(".duration-pill");
    let selectedDuration = booking.duration;
    pills.forEach(pill => {
      pill.addEventListener("click", () => {
        pills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        selectedDuration = pill.dataset.duration;
      });
    });

    const confirmBtn = document.getElementById("confirm-reschedule-btn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", async () => {
        const date = document.getElementById("reschedule-date")?.value;
        const startTime = document.getElementById("reschedule-start-time")?.value;
        const errorEl = document.getElementById("reschedule-error");
        const successEl = document.getElementById("reschedule-success");

        if (errorEl) errorEl.style.display = "none";
        if (!date || !startTime) {
          if (errorEl) { errorEl.textContent = "Please fill in all fields"; errorEl.style.display = "block"; }
          return;
        }

        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE_URL}/bookings/${booking._id}/reschedule`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ date, startTime, duration: selectedDuration })
          });
          const data = await res.json();
          if (res.ok) {
            if (successEl) { successEl.textContent = "✅ Booking rescheduled!"; successEl.style.display = "block"; }
            setTimeout(() => { overlay.remove(); loadMyBookings(); }, 1200);
          } else {
            if (errorEl) { errorEl.textContent = data.message || "Reschedule failed"; errorEl.style.display = "block"; }
          }
        } catch (err) {
          console.error(err);
          if (errorEl) { errorEl.textContent = "Network error"; errorEl.style.display = "block"; }
        }
      });
    }
  }

  // ── FR-21: Ratings ──
  async function loadMyRatings() {
    // Stop any running live-update interval
    stopLiveUpdate();
    
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }

    try {
      const pendingRes = await fetch(`${API_BASE_URL}/ratings/my-pending`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      let pending = [];
      if (pendingRes.ok) {
        pending = await pendingRes.json();
      }

      let received = [];
      if (currentUser.role === "GarageHost") {
        const receivedRes = await fetch(`${API_BASE_URL}/ratings/my-received`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (receivedRes.ok) {
          received = await receivedRes.json();
        }
      }

      currentPendingRatings = pending;
      currentReceivedRatings = received;
      parkingView.renderMyRatings(pending, currentUser.role, received);
      setupBackToDashboardListener();
      setupRateButtons();
    } catch (err) { console.error(err); }
  }

  function setupRateButtons() {
    document.querySelectorAll(".btn-rate-booking").forEach(btn => {
      btn.addEventListener("click", () => {
        const bookingId = btn.dataset.bookingId;
        const booking = currentPendingRatings.find((b) => b._id === bookingId);
        if (!booking) return;
        parkingView.renderRatingModal(booking, currentUser.role);
        setupRatingModalListeners(bookingId);
      });
    });
  }

  function setupRatingModalListeners(bookingId) {
    const overlay = document.getElementById("rating-modal-overlay");
    const closeBtn = document.getElementById("rating-modal-close");
    if (closeBtn) closeBtn.addEventListener("click", () => overlay.remove());
    if (overlay) overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });

    const stars = document.querySelectorAll("#star-selector .star");
    const ratingInput = document.getElementById("rating-value");
    stars.forEach(star => {
      star.addEventListener("mouseover", () => {
        stars.forEach(s => s.style.color = s.dataset.value <= star.dataset.value ? "#f39c12" : "#ccc");
      });
      star.addEventListener("mouseout", () => {
        const val = ratingInput.value;
        stars.forEach(s => s.style.color = s.dataset.value <= val ? "#f39c12" : "#ccc");
      });
      star.addEventListener("click", () => {
        ratingInput.value = star.dataset.value;
        stars.forEach(s => s.style.color = s.dataset.value <= star.dataset.value ? "#f39c12" : "#ccc");
      });
    });

    const submitBtn = document.getElementById("submit-rating-btn");
    if (submitBtn) {
      submitBtn.addEventListener("click", async () => {
        const rating = parseInt(document.getElementById("rating-value").value);
        const review = document.getElementById("rating-review").value.trim();
        const errorEl = document.getElementById("rating-error");
        const successEl = document.getElementById("rating-success");

        if (!rating || rating < 1) {
          errorEl.textContent = "Please select a star rating";
          errorEl.style.display = "block";
          return;
        }

        try {
          const booking = currentPendingRatings.find((b) => b._id === bookingId);
          if (!booking) {
            errorEl.textContent = "Booking data not found.";
            errorEl.style.display = "block";
            return;
          }

          const token = localStorage.getItem("token");
          const payload = { bookingId, rating, review };
          if (currentUser.role === "Driver") {
            payload.toGarageId = booking.garageSpace?._id;
          } else if (currentUser.role === "GarageHost") {
            payload.toUserId = booking.driver?._id;
          }

          const res = await fetch(`${API_BASE_URL}/ratings`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok) {
            successEl.textContent = "✅ Rating submitted!";
            successEl.style.display = "block";
            errorEl.style.display = "none";
            submitBtn.disabled = true;
            setTimeout(() => { overlay.remove(); loadMyRatings(); }, 1200);
          } else {
            errorEl.textContent = data.message || "Failed to submit rating";
            errorEl.style.display = "block";
          }
        } catch (err) {
          errorEl.textContent = "Network error";
          errorEl.style.display = "block";
        }
      });
    }
  }

  // ── FR-22: Panic Button ──
  async function loadPanicSection() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/users/trusted-contact`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const contact = res.ok ? await res.json() : {};
      parkingView.renderPanicSection(contact);
      setupBackToDashboardListener();
      setupPanicListeners();
    } catch (err) { console.error(err); }
  }

  function setupPanicListeners() {
    const panicBtn = document.getElementById("panic-btn");
    if (panicBtn) {
      panicBtn.addEventListener("click", async () => {
        if (!confirm("🚨 Are you sure you want to trigger the panic alert? This will notify your trusted contact.")) return;
        panicBtn.disabled = true;
        panicBtn.textContent = "Sending alert...";
        const statusEl = document.getElementById("panic-status");

        let lat = null, lng = null;
        try {
          const pos = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (e) { console.warn("Geolocation unavailable"); }

        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE_URL}/panic`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng })
          });
          const data = await res.json();
          if (res.ok) {
            statusEl.innerHTML = `<span style="color:#e74c3c;">🚨 Alert sent! ${data.trustedContactNotified ? "Your trusted contact has been notified." : "Alert logged (email could not be sent)."}</span>`;
          } else {
            statusEl.innerHTML = `<span style="color:#e74c3c;">Failed: ${data.message}</span>`;
            panicBtn.disabled = false;
            panicBtn.textContent = "🚨 PANIC";
          }
        } catch (err) {
          statusEl.innerHTML = `<span style="color:#e74c3c;">Network error. Please call emergency services directly.</span>`;
          panicBtn.disabled = false;
          panicBtn.textContent = "🚨 PANIC";
        }
      });
    }

    const saveBtn = document.getElementById("save-trusted-contact-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const name = document.getElementById("tc-name").value.trim();
        const email = document.getElementById("tc-email").value.trim();
        const phone = document.getElementById("tc-phone").value.trim();
        const tcStatus = document.getElementById("tc-status");
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE_URL}/users/trusted-contact`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, phone })
          });
          if (res.ok) {
            tcStatus.innerHTML = `<span style="color:#28a745;">✅ Saved!</span>`;
            setTimeout(() => loadPanicSection(), 1000);
          } else {
            tcStatus.innerHTML = `<span style="color:#e74c3c;">Failed to save</span>`;
          }
        } catch (err) { tcStatus.innerHTML = `<span style="color:#e74c3c;">Network error</span>`; }
      });
    }
  }

  // ── FR-22: Admin Panic Logs ──
  async function loadPanicLogs() {
    // Stop any running live-update interval
    stopLiveUpdate();
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/panic/logs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const logs = await res.json();
        parkingView.renderPanicLogs(logs);
        setupLogoutButton();
        setupBackToDashboardListener();
        setupResolvePanicButtons();
      }
    } catch (err) { console.error(err); }
  }

  function setupResolvePanicButtons() {
    document.querySelectorAll(".btn-resolve-panic").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const notes = prompt("Add resolution notes (optional):", "");
        if (notes === null) return;
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`${API_BASE_URL}/panic/${id}/resolve`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ notes })
          });
          if (res.ok) loadPanicLogs();
        } catch (err) { console.error(err); }
      });
    });
  }

  // ── Favorite Garages ──
  async function loadFavoriteGarages() {
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/favorites`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const favorites = await res.json();
        parkingView.renderFavoriteGarages(favorites);
        setupBackToDashboardListener();
        setupLogoutButton();
        setupFavoriteActions();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to load favorites");
      }
    } catch (err) {
      console.error("Error loading favorites:", err);
      alert("Network error. Please try again.");
    }
  }

  function setupFavoriteActions() {
    // Quick rebook
    document.querySelectorAll(".btn-quick-rebook").forEach(btn => {
      btn.addEventListener("click", () => handleBookNow(btn.dataset.spaceId));
    });

    // Remove favorite
    document.querySelectorAll(".btn-remove-favorite").forEach(btn => {
      btn.addEventListener("click", async () => {
        await handleToggleFavorite(btn.dataset.id);
        loadFavoriteGarages();
      });
    });
  }

  async function handleToggleFavorite(garageId) {
    const token = localStorage.getItem("token");
    if (!token) { alert("Please login to save favorites"); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/favorites/${garageId}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Favorite toggled:", data.message);
      }
    } catch (err) { console.error("Error toggling favorite:", err); }
  }

  // ── Driver Dashboard Functions ──
  function setupDriverDashboardListeners() {
    const map = {
      "nav-find-parking": loadGarageListing,
      "nav-my-bookings": loadMyBookings,
      "nav-monthly-passes": loadSubscriptionPasses,
      "nav-my-ratings": loadMyRatings,
      "nav-emergency-panic": loadPanicSection,
      "nav-weather-alerts": loadWeatherAlerts,
      "nav-favorite-garages": loadFavoriteGarages,
      "nav-payment-history":  loadPaymentHistory,
      "nav-nid-verify":       loadNidVerification
    };

    for (const [id, handler] of Object.entries(map)) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("click", (e) => {
          console.log(`Clicked on ${id}`);
          handler();
        });
      } else {
        console.warn(`Element with id ${id} not found`);
      }
    }
  }

  // ── Admin Dashboard Functions ──
  function setupAdminDashboardListeners() {
    const map = {
      "nav-garage-approvals": loadAdminGarageApprovals,
      "nav-user-management": loadAdminUsers,
      "nav-booking-monitoring": loadAdminBookings,
      "nav-weather-alerts": loadAdminWeatherAlerts,
      "nav-revenue-analytics": loadAdminRevenue,
      "nav-aggregated-ratings": loadAdminRatings,
      "nav-complaints": loadAdminComplaints,
      "nav-system-performance": loadAdminPerformance
    };

    for (const [id, handler] of Object.entries(map)) {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click", handler);
    }
  }

  async function loadAdminGarageApprovals() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/garages`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const garages = await res.json();
        parkingView.renderAdminGarageApprovals(garages);
        setupBackToDashboardListener();
        document.querySelectorAll(".btn-approve-garage").forEach(btn => btn.addEventListener("click", () => handleUpdateGarageStatus(btn.dataset.id, "Approved")));
        document.querySelectorAll(".btn-reject-garage").forEach(btn => btn.addEventListener("click", () => handleUpdateGarageStatus(btn.dataset.id, "Rejected")));
      }
    } catch (e) { console.error(e); }
  }

  async function handleUpdateGarageStatus(id, status) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/garages/${id}/approve`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus: status })
      });
      if (res.ok) loadAdminGarageApprovals();
    } catch (e) { console.error(e); }
  }

  async function loadAdminUsers() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const users = await res.json();
        parkingView.renderAdminUsers(users);
        setupBackToDashboardListener();
        document.querySelectorAll(".btn-toggle-ban").forEach(btn => btn.addEventListener("click", () => handleToggleBan(btn.dataset.id)));
      }
    } catch (e) { console.error(e); }
  }

  async function handleToggleBan(id) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${id}/ban`, { method: "PUT", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) loadAdminUsers();
    } catch (e) { console.error(e); }
  }

  async function loadAdminBookings() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bookings`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const bookings = await res.json();
        parkingView.renderAdminBookings(bookings);
        setupBackToDashboardListener();
      }
    } catch (e) { console.error(e); }
  }

  async function loadAdminRevenue() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/revenue`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        parkingView.renderAdminRevenue(data);
        setupBackToDashboardListener();
      }
    } catch (e) { console.error(e); }
  }

  async function loadAdminRatings() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/ratings`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        parkingView.renderAdminRatings(data);
        setupBackToDashboardListener();
      }
    } catch (e) { console.error(e); }
  }

  async function loadAdminComplaints() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/complaints`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const complaints = await res.json();
        parkingView.renderAdminComplaints(complaints);
        setupBackToDashboardListener();
        document.querySelectorAll(".btn-resolve-complaint").forEach(btn => btn.addEventListener("click", async () => {
          const resolutionNotes = prompt("Enter resolution notes:");
          if (resolutionNotes) {
            await fetch(`${API_BASE_URL}/admin/complaints/${btn.dataset.id}/resolve`, {
              method: "PUT",
              headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ resolutionNotes })
            });
            loadAdminComplaints();
          }
        }));
      }
    } catch (e) { console.error(e); }
  }

  async function loadAdminPerformance() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/performance`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        parkingView.renderAdminPerformance(data);
        setupBackToDashboardListener();
      }
    } catch (e) { console.error(e); }
  }

  // ── FR-14/15: Payment & Earnings Logic ──
  async function loadPaymentHistory() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/payments/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        parkingView.renderPaymentHistory(data);
        setupBackToDashboardListener();
        
        document.querySelectorAll(".btn-view-receipt").forEach(btn => {
          btn.addEventListener("click", async (e) => {
            const paymentId = e.target.dataset.id;
            const pres = await fetch(`${API_BASE_URL}/payments/receipt/${paymentId}`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (pres.ok) {
              const payment = await pres.json();
              parkingView.renderReceipt(payment);
              
              document.getElementById("receipt-modal-close").onclick = () => {
                document.getElementById("receipt-modal-overlay").remove();
              };
              document.getElementById("print-receipt-btn").onclick = () => {
                window.print();
              };
            }
          });
        });
      }
    } catch (err) { console.error("Error loading payment history:", err); }
  }

  async function loadHostEarnings() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/payments/host`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        parkingView.renderHostEarnings(data);
        setupBackToDashboardListener();
        
        const withdrawBtn = document.getElementById("withdraw-funds-btn");
        if (withdrawBtn) {
          withdrawBtn.onclick = () => {
            alert("Withdrawal request submitted! Our team will process it within 24 hours.");
          };
        }
      }
    } catch (err) { console.error("Error loading host earnings:", err); }
  }

  // ── FR-20: NID Verification Logic ──
  async function loadNidVerification() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/nid-status`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        parkingView.renderNidVerification(data);
        setupBackToDashboardListener();
        setupLogoutButton();
        
        const submitBtn = document.getElementById("submit-nid-btn");
        if (submitBtn) submitBtn.addEventListener("click", handleVerifyNid);
      }
    } catch (err) { console.error("Error loading NID status:", err); }
  }

  async function handleVerifyNid() {
    const nidInput = document.getElementById("nid-number-input");
    const errorEl = document.getElementById("nid-error");
    const nid = nidInput.value.trim();

    if (!nid || nid.length < 10) {
      if (errorEl) { errorEl.textContent = "Please enter a valid 10-digit NID number."; errorEl.style.display = "block"; }
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/users/verify-nid`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ nidNumber: nid })
      });
      const data = await res.json();
      if (res.ok) {
        loadNidVerification(); // Refresh view
      } else {
        if (errorEl) { errorEl.textContent = data.message || "Verification failed"; errorEl.style.display = "block"; }
      }
    } catch (err) { console.error("NID verification error:", err); }
  }

  // ── Init ──
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { init, logout };
})();