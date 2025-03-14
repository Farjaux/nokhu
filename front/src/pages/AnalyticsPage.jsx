import React from "react";
import { useQuery } from "@apollo/client";
import { GET_USER_VIDEOS } from "../graphql/videoQueries";
import { GET_USER_VIDEO_ANALYTICS } from "../graphql/videoAnalyticsQueries";
import { useAuth } from "../context/AuthProvider";

const CLOUDFRONT_URL = process.env.REACT_APP_CLOUDFRONT_URL;

const AnalyticsPage = () => {
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch user's uploaded videos
  const { data: videoData, loading: videoLoading, error: videoError } = useQuery(GET_USER_VIDEOS, {
    variables: { userId },
    skip: !userId,
  });

  // Fetch analytics for user's videos
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useQuery(
    GET_USER_VIDEO_ANALYTICS,
    { variables: { userId }, skip: !userId }
  );

  if (videoLoading || analyticsLoading) return <p className="text-center text-lg">Loading...</p>;
  if (videoError || analyticsError) return <p className="text-center text-lg text-red-500">Error loading data</p>;

  // Merge analytics with videos
  const videosWithAnalytics = videoData?.getUserVideos.map((video) => {
    const analytics = analyticsData?.getUserVideoAnalytics.find(
      (a) => a.video_id === video.id
    );
    return {
      ...video,
      views: analytics?.view_count || 0,
      clicks: analytics?.clicks || 0,
      impressions: analytics?.impressions || 0,
    };
  });

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videosWithAnalytics.map((video) => (
          <div 
            key={video.id} 
            className="border border-gray-400 rounded-lg shadow-md overflow-hidden"
          >
            <div className="relative w-full h-48 flex items-center justify-center bg-black">
              <img
                src={`${CLOUDFRONT_URL}/${video.thumbnail_s3_key}`}
                alt={video.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-300">{video.title}</h3>
              <p className="text-sm text-gray-500">Views: {video.views}</p>
              <p className="text-sm text-gray-500">Clicks: {video.clicks}</p>
              <p className="text-sm text-gray-500">Impressions: {video.impressions}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsPage;
