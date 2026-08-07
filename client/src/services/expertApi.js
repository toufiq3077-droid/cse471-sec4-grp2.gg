const API_BASE = import.meta.env.VITE_API_URL || 'https://server-9epcbbn5d-azm0d3u8s-projects.vercel.app/api';


// ─── API calls ───────────────────────────────────────────────────────────────
const api = {
  getExperts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/experts?${q}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then((r) => r.json());
  },
  getExpertSlots: (expertId, year, month) =>
    fetch(`${API_BASE}/experts/${expertId}/slots?year=${year}&month=${month}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then((r) => r.json()),
  bookSlot: (payload) =>
    fetch(`${API_BASE}/consultations/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),
};
export { api };