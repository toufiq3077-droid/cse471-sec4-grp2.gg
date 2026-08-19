const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { geocode, reverseGeocode } = require('../services/trackingService');

// @desc    Forward geocode a free-text address/query into coordinates
// @route   GET /api/geocode/search?q=...
// @access  Private
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }
    const point = await geocode(q);
    if (!point) {
      return res.status(404).json({ success: false, message: 'No location found for that address' });
    }
    return res.json({ success: true, data: point });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Reverse geocode coordinates into an address label
// @route   GET /api/geocode/reverse?lat=..&lng=..
// @access  Private
router.get('/reverse', authenticateToken, async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, message: 'Valid lat/lng are required' });
    }
    const point = await reverseGeocode(lat, lng);
    if (!point) {
      return res.status(404).json({ success: false, message: 'Could not resolve that location' });
    }
    return res.json({ success: true, data: point });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
