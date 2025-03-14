const User = require('./User');
const Video = require('./Video');
const Subscription = require('./Subscription');
const PaymentHistory = require('./PaymentHistory');
const WatchHistory = require('./WatchHistory');
const PlaybackProgress = require('./PlaybackProgress');
const Category = require('./Category');
const VideoCategory = require('./VideoCategory'); // Join Table
const VideoAnalytics = require('./VideoAnalytics'); // Import VideoAnalytics

// User - Video Relationship
User.hasMany(Video, { foreignKey: 'uploader_id', as: 'videos' });
Video.belongsTo(User, { foreignKey: 'uploader_id', as: 'uploader' });

// User - Subscription Relationship
User.hasOne(Subscription, { foreignKey: 'user_id', as: 'subscription' });
Subscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User - Payment History Relationship
User.hasMany(PaymentHistory, { foreignKey: 'user_id', as: 'payments' });
PaymentHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Subscription - Payment History Relationship
Subscription.hasMany(PaymentHistory, {
  foreignKey: 'subscription_id',
  as: 'payments',
});
PaymentHistory.belongsTo(Subscription, {
  foreignKey: 'subscription_id',
  as: 'subscription',
});

// User - Watch History Relationship
User.hasMany(WatchHistory, { foreignKey: 'user_id', as: 'watchHistory' });
WatchHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Video - Watch History Relationship
Video.hasMany(WatchHistory, { foreignKey: 'video_id', as: 'watchHistory' });
WatchHistory.belongsTo(Video, { foreignKey: 'video_id', as: 'video' });

// User - Playback Progress Relationship
User.hasMany(PlaybackProgress, {
  foreignKey: 'user_id',
  as: 'playbackProgress',
});
PlaybackProgress.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Video - Playback Progress Relationship
Video.hasMany(PlaybackProgress, {
  foreignKey: 'video_id',
  as: 'playbackProgress',
});
PlaybackProgress.belongsTo(Video, { foreignKey: 'video_id', as: 'video' });

// Category Hierarchy
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'subcategories' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

// Video - Categories (Many-to-Many)
Video.belongsToMany(Category, {
  through: VideoCategory,
  foreignKey: 'video_id',
  as: 'categories',
});
Category.belongsToMany(Video, {
  through: VideoCategory,
  foreignKey: 'category_id',
  as: 'videos',
});

// Video - Video Analytics Relationship (One-to-One)
Video.hasOne(VideoAnalytics, {
  foreignKey: 'video_id',
  as: 'analytics',
  onDelete: 'CASCADE',
});
VideoAnalytics.belongsTo(Video, {
  foreignKey: 'video_id',
  as: 'video',
});

module.exports = {
  User,
  Video,
  Subscription,
  PaymentHistory,
  WatchHistory,
  PlaybackProgress,
  Category,
  VideoCategory,
  VideoAnalytics,
};
