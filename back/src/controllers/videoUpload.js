require('dotenv').config();
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { fromEnv } = require('@aws-sdk/credential-provider-env');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const multerS3 = require('multer-s3');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { Upload } = require('@aws-sdk/lib-storage');

const ffmpegPath = 'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe';
const ffprobePath = 'C:\\Program Files\\ffmpeg\\bin\\ffprobe.exe';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Initialize S3 client (AWS SDK v3)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});

// Configure Multer S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'private',
    key: (req, file, cb) => {
      const userId = req.body.userId;
      const timeStamp = Date.now().toString();
      if (file.fieldname === 'video') {
        cb(
          null,
          `videos/originals/${userId}/${timeStamp}-${file.originalname}`
        );
      } else if (file.fieldname === 'thumbnail') {
        cb(
          null,
          `videos/thumbnails/${userId}/${timeStamp}-${file.originalname}`
        );
      }
    },
  }),
  fileFilter: (req, file, cb) => {
    console.log('Processing file:', file);

    if (file.fieldname === 'thumbnail') {
      const allowedImageTypes = ['image/jpg', 'image/jpeg', 'image/png'];
      if (allowedImageTypes.includes(file.mimetype)) {
        return cb(null, true);
      }
      console.error('Invalid thumbnail file type:', file.mimetype);
      return cb(
        new Error(
          'Invalid thumbnail file type. Only JPG, JPEG, and PNG are allowed.'
        )
      );
    }

    if (file.fieldname === 'video') {
      const allowedVideoTypes = ['video/mp4', 'video/mkv', 'video/avi']; // Adjust based on your needs
      if (allowedVideoTypes.includes(file.mimetype)) {
        return cb(null, true);
      }
      console.error('Invalid video file type:', file.mimetype);
      return cb(new Error('Invalid video file type.'));
    }

    console.error('Unexpected field:', file.fieldname);
    return cb(new Error('Unexpected file field.'));
  },
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

// Generate a signed URL for private access
const generateSignedUrl = async fileKey => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
    });

    // Ensure that s3 is properly passed with endpointProvider
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour expiration
    return signedUrl;
  } catch (err) {
    console.error('Error generating signed URL:', err);
    throw err;
  }
};

const uploadVideo = async (req, res) => {
  upload(req, res, async uploadErr => {
    console.log('Middleware Request Body:', req.body);
    console.log('Middleware Request Files:', req.files);
    if (uploadErr) {
      console.error('Upload failed:', uploadErr);
      return res.status(500).json({
        error: 'Upload failed',
        details: uploadErr.message || uploadErr,
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        error:
          'No files uploaded. Ensure you are sending form-data with the correct field names.',
      });
    }

    if (!req.files['video'] || req.files['video'].length === 0) {
      return res.status(400).json({ error: 'No video file uploaded.' });
    }

    if (!req.files['thumbnail'] || req.files['thumbnail'].length === 0) {
      return res.status(400).json({ error: 'No thumbnail file uploaded.' });
    }

    try {
      // Extract categories from request body
      const categoryIds = req.body.category_ids
        ? JSON.parse(req.body.category_ids)
        : [];

      // Access the uploaded files
      const videoFile = req.files['video'][0];
      const thumbnailFile = req.files['thumbnail'][0];

      // videoFile.key and thumbnailFile.key are the S3 object keys
      // e.g. "videos/originals/<userId>/<timestamp>-<filename>.mp4"
      console.log('Stored video S3 key:', videoFile.key);
      console.log('Stored thumbnail S3 key:', thumbnailFile.key);

      // Generate signed URL to access the private video file from S3
      const signedUrl = await generateSignedUrl(videoFile.key);

      // Extract metadata using FFmpeg (for duration, resolutions, etc.)
      ffmpeg(signedUrl).ffprobe(async (err, metadata) => {
        if (err) {
          console.error('Error extracting metadata:', err);
          return res.status(500).json({ error: 'Failed to extract metadata' });
        }

        const videoStreams = metadata.streams.filter(
          stream => stream.width && stream.height
        );
        const duration = Math.floor(metadata.format.duration);
        const resolutions = videoStreams.map(
          stream => `${stream.width}x${stream.height}`
        );

        // Build the subfolder for HLS output:
        // e.g. "videos/hls/<userId>/<timestamp>/index.m3u8"
        const userId = req.body.userId;
        const hlsTimestamp = Date.now().toString();
        const hlsFolder = `videos/hls/${userId}/${hlsTimestamp}`;
        const hlsOutputDir = path.join('./tmp', userId, hlsTimestamp); // Temporary local path for the HLS files

        // Ensure temporary directory exists
        if (!fs.existsSync(hlsOutputDir)) {
          fs.mkdirSync(hlsOutputDir, { recursive: true });
        }

        // Transcode the video into HLS format
        ffmpeg(signedUrl)
          .outputOptions([
            '-profile:v baseline',
            '-preset veryfast',
            '-g 60',
            '-hls_time 10',
            '-hls_list_size 0',
            '-f hls',
            '-hls_segment_filename',
            `${hlsOutputDir}/segment_%03d.ts`,
          ])
          .output(path.join(hlsOutputDir, 'index.m3u8')) // Ensure the output file exists
          .on('end', async () => {
            console.log('Transcoding completed! Uploading to S3...');

            const files = fs.readdirSync(hlsOutputDir);
            for (const file of files) {
              const filePath = path.join(hlsOutputDir, file);
              const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `${hlsFolder}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: file.endsWith('.m3u8')
                  ? 'application/x-mpegURL'
                  : 'video/MP2T',
              };
              const parallelUploader = new Upload({
                client: s3,
                params: params,
              });

              // Await completion of the upload
              await parallelUploader.done();
            }

            if (fs.existsSync(hlsOutputDir)) {
              fs.rm(hlsOutputDir, { recursive: true, force: true }, rmErr => {
                if (err) {
                  console.error(
                    'Error removing temporary HLS directory:',
                    rmErr
                  );
                } else {
                  console.log('Temporary HLS directory removed successfully.');
                }
              });
            } else {
              console.log(`Directory ${hlsOutputDir} does not exist.`);
            }

            // Video data to be saved
            const newVideoData = {
              title: req.body.title,
              description: req.body.description,
              duration: duration,
              thumbnail_s3_key: thumbnailFile.key,
              video_s3_key: videoFile.key,
              available_resolutions: resolutions,
              hls_manifest_s3_key: `${hlsFolder}/index.m3u8`,
              uploader_id: req.body.userId,
              visibility: req.body.visibility,
              category_ids: categoryIds,
            };

            // Call the GraphQL mutation to create the video in PostgreSQL
            const {
              Mutation: { createVideo },
            } = require('../graphql/resolvers'); // Import the resolver
            const newVideo = await createVideo(null, newVideoData); // Await the resolver's mutation

            // Return success message and created video
            res.json({
              message: 'Video uploaded, transcoded to HLS, and metadata saved!',
              video: newVideo,
            });
          })
          .on('error', err => {
            console.error('Error during transcoding:', err);
            res
              .status(500)
              .json({ error: 'Error transcoding video', details: err });
          })
          .run();
      });
    } catch (err) {
      console.error('Error processing video upload:', err);
      res
        .status(500)
        .json({ error: 'Error processing video upload', details: err });
    }
  });
};
module.exports = {
  uploadVideo,
};
