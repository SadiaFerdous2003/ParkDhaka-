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

    const { images, price, vehicleTypes, availableHours } = req.body;
    if (images) space.images = images;
    if (price != null) space.price = price;
    if (vehicleTypes) space.vehicleTypes = vehicleTypes;
    if (availableHours) space.availableHours = availableHours;

    const updated = await space.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// toggle garage space status
exports.toggleGarageStatus = async (req, res) => {
  try {
    const hostId = req.user && req.user.userId;
    const { id } = req.params;
    const space = await GarageSpace.findById(id);
    if (!space) return res.status(404).json({ message: 'Space not found' });
    if (space.host.toString() !== hostId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Toggle status Between Open and Closed
    space.status = space.status === "Open" ? "Closed" : "Open";

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