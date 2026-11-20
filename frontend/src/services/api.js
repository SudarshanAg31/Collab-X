import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('collabx_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap payload + handle auth errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.error?.code;
    const message =
      error.response?.data?.error?.message || error.message || 'Something went wrong';

    // 401 → clear token + send to login (but not from auth endpoints)
    if (status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('collabx_token');
      localStorage.removeItem('collabx_user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }

    // 403 PROFILE_INCOMPLETE → redirect to profile completion
    if (status === 403 && code === 'PROFILE_INCOMPLETE') {
      if (window.location.pathname !== '/complete-profile') {
        window.location.href = '/complete-profile';
      }
    }

    return Promise.reject({
      status,
      code,
      message,
      details: error.response?.data?.error?.details,
    });
  }
);

export default api;