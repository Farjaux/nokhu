const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/postgresql').sequelize;

const Subscription = sequelize.define(
  'Subscription',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    plan: {
      type: DataTypes.ENUM('free', 'plus', 'premium'),
      allowNull: false,
      defaultValue: 'free',
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
  },
  {
    tableName: 'subscriptions',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Subscription;
