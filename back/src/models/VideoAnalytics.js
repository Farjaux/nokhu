const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/postgresql').sequelize;

const VideoAnalytics = sequelize.define(
  'VideoAnalytics',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    video_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'videos',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    watch_time: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Total watch time in seconds
    },
    completion_rate: {
      type: DataTypes.NUMERIC(5, 2), // Stored as a percentage (e.g., 85.50)
      defaultValue: 0.0,
    },
    average_watch_time: {
      type: DataTypes.NUMERIC(10, 2), // Average watch time in seconds
      defaultValue: 0.0,
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Number of times watched (80% completion)
    },
    clicks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    comments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    impressions: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Number of times the video was seen in feeds
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    shares: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    tableName: 'video_analytics',
    timestamps: true,
    underscored: true,
  }
);

module.exports = VideoAnalytics;
