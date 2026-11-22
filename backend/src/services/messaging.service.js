const Message = require('../models/Message');
const User = require('../models/User');
const { NotFoundError, BadRequestError } = require('../utils/errors');

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

  async getMessages(userId, conversationId) {
    // Only return messages from the conversation the caller actually participates in.
    return Message.find({
      conversationId,
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role avatar')
      .populate('receiver', 'name role avatar')
      .lean();
  }

  async sendMessage(senderId, { receiverId, body, subject, dueDate }) {
    if (!receiverId || !/^[0-9a-fA-F]{24}$/.test(receiverId.toString())) {
      throw new BadRequestError('A valid receiverId is required');
    }
    if (!body || !body.trim()) {
      throw new BadRequestError('Message body is required');
    }
    if (receiverId.toString() === senderId.toString()) {
      throw new BadRequestError('You cannot send a message to yourself');
    }

    const receiver = await User.exists({ _id: receiverId });
    if (!receiver) {
      throw new NotFoundError('Recipient not found');
    }

    // Derive the canonical conversation id so a client cannot inject messages
    // into an unrelated conversation.
    const cid = [senderId, receiverId].sort().join('_');
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
