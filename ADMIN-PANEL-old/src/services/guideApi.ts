import axios from 'axios';

let guideApiBaseUrl = import.meta.env.VITE_GUIDE_API_URL || 'http://localhost:5000/api';
if (!guideApiBaseUrl.endsWith('/api') && !guideApiBaseUrl.includes('/api/')) {
  guideApiBaseUrl = guideApiBaseUrl.replace(/\/$/, '') + '/api';
}
console.log('🚀 [Guide API] Active base URL:', guideApiBaseUrl);

const guideApi = axios.create({
  baseURL: guideApiBaseUrl
});

guideApi.interceptors.request.use((config) => {
  // Use localStorage guide_token if present.
  // Fallback to "1" ONLY in development mode for local guide API testing.
  const token = localStorage.getItem('guide_token') || '';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];
let reloginCooldownUntil = 0; // Timestamp: block re-login attempts until this time

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

guideApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("guide_token");
    }
    return Promise.reject(err);
  }
);

export { guideApi };
export default guideApi;
