const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async (uri = env.MONGODB_URI) => {
  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.name} @ ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.error('[MongoDB] DIAGNOSTIC: The MongoDB Atlas cluster hostname could not be resolved (ENOTFOUND).');
      console.error('[MongoDB] This occurs when an Atlas free M0 cluster is PAUSED due to inactivity or the MONGODB_URI in Render is invalid.');
      console.error('[MongoDB] Action required: Visit https://cloud.mongodb.com, resume the cluster, or provide an active MONGODB_URI connection string.');
    }
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed.');
  } catch (error) {
    console.error(`[MongoDB] Disconnection error: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
