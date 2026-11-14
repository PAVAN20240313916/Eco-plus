import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Attach JWT token from localStorage automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecopulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired/invalid tokens uniformly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('ecopulse_token');
        localStorage.removeItem('ecopulse_org');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (payload) => apiClient.post('/auth/register', payload),
  getMe: () => apiClient.get('/auth/me')
};

export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats')
};

export const inventoryAPI = {
  getAll: () => apiClient.get('/inventory'),
  create: (item) => apiClient.post('/inventory', item),
  update: (id, fields) => apiClient.put(`/inventory/${id}`, fields),
  remove: (id) => apiClient.delete(`/inventory/${id}`)
};

export const wasteAPI = {
  getAll: () => apiClient.get('/waste'),
  create: (log) => apiClient.post('/waste', log),
  remove: (id) => apiClient.delete(`/waste/${id}`)
};

export const aiAPI = {
  getForecast: (payload = {}) => apiClient.post('/ai/forecast', payload),
  matchSurplus: (items = []) => apiClient.post('/ai/surplus-match', { items }),
  getHistory: () => apiClient.get('/ai/history')
};

export const surplusAPI = {
  getAll: () => apiClient.get('/surplus'),
  create: (listing) => apiClient.post('/surplus', listing),
  updateStatus: (id, status, partnerInfo = {}) =>
    apiClient.patch(`/surplus/${id}/status`, { status, ...partnerInfo })
};

export default apiClient;
