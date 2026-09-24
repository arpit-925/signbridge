const parentService = require('../services/parent.service');
const { successResponse } = require('../utils/response');

class ParentController {
  async getDashboard(req, res, next) {
    try {
      const data = await parentService.getDashboard(req.user._id);
      return successResponse(res, data, 'Parent dashboard retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getChildren(req, res, next) {
    try {
      const children = await parentService.getChildren(req.user._id);
      return successResponse(res, children, 'Children retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getChildProgress(req, res, next) {
    try {
      const progress = await parentService.getChildProgress(req.user._id, req.params.id);
      return successResponse(res, progress, 'Child progress retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getChildActivity(req, res, next) {
    try {
      const activity = await parentService.getChildActivity(req.user._id, req.params.id);
      return successResponse(res, activity, 'Child activity timeline retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const messages = await parentService.getMessages(req.user._id);
      return successResponse(res, messages, 'Parent messages retrieved');
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const sent = await parentService.sendMessage(req.user._id, req.body);
      return successResponse(res, sent, 'Message sent', 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ParentController();
