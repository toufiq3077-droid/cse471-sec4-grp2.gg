const User = require('../models/User');
const { getHyperLocalWeather } = require('../services/weatherService');

/**
 * GET /api/weather
 * Returns current weather, 7-day forecast & smart agricultural insights
 */
async function getWeather(req, res, next) {
  try {
    let lat = req.query.lat ? Number(req.query.lat) : null;
    let lon = req.query.lon ? Number(req.query.lon) : null;

    // If query coordinates not provided, check user's saved farm location
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      if (req.user && req.user.farmLocation && req.user.farmLocation.latitude) {
        lat = req.user.farmLocation.latitude;
        lon = req.user.farmLocation.longitude;
      } else {
        // Default to Dhaka, Bangladesh coordinates
        lat = 23.8103;
        lon = 90.4125;
      }
    }

    const weatherData = await getHyperLocalWeather(lat, lon);

    // Attach saved location metadata if available
    if (req.user && req.user.farmLocation) {
      weatherData.savedFarmLocation = req.user.farmLocation;
    }

    return res.json({
      success: true,
      data: weatherData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/weather/location
 * Saves or updates user's farm location coordinates in MongoDB
 */
async function updateFarmLocation(req, res, next) {
  try {
    const { latitude, longitude, locationName, district } = req.body;

    const latNum = Number(latitude);
    const lonNum = Number(longitude);

    if (isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude numbers are required',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.farmLocation = {
      latitude: latNum,
      longitude: lonNum,
      locationName: locationName || `Farm (${latNum.toFixed(2)}°, ${lonNum.toFixed(2)}°)`,
      district: district || 'Farm Location',
    };

    await user.save();

    return res.json({
      success: true,
      message: 'Farm location coordinate points updated successfully',
      data: {
        farmLocation: user.farmLocation,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWeather,
  updateFarmLocation,
};
