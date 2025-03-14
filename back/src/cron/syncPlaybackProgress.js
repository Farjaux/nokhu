const { redisClient } = require('../config/redis');
const PlaybackProgress = require('../models/PlaybackProgress');

const syncPlaybackProgress = async () => {
  console.log(
    '🔄 [CRON JOB] Syncing playback progress from Redis to PostgreSQL...'
  );

  const keys = await redisClient.keys('playback_progress:*');

  if (keys.length === 0) {
    console.log(
      '⚠️ [CRON JOB] No playback progress data in Redis. Skipping database update.'
    );
    return;
  }

  console.log(`🔍 [REDIS] Found ${keys.length} playback progress keys to sync`);

  for (const key of keys) {
    const [_, user_id, video_id] = key.split(':');
    const last_position = await redisClient.hGet(key, 'last_position');

    if (!last_position) {
      console.warn(`⚠️ [SKIP] No progress found for key: ${key}`);
      continue;
    }

    console.log(
      `📌 [PROCESSING] User: ${user_id}, Video: ${video_id}, Position: ${last_position}`
    );

    try {
      const [record, created] = await PlaybackProgress.upsert(
        {
          user_id,
          video_id,
          last_position: parseInt(last_position),
        },
        {
          conflictFields: ['user_id', 'video_id'],
        }
      );

      if (!created) {
        console.log(
          `🔹 [SKIPPED] No changes detected for User ${user_id}, Video ${video_id}`
        );
      } else {
        console.log(
          `✅ [SAVED] Playback progress updated for User ${user_id}, Video ${video_id}`
        );
      }

      // Delete Redis key after syncing
      const redisDeleteResult = await redisClient.del(key);
      if (redisDeleteResult > 0) {
        console.log(`🗑️ [DELETED] Removed key from Redis: ${key}`);
      } else {
        console.warn(`⚠️ [WARNING] Redis key was not deleted: ${key}`);
      }
    } catch (error) {
      console.error(
        `❌ [ERROR] Failed to sync playback progress for User ${user_id}, Video ${video_id}`,
        error
      );
    }
  }

  console.log('✅ [CRON JOB] Playback progress sync completed.');
};

module.exports = syncPlaybackProgress;
