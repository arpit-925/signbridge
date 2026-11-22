const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Resource = require('../models/Resource');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');

class TeacherService {
  async getDashboard(teacherId) {
    const classes = await Class.find({ teacherId }).populate('students', 'name email avatar');
    const totalStudents = classes.reduce((acc, c) => acc + (c.students?.length || 0), 0);
    const classIds = classes.map((c) => c._id);
    const pendingGrading = await Submission.countDocuments({
      classId: { $in: classIds },
      status: 'Awaiting Review',
    });

    const kpis = [
      { label: 'Total Students', value: `${totalStudents}`, sub: 'Across your active classes' },
      { label: 'Active Classes', value: `${classes.length}`, sub: 'Classes assigned to you' },
      { label: 'Pending Grading', value: `${pendingGrading}`, sub: 'Submissions needing verification' },
      { label: 'Avg. Progress', value: '82%', sub: '+4% increase from last week' },
    ];

    const classroomAgenda = [
      { time: '09:00', grade: 'Grade 2', title: 'ASL Beginners Greetings', type: 'Live Co-coaching Lesson', status: 'Active Now', statusType: 'active' },
      { time: '11:30', grade: 'Grade 3', title: 'Fractions Practice Quiz Review', type: 'Review auto-graded submissions', status: 'Upcoming', statusType: 'upcoming' },
    ];

    const recentActivity = [
      { student: 'Leo Chen', action: 'submitted "Water Cycle Signs"', detail: 'score 100%', time: '5m ago', icon: '✅' },
      { student: 'Mia Rose', action: 'earned the "7 Day Streak" achievement badge', detail: '', time: '1h ago', icon: '🏆' },
    ];

    const teacherAlerts = [
      { type: 'pink', text: '3 students are falling behind class average in ASL basics.' },
      { type: 'orange', text: 'Grade 3 fractions module has 4 un-graded video questions.' },
    ];

    return {
      kpis,
      classroomAgenda,
      recentActivity,
      teacherAlerts,
    };
  }

  async getClasses(teacherId) {
    const classes = await Class.find({ teacherId }).lean();
    return classes.map((c) => ({
      id: c._id,
      name: c.name,
      grade: c.grade,
      roster: c.students?.length || 0,
      module: c.module || 'Greetings module',
      progress: c.progress || 0,
    }));
  }

  async createClass(teacherId, data) {
    const newClass = await Class.create({
      name: data.name,
      code: data.code,
      grade: data.grade,
      module: data.module,
      students: data.students,
      progress: data.progress,
      schedule: data.schedule,
      teacherId,
    });
    return newClass;
  }

  async updateClass(teacherId, classId, data) {
    const target = await Class.findOne({ _id: classId, teacherId });
    if (!target) throw new NotFoundError('Class not found or unauthorized');

    // Never allow ownership (teacherId) or _id to be reassigned through the API.
    const allowed = ['name', 'code', 'grade', 'module', 'students', 'progress', 'schedule'];
    allowed.forEach((field) => {
      if (data[field] !== undefined) target[field] = data[field];
    });
    await target.save();
    return target;
  }

  async deleteClass(teacherId, classId) {
    const target = await Class.findOneAndDelete({ _id: classId, teacherId });
    if (!target) throw new NotFoundError('Class not found or unauthorized');
    return true;
  }

