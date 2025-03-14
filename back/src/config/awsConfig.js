import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const getSignedUrlForThumbnail = async thumbnailUrl => {
  try {
    if (!thumbnailUrl) {
      console.error('Missing thumbnail URL');
      return null;
    }

    // Extract the key from the full S3 URL
    const s3BaseUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    if (!thumbnailUrl.startsWith(s3BaseUrl)) {
      console.error('Invalid S3 URL format:', thumbnailUrl);
      return null;
    }

    const s3Key = thumbnailUrl.replace(s3BaseUrl, '');

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
    });

    return await getSignedUrl(s3, command, { expiresIn: 600 }); // 10 min expiration
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};
