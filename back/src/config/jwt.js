const jwt = require('jsonwebtoken');

const generateAccessToken = user => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '30m',
  });
};

const generateRefreshToken = user => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.REFRESH_SECRET,
    {
      expiresIn: '60d',
    }
  );
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (err.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Authentication error');
    }
  }
};

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };
