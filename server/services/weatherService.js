const axios = require('axios');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '899ba13c289e7b5faf7adbd0f6e50bf';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Compute smart agricultural advice based on current and forecasted weather metrics
 */
function computeAgriInsights(current, forecast) {
  const temp = current.temp;
  const humidity = current.humidity;
  const windSpeed = current.windSpeed; // km/h
  const pop = current.rainProbability || 0; // %

  // Spraying advice
  let sprayingStatus = 'Optimal';
  let sprayingAdvice = 'Calm winds and low rain risk. Ideal for pesticide or fertilizer application.';
  if (windSpeed > 15) {
    sprayingStatus = 'Unsafe (High Wind)';
    sprayingAdvice = `Wind speed is ${windSpeed} km/h. High risk of chemical drift. Postpone spraying.`;
  } else if (pop > 40) {
    sprayingStatus = 'Unsafe (Rain Expected)';
    sprayingAdvice = `Rain probability is ${pop}%. Chemicals may wash off. Delay application.`;
  }

  // Irrigation advice
  let irrigationStatus = 'Standard';
  let irrigationAdvice = 'Normal irrigation schedule recommended.';
  if (pop >= 60) {
    irrigationStatus = 'Hold Irrigation';
    irrigationAdvice = 'High chance of natural rainfall. Save water and prevent waterlogging.';
  } else if (temp > 32 && humidity < 50) {
    irrigationStatus = 'Increase Irrigation';
    irrigationAdvice = 'High temperature and low humidity. Increase watering frequency to prevent heat stress.';
  }

  // Disease & Fungus Risk
  let diseaseRisk = 'Low';
  let diseaseAdvice = 'Favorable dry/moderate conditions. Low fungal risk.';
  if (humidity > 78 && temp >= 20 && temp <= 30) {
    diseaseRisk = 'High (Fungal Hazard)';
    diseaseAdvice = 'Warm and humid conditions favor blight, mildew, and fungal outbreaks. Monitor crops closely.';
  } else if (humidity > 70) {
    diseaseRisk = 'Moderate';
    diseaseAdvice = 'Elevated humidity. Inspect lower leaves for early disease signs.';
  }

  // Harvest Safety
  let harvestStatus = 'Safe';
  let harvestAdvice = 'Favorable dry conditions for harvesting and post-harvest drying.';
  if (pop > 50) {
    harvestStatus = 'Postpone';
    harvestAdvice = 'Rain expected. Moisture will spoil harvested grains/vegetables. Postpone harvest.';
  }

  return {
    spraying: { status: sprayingStatus, advice: sprayingAdvice },
    irrigation: { status: irrigationStatus, advice: irrigationAdvice },
    diseaseRisk: { status: diseaseRisk, advice: diseaseAdvice },
    harvest: { status: harvestStatus, advice: harvestAdvice },
  };
}

/**
 * Generate realistic fallback data if OpenWeather key is pending activation
 */
