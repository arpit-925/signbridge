// ===== MOCK DATA FOR SIGN BRIDGE =====

export const currentUser = {
  student: { name: 'Leo Chen', role: 'Student', grade: 'Grade 6', school: 'Metro Public School', id: '#SB-901-22', avatar: 'LC' },
  teacher: { name: 'Sarah Jenkins', role: 'Lead ASL Instructor', school: 'Metro Public School', avatar: 'SJ' },
  parent: { name: 'Robert Chen', role: 'Parent Account', avatar: 'RC' },
  admin: { name: 'Principal Thompson', role: 'School Administrator', avatar: 'PT' },
};

export const sidebarConfig = {
  student: {
    portalName: 'INCLUSIVE EDU',
    links: [
      { label: 'Dashboard', icon: 'LayoutDashboard', path: '/student' },
      { label: 'My Lessons', icon: 'BookOpen', path: '/student/lessons' },
      { label: 'Quizzes', icon: 'ClipboardCheck', path: '/student/quizzes' },
      { label: 'Converter', icon: 'Languages', path: '/student/converter' },
      { label: 'Object Recognition', icon: 'ScanSearch', path: '/student/objects' },
      { label: 'Progress', icon: 'TrendingUp', path: '/student/progress' },
      { label: 'Achievements', icon: 'Trophy', path: '/student/achievements' },
      { label: 'Messages', icon: 'MessageSquare', path: '/student/messages' },
      { label: 'Settings', icon: 'Settings', path: '/student/settings' },
    ],
  },
  teacher: {
    portalName: 'TEACHER PORTAL',
    links: [
      { label: 'Dashboard', icon: 'LayoutDashboard', path: '/teacher' },
      { label: 'My Classes', icon: 'Users', path: '/teacher/classes' },
      { label: 'Assignments', icon: 'FileText', path: '/teacher/assignments' },
      { label: 'Student Progress', icon: 'BarChart3', path: '/teacher/progress' },
      { label: 'Feedback & Grading', icon: 'CheckCircle', path: '/teacher/grading' },
      { label: 'Resources & Content', icon: 'FolderOpen', path: '/teacher/resources' },
      { label: 'Settings', icon: 'Settings', path: '/teacher/settings' },
    ],
  },
  parent: {
    portalName: 'PARENT PORTAL',
    links: [
      { label: 'Dashboard', icon: 'LayoutDashboard', path: '/parent' },
      { label: 'My Children', icon: 'Users', path: '/parent/children' },
      { label: 'Progress Reports', icon: 'BarChart3', path: '/parent/progress' },
      { label: 'Messages', icon: 'MessageSquare', path: '/parent/messages' },
      { label: 'Resources', icon: 'HelpCircle', path: '/parent/help' },
      { label: 'Settings', icon: 'Settings', path: '/parent/settings' },
    ],
  },
  admin: {
    portalName: 'ADMIN PORTAL',
    links: [
      { label: 'Admin Dashboard', icon: 'LayoutDashboard', path: '/admin' },
      { label: 'User Management', icon: 'Users', path: '/admin/users' },
      { label: 'School Courses', icon: 'BookOpen', path: '/admin/courses' },
      { label: 'System Settings', icon: 'Settings', path: '/admin/settings' },
    ],
  },
};

export const studentKPIs = {
  dashboard: [
    { label: 'Weekly Lessons Done', value: '9 / 12', sub: 'On track for weekly goal' },
    { label: 'Average Quiz Score', value: '92%', sub: 'Above class average' },
    { label: 'Current Streak', value: '7 Days', sub: '🔥 Keep it going!' },
  ],
};

export const quickActions = [
  { title: 'Continue Lesson', desc: 'Lesson 4: ASL Greetings', btn: 'Enter', btnColor: 'success', path: '/student/lessons/4' },
  { title: 'Practice Quiz', desc: "Today's Homework: Science Signs", btn: 'Start Practice', btnColor: 'info', path: '/student/quizzes/1' },
  { title: 'Open Real-time Converter', desc: 'Translate Hand Signs instantly', btn: 'Launch Camera', btnColor: 'accent', path: '/student/converter' },
];

