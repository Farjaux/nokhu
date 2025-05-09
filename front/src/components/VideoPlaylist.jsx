import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { TRACK_VIDEO_ANALYTICS } from '../graphql/videoAnalyticsQueries';
import {GET_PLAYLIST} from '../graphql/videoQueries'

const CLOUDFRONT_URL = process.env.REACT_APP_CLOUDFRONT_URL;


export default function VideoPlaylist({ currentVideoId }) {
  // Execute the query
  const { loading, error, data } = useQuery(GET_PLAYLIST);
  const [trackAnalytics] = useMutation(TRACK_VIDEO_ANALYTICS);
  const impressionRefs = useRef(new Set()); // Tracks which videos have been recorded
  const videoRefs = useRef([]); 

  // Store videos in local state
  const [playlist, setPlaylist] = useState([]);

  // Update the playlist when data is fetched or the current video changes
  useEffect(() => {
    if (data && data.getVideoPlaylist) {
      // Filter out the current video, or limit to 5
      const filteredVideos = data.getVideoPlaylist.filter((vid) => vid.id !== currentVideoId);
      const limitedVideos = filteredVideos.slice(0, 5);
      setPlaylist(limitedVideos);
    }
  }, [data, currentVideoId]);

    // Track impressions when a playlist video enters the viewport
    useEffect(() => {
      if (!playlist.length) return;
  
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const videoId = entry.target.dataset.videoId;
  
            if (entry.isIntersecting && !impressionRefs.current.has(videoId)) {
              trackAnalytics({
                variables: { video_id: videoId, impressions: 1 },
              }).catch((err) => console.error('❌ GraphQL Error:', err));
  
              impressionRefs.current.add(videoId); // Prevent duplicate impressions
            }
          });
        },
        { threshold: 0.5 }
      );
  
      // Attach observer to all playlist video elements
      videoRefs.current.forEach((el) => el && observer.observe(el));
  
      return () => observer.disconnect(); // Cleanup
    }, [playlist, trackAnalytics]);

  // Handle loading & error states
  if (loading) {
    return <p className="text-white">Loading playlist...</p>;
  }
  if (error) {
    return <p className="text-red-500">Error loading playlist</p>;
  }

  // A function to handle when a playlist item is clicked
  const handleVideoSelect = (videoId) => {
    trackAnalytics({
      variables: { video_id: videoId, clicks: 1 },
    }).catch((err) => console.error('❌ GraphQL Error:', err));

    window.location.href = `/video/${videoId}`;
  };

  return (
    <div>
    {/* Title at the top */}
      <h2 className="text-xl font-bold mb-4 text-white">Up Next</h2>

      {playlist.map((vid) => (
        <div
          key={vid.id}
          className="flex mb-4 cursor-pointer hover:bg-gray-700 p-2"
          onClick={() => handleVideoSelect(vid.id)}
        >
          {/* Thumbnail on the left */}
          <img
            src={`${CLOUDFRONT_URL}/${vid.thumbnail_s3_key}`}
            alt={vid.title}
            className="w-40 h-24 object-cover rounded-lg mr-4"
          />
          <div>
            <p className="font-semibold">{vid.title}</p>
            {vid.uploaderName && (
            <p className="text-sm text-gray-400">{vid.uploaderName}</p>
)}
          </div>
        </div>
      ))}
    </div>
  );
}
