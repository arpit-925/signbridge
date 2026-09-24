const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 SignBridge AI Backend Server running in ${env.NODE_ENV} mode`);
      console.log(`🌐 Port: http://localhost:${env.PORT}`);
      console.log(`📚 Swagger Docs: http://localhost:${env.PORT}/api/docs`);
      console.log(`=======================================================`);
    });

    const shutdown = async () => {
      console.log('\n[Server] Graceful shutdown initiated...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`[Server] Failed to start: ${error.message}`);
    process.exit(1);
  }
};

startServer();
