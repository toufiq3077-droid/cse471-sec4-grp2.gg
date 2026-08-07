import axios from 'axios';

const aiApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://server-9epcbbn5d-azm0d3u8s-projects.vercel.app/api',
  withCredentials: true,
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
