import { API_BASE } from './apiConfig';

export const CATEGORIES = ['vegetables', 'fruits', 'grains', 'dairy', 'poultry', 'fish', 'others'];

export const categoryLabels = {
  vegetables: 'Vegetables',
  fruits: 'Fruits',
  grains: 'Grains',
  dairy: 'Dairy',
  poultry: 'Poultry',
  fish: 'Fish',
  others: 'Others',
};

export const units = ['kg', 'dozen', 'piece', 'bag', 'liter'];

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

export const cropApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/crops${q ? `?${q}` : ''}`).then(handleResponse);
  },
  get: (id) => fetch(`${API_BASE}/crops/${id}`).then(handleResponse),
  getCategories: () => fetch(`${API_BASE}/crops/categories`).then(handleResponse),
  getMine: () => fetch(`${API_BASE}/crops/mine`, { headers: authHeaders() }).then(handleResponse),
  create: (payload) =>
    fetch(`${API_BASE}/crops`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handleResponse),
  update: (id, payload) =>
    fetch(`${API_BASE}/crops/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handleResponse),
  remove: (id) =>
    fetch(`${API_BASE}/crops/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handleResponse),
};
