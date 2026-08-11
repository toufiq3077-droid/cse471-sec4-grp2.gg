const express = require('express');
const { getWeather, updateFarmLocation } = require('../controllers/weatherController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/weather - Get current & 7-day forecast for lat/lon or user's saved farm location
router.get('/', authenticateToken, getWeather);

// PUT /api/weather/location - Save/update user's farm location coordinates
router.put('/location', authenticateToken, updateFarmLocation);

module.exports = router;
