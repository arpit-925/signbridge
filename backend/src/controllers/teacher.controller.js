const teacherService = require('../services/teacher.service');
const { successResponse } = require('../utils/response');

class TeacherController {
  async getDashboard(req, res, next) {
    try {
      const data = await teacherService.getDashboard(req.user._id);
      return successResponse(res, data, 'Teacher dashboard retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getClasses(req, res, next) {
    try {
      const classes = await teacherService.getClasses(req.user._id);
      return successResponse(res, classes, 'Classes retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createClass(req, res, next) {
    try {
      const newClass = await teacherService.createClass(req.user._id, req.body);
      return successResponse(res, newClass, 'Class created', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateClass(req, res, next) {
    try {
      const updated = await teacherService.updateClass(req.user._id, req.params.id, req.body);
      return successResponse(res, updated, 'Class updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteClass(req, res, next) {
    try {
      await teacherService.deleteClass(req.user._id, req.params.id);
      return successResponse(res, null, 'Class deleted');
    } catch (error) {
      next(error);
    }
  }

  async getClassStudents(req, res, next) {
    try {
      const students = await teacherService.getClassStudents(req.user._id, req.params.id);
      return successResponse(res, students, 'Class roster retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createAssignment(req, res, next) {
    try {
      const assignment = await teacherService.createAssignment(req.user._id, req.body);
      return successResponse(res, assignment, 'Assignment created', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAssignment(req, res, next) {
    try {
      const updated = await teacherService.updateAssignment(req.user._id, req.params.id, req.body);
      return successResponse(res, updated, 'Assignment updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteAssignment(req, res, next) {
    try {
      await teacherService.deleteAssignment(req.user._id, req.params.id);
      return successResponse(res, null, 'Assignment deleted');
    } catch (error) {
      next(error);
    }
  }

  async getSubmissions(req, res, next) {
    try {
      const submissions = await teacherService.getSubmissions(req.user._id);
      return successResponse(res, submissions, 'Evaluation queue retrieved');
    } catch (error) {
      next(error);
    }
  }

  async gradeSubmission(req, res, next) {
    try {
      const graded = await teacherService.gradeSubmission(req.user._id, req.params.id, req.body);
      return successResponse(res, graded, 'Submission graded successfully');
    } catch (error) {
      next(error);
    }
  }

  async getStudentProgress(req, res, next) {
    try {
      const progress = await teacherService.getStudentProgress(req.user._id, req.params.id);
      return successResponse(res, progress, 'Student progress retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getResources(req, res, next) {
    try {
      const resources = await teacherService.getResources();
      return successResponse(res, resources, 'Resources retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createResource(req, res, next) {
    try {
      const resource = await teacherService.createResource(req.user._id, req.body);
      return successResponse(res, resource, 'Resource uploaded', 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeacherController();
