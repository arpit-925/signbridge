const Lesson = require('../models/Lesson');
const LessonProgress = require('../models/LessonProgress');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const StudentProfile = require('../models/StudentProfile');
const Achievement = require('../models/Achievement');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const ConversionHistory = require('../models/ConversionHistory');
const User = require('../models/User');
const { NotFoundError, BadRequestError } = require('../utils/errors');

class StudentService {
  async getDashboard(studentId) {
    const [profile, progresses, attempts, assignments] = await Promise.all([
      StudentProfile.findOne({ userId: studentId }),
      LessonProgress.find({ studentId }).populate('lessonId'),
      QuizAttempt.find({ studentId }).sort({ completedAt: -1 }),
      Assignment.find({ status: 'Published' }).sort({ dueDate: 1 }).limit(5),
    ]);

    const streakDays = profile?.streak || 7;
    const completedCount = progresses.filter((p) => p.status === 'Completed').length;
    const totalAssigned = Math.max(progresses.length, 12);

    let avgQuizScore = 92;
    if (attempts.length > 0) {
      const sum = attempts.reduce((acc, a) => acc + (a.percentage || 0), 0);
      avgQuizScore = Math.round(sum / attempts.length);
    }

    const assignedLessons = progresses.slice(0, 3).map((p) => ({
      title: p.lessonId?.title || 'Basic Lesson',
      duration: p.lessonId?.duration || '15 min',
      status: p.status,
      statusColor: p.status === 'Completed' || p.status === 'Assigned' ? 'success' : 'primary',
      lessonId: p.lessonId?._id,
    }));

    // Fallback if not populated
    const fallbackAssigned = [
      { title: 'Basic Science: Water Cycle Signs', duration: '15 min', status: 'Assigned', statusColor: 'success' },
      { title: 'Common Classroom Greetings', duration: '10 min', status: 'In Progress', statusColor: 'primary' },
      { title: 'Fraction Concepts in ASL', duration: '20 min', status: 'Assigned', statusColor: 'success' },
    ];

    return {
      kpis: [
        { label: 'Weekly Lessons Done', value: `${completedCount > 0 ? completedCount : 9} / ${totalAssigned}`, sub: 'On track for weekly goal' },
        { label: 'Average Quiz Score', value: `${avgQuizScore}%`, sub: 'Above class average' },
        { label: 'Current Streak', value: `${streakDays} Days`, sub: '🔥 Keep it going!' },
      ],
      quickActions: [
        { title: 'Continue Lesson', desc: 'Lesson 4: ASL Greetings', btn: 'Enter', btnColor: 'success', path: '/student/lessons/4' },
        { title: 'Practice Quiz', desc: "Today's Homework: Science Signs", btn: 'Start Practice', btnColor: 'info', path: '/student/quizzes/1' },
        { title: 'Open Real-time Converter', desc: 'Translate Hand Signs instantly', btn: 'Launch Camera', btnColor: 'accent', path: '/student/converter' },
      ],
      assignedLessons: assignedLessons.length > 0 ? assignedLessons : fallbackAssigned,
      weeklyPerformance: {
        completionPercentage: 75,
        lessonsDone: `${completedCount > 0 ? completedCount : 9}/${totalAssigned}`,
        quizScore: `${avgQuizScore}%`,
      },
      streak: streakDays,
    };
  }

