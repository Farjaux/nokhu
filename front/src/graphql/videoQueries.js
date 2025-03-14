import { gql } from '@apollo/client';

export const GET_VIDEOS = gql`
  query getVideos($parentCategoryId: ID!, $subcategoryId: ID) {
    getVideos(
      parentCategoryId: $parentCategoryId
      subcategoryId: $subcategoryId
    ) {
      id
      title
      thumbnail_s3_key
      createdAt
      uploaderName
      categories {
        id
        name
      }
    }
  }
`;

export const GET_USER_VIDEOS = gql`
  query getUserVideos($userId: ID!) {
    getUserVideos(userId: $userId) {
      id
      title
      thumbnail_s3_key
      createdAt
    }
  }
`;

export const GET_PLAYLIST = gql`
  query getVideoPlaylist {
    getVideoPlaylist {
      id
      title
      thumbnail_s3_key
      uploaderName
    }
  }
`;
