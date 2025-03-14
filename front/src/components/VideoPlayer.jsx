import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PLAYBACK_PROGRESS, UPDATE_PLAYBACK_PROGRESS, ADD_TO_WATCH_HISTORY } from '../graphql/videoHistoryQueries';
import { TRACK_VIDEO_ANALYTICS } from '../graphql/videoAnalyticsQueries';
import { useAuth } from '../context/AuthProvider';

const CLOUDFRONT_URL = process.env.REACT_APP_CLOUDFRONT_URL;

export default function VideoPlayer({ video }) {
  const { user } = useAuth();
  const user_id = user?.id || null;
  const video_id = video?.id;

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const lastPositionRef = useRef(0);
  const totalWatchTimeRef = useRef(0);
  const hasTrackedView = useRef(false);
  const [hasAddedToWatchHistory, setHasAddedToWatchHistory] = useState(false);
  const isGuest = !user_id;

  // Fetch playback progress and store in `lastPositionRef`
  useQuery(GET_PLAYBACK_PROGRESS, {
    variables: { user_id, video_id },
    skip: isGuest || !video_id,
    onCompleted: (res) => {
      if (res?.getPlaybackProgress?.last_position) {
        lastPositionRef.current = res.getPlaybackProgress.last_position;
      }
    },
  });

  // GraphQL mutations
  const [trackAnalytics] = useMutation(TRACK_VIDEO_ANALYTICS);
  const [updatePlaybackProgress] = useMutation(UPDATE_PLAYBACK_PROGRESS);
  const [addToWatchHistory] = useMutation(ADD_TO_WATCH_HISTORY);

  // Initialize or update Video.js player
  useEffect(() => {
    if (!video) return;

    const hlsManifestUrl = `${CLOUDFRONT_URL}/${video.hls_manifest_s3_key}`;

    if (!playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        responsive: true,
        fluid: true,
        autoplay: false,
        preload: 'auto',
        poster: `${CLOUDFRONT_URL}/${video.thumbnail_s3_key}`,
        sources: [{ src: hlsManifestUrl, type: 'application/x-mpegURL' }],
        userActions: {
          hotkeys: true, 
        },
      });

      // Set last known playback position
      playerRef.current.on('loadedmetadata', () => {
        const lastPos = lastPositionRef.current;
        if (lastPos > 0 && playerRef.current) {
          playerRef.current.currentTime(lastPos);
        }
      });

      playerRef.current.ready(() => {
        playerRef.current.userActive(true);
        setTimeout(() => {
          playerRef.current.userActive(false);
        }, 3000);
      });

      // ✅ Track View Count if 80%+ of the video is watched
      playerRef.current.on('timeupdate', () => {
        if (!playerRef.current) return;
        const currentTime = Math.floor(playerRef.current.currentTime());
        totalWatchTimeRef.current = currentTime;
      });

      playerRef.current.on('ended', () => {
        if (!hasTrackedView.current) {
          trackAnalytics({
            variables: {
              video_id,
              view_count: 1,
            },
          }).catch((err) => console.error('❌ GraphQL Error:', err));
          hasTrackedView.current = true;
        }
      });

      // ✅ Track `addToWatchHistory` when user presses Play
      playerRef.current.on('play', () => {
        if (!hasAddedToWatchHistory && !isGuest) {
          addToWatchHistory({ variables: { user_id, video_id } });
          setHasAddedToWatchHistory(true);
        }
      });
    } else {
      playerRef.current.src([{ src: hlsManifestUrl, type: 'application/x-mpegURL' }]);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [video]);

  // Periodic progress updates
  useEffect(() => {
    if (isGuest || !playerRef.current) return;
  
    const updateProgress = () => {
      if (!playerRef.current) return;
      const currentTime = Math.floor(playerRef.current.currentTime());
      const duration = playerRef.current.duration();

      if (currentTime > lastPositionRef.current) {
        const completionRate = duration ? (currentTime / duration).toFixed(2) : 0;
        const averageWatchTime = (totalWatchTimeRef.current / Math.max(1, hasTrackedView.current ? 1 : 0)).toFixed(2);

        trackAnalytics({
          variables: {
            video_id,
            watch_time: currentTime,
            completion_rate: parseFloat(completionRate),
            average_watch_time: parseFloat(averageWatchTime),
          },
        }).catch((err) => console.error('❌ GraphQL Error:', err));

        updatePlaybackProgress({ variables: { user_id, video_id, last_position: currentTime } });

        lastPositionRef.current = currentTime;
      }
    };
  
    // ✅ Update analytics every 30 seconds
    const interval = setInterval(updateProgress, 30000);
  
    // ✅ Update analytics when user PAUSES the video
    playerRef.current.on('pause', updateProgress);
  
    // ✅ Update analytics when user NAVIGATES away
    const handleBeforeUnload = () => updateProgress();
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    // ✅ Update analytics when user LEAVES the page
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateProgress();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
  
    return () => {
      clearInterval(interval);
      playerRef.current?.off('pause', updateProgress);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isGuest, updatePlaybackProgress]);

        // // Example: Auto-play next video on 'ended'
    // playerRef.current.on('ended', () => {
    //   // You can trigger logic here to load the next video from your playlist
    //   // e.g., using context, props, or a Redux store to track the next video
    // });

  if (!video) return <p>No video selected</p>;

  return (
    <div className="video-player-container">
      <div data-vjs-player>
        <video
          key={video_id}
          ref={videoRef}
          className="video-js vjs-big-play-centered"
        />
      </div>
    </div>
  );
}



