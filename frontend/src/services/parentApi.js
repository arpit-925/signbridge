import apiClient from './api';

export const parentApi = {
  async getDashboard() {
    const res = await apiClient('/api/parent/dashboard');
    return res.data;
  },

  async getChildren() {
    const res = await apiClient('/api/parent/children');
    return res.data;
  },

  async getChildProgress(childId) {
    const res = await apiClient(`/api/parent/children/${childId}/progress`);
    return res.data;
  },

  async getChildActivity(childId) {
    const res = await apiClient(`/api/parent/children/${childId}/activity`);
    return res.data;
  },

  async getMessages() {
    const res = await apiClient('/api/parent/messages');
    return res.data;
  },

  async sendMessage(receiverId, body, subject = 'Parent Communication') {
    const res = await apiClient('/api/parent/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, body, subject }),
    });
    return res.data;
  },
};

export default parentApi;
