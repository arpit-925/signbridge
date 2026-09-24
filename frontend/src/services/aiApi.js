import apiClient from './api';

export const aiApi = {
  async predictSign({ sessionId, frames = [], language = 'en', file = null } = {}) {
    if (file) {
      const formData = new FormData();
      formData.append('file', file, 'frame.jpg');
      if (sessionId) formData.append('sessionId', sessionId);
      if (language) formData.append('language', language);
      const res = await apiClient('/api/ai/sign/predict', {
        method: 'POST',
        body: formData,
      });
      return res.data;
    }

    const res = await apiClient('/api/ai/sign/predict', {
      method: 'POST',
      body: JSON.stringify({ sessionId, frames, language }),
    });
    return res.data;
  },

  async textToSign({ text, language = 'en' }) {
    const res = await apiClient('/api/ai/text-to-sign', {
      method: 'POST',
      body: JSON.stringify({ text, language }),
    });
    return res.data;
  },

  async predictObject({ imageBase64 = '', mode = 'Learn Mode', file = null } = {}) {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (mode) formData.append('mode', mode);
      const res = await apiClient('/api/ai/object-recognition', {
        method: 'POST',
        body: formData,
      });
      return res.data;
    }

    const res = await apiClient('/api/ai/object-recognition', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, mode }),
    });
    return res.data;
  },

  async healthCheck() {
    const res = await apiClient('/api/ai/health');
    return res.data;
  },
};

export default aiApi;
