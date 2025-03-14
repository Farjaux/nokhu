const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    match: /^[a-f0-9-]{36}$/, // Validates UUID format for PostgreSQL
  },
  notification_type: {
    type: String,
    required: true,
    enum: ['like', 'comment', 'follow', 'system'], // Restricts to predefined types
  },
  message: {
    type: String,
    required: true,
    maxlength: 500, // Limit message length to 500 characters
  },
  is_read: {
    type: Boolean,
    default: false, // Defaults to unread
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
notificationSchema.index({ user_id: 1, is_read: 1 });
notificationSchema.index({ created_at: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
