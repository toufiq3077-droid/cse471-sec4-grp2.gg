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

export const trackingApi = {
  getTracking: (orderId) =>
    fetch(`${API_BASE}/orders/${orderId}/tracking`, { headers: authHeaders() }).then(handleResponse),
};
