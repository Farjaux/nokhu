const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const router = express.Router();

// Middleware for validation error handling
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get all notifications for a user (with pagination and filters)
router.get(
  '/:user_id',
  [
    param('user_id').isUUID().withMessage('Invalid user ID'),
    query('is_read')
      .optional()
      .isBoolean()
      .withMessage('is_read must be true or false'),
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
    const { is_read, page = 1, limit = 10 } = req.query;

    try {
      const filters = { user_id };
      if (is_read !== undefined) {
        filters.is_read = is_read === 'true'; // Convert string to boolean
      }

      const notifications = await Notification.find(filters)
        .sort({ created_at: -1 }) // Sort by newest notifications
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
      const totalNotifications = await Notification.countDocuments(filters);

      res.status(200).json({
        notifications,
        pagination: {
          total: totalNotifications,
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Error fetching notifications',
        details: error.message,
      });
    }
  }
);

// Mark a notification as read
router.put(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid notification ID')],
  handleValidationErrors,
  async (req, res) => {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { is_read: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.status(200).json(notification);
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Error updating notification', details: error.message });
    }
  }
);

// Mark all notifications as read for a user
router.put(
  '/mark-all-read/:user_id',
  [param('user_id').isUUID().withMessage('Invalid user ID')],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await Notification.updateMany(
        { user_id: req.params.user_id, is_read: false },
        { $set: { is_read: true } }
      );

      res
        .status(200)
        .json({ message: 'All notifications marked as read', result });
    } catch (error) {
      res.status(500).json({
        error: 'Error marking notifications as read',
        details: error.message,
      });
    }
  }
);

// Create a new notification
router.post(
  '/',
  [
    body('user_id').isUUID().withMessage('Invalid user ID'),
    body('notification_type')
      .isString()
      .withMessage('Notification type is required'),
    body('message')
      .isString()
      .isLength({ max: 500 })
      .withMessage('Message must be less than 500 characters'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const newNotification = new Notification(req.body);
      await newNotification.save();
      res.status(201).json(newNotification);
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Error creating notification', details: error.message });
    }
  }
);

// Delete a notification
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid notification ID')],
  handleValidationErrors,
  async (req, res) => {
    try {
      const notification = await Notification.findByIdAndDelete(req.params.id);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Error deleting notification', details: error.message });
    }
  }
);

module.exports = router;
