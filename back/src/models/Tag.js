const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50,
    unique: true, // Ensures tag names are unique
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag', // Reference to another Tag
    default: null, // Null for top-level categories
  },
  description: {
    type: String,
    maxlength: 255,
    default: '',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  // The `video_ids` field is optional for keeping track of the MongoDB-based video references
  video_ids: [
    {
      type: String, // The ID of the video (could be a PostgreSQL ID if using string-based IDs)
      ref: 'Video',
    },
  ],
});

// Middleware to update `updated_at` field on update
tagSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updated_at: Date.now() });
  next();
});

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
