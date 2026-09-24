import apiClient from './api';

export const notificationApi = {
  async getNotifications() {
    const res = await apiClient('/api/notifications');
    return res.data;
  },

  async markAsRead(id) {
    const res = await apiClient(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return res.data;
  },

  async markAllAsRead() {
    const res = await apiClient('/api/notifications/read-all', {
      method: 'PATCH',
    });
    return res.data;
  },
};

export default notificationApi;
