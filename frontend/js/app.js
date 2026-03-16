const API_BASE_URL = "http://localhost:5000/api";
let googleMapsLoaded = false;
let googleMapsApiKey = "";

const App = (function () {
  const parkingView = ParkingView;
  let currentUser = null;
  let currentSpaces = []; // store fetched spaces for host
  let currentBookings = []; // store fetched bookings for driver
  let hostListenerAdded = false;

  // ── Initialize ──
  async function init() {
    // Fetch Google Maps API key from backend
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
    script.onload = () => {
      googleMapsLoaded = true;
      console.log("Google Maps loaded successfully");
    };
    script.onerror = () => {
      console.log("Failed to load Google Maps, using Leaflet fallback");
    };
    document.head.appendChild(script);
  }

  // ── Global Toggle Map Function (FR-4) ──
  let mapToggleData = null; // Store spaces and userRole for toggle
  window.toggleMap = function() {
    const toggleBtn = document.getElementById("toggle-map-btn");
    const mapWrapper = document.getElementById("map-container-wrapper");
    
    if (!toggleBtn || !mapWrapper) return;
    
    const isCollapsed = mapWrapper.classList.contains("collapsed");
    
    if (isCollapsed) {
      mapWrapper.classList.remove("collapsed");
      toggleBtn.innerHTML = `<span class="toggle-icon">📍</span> Hide Nearby Map`;
      // Initialize map when showing
      setTimeout(() => {
        if (mapToggleData && typeof initGaragesMap === 'function') {
          initGaragesMap(mapToggleData.spaces, mapToggleData.userRole);
        }
      }, 100);
    } else {
      mapWrapper.classList.add("collapsed");
      toggleBtn.innerHTML = `<span class="toggle-icon">📍</span> Show Nearby Garages Map`;
    }
  };

  // Store map data globally for toggle function
  window.setMapToggleData = function(spaces, userRole) {
    mapToggleData = { spaces, userRole };
  };

  function showAuthPage() {
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
          try {
            const spacesRes = await fetch(`${API_BASE_URL}/garage-spaces`, {
              method: "GET",
              headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
            });
            let spaces = [];
            if (spacesRes.ok) spaces = await spacesRes.json();
            parkingView.renderGarageHostDashboard(data, spaces);
            currentSpaces = spaces;
            setupGarageHostListeners();
            // Initialize location picker map after rendering
            setTimeout(() => {
              if (typeof initLocationPicker === 'function') {
                initLocationPicker();
              }
            }, 100);
          } catch (err) {
            console.error("Error loading garage spaces", err);
            currentSpaces = [];
            parkingView.renderGarageHostDashboard(data, []);
            setupGarageHostListeners();
            // Initialize location picker map after rendering
            setTimeout(() => {
              if (typeof initLocationPicker === 'function') {
                initLocationPicker();
              }
            }, 100);
          }
        } else if (role === "Driver") {
          // Also fetch waitlist notifications
          let waitlistEntries = [];
          try {
            const wRes = await fetch(`${API_BASE_URL}/waitlist/my`, {
              method: "GET",
              headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
            });
            if (wRes.ok) waitlistEntries = await wRes.json();
          } catch (e) { /* ignore */ }
          parkingView.renderDriverDashboard(data, waitlistEntries);
        } else if (role === "Admin") {
          parkingView.renderAdminDashboard(data);
        }

        setupLogoutButton();
        setupViewGaragesButton();
        setupMyBookingsButton();
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

  function setupViewGaragesButton() {
    const viewGaragesBtn = document.getElementById("view-garages-btn");
    if (viewGaragesBtn) viewGaragesBtn.addEventListener("click", loadGarageListing);

    const backBtn = document.getElementById("back-to-dashboard-btn");
    if (backBtn) backBtn.addEventListener("click", () => loadDashboard(currentUser.role));
  }

  function setupMyBookingsButton() {
    const btn = document.getElementById("my-bookings-btn");
    if (btn) btn.addEventListener("click", loadMyBookings);
  }

  function setupWaitlistActions() {
    // Dismiss waitlist notification
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

    // Book from waitlist notification
    document.querySelectorAll(".btn-book-from-waitlist").forEach(btn => {
      btn.addEventListener("click", () => {
        const spaceId = btn.dataset.spaceId;
        handleBookNow(spaceId);
      });
    });
  }

  async function loadGarageListing() {
    const token = localStorage.getItem("token");
    if (!token) { showAuthPage(); return; }

    try {
      const response = await fetch(`${API_BASE_URL}/garage-spaces/all`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });

      if (response.ok) {
        const spaces = await response.json();
        parkingView.renderGarageListing(spaces, currentUser?.role);
        setupViewGaragesButton();
        setupLogoutButton();
        setupBookNowButtons();
        setupFilterBar(spaces);
        setupMapToggleAndLiveUpdate(spaces, currentUser?.role);
        // Store map data for toggle function
        if (typeof window.setMapToggleData === 'function') {
          window.setMapToggleData(spaces, currentUser?.role);
        }
        initGaragesMap(spaces, currentUser?.role);
      } else if (response.status === 401) {
        logout();
      }
    } catch (error) {
      console.error("Error loading garage listing:", error);
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

    // Apply filters button handler
    applyBtn.addEventListener("click", () => {
      const vehicleType = vehicleTypeSelect?.value || "";
      const minPrice = minPriceInput?.value || "";
      const maxPrice = maxPriceInput?.value || "";

      parkingView.filterAndRenderGarages(vehicleType, minPrice, maxPrice, currentUser?.role);

      // Re-setup filter buttons after re-render
      setTimeout(() => setupFilterBar(spaces), 150);
    });

    // Clear filters button handler
    clearBtn.addEventListener("click", () => {
      if (vehicleTypeSelect) vehicleTypeSelect.value = "";
      if (minPriceInput) minPriceInput.value = "";
      if (maxPriceInput) maxPriceInput.value = "";

      // Render with original spaces (no filters)
      parkingView.renderGarageListing(spaces, currentUser?.role);

      // Re-setup filter buttons after re-render
      setTimeout(() => setupFilterBar(spaces), 150);
    });
  }

  // ── Map Toggle & Live Update Setup (FR-4) ──
  function setupMapToggleAndLiveUpdate(spaces, userRole) {
    const toggleBtn = document.getElementById("toggle-map-btn");
    const mapWrapper = document.getElementById("map-container-wrapper");
    const refreshBtn = document.getElementById("refresh-map-btn");

    // Toggle map visibility
    if (toggleBtn && mapWrapper) {
      toggleBtn.addEventListener("click", () => {
        const isCollapsed = mapWrapper.classList.contains("collapsed");
        
        if (isCollapsed) {
          mapWrapper.classList.remove("collapsed");
          toggleBtn.innerHTML = `<span class="toggle-icon">📍</span> Hide Nearby Map`;
          // Initialize map when showing
          setTimeout(() => {
            if (typeof initGaragesMap === 'function') {
              initGaragesMap(spaces, userRole);
            }
          }, 100);
        } else {
          mapWrapper.classList.add("collapsed");
          toggleBtn.innerHTML = `<span class="toggle-icon">📍</span> Show Nearby Garages Map`;
        }
      });
    }

    // Live update refresh button
    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        refreshBtn.textContent = "⏳ Updating...";
        refreshBtn.disabled = true;
        
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${API_BASE_URL}/garage-spaces`, {
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
          });
          
          if (response.ok) {
            const updatedSpaces = await response.json();
            // Re-initialize map with fresh data
            if (typeof initGaragesMap === 'function') {
              initGaragesMap(updatedSpaces, userRole);
            }
            refreshBtn.textContent = "✓ Updated!";
            setTimeout(() => {
              refreshBtn.textContent = "🔄 Live Update";
              refreshBtn.disabled = false;
            }, 2000);
          }
        } catch (error) {
          console.error("Error refreshing map data:", error);
          refreshBtn.textContent = "❌ Error";
          setTimeout(() => {
            refreshBtn.textContent = "🔄 Live Update";
            refreshBtn.disabled = false;
          }, 2000);
        }
      });
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    currentUser = null;
    showAuthPage();
  }

  // ── Map Integration (FR-4) - Google Maps with Leaflet Fallback ──
  function initGaragesMap(spaces, userRole) {
    const mapContainer = document.getElementById("garages-map");
    if (!mapContainer) return; // not on the listing page

    // Clear existing map
    mapContainer.innerHTML = '';

    // Check if Google Maps is loaded
    if (googleMapsLoaded && google && google.maps) {
      initGoogleMaps(spaces, userRole, mapContainer);
    } else {
      // Fallback to Leaflet
      initLeafletMap(spaces, userRole, mapContainer);
    }
  }

  // ── Google Maps Implementation ──
  function initGoogleMaps(spaces, userRole, mapContainer) {
    // Default center to Dhaka coordinates
    const dhaka = { lat: 23.8103, lng: 90.4125 };
    
    const map = new google.maps.Map(mapContainer, {
      zoom: 13,
      center: dhaka,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    });

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    spaces.forEach(s => {
      if (s.location && s.location.lat && s.location.lng) {
        const lat = parseFloat(s.location.lat);
        const lng = parseFloat(s.location.lng);
        const position = { lat, lng };
        hasMarkers = true;
        bounds.extend(position);

        const hours = s.availableHours ? `${s.availableHours.start} - ${s.availableHours.end}` : "Not specified";
        const isAvailable = s.isAvailable !== false;
        
        // Navigation link (FR-6)
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

        const infoWindow = new google.maps.InfoWindow({
          content: contentString
        });

        // Custom marker icon based on availability
        const markerIcon = {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: isAvailable ? '#28a745' : '#dc3545',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        };

        const marker = new google.maps.Marker({
          position: position,
          map: map,
          title: `৳${s.price}/hour`,
          icon: markerIcon,
          animation: google.maps.Animation.DROP
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);

          // Attach book button event
          setTimeout(() => {
            const btn = document.querySelector(`.btn-book-now-map[data-space-id="${s._id}"]`);
            if (btn) {
              btn.addEventListener("click", () => handleBookNow(s._id));
            }
          }, 100);
        });
      }
    });

    if (hasMarkers) {
      map.fitBounds(bounds, { padding: 50 });
    } else {
      map.setCenter(dhaka);
    }
  }

  // ── Leaflet Fallback Implementation ──
  function initLeafletMap(spaces, userRole, mapContainer) {
    // Let the DOM update first before injecting Leaflet map
    setTimeout(() => {
      // Default center to Dhaka coordinates (23.8103, 90.4125)
      const map = L.map("garages-map").setView([23.8103, 90.4125], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Force recalculation to fix container rendering bugs
      setTimeout(() => map.invalidateSize(), 150);

      let hasMarkers = false;
      const bounds = L.latLngBounds();

      // Custom icons for available/booked status
      const availableIcon = L.divIcon({
        className: 'custom-marker available-marker',
        html: '<div class="marker-pin available"></div>',
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -35]
      });

      const bookedIcon = L.divIcon({
        className: 'custom-marker booked-marker',
        html: '<div class="marker-pin booked"></div>',
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -35]
      });

      spaces.forEach(s => {
        if (s.location && s.location.lat && s.location.lng) {
          const lat = parseFloat(s.location.lat);
          const lng = parseFloat(s.location.lng);
          hasMarkers = true;
          bounds.extend([lat, lng]);

          const hours = s.availableHours ? `${s.availableHours.start} - ${s.availableHours.end}` : "Not specified";
          const isAvailable = s.isAvailable !== false;
          
          // Navigation link (FR-6)
          const navLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
          
          const btnHtml = userRole === "Driver"
            ? `<button class="btn-book-now-map" data-space-id="${s._id}" style="margin-top: 5px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">📅 Book Now</button>`
            : '';

          const popupContent = `
          <div style="min-width: 180px;">
            <strong style="font-size: 14px;">৳${s.price}/hour</strong>
            <span style="color: ${isAvailable ? '#28a745' : '#dc3545'}; font-size: 12px;">● ${isAvailable ? 'Available' : 'Booked'}</span><br/>
            ${s.location.address ? `<small>${s.location.address}</small><br/>` : ''}
            <small>Hours: ${hours}</small><br/>
            <a href="${navLink}" target="_blank" style="display: inline-block; margin-top: 5px; padding: 4px 8px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">📍 Navigate</a>
            ${btnHtml}
          </div>
        `;

          const marker = L.marker([lat, lng], {
            icon: isAvailable ? availableIcon : bookedIcon
          }).addTo(map);
          marker.bindPopup(popupContent);

          // Leaflet popups are inserted dynamically, so attach event when popup opens
          marker.on('popupopen', () => {
            const btn = document.querySelector(`.btn-book-now-map[data-space-id="${s._id}"]`);
            if (btn) {
              btn.addEventListener("click", () => handleBookNow(s._id));
            }
          });
        }
      });

      if (hasMarkers) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }

    }, 100); // end of setTimeout
  }

  // ── Location Picker Map for Garage Host (FR-4) ──
  function initLocationPicker() {
    const mapContainer = document.getElementById("location-picker-map");
    if (!mapContainer) return;

    // Clear any existing content
    mapContainer.innerHTML = '';

    // Default center to Dhaka
    const dhaka = { lat: 23.8103, lng: 90.4125 };

    if (googleMapsLoaded && google && google.maps) {
      // Use Google Maps for location picker
      const map = new google.maps.Map(mapContainer, {
        zoom: 13,
        center: dhaka,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      let marker = null;

      // Add click listener to map
      map.addListener("click", (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        // Remove existing marker
        if (marker) marker.setMap(null);

        // Add new marker
        marker = new google.maps.Marker({
          position: event.latLng,
          map: map,
          draggable: true,
          animation: google.maps.Animation.DROP
        });

        // Update input fields
        document.getElementById("space-lat").value = lat.toFixed(6);
        document.getElementById("space-lng").value = lng.toFixed(6);

        // Show selected location info
        const selectedDiv = document.getElementById("selected-location");
        const coordsSpan = document.getElementById("selected-coords");
        if (selectedDiv && coordsSpan) {
          selectedDiv.style.display = "block";
          coordsSpan.textContent = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
        }

        // Allow marker dragging to adjust position
        marker.addListener("dragend", () => {
          const newLat = marker.getPosition().lat();
          const newLng = marker.getPosition().lng();
          document.getElementById("space-lat").value = newLat.toFixed(6);
          document.getElementById("space-lng").value = newLng.toFixed(6);
          if (coordsSpan) {
            coordsSpan.textContent = `Lat: ${newLat.toFixed(6)}, Lng: ${newLng.toFixed(6)}`;
          }
        });
      });
    } else {
      // Fallback to Leaflet
      setTimeout(() => {
        const map = L.map("location-picker-map").setView([dhaka.lat, dhaka.lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        setTimeout(() => map.invalidateSize(), 100);

        let marker = null;

        map.on("click", function(e) {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;

          // Remove existing marker
          if (marker) map.removeLayer(marker);

          // Add new marker
          marker = L.marker([lat, lng], { draggable: true }).addTo(map);

          // Update input fields
          document.getElementById("space-lat").value = lat.toFixed(6);
          document.getElementById("space-lng").value = lng.toFixed(6);

          // Show selected location info
          const selectedDiv = document.getElementById("selected-location");
          const coordsSpan = document.getElementById("selected-coords");
          if (selectedDiv && coordsSpan) {
            selectedDiv.style.display = "block";
            coordsSpan.textContent = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
          }

          // Allow marker dragging
          marker.on("dragend", function() {
            const newLat = marker.getLatLng().lat;
            const newLng = marker.getLatLng().lng;
            document.getElementById("space-lat").value = newLat.toFixed(6);
            document.getElementById("space-lng").value = newLng.toFixed(6);
            if (coordsSpan) {
              coordsSpan.textContent = `Lat: ${newLat.toFixed(6)}, Lng: ${newLng.toFixed(6)}`;
            }
          });
        });
      }, 100);
    }
  }

  // ── Garage Host Helpers ──
  function setupGarageHostListeners() {
    const addBtn = document.getElementById("add-space-btn");
    if (addBtn) addBtn.addEventListener("click", handleAddSpace);

    function hostSpacesClickHandler(e) {
      const target = e.target;
      if (target.matches('.edit-space-btn')) handleEditSpace(target.dataset.id);
      else if (target.matches('.delete-space-btn')) handleDeleteSpace(target.dataset.id);
    }

    if (!hostListenerAdded) {
      document.addEventListener('click', hostSpacesClickHandler);
      hostListenerAdded = true;
    }
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
        res = await fetch(`${API_BASE_URL}/garage-spaces`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });
      } else if (hasUrls) {
        const images = urlValue.split(",").map(s => s.trim()).filter(Boolean);
        res = await fetch(`${API_BASE_URL}/garage-spaces`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            images, price, vehicleTypes, availableHours: { start, end },
            location: { lat: lat ? parseFloat(lat) : null, lng: lng ? parseFloat(lng) : null, address }
          })
        });
      } else {
        res = await fetch(`${API_BASE_URL}/garage-spaces`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            images: [], price, vehicleTypes, availableHours: { start, end },
            location: { lat: lat ? parseFloat(lat) : null, lng: lng ? parseFloat(lng) : null, address }
          })
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

    const newAddress = prompt("Address / Location Name:", space.location?.address || "");
    const newLat = prompt("Latitude (e.g. 23.8103):", space.location?.lat || "");
    const newLng = prompt("Longitude (e.g. 90.4125):", space.location?.lng || "");

    const body = {};
    if (newPrice !== null) body.price = parseFloat(newPrice);
    if (newTypes !== null) body.vehicleTypes = newTypes.split(",").map(s => s.trim()).filter(Boolean);
    if (newStart !== null && newEnd !== null) body.availableHours = { start: newStart, end: newEnd };

    // Check if any location field was updated
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
      const res = await fetch(`${API_BASE_URL}/garage-spaces/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
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
    // We need the space object to show price
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
    } catch (err) {
      console.error("Error fetching space for booking:", err);
    }
  }

  function setupBookingFormListeners(space) {
    // Close modal
    const closeBtn = document.getElementById("booking-modal-close");
    const overlay = document.getElementById("booking-modal-overlay");
    if (closeBtn) closeBtn.addEventListener("click", () => overlay.remove());
    if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    // Duration pills
    const pills = document.querySelectorAll(".booking-modal .duration-pill");
    const priceAmountEl = document.getElementById("price-amount");
    const multipliers = { hourly: 1, "half-day": 5, "full-day": 9 };
    let selectedDuration = "hourly";

    pills.forEach(pill => {
      pill.addEventListener("click", () => {
        pills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        selectedDuration = pill.dataset.duration;
        if (priceAmountEl) {
          priceAmountEl.textContent = `৳${space.price * multipliers[selectedDuration]}`;
        }
      });
    });

    // Confirm booking
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
            if (successEl) { successEl.textContent = "✅ Booking confirmed!"; successEl.style.display = "block"; }
            confirmBtn.disabled = true;
            confirmBtn.textContent = "Booked!";
            setTimeout(() => { if (overlay) overlay.remove(); loadDashboard(currentUser.role); }, 1500);
          } else if (res.status === 409) {
            if (errorEl) { errorEl.textContent = data.message; errorEl.style.display = "block"; }
            // Show waitlist option
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
        setupLogoutButton();
        setupViewGaragesButton();
        setupBookingActions();
      }
    } catch (err) { console.error("Error loading bookings:", err); }
  }

  function setupBookingActions() {
    // Cancel
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
          } else {
            alert(data.message || "Cannot cancel booking");
          }
        } catch (err) { console.error(err); alert("Network error"); }
      });
    });

    // Reschedule
    document.querySelectorAll(".btn-reschedule-booking:not(.disabled)").forEach(btn => {
      btn.addEventListener("click", () => {
        const bookingId = btn.dataset.id;
        const booking = currentBookings.find(b => b._id === bookingId);
        if (!booking) return;
        parkingView.renderRescheduleModal(booking);
        setupRescheduleModalListeners(booking);
      });
    });
  }

  function setupRescheduleModalListeners(booking) {
    const overlay = document.getElementById("reschedule-modal-overlay");
    const closeBtn = document.getElementById("reschedule-modal-close");
    if (closeBtn) closeBtn.addEventListener("click", () => overlay.remove());
    if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    // Duration pills (within reschedule modal)
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

        if (errorEl) { errorEl.style.display = "none"; }

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

  // ── Init ──
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { init, logout };
})();
