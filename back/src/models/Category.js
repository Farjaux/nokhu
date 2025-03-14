const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/postgresql').sequelize;

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'categories',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Category;
