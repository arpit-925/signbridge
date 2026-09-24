const express = require('express');
const messagingService = require('../services/messaging.service');
const { authenticate } = require('../middleware/auth');
const { successResponse } = require('../utils/response');

const router = express.Router();
router.use(authenticate);

router.get('/conversations', async (req, res, next) => {
  try {
    const list = await messagingService.getConversations(req.user._id);
    return successResponse(res, list, 'Conversations retrieved');
  } catch (error) {
    next(error);
  }
});

router.get('/:conversationId', async (req, res, next) => {
  try {
    const messages = await messagingService.getMessages(req.params.conversationId);
    return successResponse(res, messages, 'Messages retrieved');
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const msg = await messagingService.sendMessage(req.user._id, req.body);
    return successResponse(res, msg, 'Message sent', 201);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const updated = await messagingService.markAsRead(req.params.id, req.user._id);
    return successResponse(res, updated, 'Message marked as read');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
