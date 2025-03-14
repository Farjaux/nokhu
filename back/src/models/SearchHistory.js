const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    match: /^[a-f0-9-]{36}$/, // UUID format for PostgreSQL
  },
  search_terms: {
    type: [String],
    required: true,
    validate: {
      validator: terms => terms.length > 0,
      message: 'Search terms array must contain at least one term',
    },
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
searchHistorySchema.index({ user_id: 1, created_at: -1 });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

module.exports = SearchHistory;