export const assignedLessons = [
  { title: 'Basic Science: Water Cycle Signs', duration: '15 min', status: 'Assigned', statusColor: 'success' },
  { title: 'Common Classroom Greetings', duration: '10 min', status: 'In Progress', statusColor: 'primary' },
  { title: 'Fraction Concepts in ASL', duration: '20 min', status: 'Assigned', statusColor: 'success' },
];

export const lessons = [
  { id: 1, category: 'Math Signs', level: 'Intermediate', title: 'Algebra Terms & Symbols', duration: '12 mins', progress: 80, color: 'blue' },
  { id: 2, category: 'Science Signs', level: 'Advanced', title: 'Atmosphere & Weather Cycle', duration: '18 mins', progress: 0, color: 'orange' },
  { id: 3, category: 'ASL Basics', level: 'Beginner', title: 'Common Animals & Pets', duration: '8 mins', progress: 100, color: 'teal' },
  { id: 4, category: 'ASL Basics', level: 'Beginner', title: 'Family & Relations', duration: '10 mins', progress: 60, color: 'teal' },
  { id: 5, category: 'Daily Communication', level: 'Advanced', title: 'Emergency Assistance Phrases', duration: '15 mins', progress: 0, color: 'purple' },
  { id: 6, category: 'Math Signs', level: 'Intermediate', title: 'Fractions & Percentages', duration: '14 mins', progress: 85, color: 'blue' },
];

export const quizData = {
  title: 'Unit 1 Evaluation: ASL Basics',
  currentQuestion: 3,
  totalQuestions: 10,
  mode: 'Untimed Mode',
  question: 'Which word is this character signing in the video?',
  options: ['Hello', 'Thank You', 'Goodbye', 'Please'],
  correctAnswer: 1,
  feedback: 'Correct Answer! Great job. Touching your fingertips to your lips and moving them outward indeed means "Thank You".',
};

export const vocabularyItems = [
  { word: 'Hello', desc: 'Open hand, fingers together, touch your forehead and move it slightly out like a salute.', active: true },
  { word: 'Good Morning', desc: 'Place flat fingertips of right hand to chin, move hand down, then cross with arm extension.', active: false },
  { word: 'Thank You', desc: 'Touch flat fingertips to lips, then move hand down and forward toward the other person.', active: false },
];

export const sessionLog = [
  { phrase: 'Hello / Wave', time: '10:31:02 AM' },
  { phrase: 'Teacher / School', time: '10:30:54 AM' },
  { phrase: 'My name is Leo', time: '10:30:11 AM' },
];

export const recentObjects = ['Apple', 'Computer', 'Pencil', 'Desk'];

export const progressBySubject = [
  { subject: 'ASL Basics', percent: 95, color: 'teal' },
  { subject: 'Math Signs', percent: 70, color: 'blue' },
  { subject: 'Science Signs', percent: 60, color: 'orange' },
];

export const earnedBadges = [
  { name: 'First Sign', icon: '🤟', color: 'orange' },
  { name: 'Math Guru', icon: '🧮', color: 'gray' },
  { name: '7 Day Streak', icon: '🔥', color: 'orange' },
];

