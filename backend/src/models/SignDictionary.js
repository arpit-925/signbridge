const mongoose = require('mongoose');

const signDictionarySchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'asl'],
      default: 'en',
    },
    signCode: {
      type: String,
      default: '',
    },
    animationUrl: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
    },
    description: {
      type: String,
      default: '',
    },
    aliases: [{ type: String, lowercase: true, trim: true }],
  },
  {
    timestamps: true,
  }
);

signDictionarySchema.index({ aliases: 1 });

module.exports = mongoose.model('SignDictionary', signDictionarySchema);