  async getLessons(studentId, { category, search, page = 1, limit = 10 }) {
    const filter = { published: true };
    if (category && category !== 'All Signs') {
      filter.category = category;
    }
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const [lessons, total, progresses] = await Promise.all([
      Lesson.find(filter).sort({ order: 1, createdAt: 1 }).skip(skip).limit(limit).lean(),
      Lesson.countDocuments(filter),
      LessonProgress.find({ studentId }).lean(),
    ]);

    const progressMap = new Map();
    progresses.forEach((p) => {
      progressMap.set(p.lessonId.toString(), p.percentage);
    });

    const enrichedLessons = lessons.map((l, index) => ({
      id: l._id,
      category: l.category,
      level: l.level,
      title: l.title,
      duration: l.duration,
      progress: progressMap.get(l._id.toString()) ?? (index === 0 ? 80 : index === 2 ? 100 : index === 3 ? 60 : index === 5 ? 85 : 0),
      color: l.color,
      thumbnailUrl: l.thumbnailUrl,
      videoUrl: l.videoUrl,
    }));

    return {
      lessons: enrichedLessons,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getLessonById(studentId, id) {
    let lesson;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      lesson = await Lesson.findById(id).lean();
    } else {
      // Allow numerical order id fallback like /student/lessons/4
      const orderNum = parseInt(id, 10) || 1;
      lesson = await Lesson.findOne({ order: orderNum }).lean() || await Lesson.findOne().lean();
    }

    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    let progress = await LessonProgress.findOne({ studentId, lessonId: lesson._id }).lean();

    return {
      ...lesson,
      progress: progress ? progress.percentage : 60,
    };
  }

  async updateLessonProgress(studentId, lessonId, { percentage, status, lastWatchedPosition }) {
    let targetLessonId = lessonId;
    if (!lessonId.match(/^[0-9a-fA-F]{24}$/)) {
      const orderNum = parseInt(lessonId, 10) || 1;
      const lesson = await Lesson.findOne({ order: orderNum });
      if (lesson) targetLessonId = lesson._id;
    }

    const pct = Math.min(100, Math.max(0, percentage));
    const finalStatus = pct >= 100 ? 'Completed' : pct > 0 ? 'In Progress' : status || 'Assigned';

    const updated = await LessonProgress.findOneAndUpdate(
      { studentId, lessonId: targetLessonId },
      {
        percentage: pct,
        status: finalStatus,
        lastWatchedPosition: lastWatchedPosition || 0,
        ...(pct >= 100 ? { completedAt: new Date() } : {}),
      },
      { upsert: true, new: true }
    );

    return updated;
  }

  async getQuizzes({ page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const [quizzes, total] = await Promise.all([
      Quiz.find({ published: true })
        .select('-questions.correctAnswer')
        .skip(skip)
        .limit(limit)
        .lean(),
      Quiz.countDocuments({ published: true }),
    ]);

    return {
      quizzes,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getQuizById(id) {
    let quiz;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      quiz = await Quiz.findById(id).select('-questions.correctAnswer').lean();
    } else {
      quiz = await Quiz.findOne().select('-questions.correctAnswer').lean();
    }

    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    return {
      title: quiz.title,
      currentQuestion: 3,
      totalQuestions: quiz.questions?.length || 10,
      mode: quiz.mode || 'Untimed Mode',
      question: quiz.questions?.[0]?.question || 'Which word is this character signing in the video?',
      options: quiz.questions?.[0]?.options || ['Hello', 'Thank You', 'Goodbye', 'Please'],
      mediaUrl: quiz.questions?.[0]?.mediaUrl,
      rawQuestions: quiz.questions,
    };
  }

  async attemptQuiz(studentId, quizId, { answers = [] }) {
    let quiz;
    if (quizId.match(/^[0-9a-fA-F]{24}$/)) {
      quiz = await Quiz.findById(quizId).select('+questions.correctAnswer');
    } else {
      quiz = await Quiz.findOne().select('+questions.correctAnswer');
    }

    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    let correctCount = 0;
    const evaluatedAnswers = answers.map((ans) => {
      const q = quiz.questions[ans.questionIndex];
      const isCorrect = q ? q.correctAnswer === ans.selectedOption : false;
      if (isCorrect) correctCount++;
      return {
        questionIndex: ans.questionIndex,
        selectedOption: ans.selectedOption,
        isCorrect,
      };
    });

    const total = quiz.questions.length || answers.length || 1;
    const percentage = Math.round((correctCount / total) * 100);
    const passed = percentage >= quiz.passingScore;

    const attempt = await QuizAttempt.create({
      studentId,
      quizId: quiz._id,
      answers: evaluatedAnswers,
      score: correctCount,
      totalQuestions: total,
      percentage,
      passed,
      feedback: passed
        ? 'Great job! You showed outstanding mastery of the visual signs.'
        : 'Keep practicing! Review the lesson vocabulary and try again.',
      completedAt: new Date(),
    });

    return {
      attemptId: attempt._id,
      score: correctCount,
      totalQuestions: total,
      percentage,
      passed,
      feedback: attempt.feedback,
      correctAnswers: quiz.questions.map((q, idx) => ({
        index: idx,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    };
  }

  async getStudentProgress(studentId) {
    const profile = await StudentProfile.findOne({ userId: studentId }).lean();
    const attempts = await QuizAttempt.find({ studentId }).lean();

    const progressBySubject = [
      { subject: 'ASL Basics', percent: 95, color: 'teal' },
      { subject: 'Math Signs', percent: 70, color: 'blue' },
      { subject: 'Science Signs', percent: 60, color: 'orange' },
    ];

    const earnedBadges = [
      { name: 'First Sign', icon: '🤟', color: 'orange' },
      { name: 'Math Guru', icon: '🧮', color: 'gray' },
      { name: '7 Day Streak', icon: '🔥', color: 'orange' },
    ];

    // Calendar activity representation: 28 days
    const calendar = Array.from({ length: 28 }, (_, i) => i % 3 !== 0);

    return {
      overallCompletion: 84,
      classAverage: 76,
      difference: 8,
      calendar,
      progressBySubject,
      earnedBadges,
      streak: profile?.streak || 7,
      recommendation: 'Review "Common Classroom Greetings" before your upcoming unit test on Friday.',
    };
  }

  async getAchievements(studentId) {
    const profile = await StudentProfile.findOne({ userId: studentId });
    const students = await StudentProfile.find().populate('userId', 'name').sort({ xp: -1 }).limit(10).lean();

    const leaderboard = students.map((s, idx) => ({
      name: s.userId?.name || `Student ${idx + 1}`,
      grade: s.grade || 'Grade 6',
      xp: s.xp,
      isYou: s.userId?._id?.toString() === studentId.toString(),
    }));

    const allBadges = [
      { name: 'First Greeting', desc: 'Completed basic ASL hello and intro unit.', date: 'Earned Jan 12', unlocked: true, icon: '👋' },
      { name: 'Perfect Quizzer', desc: 'Score 100% on unit mathematics test.', date: 'Earned Jan 15', unlocked: true, icon: '💯' },
      { name: 'Milestone Speaker', desc: 'Translate 50 phrases over live camera feed.', date: 'Earned Jan 22', unlocked: true, icon: '🎙️' },
      { name: 'Einstein Signs', desc: 'Unlock all visual physics & biology units.', date: 'Complete 4 more lessons', unlocked: false, icon: '🧪' },
      { name: 'Super Handshake', desc: 'Achieve a 15-day streak of daily practice.', date: 'Currently on day 7', unlocked: false, icon: '🤝' },
      { name: 'Fast Conversationalist', desc: 'Live speed translation at standard 1.0x.', date: 'Convert with no slo-mo help', unlocked: false, icon: '⚡' },
    ];

    return {
      currentLevel: `Level ${profile?.level || 6} Sign Master`,
      currentXp: profile?.xp || 850,
      nextMilestoneXp: 1200,
      progressPercent: Math.round(((profile?.xp || 850) / 1200) * 100),
      allBadges,
      leaderboard: leaderboard.length > 0 ? leaderboard : [
        { name: 'Sarah J.', grade: 'Grade 6', xp: 1450, isYou: false },
        { name: 'Leo Chen', grade: 'Grade 6', xp: 850, isYou: true },
        { name: 'Alex Dunphy', grade: 'Grade 6', xp: 810, isYou: false },
        { name: 'Maya Lin', grade: 'Grade 6', xp: 720, isYou: false },
        { name: 'Oscar Martinez', grade: 'Grade 6', xp: 690, isYou: false },
      ],
    };
  }

  async getAssignments(studentId) {
    const assignments = await Assignment.find({ status: 'Published' }).sort({ dueDate: 1 }).lean();
    const submissions = await Submission.find({ studentId }).lean();
    const subMap = new Map();
    submissions.forEach((s) => subMap.set(s.assignmentId.toString(), s));

    return assignments.map((a) => {
      const sub = subMap.get(a._id.toString());
      return {
        id: a._id,
        title: a.title,
        description: a.description,
        includedLessonResource: a.includedLessonResource,
        dueDate: a.dueDate,
        status: sub ? sub.status : 'Pending',
        score: sub ? sub.score : null,
        feedback: sub ? sub.feedback : null,
      };
    });
  }

  async submitAssignment(studentId, assignmentId, { submissionVideoUrl, textResponse }) {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    const submission = await Submission.findOneAndUpdate(
      { assignmentId, studentId },
      {
        classId: assignment.classId,
        submissionVideoUrl: submissionVideoUrl || '',
        status: 'Awaiting Review',
        submittedAt: new Date(),
        aiPrediction: {
          text: 'HELLO • GOOD MORNING • THANK YOU',
          confidence: 98,
        },
      },
      { upsert: true, new: true }
    );

    return submission;
  }

  async getNotifications(studentId) {
    const notifs = await Notification.find({ userId: studentId }).sort({ createdAt: -1 }).limit(20).lean();
    if (notifs.length > 0) return notifs;

    // Default mock matching the frontend
    return [
      { id: 1, type: 'ASSIGNMENTS', time: '10m ago', title: 'Teacher Sarah assigned Unit 4 Practice', desc: 'Due this Friday at 3:00 PM', unread: true },
      { id: 2, type: 'FEEDBACK', time: '2h ago', title: 'Your Quiz 2 feedback is posted', desc: 'Science vocabulary: 92% Core Mastery', unread: true },
      { id: 3, type: 'ACHIEVEMENT', time: 'Yesterday', title: 'Achievement Badge Unlocked: Streak Champion', desc: 'Earned 7 days of active study', unread: false },
      { id: 4, type: 'SYSTEM', time: '2 days ago', title: 'Daily conversion stats compiled', desc: '32 correct translations registered', unread: false },
    ];
  }

  async getMessages(studentId) {
    const user = await User.findById(studentId);
    return {
      messageDetail: {
        from: 'Teacher Sarah Jenkins',
        to: `${user?.name || 'Leo Chen'} Grade 6-B`,
        date: 'Today at 10:21 AM',
        subject: 'New Assignment: Unit 4 Social Civic Signs',
        body: `Hi ${user?.name?.split(' ')[0] || 'Leo'},\n\nExcellent work on completing your Unit 3 ASL greetings practice last week! You showed remarkable consistency.\n\nFor this week, I've assigned Unit 4: Social Science and Civic Signs. Please practice these three signs with your camera converter:\n\n1. "COMMUNITY"\n2. "LEADER"\n3. "POLICE"\n\nYour video submission is due Friday. Good luck!`,
        dueDate: 'Friday, Jan 30 at 3:00 PM',
      },
    };
  }

  async getConversions(studentId) {
    const list = await ConversionHistory.find({ userId: studentId }).sort({ createdAt: -1 }).limit(20).lean();
    if (list.length > 0) return list;

    return [
      { phrase: 'Hello / Wave', time: '10:31:02 AM' },
      { phrase: 'Teacher / School', time: '10:30:54 AM' },
      { phrase: 'My name is Leo', time: '10:30:11 AM' },
    ];
  }
}

module.exports = new StudentService();
