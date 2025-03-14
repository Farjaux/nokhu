import VideoSection from './VideoSection';

const VideoFeed = () => {
  return (
    <div className="bg-black min-h-screen flex flex-col space-y-8">
      {/* Ensure each section is stacked vertically */}
      <VideoSection title="Featured" />
      <VideoSection title="For You" />
      <VideoSection title="Recently Added" />
      <VideoSection title="Most Played" />
    </div>
  );
};

export default VideoFeed;
