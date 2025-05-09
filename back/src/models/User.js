const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/postgresql').sequelize;

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    oauth_provider: {
      type: DataTypes.STRING,
    },
    oauth_provider_id: {
      type: DataTypes.STRING,
      unique: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'creator', 'admin'),
      defaultValue: 'user',
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    access_token: {
      type: DataTypes.STRING,
    },
    token_expiry: {
      type: DataTypes.DATE,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
    },
    gender: {
      type: DataTypes.STRING(20),
    },
    country: {
      type: DataTypes.STRING(100),
    },
    language_preference: {
      type: DataTypes.STRING(10),
    },
    profile_picture: {
      type: DataTypes.INTEGER,
    },
    cover_photo: {
      type: DataTypes.STRING,
    },
    bio: {
      type: DataTypes.TEXT,
    },
    account_status: {
      type: DataTypes.ENUM('active', 'suspended', 'deleted'),
      defaultValue: 'active',
    },
    terms_accepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    terms_date: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    terms_version: {
      type: DataTypes.TEXT,
    },
    consent_given: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    consent_date: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    consent_version: {
      type: DataTypes.TEXT,
    },
    data_retention_period: {
      type: DataTypes.INTEGER,
    },
    data_retention_end_date: {
      type: DataTypes.DATE,
    },
    data_retention_policy: {
      type: DataTypes.TEXT,
    },
    data_retention_preference: {
      type: DataTypes.ENUM('retain', 'delete', 'anonymize'),
    },
    opt_out_date: {
      type: DataTypes.DATE,
    },
    data_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    data_deletion_date: {
      type: DataTypes.DATE,
    },
    data_deletion_method: {
      type: DataTypes.TEXT,
    },
    gdpr_compliant: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    user_rights_requested: {
      type: DataTypes.JSONB,
      defaultValue: '{}',
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
  }
);

module.exports = User;
