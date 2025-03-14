import { useQuery, useMutation } from '@apollo/client';
import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GET_VIDEOS } from '../graphql/videoQueries';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
import { TRACK_VIDEO_ANALYTICS } from '../graphql/videoAnalyticsQueries';

const CLOUDFRONT_URL = process.env.REACT_APP_CLOUDFRONT_URL;

export default function VideoSection({  title, parentCategoryId, subcategoryId  }) {
  const { loading, error, data } = useQuery(GET_VIDEOS, {
    variables: { parentCategoryId, subcategoryId },
    skip: !parentCategoryId, // Don't run the query until a parent category is selected
  });

  const [trackAnalytics] = useMutation(TRACK_VIDEO_ANALYTICS);
  const impressionRefs = useRef(new Set()); // Prevent duplicate impressions
  const observerRef = useRef(null);

  // Always call the hook to maintain hook order
  const { containerRef, showArrows, scrollContainer, updateArrows } = useHorizontalScroll();

    // Track impressions when a thumbnail enters the viewport
    useEffect(() => {
      if (!data?.getVideos) return;
  
      // Create IntersectionObserver if not already created
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const videoId = entry.target.dataset.videoId;
  
              if (entry.isIntersecting && !impressionRefs.current.has(videoId)) {
                trackAnalytics({
                  variables: { video_id: videoId, impressions: 1 },
                }).catch((err) => console.error('❌ GraphQL Error:', err));
  
                impressionRefs.current.add(videoId); // Prevent duplicate tracking
              }
            });
          },
          { threshold: 0.5 } // Trigger when at least 50% is visible
        );
      }
  
      // Observe all video thumbnails
      data.getVideos.forEach((video) => {
        const element = document.querySelector(`[data-video-id="${video.id}"]`);
        if (element) observerRef.current.observe(element);
      });
  
      return () => {
        if (observerRef.current) observerRef.current.disconnect();
      };
    }, [data, trackAnalytics]);

  // Memoized rendering of videos
  const renderedVideos = useMemo(() => {
    if (!data) return [];

    return data.getVideos.map((video) => {
      // Construct CloudFront URL for thumbnail
      const thumbnail = `${CLOUDFRONT_URL}/${video.thumbnail_s3_key}`;
      return (
        <Link
          key={video.id}
          to={`/video/${video.id}`}
          className="w-72 sm:w-64 md:w-56 lg:w-72 xl:w-80 2xl:w-96 flex-shrink-0"
          data-video-id={video.id} // Needed for IntersectionObserver
          onClick={() => {
            trackAnalytics({
              variables: { video_id: video.id, clicks: 1 },
            }).catch((err) => console.error('❌ GraphQL Error:', err));
          }}
        >
          <div className="relative w-full aspect-w-16 aspect-h-9">
            <img
              src={thumbnail}
              alt={video.title}
              className="object-cover w-full h-full rounded-lg"
              loading="lazy"
            />
          </div>
          <div className="text-white mt-2">
            <h3 className="font-semibold">{video.title}</h3>
            {video.uploaderName && (
              <p className="text-sm text-gray-400">{video.uploaderName}</p>
            )}
          </div>
        </Link>
      );
    });
  }, [data, trackAnalytics]);

  // Trigger updateArrows when videos are loaded
  useEffect(() => {
    if (data?.getVideos?.length > 0 && containerRef.current) {
      updateArrows();
    }
  }, [data, containerRef, updateArrows]);

  if (loading) return <p className="text-white">Loading videos...</p>;
  if (error) return <p className="text-red-500">Error loading videos</p>;
  if (!data || !data.getVideos) return null;

  return (
    <section className="p-4">
      <h2 className="text-2xl font-bold text-gray-200">{title}</h2>
      <div className="relative mt-4 w-full">
        {/* Scroll container */}
        <div
          ref={containerRef}
          className="flex space-x-4 pb-4 overflow-x-auto scrollbar-hide"
        >
          {renderedVideos}
        </div>

        {showArrows.left && (
          <button
            className="absolute left-0 top-0 bottom-0 flex items-center justify-center bg-transparent hover:bg-gray-700 text-white rounded-full p-2 transition duration-300"
            onClick={() => scrollContainer('left')}
          >
            <span className="text-2xl">&lt;</span>
          </button>
        )}

        {showArrows.right && (
          <button
            className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-transparent hover:bg-gray-700 text-white rounded-full p-2 transition duration-300"
            onClick={() => scrollContainer('right')}
          >
            <span className="text-2xl">&gt;</span>
          </button>
        )}
      </div>
    </section>
  );
}