function generateFallbackWeatherData(lat, lon) {
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Deterministic seed based on coordinates and date
  const baseTemp = 26 + Math.round(Math.sin(lat + lon) * 4);
  const currentTemp = baseTemp + 2;

  const current = {
    temp: currentTemp,
    feelsLike: currentTemp + 2,
    tempMin: baseTemp - 2,
    tempMax: currentTemp + 3,
    humidity: 68,
    windSpeed: 11, // km/h
    windDirection: 'NE',
    pressure: 1012,
    clouds: 25,
    rainProbability: 20,
    uvIndex: 6,
    condition: 'Partly Cloudy',
    description: 'scattered clouds',
    icon: '02d',
    locationName: `Farm Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
    updatedAt: now.toISOString(),
  };

  const dailyForecast = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dayName = i === 0 ? 'Today' : dayNames[d.getDay()];

    const dayTempMax = baseTemp + Math.floor(Math.sin(i * 1.2) * 3) + 3;
    const dayTempMin = baseTemp - 3 + Math.floor(Math.sin(i * 0.8) * 2);
    const rainChance = Math.min(90, Math.max(10, Math.round((Math.sin(i * 2) + 1) * 35)));
    
    let cond = 'Clear Sky';
    let icon = '01d';
    if (rainChance > 60) {
      cond = 'Moderate Rain';
      icon = '10d';
    } else if (rainChance > 35) {
      cond = 'Partly Cloudy';
      icon = '03d';
    }

    dailyForecast.push({
      date: d.toISOString().split('T')[0],
      dayName,
      tempMax: dayTempMax,
      tempMin: dayTempMin,
      humidity: 60 + (i * 3) % 25,
      windSpeed: 8 + (i * 2) % 10,
      rainProbability: rainChance,
      condition: cond,
      icon,
    });
  }

  const agriInsights = computeAgriInsights(current, dailyForecast);

  return {
    isFallback: true,
    latitude: Number(lat),
    longitude: Number(lon),
    current,
    dailyForecast,
    agriInsights,
  };
}

/**
 * Fetch hyper-local weather & forecast from OpenWeather API
 */
async function getHyperLocalWeather(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    const error = new Error('Valid latitude and longitude coordinates are required');
    error.statusCode = 400;
    throw error;
  }

  try {
    // 1. Current Weather Request
    const currentWeatherUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const forecastUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;

    const [currentRes, forecastRes] = await Promise.all([
      axios.get(currentWeatherUrl),
      axios.get(forecastUrl),
    ]);

    const cur = currentRes.data;
    const fc = forecastRes.data;

    const current = {
      temp: Math.round(cur.main.temp),
      feelsLike: Math.round(cur.main.feels_like),
      tempMin: Math.round(cur.main.temp_min),
      tempMax: Math.round(cur.main.temp_max),
      humidity: cur.main.humidity,
      windSpeed: Math.round(cur.wind.speed * 3.6), // m/s to km/h
      pressure: cur.main.pressure,
      clouds: cur.clouds?.all || 0,
      rainProbability: Math.round((fc.list[0]?.pop || 0) * 100),
      condition: cur.weather[0]?.main || 'Clear',
      description: cur.weather[0]?.description || '',
      icon: cur.weather[0]?.icon || '01d',
      locationName: cur.name || fc.city?.name || `Farm (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
      updatedAt: new Date().toISOString(),
    };

    // 2. Process 3-hour forecast chunks into daily 7-day summaries
    const dailyMap = new Map();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    fc.list.forEach((item) => {
      const dateStr = item.dt_txt.split(' ')[0];
      const dateObj = new Date(item.dt_txt);
      
      if (!dailyMap.has(dateStr)) {
        const todayStr = new Date().toISOString().split('T')[0];
        dailyMap.set(dateStr, {
          date: dateStr,
          dayName: dateStr === todayStr ? 'Today' : dayNames[dateObj.getDay()],
          temps: [],
          humidities: [],
          winds: [],
          pops: [],
          conditions: [],
          icons: [],
        });
      }

      const dayData = dailyMap.get(dateStr);
      dayData.temps.push(item.main.temp);
      dayData.humidities.push(item.main.humidity);
      dayData.winds.push(item.wind.speed * 3.6);
      dayData.pops.push((item.pop || 0) * 100);
      dayData.conditions.push(item.weather[0]?.main);
      dayData.icons.push(item.weather[0]?.icon);
    });

    const dailyForecast = Array.from(dailyMap.values()).slice(0, 7).map((d) => ({
      date: d.date,
      dayName: d.dayName,
      tempMax: Math.round(Math.max(...d.temps)),
      tempMin: Math.round(Math.min(...d.temps)),
      humidity: Math.round(d.humidities.reduce((a, b) => a + b, 0) / d.humidities.length),
      windSpeed: Math.round(d.winds.reduce((a, b) => a + b, 0) / d.winds.length),
      rainProbability: Math.round(Math.max(...d.pops)),
      condition: d.conditions[Math.floor(d.conditions.length / 2)] || 'Clear',
      icon: d.icons[Math.floor(d.icons.length / 2)] || '01d',
    }));

    const agriInsights = computeAgriInsights(current, dailyForecast);

    return {
      isFallback: false,
      latitude: lat,
      longitude: lon,
      current,
      dailyForecast,
      agriInsights,
    };

  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 429)) {
      console.warn(`[OpenWeather API] Key status ${error.response.status}. Using fallback hyper-local generator.`);
      return generateFallbackWeatherData(lat, lon);
    }

    console.error('[OpenWeather Error]:', error.message);
    return generateFallbackWeatherData(lat, lon);
  }
}

module.exports = {
  getHyperLocalWeather,
};
