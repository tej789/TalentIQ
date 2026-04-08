import axios from "axios";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. https://your-backend.com/api
  withCredentials: true,
});

// 🔥 Request interceptor to attach Clerk token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // ✅ Correct way to get Clerk token
      const token = await window.Clerk?.session?.getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting Clerk token:", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;