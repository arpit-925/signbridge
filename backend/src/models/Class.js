const mongoose = require('mongoose');

const classScheduleItemSchema = new mongoose.Schema(
  {
    time: { type: String, required: true },
    grade: { type: String, default: '' },
    title: { type: String, required: true },
    type: { type: String, default: 'Lesson' },
    status: { type: String, default: 'Upcoming' },
    statusType: { type: String, enum: ['active', 'upcoming'], default: 'upcoming' },
  },
  { _id: false }
);

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      trim: true,
    },
    grade: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      default: '',
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    progress: {
      type: Number,
      default: 0,
    },
    schedule: [classScheduleItemSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Class', classSchema);
