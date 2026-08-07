const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const backendUrl = apiUrl.replace(/\/api\/?$/, "");

// Keeps external providers (for example, old Cloudinary records) intact while
// resolving local Multer paths against the backend rather than the Vite app.
export const getImageUrl = (storedUrl) => {
  if (!storedUrl) return "";

  const normalizedUrl = String(storedUrl).replace(/\\/g, "/");
  if (/^(https?:|data:|blob:)/i.test(normalizedUrl)) return normalizedUrl;

  const path = normalizedUrl.startsWith("/") ? normalizedUrl : `/${normalizedUrl}`;
  return `${backendUrl}${path}`;
};
