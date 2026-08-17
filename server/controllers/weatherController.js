const User = require('../models/User');
const Notification = require('../models/Notification');
const { getHyperLocalWeather } = require('../services/weatherService');
const { broadcastWeatherAlert } = require('../services/socketService');

/**
 * Helper to generate & save persistent notification + emit socket event
 */
async function createAndEmitWeatherNotification({ userId, title, message, severity = 'warning', metadata = {} }) {
  try {
    const notification = await Notification.create({
      recipientId: userId,
      title,
      message,
      type: 'weather_alert',
      severity,
      metadata,
    });

    const payload = {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      severity: notification.severity,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      read: false,
    };

    // Emit live Socket.io event to user room
    broadcastWeatherAlert(payload, userId);
    return notification;
  } catch (err) {
    console.error('Error creating weather notification:', err.message);
    return null;
  }
}

/**
 * GET /api/weather
 * Returns current weather, 7-day forecast & smart agricultural insights
 */
async function getWeather(req, res, next) {
  try {
    let lat = req.query.lat ? Number(req.query.lat) : null;
    let lon = req.query.lon ? Number(req.query.lon) : null;

    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      if (req.user && req.user.farmLocation && req.user.farmLocation.latitude) {
        lat = req.user.farmLocation.latitude;
        lon = req.user.farmLocation.longitude;
      } else {
        lat = 23.8103;
        lon = 90.4125;
      }
    }

    const weatherData = await getHyperLocalWeather(lat, lon);

    if (req.user && req.user.farmLocation) {
      weatherData.savedFarmLocation = req.user.farmLocation;
    }

    // Auto-detect critical hazards (e.g., rain probability > 60%, wind > 25km/h, humidity > 80%)
    if (req.user && (req.user._id || req.user.id)) {
      const userId = req.user._id || req.user.id;
      const { spraying, diseaseRisk, harvest } = weatherData.agriInsights || {};

      if (spraying?.status?.includes('Unsafe') || diseaseRisk?.status?.includes('High') || harvest?.status?.includes('Postpone')) {
        const hazardTitle = `⚠️ Weather Hazard at ${weatherData.current?.locationName || 'Farm'}`;
        const hazardMsg = `${spraying?.advice || diseaseRisk?.advice || harvest?.advice}`;
        
        // Prevent duplicate unread notifications within 30 minutes
        const recentNotif = await Notification.findOne({
          recipientId: userId,
          type: 'weather_alert',
          createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
        });

        if (!recentNotif) {
          await createAndEmitWeatherNotification({
            userId,
            title: hazardTitle,
            message: hazardMsg,
            severity: 'critical',
            metadata: {
              latitude: lat,
              longitude: lon,
              locationName: weatherData.current?.locationName,
              condition: weatherData.current?.condition,
              riskType: spraying?.status || diseaseRisk?.status || 'Severe Hazard',
            },
          });
        }
      }
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

/**
 * POST /api/weather/trigger-risk-alert
 * Trigger an instant test/simulated real-time Socket.io weather risk alert for testing
 */
async function triggerRiskAlert(req, res, next) {
  try {
    const userId = req.user._id || req.user.id;
    const { title, message, severity, riskType } = req.body;

    const alertTitle = title || '🚨 High Wind & Rain Hazard Warning!';
    const alertMsg = message || 'Heavy rain & wind gust (28 km/h) forecasted for your farm location. Hold spraying and safeguard harvested crops.';
    const alertSeverity = severity || 'critical';

    const notification = await createAndEmitWeatherNotification({
      userId,
      title: alertTitle,
      message: alertMsg,
      severity: alertSeverity,
      metadata: {
        latitude: req.user?.farmLocation?.latitude || 23.8103,
        longitude: req.user?.farmLocation?.longitude || 90.4125,
        locationName: req.user?.farmLocation?.locationName || 'My Farm',
        condition: 'Thunderstorm',
        riskType: riskType || 'High Wind & Heavy Rain',
      },
    });

    return res.json({
      success: true,
      message: '⚡ Real-time Socket.io weather alert triggered successfully!',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWeather,
  updateFarmLocation,
  triggerRiskAlert,
};
