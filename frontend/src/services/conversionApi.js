import apiClient from './api';

export const conversionApi = {
  async logConversion(data) {
    const res = await apiClient('/api/conversions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getHistory() {
    const res = await apiClient('/api/conversions');
    return res.data;
  },

  async deleteConversion(id) {
    const res = await apiClient(`/api/conversions/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },
};

export default conversionApi;