export const allBadges = [
  { name: 'First Greeting', desc: 'Completed basic ASL hello and intro unit.', date: 'Earned Jan 12', unlocked: true, icon: '👋' },
  { name: 'Perfect Quizzer', desc: 'Score 100% on unit mathematics test.', date: 'Earned Jan 15', unlocked: true, icon: '💯' },
  { name: 'Milestone Speaker', desc: 'Translate 50 phrases over live camera feed.', date: 'Earned Jan 22', unlocked: true, icon: '🎙️' },
  { name: 'Einstein Signs', desc: 'Unlock all visual physics & biology units.', date: 'Complete 4 more lessons', unlocked: false, icon: '🧪' },
  { name: 'Super Handshake', desc: 'Achieve a 15-day streak of daily practice.', date: 'Currently on day 7', unlocked: false, icon: '🤝' },
  { name: 'Fast Conversationalist', desc: 'Live speed translation at standard 1.0x.', date: 'Convert with no slo-mo help', unlocked: false, icon: '⚡' },
];

export const leaderboard = [
  { name: 'Sarah J.', grade: 'Grade 6', xp: 1450, isYou: false },
  { name: 'Leo Chen', grade: 'Grade 6', xp: 850, isYou: true },
  { name: 'Alex Dunphy', grade: 'Grade 6', xp: 810, isYou: false },
  { name: 'Maya Lin', grade: 'Grade 6', xp: 720, isYou: false },
  { name: 'Oscar Martinez', grade: 'Grade 6', xp: 690, isYou: false },
];

export const notifications = [
  { id: 1, type: 'ASSIGNMENTS', time: '10m ago', title: 'Teacher Sarah assigned Unit 4 Practice', desc: 'Due this Friday at 3:00 PM', unread: true },
  { id: 2, type: 'FEEDBACK', time: '2h ago', title: 'Your Quiz 2 feedback is posted', desc: 'Science vocabulary: 92% Core Mastery', unread: true },
  { id: 3, type: 'ACHIEVEMENT', time: 'Yesterday', title: 'Achievement Badge Unlocked: Streak Champion', desc: 'Earned 7 days of active study', unread: false },
  { id: 4, type: 'SYSTEM', time: '2 days ago', title: 'Daily conversion stats compiled', desc: '32 correct translations registered', unread: false },
];

export const messageDetail = {
  from: 'Teacher Sarah Jenkins',
  to: 'Leo Chen Grade 6-B',
  date: 'Today at 10:21 AM',
  subject: 'New Assignment: Unit 4 Social Civic Signs',
  body: `Hi Leo,\n\nExcellent work on completing your Unit 3 ASL greetings practice last week! You showed remarkable consistency.\n\nFor this week, I've assigned Unit 4: Social Science and Civic Signs. Please practice these three signs with your camera converter:\n\n1. "COMMUNITY"\n2. "LEADER"\n3. "POLICE"\n\nYour video submission is due Friday. Good luck!`,
  dueDate: 'Friday, Jan 30 at 3:00 PM',
};

// ===== TEACHER DATA =====
export const teacherKPIs = [
  { label: 'Total Students', value: '48', sub: 'Across 3 active grade portals' },
  { label: 'Active Classes', value: '3', sub: 'G2 ASL, G3 Math, G6 Science' },
  { label: 'Pending Grading', value: '12', sub: 'Submissions needing verification' },
  { label: 'Avg. Progress', value: '82%', sub: '+4% increase from last week' },
];

export const classroomAgenda = [
  { time: '09:00', grade: 'Grade 2', title: 'ASL Beginners Greetings', type: 'Live Co-coaching Lesson', status: 'Active Now', statusType: 'active' },
  { time: '11:30', grade: 'Grade 3', title: 'Fractions Practice Quiz Review', type: 'Review auto-graded submissions', status: 'Upcoming', statusType: 'upcoming' },
];

export const recentActivity = [
  { student: 'Leo Chen', action: 'submitted "Water Cycle Signs"', detail: 'score 100%', time: '5m ago', icon: '✅' },
  { student: 'Mia Rose', action: 'earned the "7 Day Streak" achievement badge', detail: '', time: '1h ago', icon: '🏆' },
];

export const teacherAlerts = [
  { type: 'pink', text: '3 students are falling behind class average in ASL basics.' },
  { type: 'orange', text: 'Grade 3 fractions module has 4 un-graded video questions.' },
];

