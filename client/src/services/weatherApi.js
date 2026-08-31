const BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api')
      ? import.meta.env.VITE_API_URL
      : `${import.meta.env.VITE_API_URL}/api`)
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : '/api');

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Server error (${response.status})`);
  }
  return data;
}

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    return await handleResponse(res);
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the Khet-i server. Please ensure the backend is running.');
    }
    throw error;
  }
}

export const weatherApi = {
  /**
   * Fetch weather for given coordinates or user's saved farm location
   * @param {string} token - JWT auth token
   * @param {number|null} lat - Latitude (optional)
   * @param {number|null} lon - Longitude (optional)
   */
  getWeather: async (token, lat = null, lon = null) => {
    const params = lat !== null && lon !== null ? `?lat=${lat}&lon=${lon}` : '';
    return safeFetch(`${BASE_URL}/weather${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /**
   * Save/update user's farm location coordinates to their profile
   * @param {string} token - JWT auth token
   * @param {{latitude, longitude, locationName, district}} locationData
   */
  updateFarmLocation: async (token, locationData) => {
    return safeFetch(`${BASE_URL}/weather/location`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData),
    });
  },
};
