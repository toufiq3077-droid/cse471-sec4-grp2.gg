import { API_BASE } from './apiConfig';

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Server error (${response.status})`);
  }
  return data;
}

export const geocodingApi = {
  search: (q) =>
    fetch(`${API_BASE}/geocode/search?q=${encodeURIComponent(q)}`, {
      headers: authHeaders(),
    }).then(handleResponse),
  reverse: (lat, lng) =>
    fetch(`${API_BASE}/geocode/reverse?lat=${lat}&lng=${lng}`, {
      headers: authHeaders(),
    }).then(handleResponse),
};
