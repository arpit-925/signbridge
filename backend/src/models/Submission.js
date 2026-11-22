const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    submissionVideoUrl: {
      type: String,
      default: '',
    },
    textResponse: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Awaiting Review', 'Graded', 'Returned'],
      default: 'Awaiting Review',
      index: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
      default: '',
    },
    // No fabricated defaults: only populated when a real AI prediction is supplied.
    aiPrediction: {
      text: { type: String, default: '' },
      confidence: { type: Number, default: 0 },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    gradedAt: {
      type: Date,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ assignmentId: 1, studentId: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