  async getClassStudents(teacherId, classId) {
    const target = await Class.findOne({ _id: classId, teacherId }).populate('students');
    if (!target) {
      throw new NotFoundError('Class not found or unauthorized');
    }

    return target.students.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      enrollment: 'Sep 4, 2025',
      progress: 80,
      lastActive: 'Today, 09:30 AM',
    }));
  }

  async createAssignment(teacherId, data) {
    if (!data.classId) {
      throw new BadRequestError('classId is required');
    }
    const ownsClass = await Class.exists({ _id: data.classId, teacherId });
    if (!ownsClass) {
      throw new ForbiddenError('You can only assign work to your own classes');
    }

    const assignment = await Assignment.create({
      title: data.title,
      classId: data.classId,
      description: data.description,
      includedLessonResource: data.includedLessonResource,
      dueDate: data.dueDate,
      status: data.status || 'Published',
      teacherId,
    });
    return assignment;
  }

  async updateAssignment(teacherId, assignmentId, data) {
    const assignment = await Assignment.findOne({ _id: assignmentId, teacherId });
    if (!assignment) throw new NotFoundError('Assignment not found or unauthorized');

    if (data.classId && data.classId.toString() !== assignment.classId.toString()) {
      const ownsClass = await Class.exists({ _id: data.classId, teacherId });
      if (!ownsClass) {
        throw new ForbiddenError('You can only move work to your own classes');
      }
    }

    const allowed = ['title', 'classId', 'description', 'includedLessonResource', 'dueDate', 'status'];
    allowed.forEach((field) => {
      if (data[field] !== undefined) assignment[field] = data[field];
    });
    await assignment.save();
    return assignment;
  }

  async deleteAssignment(teacherId, assignmentId) {
    const assignment = await Assignment.findOneAndDelete({ _id: assignmentId, teacherId });
    if (!assignment) throw new NotFoundError('Assignment not found or unauthorized');
    return true;
  }

  async getSubmissions(teacherId) {
    const classes = await Class.find({ teacherId }).select('_id').lean();
    const classIds = classes.map((c) => c._id);

    const submissions = await Submission.find({ classId: { $in: classIds } })
      .populate('studentId', 'name email avatar')
      .populate('assignmentId', 'title')
      .sort({ submittedAt: -1 })
      .lean();

    return submissions.map((s, i) => ({
      id: s._id,
      name: s.studentId?.name || 'Student',
      assignment: s.assignmentId?.title || 'Untitled assignment',
      time: s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '',
      status: s.status,
      selected: i === 0,
      submissionVideoUrl: s.submissionVideoUrl,
      textResponse: s.textResponse,
      aiPrediction: s.aiPrediction,
      score: s.score,
      feedback: s.feedback,
    }));
  }

  async gradeSubmission(teacherId, submissionId, { score, feedback, status = 'Graded' }) {
    if (!submissionId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestError('Invalid submission id');
    }
    if (!['Graded', 'Returned'].includes(status)) {
      throw new BadRequestError('Invalid grading status');
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new NotFoundError('Submission not found');
    }

    const ownsClass = await Class.exists({ _id: submission.classId, teacherId });
    if (!ownsClass) {
      throw new ForbiddenError('You can only grade submissions from your own classes');
    }

    submission.score = score;
    submission.feedback = feedback;
    submission.status = status;
    submission.gradedAt = new Date();
    submission.gradedBy = teacherId;
    await submission.save();

    return submission;
  }

  async getStudentProgress(teacherId, studentId) {
    const monitoringKPIs = [
      { label: 'Class Average', value: '84%', sub: '8% ahead of school baseline' },
      { label: 'Avg. Completion Rate', value: '91%', sub: 'Avg. 11/12 weekly lessons done' },
      { label: 'Needs Intervention', value: '3', sub: 'Students score below 70%' },
    ];

    const performanceTable = [
      { name: 'Leo Chen', completed: '9 / 12', quizScore: '92%', streak: '7 Days', status: 'Excelling' },
      { name: 'Mia Rose', completed: '8 / 12', quizScore: '85%', streak: '5 Days', status: 'On Track' },
      { name: 'Alex Dunphy', completed: '5 / 12', quizScore: '62%', streak: '2 Days', status: 'Needs Help' },
    ];

    const studentDetail = {
      name: 'Leo Chen',
      breakdown: [
        { label: 'ASL Basics', value: 95, color: 'teal' },
        { label: 'Vocabulary Retention', value: 80, color: 'blue' },
      ],
    };

    return {
      monitoringKPIs,
      performanceTable,
      studentDetail,
    };
  }

  async getResources() {
    const list = await Resource.find().lean();
    if (list.length > 0) return list;

    return [
      { title: 'ASL Greeting Worksheets', type: 'Printable Classroom Materials', grade: 'Grade 1-3', badge: 'FREE STANDARD' },
      { title: 'Math Signs Teaching Guide', type: 'Instructional Video Reference', grade: 'Teacher Prep', badge: 'FREE STANDARD' },
    ];
  }

  async createResource(teacherId, data) {
    const resource = await Resource.create({
      ...data,
      createdBy: teacherId,
    });
    return resource;
  }
}

module.exports = new TeacherService();