export const classes = [
  { name: 'ASL 101 - Beginners', grade: 'Grade 2', roster: 18, module: 'Greetings module', progress: 75 },
  { name: 'Math Signs & Fractions', grade: 'Grade 3', roster: 14, module: 'Fractions Concepts', progress: 60 },
];

export const studentRoster = [
  { name: 'Leo Chen', enrollment: 'Sep 4, 2025', progress: 80, lastActive: 'Today, 09:30 AM' },
  { name: 'Mia Rose', enrollment: 'Sep 4, 2025', progress: 72, lastActive: 'Today, 08:45 AM' },
  { name: 'Alex Dunphy', enrollment: 'Sep 5, 2025', progress: 65, lastActive: 'Yesterday' },
];

export const evaluationQueue = [
  { name: 'Leo Chen', assignment: 'Classroom Greetings Video', time: '10m ago', status: 'Awaiting Review', selected: true },
  { name: 'Mia Rose', assignment: 'Classroom Greetings Video', time: '1h ago', status: 'Awaiting Review', selected: false },
  { name: 'Alex Dunphy', assignment: 'Water Cycle Signs', time: '2h ago', status: 'Awaiting Review', selected: false },
];

export const monitoringKPIs = [
  { label: 'Class Average', value: '84%', sub: '8% ahead of school baseline' },
  { label: 'Avg. Completion Rate', value: '91%', sub: 'Avg. 11/12 weekly lessons done' },
  { label: 'Needs Intervention', value: '3', sub: 'Students score below 70%' },
];

export const performanceTable = [
  { name: 'Leo Chen', completed: '9 / 12', quizScore: '92%', streak: '7 Days', status: 'Excelling' },
  { name: 'Mia Rose', completed: '8 / 12', quizScore: '85%', streak: '5 Days', status: 'On Track' },
  { name: 'Alex Dunphy', completed: '5 / 12', quizScore: '62%', streak: '2 Days', status: 'Needs Help' },
];

export const teacherResources = [
  { title: 'ASL Greeting Worksheets', type: 'Printable Classroom Materials', grade: 'Grade 1-3', badge: 'FREE STANDARD' },
  { title: 'Math Signs Teaching Guide', type: 'Instructional Video Reference', grade: 'Teacher Prep', badge: 'FREE STANDARD' },
];

// ===== PARENT DATA =====
export const parentKPIs = [
  { label: 'Weekly Lessons Completed', value: '14 / 16', sub: '+2 bonus modules done' },
  { label: 'Average Quiz Trend', value: '94%', sub: 'Consistent Grade A bracket' },
  { label: 'Combined Streak', value: '12 Days', sub: 'Shared achievement unlocked!' },
];

export const children = [
  { name: 'Leo Chen', grade: 'Grade 6', school: 'Metro School', lesson: 'Basic Science Greetings', progress: 75, avatar: 'LC' },
  { name: 'Mia Chen', grade: 'Grade 3', school: 'Metro School', lesson: 'Fractions Practice Quiz', progress: 88, avatar: 'MC' },
];

export const parentTimeline = [
  { child: 'Leo Chen', action: 'submitted ASL Math Quiz: Fractions', detail: 'Score: 100%', time: '10 mins ago', icon: '✅' },
  { child: 'Mia Chen', action: 'unlocked achievement badge:', detail: '"Double Stream King"', time: '1 hour ago', icon: '🏆' },
];

export const parentAlerts = [
  { type: 'pink', text: "Teacher Sarah Jenkins left a custom video feedback on Leo's science presentation." },
  { type: 'orange', text: 'Upcoming due date: Mia\'s homework "Common Sign Concepts" tomorrow 4 PM.' },
];

export const childSubjects = [
  { subject: 'ASL Vocabulary & Grammar', percent: 92, color: 'teal' },
  { subject: 'Bilingual Math Concepts', percent: 78, color: 'blue' },
  { subject: 'Bilingual Science Signs', percent: 85, color: 'orange' },
];

