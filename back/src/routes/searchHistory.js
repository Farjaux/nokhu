const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const SearchHistory = require('../models/SearchHistory');
const router = express.Router();

// Middleware for validation error handling
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get search history for a user (with optional pagination)
router.get(
  '/:user_id',
  [
    param('user_id').isUUID().withMessage('Invalid user ID'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Limit must be a positive integer'),
  ],
  handleValidationErrors,
  async (req, res) => {
    const { user_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
      const searchHistory = await SearchHistory.find({ user_id })
        .sort({ created_at: -1 }) // Newest first
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const totalHistory = await SearchHistory.countDocuments({ user_id });

      res.status(200).json({
        searchHistory,
        pagination: {
          total: totalHistory,
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({
          error: 'Error fetching search history',
          details: error.message,
        });
    }
  }
);

// Add a new search term
router.post(
  '/',
  [
    body('user_id').isUUID().withMessage('Invalid user ID'),
    body('search_terms')
      .isArray({ min: 1 })
      .withMessage('Search terms must be an array with at least one term'),
    body('search_terms.*')
      .isString()
      .isLength({ max: 100 })
      .withMessage(
        'Each search term must be a string with a maximum of 100 characters'
      ),
  ],
  handleValidationErrors,
  async (req, res) => {
    const { user_id, search_terms } = req.body;

    try {
      const newSearch = new SearchHistory({ user_id, search_terms });
      await newSearch.save();
      res.status(201).json(newSearch);
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Error saving search history', details: error.message });
    }
  }
);

// Delete search history for a user
router.delete(
  '/:user_id',
  [param('user_id').isUUID().withMessage('Invalid user ID')],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await SearchHistory.deleteMany({
        user_id: req.params.user_id,
      });

      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json({ error: 'No search history found for the user' });
      }

      res.status(200).json({ message: 'Search history cleared', result });
    } catch (error) {
      res
        .status(500)
        .json({
          error: 'Error deleting search history',
          details: error.message,
        });
    }
  }
);

// Delete a specific search entry by its ID
router.delete(
  '/entry/:id',
  [param('id').isMongoId().withMessage('Invalid search entry ID')],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await SearchHistory.findByIdAndDelete(req.params.id);

      if (!result) {
        return res.status(404).json({ error: 'Search entry not found' });
      }

      res.status(200).json({ message: 'Search entry deleted', result });
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Error deleting search entry', details: error.message });
    }
  }
);

module.exports = router;
