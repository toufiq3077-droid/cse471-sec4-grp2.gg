const BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api')
      ? import.meta.env.VITE_API_URL
      : `${import.meta.env.VITE_API_URL}/api`)
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : 'https://server-nu-one-37.vercel.app/api');

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Server error (${response.status})`);
  }
  return data;
}

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    return await handleResponse(res);
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error(
        'Unable to connect to the Khet-i server. Please ensure the backend server is running.'
      );
    }
    throw error;
  }
}

export const adminApi = {
  getStats: async (token) => {
    return safeFetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getAllUsers: async (token) => {
    return safeFetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  toggleVerifyUser: async (userId, token) => {
    return safeFetch(`${BASE_URL}/admin/users/${userId}/verify`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getPendingExperts: async (token) => {
    return safeFetch(`${BASE_URL}/experts/admin/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  approveExpert: async (expertId, token) => {
    return safeFetch(`${BASE_URL}/experts/${expertId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  rejectExpert: async (expertId, token) => {
    return safeFetch(`${BASE_URL}/experts/${expertId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getConsultationRevenue: async (token) => {
    return safeFetch(`${BASE_URL}/consultations/admin/revenue`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getPendingCashPayments: async (token) => {
    return safeFetch(`${BASE_URL}/consultations/admin/pending-payments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  approveCashPayment: async (consultationId, token) => {
    return safeFetch(`${BASE_URL}/consultations/${consultationId}/approve-payment`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
