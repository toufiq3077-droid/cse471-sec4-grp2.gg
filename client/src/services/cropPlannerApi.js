const BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api')
      ? import.meta.env.VITE_API_URL
      : `${import.meta.env.VITE_API_URL}/api`)
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:9478/api'
      : '/api');

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Server error (${response.status})`);
  }
  return data;
}

export const cropPlannerApi = {
  getPresets: async (token) => {
    const res = await fetch(`${BASE_URL}/crop-plans/presets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },

  getMyPlans: async (token, status = '') => {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${BASE_URL}/crop-plans${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },

  getPlanById: async (token, id) => {
    const res = await fetch(`${BASE_URL}/crop-plans/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },

  createPlan: async (token, planData) => {
    const res = await fetch(`${BASE_URL}/crop-plans`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(planData),
    });
    return handleResponse(res);
  },

  toggleTask: async (token, planId, taskId) => {
    const res = await fetch(`${BASE_URL}/crop-plans/${planId}/tasks/${taskId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },

  convertToListing: async (token, planId, listingData) => {
    const res = await fetch(`${BASE_URL}/crop-plans/${planId}/convert-to-listing`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listingData),
    });
    return handleResponse(res);
  },

  deletePlan: async (token, planId) => {
    const res = await fetch(`${BASE_URL}/crop-plans/${planId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },
};
