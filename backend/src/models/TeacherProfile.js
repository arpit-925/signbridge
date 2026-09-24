const mongoose = require('mongoose');

const teacherProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Lead ASL Instructor',
    },
    school: {
      type: String,
      default: 'Metro Public School',
    },
    specialization: {
      type: [String],
      default: ['ASL', 'Math Signs', 'Science Signs'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TeacherProfile', teacherProfileSchema);
