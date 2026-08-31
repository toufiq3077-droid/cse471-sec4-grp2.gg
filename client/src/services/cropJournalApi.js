import { API_BASE } from './apiConfig';

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Server error (${response.status})`);
  return data;
}

export const cropJournalApi = {
  list: (crop) => fetch(`${API_BASE}/crop-journal${crop ? `?crop=${encodeURIComponent(crop)}` : ''}`, { headers: authHeaders() }).then(handleResponse),
  create: (payload) => fetch(`${API_BASE}/crop-journal`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) }).then(handleResponse),
  update: (id, payload) => fetch(`${API_BASE}/crop-journal/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) }).then(handleResponse),
  remove: (id) => fetch(`${API_BASE}/crop-journal/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse),
};
