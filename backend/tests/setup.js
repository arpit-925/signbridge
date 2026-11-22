const mongoose = require('mongoose');
const env = require('../src/config/env');

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.TEST_MONGODB_URI || env.MONGODB_URI, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      });
    } catch (err) {
      console.warn(`[Test Setup] Warning: MongoDB connection failed: ${err.message}`);
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close();
    } catch (err) {
      // Ignore cleanup error
    }
  }
});
