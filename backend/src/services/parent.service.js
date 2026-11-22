const ParentProfile = require('../models/ParentProfile');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const LessonProgress = require('../models/LessonProgress');
const QuizAttempt = require('../models/QuizAttempt');
const Submission = require('../models/Submission');
const Feedback = require('../models/Feedback');
const Message = require('../models/Message');
const Class = require('../models/Class');
const messagingService = require('./messaging.service');
const { ForbiddenError, NotFoundError, BadRequestError } = require('../utils/errors');

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ''));

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

class ParentService {
  async getProfile(parentId) {
    const profile = await ParentProfile.findOne({ userId: parentId }).populate('children').lean();
    if (!profile) {
      throw new ForbiddenError('Parent profile not configured');
    }
    return profile;
  }

  async getChildren(parentId) {
    const profile = await this.getProfile(parentId);
    const children = profile.children || [];
    const childIds = children.map((c) => c._id);

    const [studentProfiles, progresses] = await Promise.all([
      StudentProfile.find({ userId: { $in: childIds } }).lean(),
      LessonProgress.find({ studentId: { $in: childIds } })
        .populate('lessonId', 'title category')
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    const profileMap = new Map(studentProfiles.map((p) => [p.userId.toString(), p]));

    return children.map((child) => {
      const studentProfile = profileMap.get(child._id.toString());
      const childProgress = progresses.filter((p) => p.studentId.toString() === child._id.toString());
      const latest = childProgress[0];
      const progress =
        childProgress.length > 0
          ? Math.round(
              childProgress.reduce((sum, p) => sum + (p.percentage || 0), 0) / childProgress.length
            )
          : 0;

      return {
        id: child._id,
        name: child.name,
        email: child.email,
        grade: studentProfile?.grade || 'Grade 6',
        school: studentProfile?.school || 'Metro Public School',
        lesson: latest?.lessonId?.title || 'No lesson activity yet',
        progress,
        avatar: initials(child.name),
      };
    });
  }

  async getDashboard(parentId) {
    const children = await this.getChildren(parentId);
    const childIds = children.map((c) => c.id);

    const [studentProfiles, progresses, attempts, submissions] = await Promise.all([
      StudentProfile.find({ userId: { $in: childIds } }).lean(),
      LessonProgress.find({ studentId: { $in: childIds } }).lean(),
      QuizAttempt.find({ studentId: { $in: childIds } }).lean(),
      Submission.find({ studentId: { $in: childIds } })
        .populate('studentId', 'name')
        .populate('assignmentId', 'title')
        .sort({ submittedAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const completedLessons = progresses.filter((p) => p.status === 'Completed').length;
    const averageQuiz =
      attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length)
        : 0;
    const combinedStreak = studentProfiles.reduce((sum, p) => sum + (p.streak || 0), 0);
    const pendingSubmissions = submissions.filter((s) => s.status === 'Awaiting Review').length;

    const parentKPIs = [
      {
        label: 'Weekly Lessons Completed',
        value: `${completedLessons} / ${progresses.length}`,
        sub: 'Across all registered children',
      },
      {
        label: 'Average Quiz Trend',
        value: `${averageQuiz}%`,
        sub: attempts.length > 0 ? `Based on ${attempts.length} attempts` : 'No quiz attempts yet',
      },
      {
        label: 'Combined Streak',
        value: `${combinedStreak} Days`,
        sub: 'Combined active learning streak',
      },
    ];

    const parentTimeline = submissions.map((s) => ({
      child: s.studentId?.name || 'Student',
      action: `submitted "${s.assignmentId?.title || 'an assignment'}"`,
      detail: s.status === 'Graded' && s.score != null ? `Score: ${s.score}%` : s.status,
      time: s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '',
      icon: s.status === 'Graded' ? '✅' : '📝',
    }));

    const parentAlerts = [];
    if (pendingSubmissions > 0) {
      parentAlerts.push({
        type: 'orange',
        text: `${pendingSubmissions} submission(s) from your children are awaiting teacher review.`,
      });
    }
    if (children.length === 0) {
      parentAlerts.push({
        type: 'pink',
        text: 'No children are linked to this parent account yet. Contact your school administrator.',
      });
    }

    return {
      kpis: parentKPIs,
      children,
      timeline: parentTimeline,
      alerts: parentAlerts,
    };
  }

  async verifyChildAccess(parentId, childId) {
    if (!isObjectId(childId)) {
      throw new ForbiddenError('Unauthorized: You can only view progress for your registered children');
    }

    const parentProfile = await ParentProfile.findOne({ userId: parentId });
    if (!parentProfile) {
      throw new ForbiddenError('Parent profile not configured');
    }

    const hasAccess = parentProfile.children.some((c) => c.toString() === childId.toString());
    if (!hasAccess) {
      throw new ForbiddenError('Unauthorized: You can only view progress for your registered children');
    }

    return true;
  }

  async getChildProgress(parentId, childId) {
    await this.verifyChildAccess(parentId, childId);

    const [progresses, feedback, quizAttempts] = await Promise.all([
      LessonProgress.find({ studentId: childId }).populate('lessonId', 'title category').lean(),
      Feedback.findOne({ studentId: childId })
        .populate('teacherId', 'name')
        .sort({ createdAt: -1 })
        .lean(),
      QuizAttempt.find({ studentId: childId }).lean(),
    ]);

    const subjectMap = new Map();
    progresses.forEach((p) => {
      const category = p.lessonId?.category || 'General';
      if (!subjectMap.has(category)) subjectMap.set(category, []);
      subjectMap.get(category).push(p.percentage || 0);
    });

    const colors = ['teal', 'blue', 'orange', 'purple'];
    const childSubjects = Array.from(subjectMap.entries()).map(([subject, values], index) => ({
      subject,
      percent: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      color: colors[index % colors.length],
    }));

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyEngagement = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      const activityCount = progresses.filter(
        (p) => p.updatedAt && p.updatedAt >= date && p.updatedAt < next
      ).length;
      dailyEngagement.push({
        day: days[date.getDay()],
        hours: Number((activityCount * 0.5).toFixed(1)),
      });
    }

    const teacherFeedback = feedback
      ? {
          teacher: feedback.teacherId?.name || 'Teacher',
          subject: feedback.subject || 'General',
          comment: feedback.comments,
        }
      : null;

    const averageQuiz =
      quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / quizAttempts.length)
        : 0;

    const supportiveStrategy =
      averageQuiz > 0
        ? `Continue daily practice; the current quiz average is ${averageQuiz}%.`
        : 'Encourage daily ASL practice using the lesson modules to build a baseline.';

    return {
      childSubjects,
      dailyEngagement,
      teacherFeedback,
      supportiveStrategy,
    };
  }

  async getChildActivity(parentId, childId) {
    await this.verifyChildAccess(parentId, childId);

    const [progresses, attempts, submissions] = await Promise.all([
      LessonProgress.find({ studentId: childId }).populate('lessonId', 'title').lean(),
      QuizAttempt.find({ studentId: childId }).populate('quizId', 'title').lean(),
      Submission.find({ studentId: childId }).populate('assignmentId', 'title').lean(),
    ]);

    const activity = [
      ...progresses.map((p) => ({
        action:
          p.status === 'Completed'
            ? `Completed Lesson: ${p.lessonId?.title || 'Lesson'}`
            : `Studied Lesson: ${p.lessonId?.title || 'Lesson'}`,
        time: p.updatedAt,
        score: p.status === 'Completed' ? 'Completed' : `${p.percentage || 0}%`,
      })),
      ...attempts.map((a) => ({
        action: `Submitted Quiz: ${a.quizId?.title || 'Quiz'}`,
        time: a.completedAt || a.createdAt,
        score: `${a.percentage || 0}%`,
      })),
      ...submissions.map((s) => ({
        action: `Submitted Assignment: ${s.assignmentId?.title || 'Assignment'}`,
        time: s.submittedAt,
        score: s.score != null ? `${s.score}%` : s.status,
      })),
    ];

    return activity
      .filter((item) => item.time)
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10)
      .map((item) => ({
        action: item.action,
        time: new Date(item.time).toLocaleString(),
        score: item.score,
      }));
  }

  async getMessages(parentId) {
    return Message.find({
      $or: [{ sender: parentId }, { receiver: parentId }],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role avatar')
      .populate('receiver', 'name role avatar')
      .lean();
  }

  async resolveReceiver(parentId, receiverId) {
    if (receiverId) {
      if (!isObjectId(receiverId)) {
        throw new BadRequestError('A valid receiverId is required');
      }
      const exists = await User.exists({ _id: receiverId });
      if (!exists) {
        throw new NotFoundError('Recipient not found');
      }
      return receiverId;
    }

    const lastMessage = await Message.findOne({
      $or: [{ sender: parentId }, { receiver: parentId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    if (lastMessage) {
      return lastMessage.sender.toString() === parentId.toString()
        ? lastMessage.receiver
        : lastMessage.sender;
    }

    const profile = await ParentProfile.findOne({ userId: parentId }).lean();
    const childIds = profile?.children || [];
    const classroom = await Class.findOne({ students: { $in: childIds } })
      .sort({ createdAt: -1 })
      .lean();

    if (classroom?.teacherId) {
      return classroom.teacherId;
    }

    throw new BadRequestError('No teacher is available to receive this message yet');
  }

  async sendMessage(parentId, { receiverId, text, body, subject }) {
    const content = (body || text || '').trim();
    if (!content) {
      throw new BadRequestError('Message body is required');
    }

    const target = await this.resolveReceiver(parentId, receiverId);
    return messagingService.sendMessage(parentId, {
      receiverId: target,
      body: content,
      subject: subject || 'Parent Communication',
    });
  }
}

module.exports = new ParentService();
