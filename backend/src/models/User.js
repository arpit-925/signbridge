const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const accessibilityPreferencesSchema = new mongoose.Schema(
  {
    captionSize: { type: String, default: '24px' },
    playbackSpeed: { type: Number, default: 0.75 },
    highContrast: { type: Boolean, default: true },
    autoplay: { type: Boolean, default: false },
    subtitles: { type: Boolean, default: true },
    magnification: { type: Number, default: 1.0 },
    preferredLanguage: { type: String, default: 'asl' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'parent', 'admin'],
      default: 'student',
      index: true,
    },
    avatar: {
      type: String,
      default: 'SB',
    },
    phone: {
      type: String,
      trim: true,
    },
    school: {
      type: String,
      trim: true,
      default: 'Metro Public School',
    },
    languagePreference: {
      type: String,
      default: 'en',
    },
    accessibilityPreferences: {
      type: accessibilityPreferencesSchema,
      default: () => ({}),
    },
    refreshToken: {
      type: String,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = mongoose.model('User', userSchema);
