const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Never ship a publicly known signing key. If the environment does not provide
// one, generate a strong per-process secret and warn loudly instead of using a
// hardcoded fallback. (Production deployments should always set these.)
const resolveSecret = (name) => {
  const provided = process.env[name];
  if (provided && provided.length >= 32) return provided;
  if (provided) {
    console.warn(`[Config] ${name} is shorter than 32 characters; generating a stronger ephemeral secret.`);
  } else {
    console.warn(`[Config] ${name} is not set; generating an ephemeral secret. Tokens will be invalid after restart.`);
  }
  return crypto.randomBytes(64).toString('hex');
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/signbridge_db',

  JWT_ACCESS_SECRET: resolveSecret('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: resolveSecret('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',

  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',

  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
};

module.exports = env;
