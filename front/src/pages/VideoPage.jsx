import { useQuery, gql } from '@apollo/client';
import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import VideoDetails from '../components/VideoDetails';
import VideoPlaylist from '../components/VideoPlaylist';
import React from 'react';

const GET_VIDEO_BY_ID = gql`
  query getVideo($id: ID!) {
    getVideo(id: $id) {
      id
      title
      hls_manifest_s3_key
      thumbnail_s3_key
      views
      description
      createdAt
    }
  }
`;

export default function VideoPage() {
  const { videoId } = useParams();
  const { loading, error, data } = useQuery(GET_VIDEO_BY_ID, {
    variables: { id: videoId },
  });

  if (loading) return <p className="text-white">Loading video...</p>;
  if (error) return <p className="text-red-500">Error loading video</p>;
  if (!data || !data.getVideo) return <p className="text-white">Video not found</p>;

  const currentVideo = data.getVideo;

  return (
    <div className="flex flex-row p-6 gap-6 text-white">
      {/* Left Side: Video Player and Video Details */}
      <div className="w-2/3">
        <VideoPlayer video={currentVideo} />
        <VideoDetails video={currentVideo} />
      </div>

      {/* Right Side: Playlist */}
      <div className="w-1/3">
        {/* Pass the current videoId (or other data) to fetch/maintain recommended videos */}
        <VideoPlaylist currentVideoId={videoId} />
      </div>
    </div>
  );
}
