import { useQuery, gql } from '@apollo/client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

const getVideos = gql`
  query getVideos {
    getVideos {
      id
      title
      thumbnail_url
      views
      createdAt
    }
  }
`;

const VideoSection = ({ title }) => {
  const { loading, error, data } = useQuery(getVideos);
  const [showArrows, setShowArrows] = useState({ left: false, right: true });
  const containerRef = useRef(null);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const atLeft = container.scrollLeft === 0;
    const atRight =
      container.scrollLeft + container.clientWidth >= container.scrollWidth;
    setShowArrows({ left: !atLeft, right: !atRight });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    handleScroll();
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollContainer = useCallback(direction => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const calculateTimeAgo = dateString => {
    const createdAt = new Date(Number(dateString));
    if (isNaN(createdAt.getTime())) return 'Invalid date';

    const now = new Date();
    const diffInMs = now - createdAt;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInDays > 1) return `${diffInDays} days ago`;
    if (diffInDays === 1) return '1 day ago';
    if (diffInHours > 1) return `${diffInHours} hours ago`;
    return 'Just now';
  };

  const renderedVideos = useMemo(() => {
    if (!data) return [];
    return data.getVideos.map(video => (
      <div
        key={video.id}
        className="w-72 sm:w-64 md:w-56 lg:w-72 xl:w-80 2xl:w-96 flex-shrink-0"
      >
        <div className="relative w-full aspect-w-16 aspect-h-9">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="object-cover w-full h-full rounded-lg"
          />
        </div>
        <div className="text-white mt-2">
          <h3 className="font-semibold">{video.title}</h3>
          <p className="text-sm text-gray-400">
            {video.views} views • {calculateTimeAgo(video.createdAt)}
          </p>
        </div>
      </div>
    ));
  }, [data]);

  if (loading) return <p className="text-white">Loading videos...</p>;
  if (error) return <p className="text-red-500">Error loading videos</p>;

  return (
    <section className="p-4">
      <h2 className="text-2xl font-bold text-gray-200">{title}</h2>
      <div className="relative mt-4">
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
};

export default VideoSection;
