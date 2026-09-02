import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user?.refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: user.refreshToken
          });
          const updatedUser = { ...user, ...data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('token', data.token);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        }
      } catch {}

      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/** Extract a human-friendly message from an axios error / backend response. */
export const getErrorMessage = (err: any, fallback = 'Something went wrong'): string => {
  const backendMessage =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    (typeof err?.response?.data === 'string' && err.response.data) ||
    null;

  if (backendMessage && backendMessage !== 'Unauthorized' && !/^Request failed/i.test(backendMessage)) {
    return backendMessage;
  }

  const status = err?.response?.status;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403)
    return err?.config?.url?.includes('/seller/')
      ? 'Your seller account may be awaiting admin approval. You cannot perform this action yet.'
      : 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 413) return 'The file is too large.';
  if (!err?.response) return 'Cannot reach the server. Please check your connection.';

  return fallback;
};

export default api;
