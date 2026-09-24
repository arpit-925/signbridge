const mongoose = require('mongoose');

const parentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    relationship: {
      type: String,
      default: 'Parent',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ParentProfile', parentProfileSchema);
