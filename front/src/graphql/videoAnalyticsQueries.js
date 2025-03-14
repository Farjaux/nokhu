import { gql } from '@apollo/client';

export const GET_USER_VIDEO_ANALYTICS = gql`
  query getUserVideoAnalytics($userId: ID!) {
    getUserVideoAnalytics(userId: $userId) {
      video_id
      view_count
      clicks
      impressions
    }
  }
`;

export const TRACK_VIDEO_ANALYTICS = gql`
  mutation TrackVideoAnalytics(
    $video_id: ID!
    $watch_time: Int
    $completion_rate: Float
    $average_watch_time: Float
    $view_count: Int
    $clicks: Int
    $comments: Int
    $impressions: Int
    $likes: Int
    $shares: Int
  ) {
    trackVideoAnalytics(
      video_id: $video_id
      watch_time: $watch_time
      completion_rate: $completion_rate
      average_watch_time: $average_watch_time
      view_count: $view_count
      clicks: $clicks
      comments: $comments
      impressions: $impressions
      likes: $likes
      shares: $shares
    ) {
      success
      message
    }
  }
`;
