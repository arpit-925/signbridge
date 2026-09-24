const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    type: { type: String, enum: ['multiple-choice', 'sign-identification'], default: 'multiple-choice' },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true, select: false }, // Hidden by default from student responses
    explanation: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    description: {
      type: String,
      default: '',
    },
    mode: {
      type: String,
      default: 'Untimed Mode',
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    passingScore: {
      type: Number,
      default: 70,
    },
    questions: [questionSchema],
    published: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Quiz', quizSchema);
