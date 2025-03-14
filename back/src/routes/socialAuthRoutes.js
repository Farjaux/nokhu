const express = require('express');
const passport = require('../config/passport');
const { storeRefreshTokenInCookie } = require('../utils/generateTokens');
const router = express.Router();

// ✅ Google OAuth Login
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: 'Authentication failed' });

    const { user, tokens } = req.user;

    // ✅ Store refresh token in HTTP-only cookie
    storeRefreshTokenInCookie(res, tokens.refreshToken);

    // ✅ Redirect to frontend with access token
    res.redirect(`http://localhost:3000/`);
  }
);

// ✅ Facebook OAuth Login
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  (req, res) => {
    if (!req.user)
      return res.status(401).json({ message: 'Authentication failed' });

    const { user, tokens } = req.user;

    // ✅ Store refresh token in HTTP-only cookie
    storeRefreshTokenInCookie(res, tokens.refreshToken);

    // ✅ Redirect to frontend with access token
    res.redirect(`http://localhost:3000/`);
  }
);

module.exports = router;
