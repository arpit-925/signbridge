const mongoose = require('mongoose');

const vocabularyItemSchema = new mongoose.Schema(
  {
    word: { type: String, required: true },
    desc: { type: String, required: true },
    active: { type: Boolean, default: false },
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: ['ASL Basics', 'Math Signs', 'Science Signs', 'Daily Communication', 'Academic Concepts', 'Alphabet', 'Numbers', 'Words'],
      index: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'asl'],
      default: 'en',
    },
    duration: {
      type: String,
      default: '10 mins',
    },
    color: {
      type: String,
      enum: ['teal', 'blue', 'orange', 'purple'],
      default: 'teal',
    },
    vocabulary: [vocabularyItemSchema],
    videoUrl: {
      type: String,
      default: '',
    },
    signAnimationUrl: {
      type: String,
      default: '',
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    order: {
      type: Number,
      default: 1,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({ category: 1, published: 1 });
lessonSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Lesson', lessonSchema);
