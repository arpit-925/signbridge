const adminService = require('../services/admin.service');
const { successResponse } = require('../utils/response');

class AdminController {
  async getDashboard(req, res, next) {
    try {
      const data = await adminService.getDashboard();
      return successResponse(res, data, 'Admin dashboard retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const { role, search, page, limit } = req.query;
      const { users, pagination } = await adminService.getUsers({ role, search, page, limit });
      return successResponse(res, users, 'Users retrieved', 200, pagination);
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const updated = await adminService.updateUserStatus(req.params.id, req.body);
      return successResponse(res, updated, 'User status updated');
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      const analytics = await adminService.getAnalytics();
      return successResponse(res, analytics, 'Analytics data aggregated');
    } catch (error) {
      next(error);
    }
  }

  async getClasses(req, res, next) {
    try {
      const classes = await adminService.getClasses();
      return successResponse(res, classes, 'Admin classes retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getLessons(req, res, next) {
    try {
      const lessons = await adminService.getLessons();
      return successResponse(res, lessons, 'Admin lessons retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
