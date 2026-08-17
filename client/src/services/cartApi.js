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

export const cartApi = {
  get: () => fetch(`${API_BASE}/cart`, { headers: authHeaders() }).then(handleResponse),
  add: (cropId, quantity) =>
    fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ cropId, quantity }),
    }).then(handleResponse),
  update: (cropId, quantity) =>
    fetch(`${API_BASE}/cart/items/${cropId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ quantity }),
    }).then(handleResponse),
  remove: (cropId) =>
    fetch(`${API_BASE}/cart/items/${cropId}`, { method: 'DELETE', headers: authHeaders() }).then(
      handleResponse
    ),
  clear: () =>
    fetch(`${API_BASE}/cart`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse),
};
