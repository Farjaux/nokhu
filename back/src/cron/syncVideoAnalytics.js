const { redisClient } = require('../config/redis');
const VideoAnalytics = require('../models/VideoAnalytics');

const syncVideoAnalytics = async () => {
  console.log(
    '🔄 [CRON JOB] Syncing video analytics from Redis to PostgreSQL...'
  );

  const keys = await redisClient.keys('video_analytics:*');

  if (keys.length === 0) {
    console.log(
      '⚠️ [CRON JOB] No new video analytics data found in Redis. Skipping database update.'
    );
    return;
  }

  console.log(`🔍 [REDIS] Found ${keys.length} analytics keys to sync`);

  for (const key of keys) {
    const video_id = key.split(':')[1]; // Extract videoId
    const analyticsData = await redisClient.hGetAll(key);

    if (Object.keys(analyticsData).length === 0) {
      console.warn(`⚠️ [SKIP] Empty data for key: ${key}`);
      continue;
    }

    console.log(`📌 [PROCESSING] Video ID: ${video_id}, Data:`, analyticsData);

    try {
      // Convert Redis data to correct types with defaults
      const watch_time = parseInt(analyticsData.watch_time) || 0;
      const completion_rate = parseFloat(analyticsData.completion_rate) || 0;
      const average_watch_time =
        parseFloat(analyticsData.average_watch_time) || 0;
      const view_count = parseInt(analyticsData.view_count) || 0;
      const clicks = parseInt(analyticsData.clicks) || 0;
      const comments = parseInt(analyticsData.comments) || 0;
      const impressions = parseInt(analyticsData.impressions) || 0;
      const likes = parseInt(analyticsData.likes) || 0;
      const shares = parseInt(analyticsData.shares) || 0;

      // Check if an existing record exists in the database
      const [analytics, created] = await VideoAnalytics.findOrCreate({
        where: { video_id },
        defaults: {
          watch_time,
          completion_rate,
          average_watch_time,
          view_count,
          clicks,
          comments,
          impressions,
          likes,
          shares,
        },
      });

      if (!created) {
        // Calculate new average watch time
        const total_watch_time = analytics.watch_time + watch_time;
        const new_average_watch_time =
          total_watch_time / Math.max(analytics.view_count + view_count, 1);

        // Determine if an update is needed
        const shouldUpdate = Object.values(analyticsData).some(
          val => parseFloat(val) > 0
        );

        if (shouldUpdate) {
          await analytics.update({
            watch_time: total_watch_time,
            completion_rate: (analytics.completion_rate + completion_rate) / 2,
            average_watch_time: new_average_watch_time.toFixed(2),
            view_count: analytics.view_count + view_count,
            clicks: analytics.clicks + clicks,
            comments: analytics.comments + comments,
            impressions: analytics.impressions + impressions,
            likes: analytics.likes + likes,
            shares: analytics.shares + shares,
          });

          console.log(
            `✅ [SAVED] Video analytics updated for Video ID: ${video_id}`
          );
        } else {
          console.log(
            `🔹 [SKIPPED] No changes detected for Video ID: ${video_id}, skipping update.`
          );
        }
      }

      // ✅ Remove key from Redis after successful processing
      const redisDeleteResult = await redisClient.del(key);
      if (redisDeleteResult > 0) {
        console.log(`🗑️ [DELETED] Removed key from Redis: ${key}`);
      } else {
        console.warn(`⚠️ [WARNING] Redis key was not deleted: ${key}`);
      }
    } catch (error) {
      console.error(
        `❌ [ERROR] Failed to sync analytics for Video ID: ${video_id}`,
        error
      );
    }
  }

  console.log('✅ [CRON JOB] Video analytics sync completed.');
};

module.exports = syncVideoAnalytics;
