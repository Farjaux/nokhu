const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Tag = require('../models/Tag');
const Video = require('../models/Video'); // Assuming you have a Video model
const { sequelize } = require('../config/database'); // Your Sequelize instance (for PostgreSQL)
const router = express.Router();

// Middleware for validation error handling
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get all tags in a hierarchical structure (parent/child relationships)
router.get('/hierarchy', async (req, res) => {
  try {
    const tags = await Tag.aggregate([
      {
        $lookup: {
          from: 'tags', // The name of the collection
          localField: '_id',
          foreignField: 'parent_id',
          as: 'children',
        },
      },
      {
        $project: {
          name: 1,
          parent_id: 1,
          description: 1,
          children: {
            name: 1,
            parent_id: 1,
            description: 1,
          },
        },
      },
    ]);

    res.status(200).json(tags);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error fetching tag hierarchy', details: error.message });
  }
});

// Get child tags of a specific parent category
router.get(
  '/:parent_id/children',
  [param('parent_id').isMongoId().withMessage('Invalid parent_id format')],
  handleValidationErrors,
  async (req, res) => {
    try {
      const children = await Tag.find({ parent_id: req.params.parent_id });

      if (children.length === 0) {
        return res
          .status(404)
          .json({ message: 'No child tags found for this category' });
      }

      res.status(200).json(children);
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Error fetching child tags', details: error.message });
    }
  }
);

// Add a new category or subcategory (parent_id defines if it's a category or subcategory)
router.post(
  '/',
  [
    body('name')
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('Tag name must be between 1 and 50 characters long'),
    body('parent_id')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent_id format'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 255 })
      .withMessage('Description cannot exceed 255 characters'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, parent_id, description } = req.body;

      const newTag = new Tag({
        name,
        parent_id: parent_id || null,
        description,
      });
      const savedTag = await newTag.save();

      res.status(201).json(savedTag);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ error: 'Tag name must be unique' });
      }
      res
        .status(500)
        .json({ error: 'Error creating tag', details: error.message });
    }
  }
);

// Associate tags with a video (through a PostgreSQL relationship)
router.post(
  '/associate',
  [
    body('video_id').isInt().withMessage('Invalid video ID'),
    body('tag_ids').isArray().withMessage('Tag IDs must be an array'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { video_id, tag_ids } = req.body;

      // Ensure the video exists
      const video = await Video.findByPk(video_id);
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Insert the associations into the PostgreSQL `video_tags` table
      const tagAssociations = tag_ids.map(tag_id => ({
        video_id,
        tag_id: tag_id,
      }));

      await sequelize.models.video_tags.bulkCreate(tagAssociations);

      res
        .status(201)
        .json({ message: 'Tags associated with video successfully' });
    } catch (error) {
      res
        .status(500)
        .json({
          error: 'Error associating tags with video',
          details: error.message,
        });
    }
  }
);

// Get tags associated with a specific video
router.get('/:video_id', async (req, res) => {
  try {
    // Assuming `video_tags` is a join table in PostgreSQL
    const tags = await sequelize.models.video_tags.findAll({
      where: { video_id: req.params.video_id },
      include: [
        { model: Tag, attributes: ['name', 'parent_id', 'description'] },
      ],
    });

    if (!tags.length) {
      return res.status(404).json({ error: 'No tags found for this video' });
    }

    res.status(200).json(tags);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error fetching tags for video', details: error.message });
  }
});

// Delete a category and all its subcategories
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid tag ID format')],
  handleValidationErrors,
  async (req, res) => {
    try {
      const tagId = req.params.id;

      // Delete the tag and its children
      const result = await Tag.deleteMany({
        $or: [{ _id: tagId }, { parent_id: tagId }],
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Tag not found' });
      }

      res
        .status(200)
        .json({ message: 'Tag and its children successfully deleted', result });
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Error deleting tag', details: error.message });
    }
  }
);

module.exports = router;
