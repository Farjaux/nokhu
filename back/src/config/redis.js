const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URI || 'redis://127.0.0.1:6379', // Default to localhost if missing
});

redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('error', err => console.error('Redis Error:', err));

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

const closeRedis = async () => {
  console.log('Attempting to close Redis connection...');
  try {
    await redisClient.quit();
    console.log('Redis connection closed.');
  } catch (err) {
    console.error('Error closing Redis connection:', err);
  }
};

module.exports = { redisClient, connectRedis, closeRedis };
