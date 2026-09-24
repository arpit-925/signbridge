const aiService = require('../services/ai.service');
const { successResponse } = require('../utils/response');

class AiController {
  async predictSign(req, res, next) {
    try {
      const { sessionId, frames, language } = req.body || {};
      const file = req.file;
      const result = await aiService.predictSign({
        file,
        sessionId,
        frames,
        language: language || 'en',
        userId: req.user ? req.user._id : null,
      });
      return successResponse(res, result.prediction, 'Sign prediction completed', 200, null);
    } catch (error) {
      next(error);
    }
  }

  async textToSign(req, res, next) {
    try {
      const { text, language } = req.body;
      const result = await aiService.textToSign({ text, language });
      return successResponse(res, result, 'Text converted to sign sequence');
    } catch (error) {
      next(error);
    }
  }

  async predictObject(req, res, next) {
    try {
      const { image, sessionId } = req.body;
      const result = await aiService.predictObject({
        image,
        sessionId,
        userId: req.user ? req.user._id : null,
      });
      return successResponse(res, result.data, 'Object recognition completed');
    } catch (error) {
      next(error);
    }
  }

  async health(req, res, next) {
    try {
      const status = await aiService.health();
      return successResponse(res, status, 'AI service health check');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AiController();
