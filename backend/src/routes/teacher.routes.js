const express = require('express');
const teacherController = require('../controllers/teacher.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('teacher', 'admin'));

router.get('/dashboard', teacherController.getDashboard);

router.get('/classes', teacherController.getClasses);
router.post('/classes', teacherController.createClass);
router.patch('/classes/:id', teacherController.updateClass);
router.delete('/classes/:id', teacherController.deleteClass);
router.get('/classes/:id/students', teacherController.getClassStudents);

router.post('/assignments', teacherController.createAssignment);
router.patch('/assignments/:id', teacherController.updateAssignment);
router.delete('/assignments/:id', teacherController.deleteAssignment);

router.get('/submissions', teacherController.getSubmissions);
router.patch('/submissions/:id/grade', teacherController.gradeSubmission);

router.get('/students/:id/progress', teacherController.getStudentProgress);

router.get('/resources', teacherController.getResources);
router.post('/resources', teacherController.createResource);

module.exports = router;
