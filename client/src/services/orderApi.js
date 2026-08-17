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

export const orderApi = {
  place: (payload) =>
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handleResponse),
  getMine: () => fetch(`${API_BASE}/orders/mine`, { headers: authHeaders() }).then(handleResponse),
  get: (id) => fetch(`${API_BASE}/orders/${id}`, { headers: authHeaders() }).then(handleResponse),
};
