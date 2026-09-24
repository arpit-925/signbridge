import apiClient from './api';

export const messageApi = {
  async getConversations() {
    const res = await apiClient('/api/messages/conversations');
    return res.data;
  },

  async getMessages(conversationId) {
    const res = await apiClient(`/api/messages/${conversationId}`);
    return res.data;
  },

  async sendMessage({ receiverId, body, subject, conversationId, dueDate }) {
    const res = await apiClient('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, body, subject, conversationId, dueDate }),
    });
    return res.data;
  },

  async markAsRead(id) {
    const res = await apiClient(`/api/messages/${id}/read`, {
      method: 'PATCH',
    });
    return res.data;
  },
};

export default messageApi;
