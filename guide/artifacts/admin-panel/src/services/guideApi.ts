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
  // Use localStorage guide_token if present, otherwise default to "1" for local admin testing
  const token = localStorage.getItem('guide_token') || '1';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

guideApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn("🔐 Guide API Session expired or unauthorized");
    }
    return Promise.reject(err);
  }
);

export { guideApi };
export default guideApi;
