const { z } = require('zod');

const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['student', 'teacher', 'parent', 'admin']).default('student'),
    school: z.string().optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    captionSize: z.string().optional(),
    playbackSpeed: z.number().optional(),
    preferredLanguage: z.string().optional(),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    role: z.enum(['student', 'teacher', 'parent', 'admin']).optional(),
  }),
};

const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

const updateProfileSchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    school: z.string().optional(),
    avatar: z.string().optional(),
    languagePreference: z.string().optional(),
    accessibilityPreferences: z
      .object({
        captionSize: z.string().optional(),
        playbackSpeed: z.number().optional(),
        highContrast: z.boolean().optional(),
        autoplay: z.boolean().optional(),
        subtitles: z.boolean().optional(),
        magnification: z.number().optional(),
        preferredLanguage: z.string().optional(),
      })
      .optional(),
  }),
};

const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
};
