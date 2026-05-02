// legacy parking model is not used; keep stub routes if needed
const GarageSpace = require("../models/garageSpace");

// legacy parking endpoints (unused in current UI) - return simple stubs
exports.getParkings = async (req, res) => {
  res.json([]);
};

exports.addParking = async (req, res) => {
  res.status(201).json({ message: "not implemented" });
};

// new garage space endpoints for hosts
exports.getGarageSpaces = async (req, res) => {
  try {
    // return spaces for the authenticated host only
    const hostId = req.user && req.user.userId;
    const spaces = await GarageSpace.find({ host: hostId });
    res.json(spaces);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addGarageSpace = async (req, res) => {
  try {
    const hostId = req.user && req.user.userId;
    
    // Handle both file uploads and JSON data
    let images = [];
    let price, vehicleTypes, availableHours;
    
    // If files were uploaded, create URLs for them
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    }
    
    // Parse JSON fields if sent as multipart form data
    if (req.body.price) {
      price = parseFloat(req.body.price);
    }
    if (req.body.vehicleTypes) {
      vehicleTypes = typeof req.body.vehicleTypes === 'string' 
        ? req.body.vehicleTypes.split(",").map(s => s.trim()).filter(Boolean)
        : req.body.vehicleTypes;
    }
    let location;
    if (req.body.location) {
      location = typeof req.body.location === 'string' 
        ? JSON.parse(req.body.location) 
        : req.body.location;
    }
    if (req.body.availableHours) {
      if (typeof req.body.availableHours === "string") {
        availableHours = JSON.parse(req.body.availableHours);
      } else {
        availableHours = req.body.availableHours;
      }
    }
    
    // Also support JSON-only requests (for backwards compatibility)
    if (req.body.images) {
      images = req.body.images;
    }
    if (req.body.price != null && price == null) {
      price = parseFloat(req.body.price);
    }
    if (req.body.vehicleTypes && !vehicleTypes) {
      vehicleTypes = req.body.vehicleTypes;
    }
    if (req.body.location && !location) {
      location = req.body.location;
    }
    if (req.body.availableHours && !availableHours) {
      availableHours = req.body.availableHours;
    }

    if (price == null || isNaN(price)) {
      return res.status(400).json({ message: "Valid price is required" });
    }

    const space = new GarageSpace({
      host: hostId,
      images,
      price,
      vehicleTypes: vehicleTypes || [],
      location: location || {},
      availableHours: availableHours || {}
    });

    const saved = await space.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// update existing space
exports.updateGarageSpace = async (req, res) => {
  try {
    const hostId = req.user && req.user.userId;
    const { id } = req.params;
    const space = await GarageSpace.findById(id);
    if (!space) return res.status(404).json({ message: 'Space not found' });
    if (space.host.toString() !== hostId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { images, price, vehicleTypes, availableHours, location } = req.body;
    if (images) space.images = images;
    if (price != null) space.price = price;
    if (vehicleTypes) space.vehicleTypes = vehicleTypes;
    if (availableHours) space.availableHours = availableHours;
    if (location) space.location = location;

    const updated = await space.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// delete existing space
exports.deleteGarageSpace = async (req, res) => {
  try {
    const hostId = req.user && req.user.userId;
    const { id } = req.params;
    const space = await GarageSpace.findById(id);
    if (!space) return res.status(404).json({ message: 'Space not found' });
    if (space.host.toString() !== hostId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await GarageSpace.deleteOne({ _id: id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all garage spaces (for viewing all listed garages) - Only return "Open" ones for Drivers
exports.getAllGarageSpaces = async (req, res) => {
  try {
    const query = req.user && req.user.role === "Driver" 
      ? { status: "Open", approvalStatus: { $nin: ["Pending", "Rejected"] } } 
      : {};
    const spaces = await GarageSpace.find(query)
      .populate('host', 'name email')
      .sort({ createdAt: -1 });

    // ── Fix: Ensure coordinates are valid and default to Dhaka ──
    const sanitizedSpaces = spaces.map(s => {
      const space = s.toObject();
      if (!space.location) space.location = {};
      if (!space.location.lat || isNaN(space.location.lat)) space.location.lat = 23.8103;
      if (!space.location.lng || isNaN(space.location.lng)) space.location.lng = 90.4125;
      return space;
    });

    res.json(sanitizedSpaces);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Toggle garage availability status (Open/Closed)
exports.toggleGarageStatus = async (req, res) => {
  try {
    const hostId = req.user && req.user.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!["Open", "Closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use 'Open' or 'Closed'." });
    }

    const space = await GarageSpace.findById(id);
    if (!space) return res.status(404).json({ message: 'Space not found' });
    
    if (space.host.toString() !== hostId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    space.status = status;
    const updated = await space.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── FR-4: Get Nearby Garages (GPS-based) ──
exports.getNearbyGarages = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query; // Default radius 5km
    if (!lat || !lng) {
      return res.status(400).json({ message: "GPS coordinates (lat, lng) are required." });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Find all approved and open spaces
    const query = { status: "Open", approvalStatus: { $nin: ["Pending", "Rejected"] } };
    const allSpaces = await GarageSpace.find(query).populate('host', 'name email');

    // Simple Haversine distance filtering
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const nearbySpaces = allSpaces.filter(s => {
      if (!s.location || !s.location.lat || !s.location.lng) return false;
      const dist = calculateDistance(userLat, userLng, s.location.lat, s.location.lng);
      s.distance = dist; // Attach distance for sorting
      return dist <= (radius / 1000); // convert radius to km
    });

    // Sort by proximity
    nearbySpaces.sort((a, b) => a.distance - b.distance);

    res.json(nearbySpaces);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};