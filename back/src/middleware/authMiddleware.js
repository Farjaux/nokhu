const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { redisClient } = require('../config/redis');
const { generateTokens } = require('../utils/generateTokens');

/**
 * Checks the request for an access token. If it's expired,
 * tries to refresh automatically using the refresh token in cookie.
 */
async function getUserFromToken(req, res) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      // 1) Verify Access Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        // 2) Attempt to refresh if expired
        const refreshToken = req.cookies.refresh_token;
        if (refreshToken) {
          try {
            const decodedRefresh = jwt.verify(
              refreshToken,
              process.env.JWT_REFRESH_SECRET
            );
            const storedHash = await redisClient.get(
              `refresh_token:${decodedRefresh.id}`
            );
            if (
              storedHash &&
              (await bcrypt.compare(refreshToken, storedHash))
            ) {
              // Generate new tokens
              const { accessToken: newAccess, refreshToken: newRefresh } =
                await generateTokens(decodedRefresh.id);

              // Set new refresh token cookie
              res.cookie('refresh_token', newRefresh, {
                httpOnly: true,
                secure: false, // true in production
                // sameSite: 'Strict', // or 'None' if needed
                maxAge: 30 * 24 * 60 * 60 * 1000,
              });

              // Return new access token in a custom header
              res.setHeader('x-refreshed-token', newAccess);

              // Decode & return the new access token
              const newDecoded = jwt.verify(newAccess, process.env.JWT_SECRET);
              return newDecoded;
            }
          } catch {
            return null;
          }
        }
      }
      return null;
    }
  }

  // 3) If no Access Token, try Refresh Token alone
  const refreshToken = req.cookies.refresh_token;
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const storedHash = await redisClient.get(`refresh_token:${decoded.id}`);
      if (storedHash && (await bcrypt.compare(refreshToken, storedHash))) {
        // Generate new access token
        const { accessToken: newAccess, refreshToken: newRefresh } =
          await generateTokens(decoded.id);

        // Set new refresh token
        res.cookie('refresh_token', newRefresh, {
          httpOnly: true,
          secure: false, // true in production
          // sameSite: 'Strict',
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        // Return the new access token in header
        res.setHeader('x-refreshed-token', newAccess);

        // Return decoded user from the new access token
        const newDecoded = jwt.verify(newAccess, process.env.JWT_SECRET);
        console.log(`[${requestId}] new access token`, newDecoded);
        return newDecoded;
      }
    } catch {
      return null;
    }
  }

  // No valid tokens
  return null;
}

module.exports = { getUserFromToken };
