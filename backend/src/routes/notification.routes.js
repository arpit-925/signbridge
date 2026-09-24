const express = require('express');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');
const { successResponse } = require('../utils/response');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const list = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30);
    return successResponse(res, list, 'Notifications retrieved');
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { unread: false },
      { new: true }
    );
    return successResponse(res, updated, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id }, { unread: false });
    return successResponse(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
