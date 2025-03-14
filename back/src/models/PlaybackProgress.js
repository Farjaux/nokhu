const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/postgresql').sequelize;

const PlaybackProgress = sequelize.define(
  'WatchHistory',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    video_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'videos',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    last_position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'playback_progress',
    timestamps: false,
  }
);

module.exports = PlaybackProgress;
