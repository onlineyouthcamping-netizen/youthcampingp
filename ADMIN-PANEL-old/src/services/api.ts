import axios from 'axios';

let apiBaseUrl = import.meta.env.VITE_API_URL || 'https://api.youthcamping.online/api';
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
} else if (!apiBaseUrl || apiBaseUrl.includes('onrender.com')) {
  console.warn('⚠️ Stale or invalid Render API URL detected. Forcing fallback to Hostinger VPS.');
  apiBaseUrl = 'https://api.youthcamping.online/api';
}
if (import.meta.env.DEV) console.log('🚀 [Admin API] Active API base URL:', apiBaseUrl);

const api = axios.create({
  baseURL: apiBaseUrl.replace(/\/api$/, ''),
  timeout: 15000,
});

let requestIdCounter = 0;

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

  if (typeof window !== 'undefined' && localStorage.getItem('TRACE_REQUESTS') === 'true') {
    requestIdCounter++;
    const reqId = `REQ-${requestIdCounter}`;
    (config as any)._reqId = reqId;
    (config as any)._startTime = Date.now();
    console.log(`[TRACE][START] ID: ${reqId} | Endpoint: ${config.url} | Time: ${new Date().toISOString()}`);
  }

  return config;
});

api.interceptors.response.use(
  (res) => {
    if (typeof window !== 'undefined' && localStorage.getItem('TRACE_REQUESTS') === 'true') {
      const config = res.config as any;
      if (config._reqId) {
        const duration = Date.now() - (config._startTime || Date.now());
        console.log(`[TRACE][DONE] ID: ${config._reqId} | Endpoint: ${config.url} | Duration: ${duration}ms | Status: ${res.status}`);
      }
    }
    return res;
  },
  (err) => {
    if (typeof window !== 'undefined' && localStorage.getItem('TRACE_REQUESTS') === 'true') {
      const config = err.config as any;
      if (config?._reqId) {
        const duration = Date.now() - (config._startTime || Date.now());
        const isCancelled = axios.isCancel(err);
        console.log(`[TRACE][${isCancelled ? 'CANCELLED' : 'FAILED'}] ID: ${config._reqId} | Endpoint: ${config?.url} | Duration: ${duration}ms | Status: ${err.response?.status || 'ERR'}`);
      }
    }
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
