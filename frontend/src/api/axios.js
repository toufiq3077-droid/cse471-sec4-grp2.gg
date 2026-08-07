import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach farmer's JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on token expiry / invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("kb_token");
      localStorage.removeItem("kb_farmer");
    }
    return Promise.reject(error);
  }
);

export default api;
