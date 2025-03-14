const User = require('../models/User');
const Subscription = require('../models/Subscription');

const userResolvers = {
  Query: {
    getUser: async (_, { id }) => {
      return await User.findByPk(id);
    },
    getUsers: async () => {
      return await User.findAll();
    },
    me: async (_, __, { user }) => {
      if (!user) {
        throw new Error('Unauthorized');
      }

      // Fetch the user from the database with the subscription included
      const dbUser = await User.findByPk(user.id, {
        include: [{ model: Subscription, as: 'subscription' }],
      });

      if (!dbUser) {
        throw new Error('User not found');
      }

      return {
        id: dbUser.id,
        full_name: dbUser.full_name,
        username: dbUser.username,
        email: dbUser.email,
        profile_picture: dbUser.profile_picture,
        language_preference: dbUser.language_preference,
        country: dbUser.country,
        role: dbUser.role,
        subscription: dbUser.subscription,
      };
    },
  },
  Mutation: {
    updateUserProfile: async (
      _,
      {
        id,
        full_name,
        username,
        email,
        date_of_birth,
        gender,
        country,
        language_preference,
        profile_picture,
        cover_photo,
        bio,
      },
      { userId }
    ) => {
      if (id !== userId)
        throw new Error('You can only update your own profile.');

      const user = await User.findByPk(id);
      if (!user) throw new Error('User not found');

      await user.update({
        full_name,
        username,
        email,
        date_of_birth,
        gender,
        country,
        language_preference,
        profile_picture,
        cover_photo,
        bio,
      });

      return user;
    },
  },
};

module.exports = userResolvers;
