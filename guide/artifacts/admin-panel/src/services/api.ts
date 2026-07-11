import axios from 'axios';

let apiBaseUrl = import.meta.env.VITE_API_URL || 'https://api.youthcamping.online/api';
if (!apiBaseUrl || apiBaseUrl.includes('onrender.com')) {
  console.warn('⚠️ Stale or invalid Render API URL detected. Forcing fallback to Hostinger VPS.');
  apiBaseUrl = 'https://api.youthcamping.online/api';
}
console.log('🚀 [Admin API] Active API base URL:', apiBaseUrl);

const api = axios.create({
  baseURL: apiBaseUrl.replace(/\/api$/, '')
});

api.interceptors.request.use((config) => {
  // Ensure URL starts with /api if it's a relative path
  if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('http')) {
    config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
  }

  // As per requirement, use 'token' key instead of 'admin_token'
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 401 Handling: Session expired or unauthorized
    if (err.response?.status === 401) {
      console.warn("🔐 Session expired - Clearing token and redirecting");
      localStorage.removeItem('token');
      
      // Redirect to admin login when session is invalid/expired
      if (typeof window !== 'undefined' && !window.location.pathname.includes("/admin/login")) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

export { api };
export default api;
