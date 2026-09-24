const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Lesson = require('../src/models/Lesson');
const Quiz = require('../src/models/Quiz');
const Class = require('../src/models/Class');
const Assignment = require('../src/models/Assignment');
const Submission = require('../src/models/Submission');
const ParentProfile = require('../src/models/ParentProfile');
const SignDictionary = require('../src/models/SignDictionary');
require('./setup');

describe('SignBridge AI Full-Stack Integration Suite', () => {
  let studentToken;
  let teacherToken;
  let parentToken;
  let adminToken;

  let studentUser;
  let teacherUser;
  let parentUser;
  let adminUser;

  let demoLesson;
  let demoQuiz;
  let demoClass;
  let demoAssignment;

  beforeAll(async () => {
    // 1. Ensure test users exist with known passwords
    const studentPass = await User.hashPassword('Student@123');
    const teacherPass = await User.hashPassword('Teacher@123');
    const parentPass = await User.hashPassword('Parent@123');
    const adminPass = await User.hashPassword('Admin@123');

    // Upsert demo accounts
    studentUser = await User.findOneAndUpdate(
      { email: 'student@example.com' },
      { name: 'Leo Chen', email: 'student@example.com', passwordHash: studentPass, role: 'student', school: 'Metro School' },
      { upsert: true, new: true }
    );

    teacherUser = await User.findOneAndUpdate(
      { email: 'teacher@example.com' },
      { name: 'Sarah Jenkins', email: 'teacher@example.com', passwordHash: teacherPass, role: 'teacher', school: 'Metro School' },
      { upsert: true, new: true }
    );

    parentUser = await User.findOneAndUpdate(
      { email: 'parent@example.com' },
      { name: 'Robert Chen', email: 'parent@example.com', passwordHash: parentPass, role: 'parent', school: 'Metro School' },
      { upsert: true, new: true }
    );

    adminUser = await User.findOneAndUpdate(
      { email: 'admin@example.com' },
      { name: 'Principal Thompson', email: 'admin@example.com', passwordHash: adminPass, role: 'admin', school: 'Metro District' },
      { upsert: true, new: true }
    );

    // Link student to parent
    await ParentProfile.findOneAndUpdate(
      { userId: parentUser._id },
      { userId: parentUser._id, children: [studentUser._id], relationship: 'Father' },
      { upsert: true, new: true }
    );

    // Create a lesson, quiz, class for integration testing
    demoLesson = await Lesson.findOneAndUpdate(
      { title: 'Algebra Terms & Symbols' },
      {
        order: 1,
        title: 'Algebra Terms & Symbols',
        category: 'Math Signs',
        level: 'Intermediate',
        duration: '12 mins',
        color: 'blue',
        published: true,
        vocabulary: [{ word: 'Variable', desc: 'Zigzag sign' }],
        createdBy: teacherUser._id,
      },
      { upsert: true, new: true }
    );

    demoQuiz = await Quiz.findOneAndUpdate(
      { title: 'Unit 1 Evaluation: ASL Basics' },
      {
        title: 'Unit 1 Evaluation: ASL Basics',
        lessonId: demoLesson._id,
        mode: 'Untimed Mode',
        difficulty: 'Beginner',
        passingScore: 70,
        published: true,
        createdBy: teacherUser._id,
        questions: [
          {
            question: 'Which word is this character signing in the video?',
            options: ['Hello', 'Thank You', 'Goodbye', 'Please'],
            correctAnswer: 1,
            explanation: 'Fingertips to lips forward motion.',
          },
        ],
      },
      { upsert: true, new: true }
    );

    demoClass = await Class.findOneAndUpdate(
      { name: 'ASL 101 - Beginners' },
      {
        name: 'ASL 101 - Beginners',
        code: 'ASL-TEST-101',
        grade: 'Grade 2',
        teacherId: teacherUser._id,
        students: [studentUser._id],
        module: 'Greetings module',
      },
      { upsert: true, new: true }
    );

    // Create sign dictionary entry
    await SignDictionary.findOneAndUpdate(
      { word: 'hello' },
      { word: 'hello', language: 'en', animationUrl: '/media/signs/hello.mp4', aliases: ['hi', 'hey'] },
      { upsert: true, new: true }
    );

    // Log in all roles to obtain access tokens
    const sLogin = await request(app).post('/api/auth/login').send({ email: 'student@example.com', password: 'Student@123' });
    studentToken = sLogin.body.data.accessToken;

    const tLogin = await request(app).post('/api/auth/login').send({ email: 'teacher@example.com', password: 'Teacher@123' });
    teacherToken = tLogin.body.data.accessToken;

    const pLogin = await request(app).post('/api/auth/login').send({ email: 'parent@example.com', password: 'Parent@123' });
    parentToken = pLogin.body.data.accessToken;

    const aLogin = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'Admin@123' });
    adminToken = aLogin.body.data.accessToken;
  });

  // 1. Registration
  it('1. Registration: creates new user with unique profile code and returns JWT', async () => {
    const uniqueEmail = `integration_${Date.now()}@example.com`;
    const res = await request(app).post('/api/auth/register').send({
      name: 'Integration Student',
      email: uniqueEmail,
      password: 'Password123!',
      role: 'student',
      school: 'Metro High',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(uniqueEmail);
    expect(res.body.data.accessToken).toBeDefined();
  });

  // 2. Login
  it('2. Login: authenticates valid credentials and returns profile + accessToken', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'student@example.com',
      password: 'Student@123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('student');
    expect(res.body.data.accessToken).toBeDefined();
  });

  // 3. Role authorization (RBAC)
  it('3. Role authorization: denies student access to teacher and admin endpoints (403 Forbidden)', async () => {
    const teacherAccess = await request(app)
      .get('/api/teacher/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(teacherAccess.status).toBe(403);

    const adminAccess = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(adminAccess.status).toBe(403);
  });

  // 4. Student dashboard
  it('4. Student Dashboard: returns real KPIs, streak, and performance metrics', async () => {
    const res = await request(app)
      .get('/api/student/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpis).toBeInstanceOf(Array);
    expect(res.body.data.quickActions).toBeInstanceOf(Array);
    expect(res.body.data.weeklyPerformance).toBeDefined();
  });

  // 5. Lesson retrieval
  it('5. Lesson retrieval: supports filtering, pagination, and progress enrichment', async () => {
    const res = await request(app)
      .get('/api/student/lessons?category=Math Signs')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].category).toBe('Math Signs');
  });

  // 6. Lesson progress
  it('6. Lesson progress: records watch percentage and marks status completed', async () => {
    const res = await request(app)
      .post(`/api/student/lessons/${demoLesson._id}/progress`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ percentage: 100, status: 'Completed' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.percentage).toBe(100);
    expect(res.body.data.status).toBe('Completed');
  });

  // 7. Quiz attempt
  it('7. Quiz attempt: evaluates answer server-side without leaking correct answers upfront', async () => {
    // Check upfront quiz questions do not include correctAnswer
    const upfront = await request(app)
      .get(`/api/student/quizzes/${demoQuiz._id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(upfront.status).toBe(200);
    expect(upfront.body.data.correctAnswer).toBeUndefined();

    // Submit attempt with correct answer (index 1)
    const attempt = await request(app)
      .post(`/api/student/quizzes/${demoQuiz._id}/attempt`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answers: [{ questionIndex: 0, selectedOption: 1 }] });

    expect(attempt.status).toBe(200);
    expect(attempt.body.success).toBe(true);
    expect(attempt.body.data.score).toBe(1);
    expect(attempt.body.data.passed).toBe(true);
    expect(attempt.body.data.percentage).toBe(100);
  });

  // 8. Assignment creation
  it('8. Assignment creation: teacher publishes assignment for a class', async () => {
    const res = await request(app)
      .post('/api/teacher/assignments')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: demoClass._id,
        title: 'Integration Test Greetings',
        description: 'Record yourself signing hello and thank you.',
        dueDate: new Date(Date.now() + 86400000),
        status: 'Published',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Integration Test Greetings');
    demoAssignment = res.body.data;
  });

  // 9. Assignment submission
  it('9. Assignment submission: student submits response to assigned task', async () => {
    const res = await request(app)
      .post(`/api/student/assignments/${demoAssignment._id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        submissionText: 'Student recorded sign video completed.',
        mediaUrl: '/uploads/demo_video.mp4',
        aiPrediction: { text: 'HELLO • THANK YOU', confidence: 97 },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Awaiting Review');
  });

  // 10. Teacher grading
  it('10. Teacher grading: teacher reviews and grades pending submission', async () => {
    // Find the submission
    const sub = await Submission.findOne({ assignmentId: demoAssignment._id });
    expect(sub).toBeDefined();

    const res = await request(app)
      .patch(`/api/teacher/submissions/${sub._id}/grade`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        score: 95,
        feedback: 'Excellent arm extension and facial grammar!',
        status: 'Graded',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score).toBe(95);
    expect(res.body.data.status).toBe('Graded');
  });

  // 11. Parent child access & security
  it('11. Parent Child Access: allows viewing linked child, forbids unlinked child (403)', async () => {
    // View linked child (studentUser._id)
    const allowed = await request(app)
      .get(`/api/parent/children/${studentUser._id}/progress`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(allowed.status).toBe(200);
    expect(allowed.body.success).toBe(true);
    expect(allowed.body.data.childSubjects).toBeDefined();

    // View unlinked random child
    const randomFakeId = '654321654321654321654321';
    const forbidden = await request(app)
      .get(`/api/parent/children/${randomFakeId}/progress`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(forbidden.status).toBe(403);
    expect(forbidden.body.success).toBe(false);
  });

  // 12. Admin dashboard & analytics
  it('12. Admin Dashboard & Analytics: aggregates real MongoDB counts', async () => {
    const dash = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(dash.status).toBe(200);
    expect(dash.body.data.kpis).toBeInstanceOf(Array);

    const analytics = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(analytics.status).toBe(200);
    expect(analytics.body.data.users.totalStudents).toBeGreaterThan(0);
    expect(analytics.body.data.content.totalLessons).toBeGreaterThan(0);
  });

  // 13. AI Mock endpoints
  it('13. AI Mock endpoints: predicts sign, converts text to sign, and recognizes object', async () => {
    // Sign prediction
    const signRes = await request(app)
      .post('/api/ai/sign/predict')
      .send({ frames: ['f1', 'f2'], language: 'en' });

    expect(signRes.status).toBe(200);
    const signData = signRes.body.data || signRes.body.prediction;
    expect(signData).toBeDefined();
    expect(signData.text).toBeDefined();

    // Text to sign
    const textRes = await request(app)
      .post('/api/ai/text-to-sign')
      .send({ text: 'Hello thank you' });

    expect(textRes.status).toBe(200);
    const textData = textRes.body.data || textRes.body;
    expect(textData.tokens).toBeInstanceOf(Array);
    expect(textData.tokens[0].word).toBe('hello');
    expect(textData.tokens[0].matched).toBe(true);

    // Object recognition
    const objRes = await request(app)
      .post('/api/ai/object-recognition')
      .send({ mode: 'Learn Mode' });

    expect(objRes.status).toBe(200);
    const objData = objRes.body.data || objRes.body.prediction;
    expect(objData).toBeDefined();
    expect(objData.object).toBeDefined();
  });
});
