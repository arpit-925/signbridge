const ParentProfile = require('../models/ParentProfile');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Message = require('../models/Message');
const Feedback = require('../models/Feedback');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

class ParentService {
  async getDashboard(parentId) {
    const parentProfile = await ParentProfile.findOne({ userId: parentId }).populate('children').lean();

    const parentKPIs = [
      { label: 'Weekly Lessons Completed', value: '14 / 16', sub: '+2 bonus modules done' },
      { label: 'Average Quiz Trend', value: '94%', sub: 'Consistent Grade A bracket' },
      { label: 'Combined Streak', value: '12 Days', sub: 'Shared achievement unlocked!' },
    ];

    const children = [
      { id: 'child_leo', name: 'Leo Chen', grade: 'Grade 6', school: 'Metro School', lesson: 'Basic Science Greetings', progress: 75, avatar: 'LC' },
      { id: 'child_mia', name: 'Mia Chen', grade: 'Grade 3', school: 'Metro School', lesson: 'Fractions Practice Quiz', progress: 88, avatar: 'MC' },
    ];

    const parentTimeline = [
      { child: 'Leo Chen', action: 'submitted ASL Math Quiz: Fractions', detail: 'Score: 100%', time: '10 mins ago', icon: '✅' },
      { child: 'Mia Chen', action: 'unlocked achievement badge:', detail: '"Double Stream King"', time: '1 hour ago', icon: '🏆' },
    ];

    const parentAlerts = [
      { type: 'pink', text: "Teacher Sarah Jenkins left a custom video feedback on Leo's science presentation." },
      { type: 'orange', text: 'Upcoming due date: Mia\'s homework "Common Sign Concepts" tomorrow 4 PM.' },
    ];

    return {
      kpis: parentKPIs,
      children,
      timeline: parentTimeline,
      alerts: parentAlerts,
    };
  }

  async getChildren(parentId) {
    const parentProfile = await ParentProfile.findOne({ userId: parentId }).populate('children').lean();
    if (parentProfile?.children?.length > 0) {
      return parentProfile.children;
    }

    return [
      { id: 'leo', name: 'Leo Chen', grade: 'Grade 6', school: 'Metro School', lesson: 'Basic Science Greetings', progress: 75, avatar: 'LC' },
      { id: 'mia', name: 'Mia Chen', grade: 'Grade 3', school: 'Metro School', lesson: 'Fractions Practice Quiz', progress: 88, avatar: 'MC' },
    ];
  }

  async verifyChildAccess(parentId, childId) {
    // If it's a seed key or demo, allow
    if (childId === 'leo' || childId === 'mia' || childId === 'child_leo' || childId === 'child_mia') {
      return true;
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

    const childSubjects = [
      { subject: 'ASL Vocabulary & Grammar', percent: 92, color: 'teal' },
      { subject: 'Bilingual Math Concepts', percent: 78, color: 'blue' },
      { subject: 'Bilingual Science Signs', percent: 85, color: 'orange' },
    ];

    const dailyEngagement = [
      { day: 'Mon', hours: 3 },
      { day: 'Tue', hours: 4 },
      { day: 'Wed', hours: 2.5 },
      { day: 'Thu', hours: 6 },
      { day: 'Fri', hours: 3.5 },
      { day: 'Sat', hours: 1 },
      { day: 'Sun', hours: 1.5 },
    ];

    const teacherFeedback = {
      teacher: 'Sarah Jenkins',
      subject: 'Science',
      comment: "Leo's visual presentation on the water cycle was exceptional. He showed high precision in water stage hand movements.",
    };

    const supportiveStrategy = "Practice interactive math vocabulary using side-by-side ASL videos on Sign Bridge's Math module.";

    return {
      childSubjects,
      dailyEngagement,
      teacherFeedback,
      supportiveStrategy,
    };
  }

  async getChildActivity(parentId, childId) {
    await this.verifyChildAccess(parentId, childId);

    return [
      { action: 'Submitted ASL Math Quiz: Fractions', time: '10 mins ago', score: '100%' },
      { action: 'Completed Lesson 3: ASL Basics', time: 'Yesterday', score: 'Completed' },
      { action: 'Unlocked Streak Badge: 7 Days', time: '2 days ago', score: '' },
    ];
  }

  async getMessages(parentId) {
    return {
      teacherConversations: [
        { name: 'Sarah Jenkins', child: 'Leo', lastMessage: 'Excellent work on the project!', avatar: 'SJ' },
        { name: 'Marcus Aurelius', child: 'Mia', lastMessage: "Let's review the upcoming test.", avatar: 'MA' },
      ],
      chatMessages: [
        { sender: 'parent', text: "Hello Sarah, thank you for the feedback on Leo's water cycle project! We practiced the signs again last night.", time: 'Yesterday, 5:30 PM', status: 'Read' },
        { sender: 'teacher', text: "That's wonderful to hear, Robert! His precision with visual ASL descriptors is outstanding. Let's touch base at our scheduled IEP review.", time: 'Today, 8:15 AM', status: '' },
      ],
    };
  }

  async sendMessage(parentId, { receiverId, text, conversationId }) {
    const msg = await Message.create({
      sender: parentId,
      receiver: receiverId || parentId, // Demo fallback
      conversationId: conversationId || `conv_${parentId}`,
      body: text,
      read: false,
    });
    return msg;
  }
}

module.exports = new ParentService();
