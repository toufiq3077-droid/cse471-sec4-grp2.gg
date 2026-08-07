const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const api = {
  
  uploadCertificate: async (formData) => {
    const response = await fetch(`${API_BASE}/experts/upload-certificate`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });

    return response.json();
  },

 
  registerExpert: async (expertData) => {
    const response = await fetch(`${API_BASE}/experts/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(expertData),
    });

    return response.json();
  },


  saveDraft: async (expertData) => {
    const response = await fetch(`${API_BASE}/experts/draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(expertData),
    });

    return response.json();
  },
};

export { api };