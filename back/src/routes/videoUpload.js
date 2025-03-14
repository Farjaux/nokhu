const express = require('express');
const router = express.Router();
const { uploadVideo } = require('../controllers/videoUpload');

router.post('/upload', uploadVideo);

module.exports = uploadVideo;
