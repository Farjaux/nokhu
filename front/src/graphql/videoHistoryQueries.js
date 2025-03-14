import { gql } from '@apollo/client';

export const ADD_TO_WATCH_HISTORY = gql`
  mutation addToWatchHistory($user_id: ID!, $video_id: ID!) {
    addToWatchHistory(user_id: $user_id, video_id: $video_id) {
      success
      message
    }
  }
`;

export const GET_PLAYBACK_PROGRESS = gql`
  query getPlaybackProgress($user_id: ID!, $video_id: ID!) {
    getPlaybackProgress(user_id: $user_id, video_id: $video_id) {
      last_position
    }
  }
`;

export const UPDATE_PLAYBACK_PROGRESS = gql`
  mutation updatePlaybackProgress(
    $user_id: ID!
    $video_id: ID!
    $last_position: Int!
  ) {
    updatePlaybackProgress(
      user_id: $user_id
      video_id: $video_id
      last_position: $last_position
    ) {
      success
      message
    }
  }
`;
