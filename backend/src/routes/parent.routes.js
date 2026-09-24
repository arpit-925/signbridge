const express = require('express');
const parentController = require('../controllers/parent.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('parent', 'admin'));

router.get('/dashboard', parentController.getDashboard);
router.get('/children', parentController.getChildren);
router.get('/children/:id/progress', parentController.getChildProgress);
router.get('/children/:id/activity', parentController.getChildActivity);
router.get('/messages', parentController.getMessages);
router.post('/messages', parentController.sendMessage);

module.exports = router;
