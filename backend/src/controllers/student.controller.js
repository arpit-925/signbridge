const studentService = require('../services/student.service');
const { successResponse } = require('../utils/response');

class StudentController {
  async getDashboard(req, res, next) {
    try {
      const data = await studentService.getDashboard(req.user._id);
      return successResponse(res, data, 'Student dashboard data retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getLessons(req, res, next) {
    try {
      const { category, search, page, limit } = req.query;
      const { lessons, pagination } = await studentService.getLessons(req.user._id, { category, search, page, limit });
      return successResponse(res, lessons, 'Lessons retrieved', 200, pagination);
    } catch (error) {
      next(error);
    }
  }

  async getLessonById(req, res, next) {
    try {
      const lesson = await studentService.getLessonById(req.user._id, req.params.id);
      return successResponse(res, lesson, 'Lesson retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateLessonProgress(req, res, next) {
    try {
      const result = await studentService.updateLessonProgress(req.user._id, req.params.id, req.body);
      return successResponse(res, result, 'Lesson progress updated');
    } catch (error) {
      next(error);
    }
  }

  async getQuizzes(req, res, next) {
    try {
      const { quizzes, pagination } = await studentService.getQuizzes(req.query);
      return successResponse(res, quizzes, 'Quizzes retrieved', 200, pagination);
    } catch (error) {
      next(error);
    }
  }

  async getQuizById(req, res, next) {
    try {
      const quiz = await studentService.getQuizById(req.params.id);
      return successResponse(res, quiz, 'Quiz details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async attemptQuiz(req, res, next) {
    try {
      const result = await studentService.attemptQuiz(req.user._id, req.params.id, req.body);
      return successResponse(res, result, 'Quiz attempt evaluated');
    } catch (error) {
      next(error);
    }
  }

  async getProgress(req, res, next) {
    try {
      const progress = await studentService.getStudentProgress(req.user._id);
      return successResponse(res, progress, 'Student progress retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getAchievements(req, res, next) {
    try {
      const achievements = await studentService.getAchievements(req.user._id);
      return successResponse(res, achievements, 'Achievements retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getAssignments(req, res, next) {
    try {
      const assignments = await studentService.getAssignments(req.user._id);
      return successResponse(res, assignments, 'Assignments retrieved');
    } catch (error) {
      next(error);
    }
  }

  async submitAssignment(req, res, next) {
    try {
      const submission = await studentService.submitAssignment(req.user._id, req.params.id, req.body);
      return successResponse(res, submission, 'Assignment submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req, res, next) {
    try {
      const notifications = await studentService.getNotifications(req.user._id);
      return successResponse(res, notifications, 'Notifications retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const messages = await studentService.getMessages(req.user._id);
      return successResponse(res, messages, 'Messages retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getConversions(req, res, next) {
    try {
      const history = await studentService.getConversions(req.user._id);
      return successResponse(res, history, 'Conversions retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StudentController();
