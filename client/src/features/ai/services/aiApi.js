import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:9478'
      : '');

const cleanBaseUrl = rawUrl.endsWith('/api') ? rawUrl.slice(0, -4) : rawUrl;

const aiApi = axios.create({
  baseURL: cleanBaseUrl,
});

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

  const response = await aiApi.post('/api/ai/diagnose', formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function fetchDiagnosisHistory() {
  const response = await aiApi.get('/api/ai/history', {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return response.data;
}

export default aiApi;
