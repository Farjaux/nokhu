const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { redisClient } = require('../config/redis');

const generateTokens = async userId => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30m',
  });
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await redisClient.set(`refresh_token:${userId}`, hashedRefreshToken, {
    EX: 30 * 24 * 60 * 60,
  }); // 30 days expiry

  return { accessToken, refreshToken };
};

const storeRefreshTokenInCookie = (res, refreshToken) => {
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: false, //Change to true in Prod
    // sameSite: 'Strict', //Turn on in Prod
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

module.exports = { generateTokens, storeRefreshTokenInCookie };
