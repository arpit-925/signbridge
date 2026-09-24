const express = require('express');
const studentController = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('student', 'admin'));

router.get('/dashboard', studentController.getDashboard);

router.get('/lessons', studentController.getLessons);
router.get('/lessons/:id', studentController.getLessonById);
router.post('/lessons/:id/progress', studentController.updateLessonProgress);

router.get('/quizzes', studentController.getQuizzes);
router.get('/quizzes/:id', studentController.getQuizById);
router.post('/quizzes/:id/attempt', studentController.attemptQuiz);

router.get('/progress', studentController.getProgress);
router.get('/achievements', studentController.getAchievements);

router.get('/assignments', studentController.getAssignments);
router.post('/assignments/:id/submit', studentController.submitAssignment);

router.get('/notifications', studentController.getNotifications);
router.get('/messages', studentController.getMessages);
router.get('/conversions', studentController.getConversions);

module.exports = router;
