const mongoose = require('mongoose');

const aiPredictionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    predictionType: {
      type: String,
      enum: ['sign', 'text-to-sign', 'object'],
      required: true,
    },
    inputPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    provider: {
      type: String,
      enum: ['mock', 'fastapi'],
      default: 'mock',
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AiPrediction', aiPredictionSchema);
