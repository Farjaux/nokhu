import React from 'react';

export default function VideoDetails({ video }) {
  if (!video) return null;

  return (
    <div className="mt-4">
      <h2 className="text-2xl font-bold mb-2">{video.title}</h2>
      <p className="text-sm text-gray-400 mb-2">{video.views} views</p>
      {/* Conditionally render the description if available */}
      {video.description && (
        <p className="text-gray-200">{video.description}</p>
      )}
    </div>
  );
}
