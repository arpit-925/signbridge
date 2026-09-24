const express = require('express');
const ConversionHistory = require('../models/ConversionHistory');
const { authenticate } = require('../middleware/auth');
const { successResponse } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const router = express.Router();
router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const { inputType, predictedText, confidence, language, sessionId, metadata } = req.body;
    const history = await ConversionHistory.create({
      userId: req.user._id,
      inputType: inputType || 'sign',
      predictedText,
      confidence: confidence || 0.95,
      language: language || 'en',
      sessionId: sessionId || `sess_${Date.now()}`,
      metadata: metadata || {},
    });
    return successResponse(res, history, 'Conversion logged', 201);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const list = await ConversionHistory.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    return successResponse(res, list, 'Conversion history retrieved');
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await ConversionHistory.findOne({ _id: req.params.id, userId: req.user._id });
    if (!item) throw new NotFoundError('Conversion record not found');
    return successResponse(res, item, 'Conversion record retrieved');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await ConversionHistory.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) throw new NotFoundError('Conversion record not found');
    return successResponse(res, null, 'Conversion record deleted');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
