const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/postgresql').sequelize;

const VideoCategory = sequelize.define(
  'VideoCategory',
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
        model: 'Video',
        key: 'id',
      },
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Category',
        key: 'id',
      },
    },
  },
  {
    tableName: 'video_categories',
    timestamps: true,
    underscored: true,
  }
);

module.exports = VideoCategory;
