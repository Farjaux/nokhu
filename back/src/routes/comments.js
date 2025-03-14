const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const Comment = require('../models/Comment');

// Middleware for validation error handling
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get comments for a specific video (with pagination)
router.get(
  '/:videoId',
  [
    param('videoId').isUUID().withMessage('Invalid video ID'),
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
    const { videoId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    try {
      const comments = await Comment.find({
        video_id: videoId,
        deleted_at: null,
      })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
      const totalComments = await Comment.countDocuments({
        video_id: videoId,
        deleted_at: null,
      });

      res.status(200).json({
        comments,
        pagination: {
          total: totalComments,
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Error fetching comments', details: error.message });
    }
  }
);

// Add a new comment
router.post(
  '/',
  [
    body('video_id').isUUID().withMessage('Invalid video ID'),
    body('user_id').isUUID().withMessage('Invalid user ID'),
    body('comment_text')
      .isString()
      .isLength({ min: 1, max: 500 })
      .withMessage('Comment must be 1-500 characters long'),
  ],
  handleValidationErrors,
  async (req, res) => {
    const { video_id, user_id, comment_text } = req.body;

    try {
      const newComment = new Comment({ video_id, user_id, comment_text });
      const savedComment = await newComment.save();
      res.status(201).json(savedComment);
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Error saving comment', details: error.message });
    }
  }
);

// Add a reply to a comment
router.post(
  '/:commentId/reply',
  [
    param('commentId').isMongoId().withMessage('Invalid comment ID'),
    body('user_id').isUUID().withMessage('Invalid user ID'),
    body('comment_text')
      .isString()
      .isLength({ min: 1, max: 500 })
      .withMessage('Reply must be 1-500 characters long'),
  ],
  handleValidationErrors,
  async (req, res) => {
    const { commentId } = req.params;
    const { user_id, comment_text } = req.body;

    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      comment.replies.push({ user_id, comment_text });
      await comment.save();
      res.status(201).json(comment);
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Error adding reply', details: error.message });
    }
  }
);

// Soft delete a comment
router.delete(
  '/:commentId',
  [param('commentId').isMongoId().withMessage('Invalid comment ID')],
  handleValidationErrors,
  async (req, res) => {
    const { commentId } = req.params;

    try {
      const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { deleted_at: new Date() },
        { new: true }
      );
      if (!updatedComment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      res.status(200).json(updatedComment);
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Error deleting comment', details: error.message });
    }
  }
);

module.exports = router;
