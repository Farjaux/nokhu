const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { redisClient } = require('../config/redis');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const {
  generateTokens,
  storeRefreshTokenInCookie,
} = require('../utils/generateTokens');
const getLanguageAndCountry = require('../utils/getLanguageAndCountry');

// 🔹 LOGIN: Use storeRefreshTokenInCookie
const login = async (_, { email, password }, { res }) => {
  const user = await User.findOne({
    where: { email },
    include: [{ model: Subscription, as: 'subscription' }],
  });

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new Error('Invalid credentials');
  }

  const { accessToken, refreshToken } = await generateTokens(user.id);

  storeRefreshTokenInCookie(res, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      profile_picture: user.profile_picture,
      language_preference: user.language_preference,
      country: user.country,
      role: user.role,
      subscription: user.subscription, // ✅ Include subscription
    },
  };
};

const logout = async (_, __, { req, res, user }) => {
  try {
    console.log('🚀 Logout Resolver Called');

    // Get the refresh token from cookies
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      console.log('⚠️ No refresh token found in cookies.');
      return { message: 'No active session' };
    }

    // Decode refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      console.log('⚠️ Invalid or expired refresh token.');
      return { message: 'Invalid session' };
    }

    // Delete refresh token from Redis
    console.log(`🗑 Removing refresh token from Redis for user: ${decoded.id}`);
    await redisClient.del(`refresh_token:${decoded.id}`);

    // Clear refresh token cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: false,
      // sameSite: 'Strict',
    });

    console.log('✅ User logged out successfully');
    return { message: 'Logged out successfully' };
  } catch (error) {
    console.error('⛔ Error in Logout Resolver:', error);
    throw new Error('Logout failed');
  }
};

const register = async (
  _,
  { full_name, username, email, password, profile_picture },
  { req }
) => {
  try {
    const existingEmail = await User.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      throw new Error('User with this email already exists');
    }
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw new Error('The username is not available');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { language_preference, country } = await getLanguageAndCountry({
      req,
    });

    const user = await User.create({
      full_name,
      username,
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      language_preference,
      country,
      profile_picture,
    });

    const subscription = await Subscription.create({
      user_id: user.id,
    });

    return {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      language_preference: user.language_preference,
      country: user.country,
      role: user.role,
      profile_picture: user.profile_picture,
      subscription,
    };
  } catch (error) {
    console.error('Error in register resolver:', error);
    throw new Error('Failed to register user');
  }
};

const refreshToken = async (_, __, { req, res }) => {
  const oldRefreshToken = req.cookies.refresh_token; // 🔹 Extract refresh token from HTTP-only cookie
  if (!oldRefreshToken) throw new Error('Unauthorized');

  // 🔹 Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new Error('Invalid refresh token. Please log in again.');
  }

  // Check if the refresh token was already recently updated
  const storedHash = await redisClient.get(`refresh_token:${decoded.id}`);
  if (!storedHash || !(await bcrypt.compare(oldRefreshToken, storedHash))) {
    throw new Error('Invalid session. Please log in again.');
  }

  // Check if a recent refresh happened
  const lastIssuedToken = await redisClient.get(`access_token:${decoded.id}`);
  if (lastIssuedToken) {
    console.log('Token already refreshed recently, preventing duplicate.');
    return { accessToken: lastIssuedToken };
  }

  // 🔹 Generate new tokens (Rotating refresh token)
  const { accessToken, refreshToken } = await generateTokens(decoded.id);

  // 🔹 Store new refresh token in Redis (Rotating the old one)
  await redisClient.set(
    `refresh_token:${decoded.id}`,
    await bcrypt.hash(refreshToken, 10),
    {
      EX: 30 * 24 * 60 * 60, // 30 days expiry
    }
  );

  // 🔹 Store the new refresh token in HTTP-only cookie
  storeRefreshTokenInCookie(res, refreshToken);

  return { accessToken };
};

const authResolvers = {
  Mutation: {
    login,
    logout,
    register,
    refreshToken,
  },
};

module.exports = authResolvers;
