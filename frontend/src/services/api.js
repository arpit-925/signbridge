// Centralized HTTP client for SignBridge AI frontend

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const TOKEN_KEY = 'sb_access_token';
export const REFRESH_KEY = 'sb_refresh_token';
export const USER_KEY = 'sb_user';

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
};

export const clearAuthStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

/**
 * Enhanced fetch wrapper with auto-auth and silent refresh handling
 */
export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const token = getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // If body is FormData, delete Content-Type so browser sets boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers,
  };

  let response = await fetch(url, config);

  // If 401 Unauthorized and not already refreshing or calling auth endpoints
  const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register') || endpoint.includes('/auth/refresh');

  if (response.status === 401 && !isAuthEndpoint && getRefreshToken()) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: getRefreshToken() }),
        });

        const refreshData = await refreshResponse.json();

        if (refreshResponse.ok && refreshData.success) {
          const newAccessToken = refreshData.data.accessToken;
          const newRefreshToken = refreshData.data.refreshToken;
          setTokens(newAccessToken, newRefreshToken);
          isRefreshing = false;
          onRefreshed(newAccessToken);

          // Retry the original request
          config.headers.Authorization = `Bearer ${newAccessToken}`;
          response = await fetch(url, config);
        } else {
          isRefreshing = false;
          clearAuthStorage();
          window.dispatchEvent(new CustomEvent('sb-auth-expired'));
        }
      } catch (err) {
        isRefreshing = false;
        clearAuthStorage();
        window.dispatchEvent(new CustomEvent('sb-auth-expired'));
      }
    } else {
      // Wait for refresh to finish
      const retryPromise = new Promise((resolve) => {
        subscribeTokenRefresh(async (newToken) => {
          config.headers.Authorization = `Bearer ${newToken}`;
          resolve(await fetch(url, config));
        });
      });
      response = await retryPromise;
    }
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error = new Error((data && data.message) || `HTTP error ${response.status}`);
    error.status = response.status;
    error.errors = data?.errors || [];
    error.raw = data;
    throw error;
  }

  return data;
}

export default apiClient;
