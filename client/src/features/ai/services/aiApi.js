const BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api')
      ? import.meta.env.VITE_API_URL
      : `${import.meta.env.VITE_API_URL}/api`)
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:9478/api'
      : '/api');

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export async function diagnoseDisease(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const res = await fetch(`${BASE_URL}/ai/diagnose`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Server error (${res.status})`);
  }

  return data;
}

export async function fetchDiagnosisHistory() {
  const res = await fetch(`${BASE_URL}/ai/history`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Server error (${res.status})`);
  }

  return data;
}

export default {
  diagnoseDisease,
  fetchDiagnosisHistory,
};
