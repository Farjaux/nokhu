require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const syncPlaybackProgress = require('./cron/syncPlaybackProgress');
const syncVideoAnalytics = require('./cron/syncVideoAnalytics');
const passport = require('./config/passport');
const socialAuthRoutes = require('./routes/socialAuthRoutes');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const { connectMongoDB, closeMongoDB } = require('./config/mongodb');
const { connectPostgreSQL, closePostgreSQL } = require('./config/postgresql');
const { connectRedis, closeRedis } = require('./config/redis');
const videoUpload = require('./routes/videoUpload');
const cookieParser = require('cookie-parser');
const { getUserFromToken } = require('./middleware/authMiddleware');
const models = require('./models/associations');

let serverInstance; // To store the server instance for graceful shutdown

async function startServer() {
  const app = express();

  await connectMongoDB();
  await connectPostgreSQL();
  await connectRedis();

  // Run playback progress and video analytics sync every 5 minute
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏳ [CRON] Running scheduled jobs...');

    try {
      await Promise.all([syncPlaybackProgress(), syncVideoAnalytics()]);
      console.log('✅ [CRON] Playback & Analytics Sync Completed.');
    } catch (error) {
      console.error(
        '❌ [CRON ERROR] Failed to execute one or more tasks:',
        error
      );
    }
  });

  // Enable CORS for all origins
  app.use(
    cors({
      origin: 'http://localhost:3000', // frontend URL
      methods: ['GET,POST'], // Allowed HTTP methods
      credentials: true, // If you're sending cookies, you need to allow credentials
    })
  );

  // Middleware
  app.use(express.json());
  app.use(cookieParser());
  app.use(passport.initialize());

  // Routes
  app.use('/api/videos', videoUpload);
  app.use('/auth', socialAuthRoutes);

  // Apollo Server setup
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req, res }) => {
      if (!req.user) {
        req.user = await getUserFromToken(req, res);
      }
      return { user: req.user, req, res, models };
    },
  });

  await server.start();
  server.applyMiddleware({
    app,
    cors: {
      origin: 'http://localhost:3000',
      credentials: true,
    },
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  const PORT = process.env.PORT || 5000;
  serverInstance = app.listen(PORT, () => {
    console.log(
      `Server running at http://localhost:${PORT}/${server.graphqlPath}`
    );
  });
}

const handleExit = async () => {
  console.log('Shutting down gracefully...');
  try {
    // Close the HTTP server gracefully first
    if (serverInstance) {
      await new Promise((resolve, reject) => {
        serverInstance.close(err => {
          if (err) reject('Error closing HTTP server: ' + err);
          else resolve();
        });
      });
      console.log('HTTP server closed.');
    }

    // Await the Redis shutdown
    await closeRedis();

    // Await the MongoDB shutdown
    await closeMongoDB();

    // Await the PostgreSQL shutdown
    await closePostgreSQL();

    console.log('Cleanup complete. Exiting.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', handleExit); // Handle termination signals
process.on('SIGINT', handleExit); // Handle Ctrl+C
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
  handleExit(); // Attempt to clean up before crashing
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  handleExit(); // Attempt to clean up
});

(async () => {
  await startServer();
})();
