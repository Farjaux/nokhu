const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/postgresql').sequelize;

const Video = sequelize.define(
  'Video',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER, // Duration in seconds
      allowNull: false,
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    thumbnail_s3_key: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    video_s3_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    available_resolutions: {
      type: DataTypes.ARRAY(DataTypes.STRING), // For PostgreSQL
      allowNull: false,
    },
    hls_manifest_s3_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uploader_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    visibility: {
      type: DataTypes.ENUM('public', 'private', 'unlisted'),
      defaultValue: 'public',
    },
  },
  {
    tableName: 'videos', // Explicitly specify the table name
    timestamps: true,
    underscored: true,
  }
);

module.exports = Video;
