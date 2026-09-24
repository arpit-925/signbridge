import apiClient from './api';

export const teacherApi = {
  async getDashboard() {
    const res = await apiClient('/api/teacher/dashboard');
    return res.data;
  },

  async getClasses() {
    const res = await apiClient('/api/teacher/classes');
    return res.data;
  },

  async createClass(classData) {
    const res = await apiClient('/api/teacher/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
    return res.data;
  },

  async updateClass(id, classData) {
    const res = await apiClient(`/api/teacher/classes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(classData),
    });
    return res.data;
  },

  async deleteClass(id) {
    const res = await apiClient(`/api/teacher/classes/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  async getClassStudents(classId) {
    const res = await apiClient(`/api/teacher/classes/${classId}/students`);
    return res.data;
  },

  async createAssignment(assignmentData) {
    const res = await apiClient('/api/teacher/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
    return res.data;
  },

  async updateAssignment(id, data) {
    const res = await apiClient(`/api/teacher/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteAssignment(id) {
    const res = await apiClient(`/api/teacher/assignments/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  async getSubmissions(classId) {
    const query = classId ? `?classId=${classId}` : '';
    const res = await apiClient(`/api/teacher/submissions${query}`);
    return res.data;
  },

  async gradeSubmission(id, { score, feedback, status = 'Graded' }) {
    const res = await apiClient(`/api/teacher/submissions/${id}/grade`, {
      method: 'PATCH',
      body: JSON.stringify({ score, feedback, status }),
    });
    return res.data;
  },

  async getStudentProgress(studentId) {
    const res = await apiClient(`/api/teacher/students/${studentId}/progress`);
    return res.data;
  },

  async getResources() {
    const res = await apiClient('/api/teacher/resources');
    return res.data;
  },

  async createResource(resourceData) {
    const res = await apiClient('/api/teacher/resources', {
      method: 'POST',
      body: JSON.stringify(resourceData),
    });
    return res.data;
  },
};

export default teacherApi;
