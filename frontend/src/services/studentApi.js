import apiClient from './api';

export const studentApi = {
  async getDashboard() {
    const res = await apiClient('/api/student/dashboard');
    return res.data;
  },

  async getLessons({ category, search, page = 1, limit = 12 } = {}) {
    const params = new URLSearchParams();
    if (category && category !== 'All Signs') params.append('category', category);
    if (search) params.append('search', search);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const query = params.toString();
    const res = await apiClient(`/api/student/lessons${query ? `?${query}` : ''}`);
    return {
      lessons: res.data || [],
      pagination: res.pagination || {},
    };
  },

  async getLessonById(id) {
    const res = await apiClient(`/api/student/lessons/${id}`);
    return res.data;
  },

  async updateLessonProgress(id, { percentage, status, lastWatchedPosition }) {
    const res = await apiClient(`/api/student/lessons/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ percentage, status, lastWatchedPosition }),
    });
    return res.data;
  },

  async getQuizzes({ page = 1, limit = 10 } = {}) {
    const res = await apiClient(`/api/student/quizzes?page=${page}&limit=${limit}`);
    return {
      quizzes: res.data || [],
      pagination: res.pagination || {},
    };
  },

  async getQuizById(id) {
    const res = await apiClient(`/api/student/quizzes/${id}`);
    return res.data;
  },

  async attemptQuiz(id, answers) {
    const res = await apiClient(`/api/student/quizzes/${id}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    return res.data;
  },

  async getProgress() {
    const res = await apiClient('/api/student/progress');
    return res.data;
  },

  async getAchievements() {
    const res = await apiClient('/api/student/achievements');
    return res.data;
  },

  async getAssignments() {
    const res = await apiClient('/api/student/assignments');
    return res.data;
  },

  async submitAssignment(id, { submissionText, mediaUrl, aiPrediction }) {
    const res = await apiClient(`/api/student/assignments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submissionText, mediaUrl, aiPrediction }),
    });
    return res.data;
  },

  async getNotifications() {
    const res = await apiClient('/api/student/notifications');
    return res.data;
  },

  async getMessages() {
    const res = await apiClient('/api/student/messages');
    return res.data;
  },

  async getConversions() {
    const res = await apiClient('/api/student/conversions');
    return res.data;
  },
};

export default studentApi;