export const dailyEngagement = [
  { day: 'Mon', hours: 3 },
  { day: 'Tue', hours: 4 },
  { day: 'Wed', hours: 2.5 },
  { day: 'Thu', hours: 6 },
  { day: 'Fri', hours: 3.5 },
  { day: 'Sat', hours: 1 },
  { day: 'Sun', hours: 1.5 },
];

export const teacherConversations = [
  { name: 'Sarah Jenkins', child: 'Leo', lastMessage: 'Excellent work on the project!', avatar: 'SJ' },
  { name: 'Marcus Aurelius', child: 'Mia', lastMessage: "Let's review the upcoming test.", avatar: 'MA' },
];

export const chatMessages = [
  { sender: 'parent', text: "Hello Sarah, thank you for the feedback on Leo's water cycle project! We practiced the signs again last night.", time: 'Yesterday, 5:30 PM', status: 'Read' },
  { sender: 'teacher', text: "That's wonderful to hear, Robert! His precision with visual ASL descriptors is outstanding. Let's touch base at our scheduled IEP review.", time: 'Today, 8:15 AM', status: '' },
];

export const helpCategories = [
  { title: 'For Parents', desc: 'Browse specific troubleshooting checklists & guided videos.', icon: '👨‍👩‍👧' },
  { title: 'For Students', desc: 'Browse specific troubleshooting checklists & guided videos.', icon: '🎓' },
  { title: 'Classroom Tools', desc: 'Browse specific troubleshooting checklists & guided videos.', icon: '🏫' },
  { title: 'Translation APIs', desc: 'Browse specific troubleshooting checklists & guided videos.', icon: '🔌' },
];

// ===== ADMIN DATA =====
export const adminKPIs = [
  { label: 'Enrolled Students', value: '248 Students', sub: '+12 enrolled this month' },
  { label: 'Active IEP Curriculums', value: '32 Paths', sub: '100% K-12 Standards Compliant' },
  { label: 'District Platform Usage', value: '94.2%', sub: 'Outstanding daily activity' },
];

export const cohortData = [
  { cohort: 'Grade 6 Science ( Jenkins )', students: 18, avgTime: '14.5 hours/wk', status: 'Active' },
  { cohort: 'Grade 3 Math ( Aurelius )', students: 14, avgTime: '12.2 hours/wk', status: 'Active' },
];

export const landingFeatures = [
  { title: 'Sign Language Lessons', desc: 'Interactive lessons with video coaching and step-by-step ASL feedback.', icon: '🤟' },
  { title: 'Real-time Converter', desc: 'Sign-to-text, speech, and object recognition powered by AI.', icon: '🔄' },
  { title: 'Progress Tracking', desc: 'Gamified streaks, badges, and comprehensive learning trends.', icon: '📊' },
  { title: 'Teacher & Classroom Tools', desc: 'Assignments, roster management, and accessibility settings.', icon: '👩‍🏫' },
  { title: 'Parent Dashboards', desc: 'Home updates, learning guides, and teacher communication.', icon: '👨‍👩‍👧' },
];

export const pricingPlans = [
  { name: 'Free Individual', price: '$0', period: '/forever', features: ['Basic ASL Lessons', 'Limited Converter Usage', 'Progress Tracking', 'Community Access'], btn: 'Start Learning', featured: false },
  { name: 'School Pack', price: '$49', period: '/month', features: ['Unlimited Lessons', 'Full Converter Access', 'Teacher Dashboard', 'Parent Portal', 'Priority Support'], btn: 'Enroll School', featured: true },
  { name: 'Enterprise / NGO', price: 'Custom', period: '', features: ['Everything in School Pack', 'Custom Integrations', 'Dedicated Support', 'SLA Guarantee', 'API Access'], btn: 'Contact Sales', featured: false },
];
