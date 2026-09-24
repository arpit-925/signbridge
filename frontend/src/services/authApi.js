import apiClient, { setTokens, setStoredUser, clearAuthStorage } from './api';

export const authApi = {
  async register(userData) {
    const res = await apiClient('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (res.data?.accessToken) {
      setTokens(res.data.accessToken, res.data.refreshToken);
      setStoredUser(res.data.user);
    }
    return res.data;
  },

  async login(email, password, role) {
    const res = await apiClient('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    if (res.data?.accessToken) {
      setTokens(res.data.accessToken, res.data.refreshToken);
      setStoredUser(res.data.user);
    }
    return res.data;
  },

  async getMe() {
    const res = await apiClient('/api/auth/me', {
      method: 'GET',
    });
    if (res.data?.user) {
      setStoredUser(res.data.user);
    }
    return res.data;
  },

  async logout() {
    try {
      await apiClient('/api/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuthStorage();
    }
  },

  async updateProfile(profileData) {
    const res = await apiClient('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
    if (res.data) {
      setStoredUser(res.data);
    }
    return res.data;
  },

  async changePassword(currentPassword, newPassword) {
    const res = await apiClient('/api/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return res.data;
  },
};

export default authApi;
