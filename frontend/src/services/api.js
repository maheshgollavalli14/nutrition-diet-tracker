import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'nutrition_tracker_token';

const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

let onUnauthorizedCallback = null;

export function registerUnauthorizedHandler(cb) {
  onUnauthorizedCallback = cb;
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function clearStoredToken() {
  setStoredToken(null);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthAttempt) {
      clearStoredToken();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export const healthApi = {
  check: () => api.get('/health').then((r) => r.data),
};

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (payload) => api.put('/auth/profile', payload).then((r) => r.data),
};

export const foodsApi = {
  list: (params = {}) => api.get('/foods', { params }).then((r) => r.data),
  search: (q, filter = 'all') => api.get('/foods/search', { params: { q, filter } }).then((r) => r.data),
  getById: (id) => api.get(`/foods/${id}`).then((r) => r.data),
  create: (payload) => api.post('/foods', payload).then((r) => r.data),
};

export const foodLogsApi = {
  preview: (payload) => api.post('/food-logs/preview', payload).then((r) => r.data),
  create: (payload) => api.post('/food-logs', payload).then((r) => r.data),
  getToday: (date) => api.get('/food-logs/today', { params: date ? { date } : {} }).then((r) => r.data),
  getHistory: (params) => api.get('/food-logs/history', { params }).then((r) => r.data),
  update: (id, payload) => api.put(`/food-logs/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/food-logs/${id}`).then((r) => r.data),
};

export const goalsApi = {
  get: () => api.get('/goals').then((r) => r.data),
  update: (payload) => api.put('/goals', payload).then((r) => r.data),
};

export const dashboardApi = {
  getSummary: (date) =>
    api.get('/dashboard/summary', { params: date ? { date } : {} }).then((r) => r.data),
  getDailySummary: (date) =>
    api.get('/summary/daily', { params: date ? { date } : {} }).then((r) => r.data),
  getWeeklySummary: (date) =>
    api.get('/summary/weekly', { params: date ? { date } : {} }).then((r) => r.data),
};

export const barcodeApi = {
  lookup: (barcode) => api.get(`/barcode/${encodeURIComponent(barcode)}`).then((r) => r.data),
};

export default api;
