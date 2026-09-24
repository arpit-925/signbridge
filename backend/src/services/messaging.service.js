const Message = require('../models/Message');
const User = require('../models/User');

class MessagingService {
  async getConversations(userId) {
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name role avatar')
      .populate('receiver', 'name role avatar')
      .lean();

    const conversationMap = new Map();
    messages.forEach((m) => {
      if (!conversationMap.has(m.conversationId)) {
        const otherParty = m.sender._id.toString() === userId.toString() ? m.receiver : m.sender;
        conversationMap.set(m.conversationId, {
          conversationId: m.conversationId,
          lastMessage: m.body,
          updatedAt: m.createdAt,
          user: otherParty,
          unread: !m.read && m.receiver._id.toString() === userId.toString(),
        });
      }
    });

    return Array.from(conversationMap.values());
  }

  async getMessages(conversationId) {
    return Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role avatar')
      .populate('receiver', 'name role avatar')
      .lean();
  }

  async sendMessage(senderId, { receiverId, conversationId, body, subject, dueDate }) {
    const cid = conversationId || [senderId, receiverId].sort().join('_');
    const msg = await Message.create({
      sender: senderId,
      receiver: receiverId,
      conversationId: cid,
      body,
      subject: subject || '',
      dueDate: dueDate || '',
      read: false,
    });
    return msg;
  }

  async markAsRead(messageId, userId) {
    return Message.findOneAndUpdate(
      { _id: messageId, receiver: userId },
      { read: true },
      { new: true }
    );
  }
}

module.exports = new MessagingService();
