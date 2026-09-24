const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    studentIdCode: {
      type: String,
      default: () => `#SB-${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`,
      unique: true,
      trim: true,
    },
    grade: {
      type: String,
      default: 'Grade 6',
    },
    section: {
      type: String,
      default: 'Class B',
    },
    school: {
      type: String,
      default: 'Metro Public School',
    },
    district: {
      type: String,
      default: 'District 4',
    },
    xp: {
      type: Number,
      default: 850,
    },
    level: {
      type: Number,
      default: 6,
    },
    streak: {
      type: Number,
      default: 7,
    },
    lastActiveDate: {
      type: Date,
      default: Date.now,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
