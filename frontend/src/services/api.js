import axios from "axios";

// Build Base URL with defensive checks
let baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Standardize URL: Remove trailing slash if present
if (baseURL.endsWith("/")) {
  baseURL = baseURL.slice(0, -1);
}

// Add protocol if missing for remote URLs
if (baseURL && !baseURL.startsWith("http") && baseURL.includes(".")) {
  baseURL = `https://${baseURL}`;
}

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor to add JWT Auth Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor to handle common errors like 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
