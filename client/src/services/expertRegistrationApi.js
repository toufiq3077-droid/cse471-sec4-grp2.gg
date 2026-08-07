const API_BASE = import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`) : 'https://server-nu-one-37.vercel.app/api';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const api = {
  uploadFile: async (file) => {
    if (!file) {
      throw new Error("No file provided");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  },
  
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