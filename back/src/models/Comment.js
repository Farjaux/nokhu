const mongoose = require('mongoose');

// Schema for replies (subdocuments)
const replySchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    match: /^[a-f0-9-]{36}$/, // Validates UUID format
  },
  comment_text: {
    type: String,
    required: true,
    maxlength: 500, // Limit reply length to 500 characters
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Schema for comments
const commentSchema = new mongoose.Schema({
  video_id: {
    type: String,
    required: true,
    match: /^[a-f0-9-]{36}$/, // Validates UUID format
  },
  user_id: {
    type: String,
    required: true,
    match: /^[a-f0-9-]{36}$/, // Validates UUID format
  },
  comment_text: {
    type: String,
    required: true,
    maxlength: 500, // Limit comment length to 500 characters
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  deleted_at: {
    type: Date,
    default: null, // For soft deletes
  },
  replies: [replySchema], // Nested replies
});

// Indexes for performance
commentSchema.index({ video_id: 1 });
commentSchema.index({ user_id: 1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
