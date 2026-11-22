const userRepository = require('../repositories/user.repository');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const ParentProfile = require('../models/ParentProfile');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token');
const { BadRequestError, UnauthorizedError, ConflictError } = require('../utils/errors');

const SELF_REGISTER_ROLES = ['student', 'teacher', 'parent'];

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  school: user.school,
  accessibilityPreferences: user.accessibilityPreferences,
});

class AuthService {
  async register(data) {
    if (data.role && !SELF_REGISTER_ROLES.includes(data.role)) {
      throw new BadRequestError('Admin accounts cannot be self-registered');
    }

    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await User.hashPassword(data.password);
    const initials = (data.name || 'User')
      .trim()
      .split(/\s+/)
      .map((n) => n[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'SB';

    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role || 'student',
      school: data.school || 'Metro Public School',
      phone: data.phone || '',
      avatar: data.avatar || initials,
      accessibilityPreferences: {
        captionSize: data.captionSize || '24px',
        playbackSpeed: data.playbackSpeed || 0.75,
        preferredLanguage: data.preferredLanguage || 'asl',
      },
    });

    // Create role-specific profile
    if (user.role === 'student') {
      await StudentProfile.create({
        userId: user._id,
        school: user.school,
      });
    } else if (user.role === 'teacher') {
      await TeacherProfile.create({
        userId: user._id,
        school: user.school,
      });
    } else if (user.role === 'parent') {
      await ParentProfile.create({
        userId: user._id,
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await userRepository.setRefreshToken(user._id, refreshToken);

    return {
      user: serializeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async login(email, password, expectedRole) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('This account has been deactivated');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (expectedRole && user.role.toLowerCase() !== expectedRole.toLowerCase()) {
      throw new UnauthorizedError(`Account role is '${user.role}', but tried logging in as '${expectedRole}'`);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await userRepository.setRefreshToken(user._id, refreshToken);

    return {
      user: serializeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await userRepository.findById(decoded.id, true);

      if (!user || !user.isActive || user.refreshToken !== token) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);
      await userRepository.setRefreshToken(user._id, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async logout(userId) {
    await userRepository.setRefreshToken(userId, null);
    return true;
  }

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ userId }).lean();
    } else if (user.role === 'teacher') {
      profile = await TeacherProfile.findOne({ userId }).lean();
    } else if (user.role === 'parent') {
      profile = await ParentProfile.findOne({ userId }).populate('children', 'name email avatar grade school').lean();
    }

    return {
      user: serializeUser(user),
      profile,
    };
  }

  async updateProfile(userId, updateData) {
    const updated = await userRepository.updateById(userId, updateData);
    return serializeUser(updated);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId, true);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect');
    }

    user.passwordHash = await User.hashPassword(newPassword);
    // Revoke the stored refresh token so a stolen token cannot outlive the password change.
    user.refreshToken = undefined;
    await user.save();
    return true;
  }
}

module.exports = new AuthService();
