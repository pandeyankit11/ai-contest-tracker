
const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';
const BASE_URL = import.meta.env.VITE_API_URL || 'https://ai-contest-tracker-v2.onrender.com';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    clearStoredAuth();
    return null;
  }
}

function buildUrl(endpoint) {
  if (endpoint.startsWith('http')) {
    return endpoint;
  }

  return `${BASE_URL}${endpoint}`;
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Server returned an invalid response');
  }
}

function getErrorMessage(payload, status) {
  if (typeof payload?.error === 'string') {
    return payload.error;
  }

  if (payload?.error?.message) {
    return payload.error.message;
  }

  if (payload?.message) {
    return payload.message;
  }

  return `Request failed with status ${status}`;
}

async function request(endpoint, options = {}) {
  const { returnEnvelope = false, ...fetchOptions } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };
  const token = getStoredToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(buildUrl(endpoint), {
      ...fetchOptions,
      headers,
    });
  } catch {
    throw new Error('Network error. Please check your connection.');
  }

  const payload = await parseResponse(response);

  if (!response.ok || payload?.success === false) {
    const message = getErrorMessage(payload, response.status);
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;

    if (response.status === 401 && endpoint !== '/api/auth/login') {
      clearStoredAuth();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    throw error;
  }

  return returnEnvelope ? payload : payload?.data ?? payload;
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, data, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: (endpoint, data, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export const authAPI = {
  register: (email, password,passwordConfirmation) => api.post('/api/auth/register', { email, password,passwordConfirmation}),
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me'),
};

export const codeforcesAPI = {
  profile: () => api.get('/api/codeforces/profile'),
};

export const platformAPI = {
  list: () => api.get('/api/platforms'),
  create: (platform, handle) => api.post('/api/platforms', { platform, handle }),
  delete: (id) => api.delete(`/api/platforms/${id}`),
};

export const contestAPI = {
  upcoming: ({ page = 1, limit = 5, days = 30, platform = '' } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      days: String(days),
    });

    if (platform) {
      params.set('platform', platform);
    }

    return api.get(`/api/contests/upcoming?${params.toString()}`, {
      returnEnvelope: true,
    });
  },
};

export default api;
