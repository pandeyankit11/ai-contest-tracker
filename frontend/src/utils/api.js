const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  get: async (endpoint, options = {}) => {
    // TODO: Implement GET requests
  },

  post: async (endpoint, data, options = {}) => {
    // TODO: Implement POST requests
  },

  put: async (endpoint, data, options = {}) => {
    // TODO: Implement PUT requests
  },

  delete: async (endpoint, options = {}) => {
    // TODO: Implement DELETE requests
  },
};

export default api;
