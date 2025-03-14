const { redisClient } = require('../config/redis');
const authResolvers = require('./authResolvers');
const userResolvers = require('./userResolvers');
const Notification = require('../models/Notification');
const SearchHistory = require('../models/SearchHistory');
const Tag = require('../models/Tag');
const User = require('../models/User');
const Video = require('../models/Video');
const VideoAnalytics = require('../models/VideoAnalytics');
const Subscription = require('../models/Subscription');
const PaymentHistory = require('../models/PaymentHistory');
const Category = require('../models/Category');
const WatchHistory = require('../models/WatchHistory');
const PlaybackProgress = require('../models/PlaybackProgress');
const Comment = require('../models/Comment');

const WATCH_HISTORY_KEY = 'watch_history';
const PLAYBACK_PROGRESS_KEY = 'playback_progress';
const VIDEO_ANALYTICS_KEY = 'video_analytics';

const resolvers = {
  Query: {
    ...userResolvers.Query,
    getVideo: async (_, { id }) => {
      const video = await Video.findByPk(id, {
        include: [{ model: Category, as: 'categories' }],
      });
      return video;
    },
    getVideoPlaylist: async () => {
      // Fetch all videos in the playlist
      const videos = await Video.findAll({
        include: [
          {
            model: User, // Assuming there's a User model linked to Video
            as: 'uploader', // Ensure the alias matches your Sequelize model association
            attributes: ['username'], // Fetch only the uploader's name
          },
        ],
      });

      // Map results to include uploaderName
      return videos.map(video => ({
        ...video.toJSON(),
        uploaderName: video.uploader ? video.uploader.username : 'Unknown',
      }));
    },
    getUserVideos: async (_, { userId }) => {
      return await Video.findAll({
        where: { uploader_id: userId },
        attributes: ['id', 'title', 'thumbnail_s3_key', 'createdAt'], // Only fetching needed fields
      });
    },
    getVideos: async (_, { parentCategoryId, subcategoryId }, { models }) => {
      let categoryFilter = {};

      if (subcategoryId && subcategoryId !== 'All') {
        // If a specific subcategory is selected, filter only by that subcategory
        categoryFilter = { '$categories.id$': subcategoryId };
      } else if (parentCategoryId) {
        // If a parent category is selected, find all its subcategories
        const subcategories = await models.Category.findAll({
          where: { parent_id: parentCategoryId },
          attributes: ['id'],
        });

        const subcategoryIds = subcategories.map(cat => cat.id);

        categoryFilter = {
          '$categories.id$':
            subcategoryIds.length > 0 ? subcategoryIds : parentCategoryId,
        };
      }

      // Fetch videos with uploader and categories
      const videos = await models.Video.findAll({
        include: [
          {
            model: models.User,
            as: 'uploader',
            attributes: ['username'], // Fetch only username
          },
          {
            model: models.Category,
            as: 'categories',
            where: categoryFilter,
          },
        ],
      });

      return videos.map(video => ({
        ...video.toJSON(),
        uploaderName: video.uploader ? video.uploader.username : null,
      }));
    },
    getVideoAnalytics: async (_, { video_id }) => {
      return await VideoAnalytics.findOne({ where: { video_id } });
    },
    getAllVideoAnalytics: async () => {
      return await VideoAnalytics.findAll();
    },
    getUserVideoAnalytics: async (_, { userId }) => {
      // Find all videos uploaded by this user
      const videos = await Video.findAll({ where: { uploader_id: userId } });

      // Extract video IDs
      const videoIds = videos.map(video => video.id);

      // Fetch analytics for these videos
      return await VideoAnalytics.findAll({
        where: { video_id: videoIds },
      });
    },
    getSubscription: async (_, { user_id }) => {
      return await Subscription.findOne({ where: { user_id } });
    },
    getPaymentHistory: async (_, { user_id }) => {
      return await PaymentHistory.findAll({ where: { user_id } });
    },
    getWatchHistory: async (_, { user_id, limit = 50 }) => {
      // Try Redis first
      const cachedHistory = await redisClient.lRange(
        `${WATCH_HISTORY_KEY}:${user_id}`,
        0,
        limit - 1
      );
      if (cachedHistory.length > 0) {
        return cachedHistory.map(JSON.parse);
      }

      // If not in Redis, fetch from PostgreSQL
      const history = await WatchHistory.findAll({
        where: { user_id },
        attributes: ['video_id', 'watched_at'],
        order: [['watched_at', 'DESC']],
        limit,
      });

      // Store in Redis (cache)
      if (history.length > 0) {
        const historyData = history.map(h => JSON.stringify(h));
        await redisClient.lPush(
          `${WATCH_HISTORY_KEY}:${user_id}`,
          ...historyData
        );
        await redisClient.lTrim(
          `${WATCH_HISTORY_KEY}:${user_id}`,
          0,
          limit - 1
        ); // Keep recent 50
      }

      return history;
    },
    getPlaybackProgress: async (_, { user_id, video_id }) => {
      // Try Redis first
      const progress = await redisClient.hGet(
        `${PLAYBACK_PROGRESS_KEY}:${user_id}:${video_id}`,
        'last_position'
      );
      if (progress) return { last_position: parseInt(progress) };

      // If not in Redis, fetch from PostgreSQL
      const dbProgress = await PlaybackProgress.findOne({
        where: { user_id, video_id },
        attributes: ['last_position'],
      });
      return dbProgress
        ? { last_position: dbProgress.last_position }
        : { last_position: 0 };
    },

    // MongoDB Queries
    getNotifications: async (_, { user_id }) => {
      return await Notification.find({ user_id });
    },
    getSearchHistory: async (_, { user_id }) => {
      return await SearchHistory.find({ user_id });
    },
    getTags: async (_, { video_id }) => {
      return await Tag.findOne({ video_id });
    },
    getCommentsForVideo: async (_, { video_id }) => {
      return await Comment.find({ video_id }).where('deleted_at').equals(null); // Fetch active comments only
    },
    getCategory: async (_, { id }) => {
      return await Category.findByPk(id, {
        include: [
          { model: Category, as: 'subcategories' },
          { model: Category, as: 'parent' },
        ],
      });
    },
    getAllCategories: async () => {
      return await Category.findAll({
        where: { parent_id: null },
        include: [
          { model: Category, as: 'subcategories' },
          { model: Category, as: 'parent' },
        ],
      });
    },
  },
  Category: {
    subcategories: async category => {
      return await Category.findAll({
        where: { parent_id: category.id },
      });
    },
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...authResolvers.Mutation,

    trackVideoAnalytics: async (
      _,
      {
        video_id,
        watch_time = 0,
        completion_rate = 0,
        average_watch_time = 0,
        view_count = 0,
        clicks = 0,
        comments = 0,
        impressions = 0,
        likes = 0,
        shares = 0,
      }
    ) => {
      if (!video_id) {
        throw new Error('❌ video_id is required.');
      }

      const redisKey = `${VIDEO_ANALYTICS_KEY}:${video_id}`;

      try {
        // Ensure values are correctly parsed
        watch_time = Number.isFinite(watch_time)
          ? Math.max(0, parseInt(watch_time))
          : 0;
        completion_rate = Number.isFinite(completion_rate)
          ? Math.min(1, Math.max(0, parseFloat(completion_rate)))
          : 0;
        average_watch_time = Number.isFinite(average_watch_time)
          ? Math.max(0, parseFloat(average_watch_time))
          : 0;
        view_count = Number.isFinite(view_count)
          ? Math.max(0, parseInt(view_count))
          : 0;
        clicks = Number.isFinite(clicks) ? Math.max(0, parseInt(clicks)) : 0;
        comments = Number.isFinite(comments)
          ? Math.max(0, parseInt(comments))
          : 0;
        impressions = Number.isFinite(impressions)
          ? Math.max(0, parseInt(impressions))
          : 0;
        likes = Number.isFinite(likes) ? Math.max(0, parseInt(likes)) : 0;
        shares = Number.isFinite(shares) ? Math.max(0, parseInt(shares)) : 0;

        // Increment values in Redis
        await redisClient.hIncrBy(redisKey, 'watch_time', watch_time);
        await redisClient.hIncrBy(redisKey, 'clicks', clicks);
        await redisClient.hIncrBy(redisKey, 'comments', comments);
        await redisClient.hIncrBy(redisKey, 'impressions', impressions);
        await redisClient.hIncrBy(redisKey, 'likes', likes);
        await redisClient.hIncrBy(redisKey, 'shares', shares);

        // Handle completion rate separately (average calculation)
        const prevCompletionRate = parseFloat(
          (await redisClient.hGet(redisKey, 'completion_rate')) || '0'
        );
        const newCompletionRate = (
          (prevCompletionRate + completion_rate) /
          2
        ).toFixed(2);
        await redisClient.hSet(redisKey, 'completion_rate', newCompletionRate);

        // Increment view count only if completion_rate ≥ 80%
        if (completion_rate >= 0.8) {
          await redisClient.hIncrBy(redisKey, 'view_count', 1);
        }

        // Refresh expiration (ensures key does not persist indefinitely)
        await redisClient.expire(redisKey, 86400);

        return {
          success: true,
          message: '✅ Video analytics updated in Redis.',
        };
      } catch (error) {
        console.error(
          `❌ [ERROR] Failed to update video analytics for Video ID: ${video_id}`,
          error
        );
        return {
          success: false,
          message: '❌ Failed to update video analytics.',
        };
      }
    },

    createSubscription: async (_, { user_id }) => {
      const existingSubscription = await Subscription.findOne({
        where: { user_id },
      });

      if (existingSubscription) {
        throw new Error('User already has a subscription.');
      }

      const plan = 'free'; // Default plan
      const is_active = true;

      return await Subscription.create({
        user_id,
        plan,
        start_date: null,
        end_date: null,
        is_active,
      });
    },
    upgradeSubscription: async (_, { user_id, new_plan }) => {
      const subscription = await Subscription.findOne({ where: { user_id } });

      if (!subscription) {
        throw new Error('User does not have a subscription.');
      }

      if (subscription.plan === new_plan) {
        throw new Error(`User is already on the ${new_plan} plan.`);
      }

      let updateFields = { plan: new_plan };

      if (new_plan === 'free') {
        // ✅ Downgrading to Free: Reset start_date & end_date
        updateFields.start_date = null;
        updateFields.end_date = null;
      } else {
        // ✅ Upgrading to Paid: Set new billing cycle dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1);

        updateFields.start_date = startDate.toISOString();
        updateFields.end_date = endDate.toISOString();
      }

      await subscription.update(updateFields);

      return subscription;
    },
    createPaymentHistory: async (
      _,
      {
        user_id,
        subscription_id,
        amount,
        currency,
        payment_method,
        transaction_id,
        status,
      }
    ) => {
      return await PaymentHistory.create({
        user_id,
        subscription_id,
        amount,
        currency,
        payment_method,
        transaction_id,
        status,
      });
    },
    createCategory: async (_, { name, parent_id }) => {
      let parentCategory = null;

      if (parent_id) {
        parentCategory = await Category.findByPk(parent_id);
        if (!parentCategory) {
          throw new Error('Parent category not found');
        }

        // Prevent circular reference
        if (parent_id === name) {
          throw new Error('A category cannot be its own parent');
        }
      }

      // Create the category
      const category = await Category.create({
        name,
        parent_id: parent_id || null,
      });

      // ✅ Fetch the newly created category along with its parent
      const categoryWithParent = await Category.findByPk(category.id, {
        include: [{ model: Category, as: 'parent' }],
      });

      return categoryWithParent;
    },
    addToWatchHistory: async (_, { user_id, video_id }) => {
      console.log('[GRAPHQL REQUEST] addToWatchHistory received:', {
        user_id,
        video_id,
      });

      const [history, created] = await WatchHistory.upsert(
        {
          user_id,
          video_id,
          watched_at: new Date(),
        },
        {
          conflictFields: ['user_id', 'video_id'],
        }
      );

      console.log('[DATABASE] Watch History Saved:', history);

      // ✅ Check if video already exists in Redis
      const redisKey = `${WATCH_HISTORY_KEY}:${user_id}`;
      let existingHistory = await redisClient.lRange(redisKey, 0, -1);

      // Parse existing history to find duplicate entries
      existingHistory = existingHistory.map(item => JSON.parse(item));

      const existingEntryIndex = existingHistory.findIndex(
        entry => entry.video_id === video_id
      );

      if (existingEntryIndex !== -1) {
        // ✅ If video exists, remove old entry before adding updated one
        await redisClient.lRem(
          redisKey,
          1,
          JSON.stringify(existingHistory[existingEntryIndex])
        );
      }

      // ✅ Push updated watch history entry to Redis
      await redisClient.lPush(redisKey, JSON.stringify(history));
      await redisClient.lTrim(redisKey, 0, 49);

      // ✅ Set expiration (30 days)
      await redisClient.expire(redisKey, 2592000);

      console.log('[REDIS SUCCESS] Watch history updated in Redis.');

      return {
        success: true,
        message: created ? 'Added to history' : 'Updated history',
      };
    },
    updatePlaybackProgress: async (_, { user_id, video_id, last_position }) => {
      // Update Redis (Fast Lookup)
      await redisClient.hSet(
        `${PLAYBACK_PROGRESS_KEY}:${user_id}:${video_id}`,
        'last_position',
        last_position
      );
      await redisClient.expire(
        `${PLAYBACK_PROGRESS_KEY}:${user_id}:${video_id}`,
        2592000
      );

      return { success: true, message: 'Playback progress updated' };
    },
    createVideo: async (
      _,
      {
        title,
        description,
        duration,
        video_s3_key,
        thumbnail_s3_key,
        available_resolutions,
        hls_manifest_s3_key,
        uploader_id,
        visibility,
        category_ids = [],
      }
    ) => {
      // 1️⃣ Create the video
      const newVideo = await Video.create({
        title,
        description,
        duration,
        video_s3_key,
        thumbnail_s3_key,
        available_resolutions,
        hls_manifest_s3_key,
        uploader_id,
        visibility,
      });

      // 2️⃣ If category_ids provided, link them
      if (category_ids.length > 0) {
        const categories = await Category.findAll({
          where: { id: category_ids },
        });
        await newVideo.addCategories(categories);
      }

      // 3️⃣ Fetch the video with categories included (if you want to return them)
      const videoWithCategories = await Video.findByPk(newVideo.id, {
        include: [{ model: Category, as: 'categories' }],
      });

      return videoWithCategories;
    },

    assignCategoryToVideo: async (_, { video_id, category_id }) => {
      const video = await Video.findByPk(video_id);
      if (!video) throw new Error('Video not found');

      const category = await Category.findByPk(category_id);
      if (!category) throw new Error('Category not found');

      // many-to-many relation method from Sequelize
      await video.addCategory(category);

      // Optionally return updated video with categories
      return await Video.findByPk(video_id, {
        include: [{ model: Category, as: 'categories' }],
      });
    },

    // MongoDB Mutations
    markNotificationAsRead: async (_, { id }) => {
      return await Notification.findByIdAndUpdate(
        id,
        { is_read: true },
        { new: true }
      );
    },
    createNotification: async (_, { user_id, notification_type, message }) => {
      const notification = new Notification({
        user_id,
        notification_type,
        message,
      });
      return await notification.save();
    },
    addSearchTerm: async (_, { user_id, search_term }) => {
      let history = await SearchHistory.findOne({ user_id });

      if (!history) {
        history = new SearchHistory({ user_id, search_terms: [search_term] });
      } else {
        history.search_terms.push(search_term);
      }

      return await history.save();
    },
    clearSearchHistory: async (_, { user_id }) => {
      await SearchHistory.deleteMany({ user_id });
      return true;
    },
    addOrUpdateTags: async (_, { video_id, tags }) => {
      return await Tag.findOneAndUpdate(
        { video_id },
        { tags },
        { upsert: true, new: true }
      );
    },

    // Comments and Replies
    addComment: async (_, { video_id, user_id, comment_text }) => {
      const newComment = new Comment({
        video_id,
        user_id,
        comment_text,
        created_at: new Date(),
      });

      return await newComment.save();
    },

    addReplyToComment: async (_, { comment_id, user_id, comment_text }) => {
      const newReply = {
        user_id,
        comment_text,
        created_at: new Date(),
      };

      // Add reply directly to the comment's replies array
      const updatedComment = await Comment.findByIdAndUpdate(
        comment_id,
        { $push: { replies: newReply } },
        { new: true }
      );

      return updatedComment;
    },

    deleteComment: async (_, { comment_id }) => {
      // Soft delete: mark the comment as deleted
      const deletedComment = await Comment.findByIdAndUpdate(
        comment_id,
        { deleted_at: new Date() },
        { new: true }
      );
      return deletedComment;
    },
  },
};

module.exports = resolvers;
