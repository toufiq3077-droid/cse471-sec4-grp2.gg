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

export const riderApi = {
  getAvailable: () => fetch(`${API_BASE}/riders/available`, { headers: authHeaders() }).then(handleResponse),
  getDeliveries: () => fetch(`${API_BASE}/riders/deliveries`, { headers: authHeaders() }).then(handleResponse),
  accept: (id) =>
    fetch(`${API_BASE}/riders/orders/${id}/accept`, {
      method: 'POST',
      headers: authHeaders(),
    }).then(handleResponse),
  updateStatus: (id, status) =>
    fetch(`${API_BASE}/riders/orders/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }).then(handleResponse),
};
