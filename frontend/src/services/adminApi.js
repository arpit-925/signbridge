import apiClient from './api';

export const adminApi = {
  async getDashboard() {
    const res = await apiClient('/api/admin/dashboard');
    return res.data;
  },

  async getUsers({ role, search, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const query = params.toString();
    const res = await apiClient(`/api/admin/users${query ? `?${query}` : ''}`);
    return {
      users: res.data || [],
      pagination: res.pagination || {},
    };
  },

  async updateUserStatus(userId, isActive) {
    const res = await apiClient(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    return res.data;
  },

  async getAnalytics() {
    const res = await apiClient('/api/admin/analytics');
    return res.data;
  },

  async getClasses() {
    const res = await apiClient('/api/admin/classes');
    return res.data;
  },

  async getLessons() {
    const res = await apiClient('/api/admin/lessons');
    return res.data;
  },
};

export default adminApi;
