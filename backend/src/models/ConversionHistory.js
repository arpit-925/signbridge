const mongoose = require('mongoose');

const conversionHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    inputType: {
      type: String,
      enum: ['sign', 'text', 'voice', 'object'],
      default: 'sign',
    },
    predictedText: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      default: 0.95,
    },
    language: {
      type: String,
      default: 'en',
    },
    aiModelVersion: {
      type: String,
      default: 'signbridge-v1.0-mock',
    },
    sessionId: {
      type: String,
      default: () => `sess_${Date.now()}`,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

conversionHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ConversionHistory', conversionHistorySchema);
