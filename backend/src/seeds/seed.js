const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const ParentProfile = require('../models/ParentProfile');
const Lesson = require('../models/Lesson');
const LessonProgress = require('../models/LessonProgress');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Achievement = require('../models/Achievement');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const Resource = require('../models/Resource');
const SignDictionary = require('../models/SignDictionary');
const ConversionHistory = require('../models/ConversionHistory');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      StudentProfile.deleteMany({}),
      TeacherProfile.deleteMany({}),
      ParentProfile.deleteMany({}),
      Lesson.deleteMany({}),
      LessonProgress.deleteMany({}),
      Quiz.deleteMany({}),
      QuizAttempt.deleteMany({}),
      Class.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({}),
      Achievement.deleteMany({}),
      Notification.deleteMany({}),
      Message.deleteMany({}),
      Resource.deleteMany({}),
      SignDictionary.deleteMany({}),
      ConversionHistory.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');
    const studentPass = await User.hashPassword('Student@123');
    const teacherPass = await User.hashPassword('Teacher@123');
    const parentPass = await User.hashPassword('Parent@123');
    const adminPass = await User.hashPassword('Admin@123');

    const [studentUser, teacherUser, parentUser, adminUser, studentMia, studentAlex] = await Promise.all([
      User.create({
        name: 'Leo Chen',
        email: 'student@example.com',
        passwordHash: studentPass,
        role: 'student',
        avatar: 'LC',
        school: 'Metro Public School',
        phone: '+1 (555) 234-5678',
        accessibilityPreferences: {
          captionSize: '24px',
          playbackSpeed: 0.75,
          highContrast: true,
          autoplay: false,
          preferredLanguage: 'asl',
        },
      }),
      User.create({
        name: 'Sarah Jenkins',
        email: 'teacher@example.com',
        passwordHash: teacherPass,
        role: 'teacher',
        avatar: 'SJ',
        school: 'Metro Public School',
        phone: '+1 (555) 345-6789',
      }),
      User.create({
        name: 'Robert Chen',
        email: 'parent@example.com',
        passwordHash: parentPass,
        role: 'parent',
        avatar: 'RC',
        school: 'Metro Public School',
        phone: '+1 (555) 456-7890',
      }),
      User.create({
        name: 'Principal Thompson',
        email: 'admin@example.com',
        passwordHash: adminPass,
        role: 'admin',
        avatar: 'PT',
        school: 'Metro Public School District',
      }),
      User.create({
        name: 'Mia Chen',
        email: 'mia.chen@example.com',
        passwordHash: studentPass,
        role: 'student',
        avatar: 'MC',
        school: 'Metro Public School',
      }),
      User.create({
        name: 'Alex Dunphy',
        email: 'alex.dunphy@example.com',
        passwordHash: studentPass,
        role: 'student',
        avatar: 'AD',
        school: 'Metro Public School',
      }),
    ]);

    console.log('[Seed] Creating user profiles...');
    await Promise.all([
      StudentProfile.create({
        userId: studentUser._id,
        studentIdCode: '#SB-901-22',
        grade: 'Grade 6',
        section: 'Class B',
        school: 'Metro Public School',
        district: 'District 4',
        xp: 850,
        level: 6,
        streak: 7,
        parentId: parentUser._id,
      }),
      StudentProfile.create({
        userId: studentMia._id,
        studentIdCode: '#SB-901-23',
        grade: 'Grade 3',
        section: 'Class A',
        school: 'Metro Public School',
        district: 'District 4',
        xp: 920,
        level: 7,
        streak: 12,
        parentId: parentUser._id,
      }),
      StudentProfile.create({
        userId: studentAlex._id,
        studentIdCode: '#SB-901-24',
        grade: 'Grade 6',
        section: 'Class B',
        school: 'Metro Public School',
        district: 'District 4',
        xp: 810,
        level: 5,
        streak: 2,
      }),
      TeacherProfile.create({
        userId: teacherUser._id,
        title: 'Lead ASL Instructor',
        school: 'Metro Public School',
        specialization: ['ASL', 'Math Signs', 'Science Signs'],
      }),
      ParentProfile.create({
        userId: parentUser._id,
        children: [studentUser._id, studentMia._id],
        relationship: 'Father',
      }),
    ]);

    console.log('[Seed] Creating lessons matching mockData.js...');
    const lessonData = [
      {
        order: 1,
        category: 'Math Signs',
        level: 'Intermediate',
        title: 'Algebra Terms & Symbols',
        duration: '12 mins',
        color: 'blue',
        description: 'Understand core signs for algebraic equations, variables, and equal signs.',
        vocabulary: [
          { word: 'Variable', desc: 'Move index finger in zigzag motion indicating change.', active: true },
          { word: 'Equation', desc: 'Both hands parallel horizontally signaling balance.', active: false },
        ],
      },
      {
        order: 2,
        category: 'Science Signs',
        level: 'Advanced',
        title: 'Atmosphere & Weather Cycle',
        duration: '18 mins',
        color: 'orange',
        description: 'Atmospheric layers, condensation, and weather signs in ASL.',
        vocabulary: [
          { word: 'Rain', desc: 'Hands claw down mimicking falling drops.', active: true },
          { word: 'Cloud', desc: 'Cupped hands circular outline in air.', active: false },
        ],
      },
      {
        order: 3,
        category: 'ASL Basics',
        level: 'Beginner',
        title: 'Common Animals & Pets',
        duration: '8 mins',
        color: 'teal',
        description: 'Everyday companion animal signs including dog, cat, and bird.',
        vocabulary: [
          { word: 'Dog', desc: 'Pat thigh and snap fingers together.', active: true },
          { word: 'Cat', desc: 'Fingers pinch cheek like whiskers moving outward.', active: false },
        ],
      },
      {
        order: 4,
        category: 'ASL Basics',
        level: 'Beginner',
        title: 'Family & Relations',
        duration: '10 mins',
        color: 'teal',
        description: 'Signs for mother, father, brother, sister, and extended family.',
        vocabulary: [
          { word: 'Hello', desc: 'Open hand, fingers together, touch forehead and move slightly out like a salute.', active: true },
          { word: 'Good Morning', desc: 'Place flat fingertips of right hand to chin, move hand down, then cross with arm extension.', active: false },
          { word: 'Thank You', desc: 'Touch flat fingertips to lips, then move hand down and forward toward the other person.', active: false },
        ],
      },
      {
        order: 5,
        category: 'Daily Communication',
        level: 'Advanced',
        title: 'Emergency Assistance Phrases',
        duration: '15 mins',
        color: 'purple',
        description: 'Vital signs for requesting medical, fire, or police assistance quickly.',
        vocabulary: [
          { word: 'Help', desc: 'Closed fist with thumb up on flat palm moving upwards.', active: true },
          { word: 'Doctor', desc: 'Fingertips tapping pulse wrist.', active: false },
        ],
      },
      {
        order: 6,
        category: 'Math Signs',
        level: 'Intermediate',
        title: 'Fractions & Percentages',
        duration: '14 mins',
        color: 'blue',
        description: 'Fractional numerators, denominators, and decimal points.',
        vocabulary: [
          { word: 'Fraction', desc: 'Horizontal division line gesture with flat hand.', active: true },
        ],
      },
    ];

    const createdLessons = await Lesson.insertMany(
      lessonData.map((l) => ({ ...l, createdBy: teacherUser._id, published: true }))
    );

    console.log('[Seed] Setting student lesson progress...');
    const progressList = [
      { studentId: studentUser._id, lessonId: createdLessons[0]._id, percentage: 80, status: 'In Progress' },
      { studentId: studentUser._id, lessonId: createdLessons[1]._id, percentage: 0, status: 'Assigned' },
      { studentId: studentUser._id, lessonId: createdLessons[2]._id, percentage: 100, status: 'Completed', completedAt: new Date() },
      { studentId: studentUser._id, lessonId: createdLessons[3]._id, percentage: 60, status: 'In Progress' },
      { studentId: studentUser._id, lessonId: createdLessons[4]._id, percentage: 0, status: 'Assigned' },
      { studentId: studentUser._id, lessonId: createdLessons[5]._id, percentage: 85, status: 'In Progress' },
    ];
    await LessonProgress.insertMany(progressList);

    console.log('[Seed] Creating quizzes and questions...');
    const quiz1 = await Quiz.create({
      title: 'Unit 1 Evaluation: ASL Basics',
      lessonId: createdLessons[3]._id,
      description: 'Test your understanding of basic ASL greeting signs.',
      mode: 'Untimed Mode',
      difficulty: 'Beginner',
      passingScore: 70,
      published: true,
      createdBy: teacherUser._id,
      questions: [
        {
          question: 'Which word is this character signing in the video?',
          type: 'multiple-choice',
          options: ['Hello', 'Thank You', 'Goodbye', 'Please'],
          correctAnswer: 1,
          explanation: 'Touching your fingertips to your lips and moving them outward means "Thank You".',
          mediaUrl: '/media/signs/thankyou.mp4',
        },
        {
          question: 'What is the sign for greeting someone in the morning?',
          type: 'multiple-choice',
          options: ['Good Morning', 'Good Night', 'Welcome', 'See You Later'],
          correctAnswer: 0,
          explanation: 'Fingertips to chin moving down combined with sunrise arm gesture means "Good Morning".',
          mediaUrl: '/media/signs/goodmorning.mp4',
        },
      ],
    });

    console.log('[Seed] Creating quiz attempts...');
    await QuizAttempt.create({
      studentId: studentUser._id,
      quizId: quiz1._id,
      answers: [
        { questionIndex: 0, selectedOption: 1, isCorrect: true },
        { questionIndex: 1, selectedOption: 0, isCorrect: true },
      ],
      score: 2,
      totalQuestions: 2,
      percentage: 100,
      passed: true,
      feedback: 'Great job! 100% Core Mastery on ASL basics.',
    });

    console.log('[Seed] Creating classrooms...');
    const classASL = await Class.create({
      name: 'ASL 101 - Beginners',
      code: 'ASL101-G2',
      grade: 'Grade 2',
      module: 'Greetings module',
      teacherId: teacherUser._id,
      students: [studentUser._id, studentMia._id, studentAlex._id],
      progress: 75,
      schedule: [
        { time: '09:00', grade: 'Grade 2', title: 'ASL Beginners Greetings', type: 'Live Co-coaching Lesson', status: 'Active Now', statusType: 'active' },
        { time: '11:30', grade: 'Grade 3', title: 'Fractions Practice Quiz Review', type: 'Review auto-graded submissions', status: 'Upcoming', statusType: 'upcoming' },
      ],
    });

    const classMath = await Class.create({
      name: 'Math Signs & Fractions',
      code: 'MATH-G3',
      grade: 'Grade 3',
      module: 'Fractions Concepts',
      teacherId: teacherUser._id,
      students: [studentMia._id, studentUser._id],
      progress: 60,
    });

    console.log('[Seed] Creating assignments...');
    const assignment1 = await Assignment.create({
      title: 'Video Practice: Simple Classroom Greetings',
      classId: classASL._id,
      teacherId: teacherUser._id,
      description: 'Watch the greetings video, then capture yourself signing back! Use bright framing.',
      includedLessonResource: 'Common Classroom Greetings (ASL Core)',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'Published',
    });

    const assignment2 = await Assignment.create({
      title: 'Water Cycle Signs',
      classId: classASL._id,
      teacherId: teacherUser._id,
      description: 'Record signs for evaporation, condensation, and precipitation.',
      includedLessonResource: 'Atmosphere & Weather Cycle',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'Published',
    });

    console.log('[Seed] Creating submissions & grading queue...');
    await Submission.create({
      assignmentId: assignment1._id,
      studentId: studentUser._id,
      classId: classASL._id,
      status: 'Awaiting Review',
      score: 95,
      feedback: 'Excellent clarity in hand positioning and lighting, Leo! Your "thank you" sign was exceptionally smooth.',
      aiPrediction: { text: 'HELLO • GOOD MORNING • THANK YOU', confidence: 98 },
    });

    await Submission.create({
      assignmentId: assignment1._id,
      studentId: studentMia._id,
      classId: classASL._id,
      status: 'Awaiting Review',
      score: 88,
      feedback: 'Very expressive facial grammar and clean signs.',
      aiPrediction: { text: 'HELLO • GOOD MORNING', confidence: 94 },
    });

    await Submission.create({
      assignmentId: assignment2._id,
      studentId: studentAlex._id,
      classId: classASL._id,
      status: 'Awaiting Review',
      score: 75,
      feedback: 'Review the condensation sign hand orientation.',
      aiPrediction: { text: 'WATER CYCLE • CLOUD', confidence: 91 },
    });

    console.log('[Seed] Creating Sign Dictionary entries for Text-to-Sign...');
    const dictionaryEntries = [
      { word: 'hello', language: 'en', animationUrl: '/media/signs/hello.mp4', category: 'Greetings', description: 'Salute hand wave from forehead', aliases: ['hi', 'hey', 'greetings'] },
      { word: 'thank', language: 'en', animationUrl: '/media/signs/thankyou.mp4', category: 'Greetings', description: 'Fingertips to lips forward motion', aliases: ['thanks', 'thank you'] },
      { word: 'good', language: 'en', animationUrl: '/media/signs/good.mp4', category: 'General', description: 'Hand from chin down into other palm', aliases: ['great', 'well'] },
      { word: 'morning', language: 'en', animationUrl: '/media/signs/morning.mp4', category: 'General', description: 'Arm rising like sun', aliases: ['dawn'] },
      { word: 'water', language: 'en', animationUrl: '/media/signs/water.mp4', category: 'Science', description: 'W handshape tap chin twice', aliases: ['aqua'] },
      { word: 'cycle', language: 'en', animationUrl: '/media/signs/cycle.mp4', category: 'Science', description: 'Index fingers rolling in circles', aliases: ['circle', 'loop'] },
      { word: 'gravity', language: 'en', animationUrl: '/media/signs/gravity.mp4', category: 'Science', description: 'Downward attraction motion', aliases: ['gravitation'] },
      { word: 'community', language: 'en', animationUrl: '/media/signs/community.mp4', category: 'Social', description: 'Hands joined fingertips together', aliases: ['society'] },
      { word: 'leader', language: 'en', animationUrl: '/media/signs/leader.mp4', category: 'Social', description: 'Pulling hand forward taking the lead', aliases: ['guide', 'captain'] },
      { word: 'police', language: 'en', animationUrl: '/media/signs/police.mp4', category: 'Social', description: 'C shape badge on chest', aliases: ['officer', 'cop'] },
      { word: 'notebook', language: 'en', animationUrl: '/media/signs/book.mp4', category: 'Objects', description: 'Palms together pivoting open', aliases: ['book', 'notepad'] },
      { word: 'apple', language: 'en', animationUrl: '/media/signs/apple.mp4', category: 'Objects', description: 'Index knuckle twist on cheek', aliases: [] },
      { word: 'computer', language: 'en', animationUrl: '/media/signs/computer.mp4', category: 'Objects', description: 'C hand moving along forearm', aliases: ['laptop', 'pc'] },
      { word: 'pencil', language: 'en', animationUrl: '/media/signs/pencil.mp4', category: 'Objects', description: 'Writing motion on open palm', aliases: ['pen'] },
    ];
    await SignDictionary.insertMany(dictionaryEntries);

    console.log('[Seed] Creating achievements and badges...');
    const badges = [
      { name: 'First Sign', desc: 'Completed basic ASL hello and intro unit.', icon: '🤟', category: 'Streaks', xpReward: 100 },
      { name: 'Math Guru', desc: 'Score 100% on unit mathematics test.', icon: '🧮', category: 'Subject Mastery', xpReward: 200 },
      { name: '7 Day Streak', desc: 'Achieve a 7-day streak of daily practice.', icon: '🔥', category: 'Streaks', xpReward: 150 },
      { name: 'Milestone Speaker', desc: 'Translate 50 phrases over live camera feed.', icon: '🎙️', category: 'Converter Milestones', xpReward: 250 },
    ];
    await Achievement.insertMany(badges);

    console.log('[Seed] Creating notifications...');
    await Notification.insertMany([
      { userId: studentUser._id, type: 'ASSIGNMENTS', title: 'Teacher Sarah assigned Unit 4 Practice', desc: 'Due this Friday at 3:00 PM', unread: true },
      { userId: studentUser._id, type: 'FEEDBACK', title: 'Your Quiz 2 feedback is posted', desc: 'Science vocabulary: 92% Core Mastery', unread: true },
      { userId: studentUser._id, type: 'ACHIEVEMENT', title: 'Achievement Badge Unlocked: Streak Champion', desc: 'Earned 7 days of active study', unread: false },
      { userId: studentUser._id, type: 'SYSTEM', title: 'Daily conversion stats compiled', desc: '32 correct translations registered', unread: false },
    ]);

    console.log('[Seed] Creating messages...');
    await Message.create({
      sender: teacherUser._id,
      receiver: studentUser._id,
      conversationId: `conv_${teacherUser._id}_${studentUser._id}`,
      subject: 'New Assignment: Unit 4 Social Civic Signs',
      body: `Hi Leo,\n\nExcellent work on completing your Unit 3 ASL greetings practice last week! You showed remarkable consistency.\n\nFor this week, I've assigned Unit 4: Social Science and Civic Signs. Please practice these three signs with your camera converter:\n\n1. "COMMUNITY"\n2. "LEADER"\n3. "POLICE"\n\nYour video submission is due Friday. Good luck!`,
      dueDate: 'Friday, Jan 30 at 3:00 PM',
      read: false,
    });

    console.log('[Seed] Creating teacher resources...');
    await Resource.insertMany([
      { title: 'ASL Greeting Worksheets', type: 'Printable Classroom Materials', grade: 'Grade 1-3', badge: 'FREE STANDARD', createdBy: teacherUser._id },
      { title: 'Math Signs Teaching Guide', type: 'Instructional Video Reference', grade: 'Teacher Prep', badge: 'FREE STANDARD', createdBy: teacherUser._id },
    ]);

    console.log('[Seed] Creating conversion log records...');
    await ConversionHistory.insertMany([
      { userId: studentUser._id, inputType: 'sign', predictedText: 'Hello / Wave', confidence: 0.98, sessionId: 'sess_1' },
      { userId: studentUser._id, inputType: 'sign', predictedText: 'Teacher / School', confidence: 0.95, sessionId: 'sess_1' },
      { userId: studentUser._id, inputType: 'sign', predictedText: 'My name is Leo', confidence: 0.97, sessionId: 'sess_1' },
    ]);

    console.log('=======================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=======================================================');
    console.log('Demo Accounts:');
    console.log('Student: student@example.com / Student@123');
    console.log('Teacher: teacher@example.com / Teacher@123');
    console.log('Parent:  parent@example.com  / Parent@123');
    console.log('Admin:   admin@example.com   / Admin@123');
    console.log('=======================================================');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
