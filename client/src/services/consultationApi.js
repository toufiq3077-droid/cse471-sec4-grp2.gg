const API_BASE = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api')
      ? import.meta.env.VITE_API_URL
      : `${import.meta.env.VITE_API_URL}/api`)
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : 'https://server-nu-one-37.vercel.app/api');

function authHeaders(json = false) {
  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Server error (${response.status})`);
  }
  return data;
}

export const consultationApi = {
  getMyConsultations: () =>
    fetch(`${API_BASE}/consultations/my`, { headers: authHeaders() }).then(handleResponse),

  getExpertConsultations: () =>
    fetch(`${API_BASE}/consultations/expert`, { headers: authHeaders() }).then(handleResponse),

  getById: (id) =>
    fetch(`${API_BASE}/consultations/${id}`, { headers: authHeaders() }).then(handleResponse),

  cancel: (id) =>
    fetch(`${API_BASE}/consultations/${id}/cancel`, {
      method: 'PATCH',
      headers: authHeaders(),
    }).then(handleResponse),

  updateStatus: (id, status) =>
    fetch(`${API_BASE}/consultations/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(true),
      body: JSON.stringify({ status }),
    }).then(handleResponse),

  pay: (id, paymentMethod) =>
    fetch(`${API_BASE}/consultations/${id}/pay`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ paymentMethod }),
    }).then(handleResponse),

  getMessages: (id) =>
    fetch(`${API_BASE}/consultations/${id}/messages`, { headers: authHeaders() }).then(handleResponse),

  sendMessage: (id, text) =>
    fetch(`${API_BASE}/consultations/${id}/messages`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ text }),
    }).then(handleResponse),

  end: (id) =>
    fetch(`${API_BASE}/consultations/${id}/end`, {
      method: 'POST',
      headers: authHeaders(),
    }).then(handleResponse),
};
