const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { generateTokens } = require('../utils/generateTokens');
const getLanguageAndCountry = require('../utils/getLanguageAndCountry');

const generateUsername = fullName => {
  const cleanName = fullName
    .normalize('NFD') // Normalize accented characters (e.g., é → e)
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
    .toLowerCase(); // Convert to lowercase;
  return `${cleanName}`;
};

const extractUsernameFromEmail = emailUser => {
  return emailUser.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
};

// ✅ Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `http://localhost:5000/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { language_preference, country } = await getLanguageAndCountry({
          locale: profile._json?.locale,
        });
        const fullName = profile.displayName;
        const emailUser = profile.emails?.[0]?.value;
        const generatedUsername = generateUsername(fullName);
        const emailGeneratedUsername = extractUsernameFromEmail(emailUser);

        let [user, created] = await User.findOrCreate({
          where: { oauth_provider_id: profile.id, oauth_provider: 'google' },
          defaults: {
            email: emailUser || null,
            full_name: fullName || null,
            username: emailGeneratedUsername || generatedUsername,
            password_hash: null,
            is_verified: true,
            email_verified: true,
            profile_picture: profile.photos?.[0]?.value || null,
            language_preference,
            country,
          },
        });

        if (created) {
          await Subscription.create({
            user_id: user.id,
          });
        }

        // ✅ Generate Access & Refresh Tokens
        const tokens = await generateTokens(user.id);

        return done(null, { user, tokens }); // Attach tokens
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// ✅ Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: `http://localhost:5000/auth/facebook/callback`,
      profileFields: [
        'id',
        'email',
        'name',
        'picture.type(large)',
        'locale',
        'location',
      ],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { language_preference, country } = await getLanguageAndCountry({
          locale: profile._json?.locale,
          location: profile._json?.location?.country,
        });

        const fullName = profile.name?.givenName
          ? `${profile.name.givenName} ${profile.name.familyName}`
          : profile.displayName;
        const emailUser = profile.emails?.[0]?.value;
        const generatedUsername = generateUsername(fullName);
        const emailGeneratedUsername = extractUsernameFromEmail(emailUser);

        let [user, created] = await User.findOrCreate({
          where: { oauth_provider_id: profile.id, oauth_provider: 'facebook' },
          defaults: {
            email: emailUser || null,
            full_name: fullName || null,
            username: emailGeneratedUsername || generatedUsername,
            password_hash: null,
            is_verified: true,
            email_verified: true,
            profile_picture: profile.photos?.[0]?.value || null,
            language_preference,
            country,
          },
        });

        if (created) {
          await Subscription.create({
            user_id: user.id,
          });
        }

        // ✅ Generate Access & Refresh Tokens
        const tokens = await generateTokens(user.id);

        return done(null, { user, tokens });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
