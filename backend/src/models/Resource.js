const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: 'Printable Classroom Materials',
    },
    grade: {
      type: String,
      default: 'Grade 1-3',
    },
    badge: {
      type: String,
      default: 'FREE STANDARD',
    },
    url: {
      type: String,
      default: '',
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

module.exports = mongoose.model('Resource', resourceSchema);
