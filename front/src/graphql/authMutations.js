import { gql } from '@apollo/client';

export const REFRESH_TOKEN = gql`
  mutation {
    refreshToken {
      accessToken
    }
  }
`;

export const GET_USER = gql`
  query {
    me {
      id
      full_name
      username
      email
      profile_picture
      country
      language_preference
      role
      subscription {
        plan
        end_date
      }
    }
  }
`;

// LOGIN MUTATION
export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      refreshToken
      user {
        id
        full_name
        username
        email
        profile_picture
        country
        language_preference
        role
        subscription {
          plan
          end_date
        }
      }
    }
  }
`;

// REGISTER MUTATION
export const REGISTER = gql`
  mutation Register(
    $full_name: String!
    $username: String!
    $email: String!
    $password: String!
    $language_preference: String
    $country: String
  ) {
    register(
      full_name: $full_name
      username: $username
      email: $email
      password: $password
      language_preference: $language_preference
      country: $country
    ) {
      id
      full_name
      username
      email
      language_preference
      country
      role
      subscription {
        plan
        end_date
      }
    }
  }
`;

// LOGOUT MUTATION
export const LOGOUT = gql`
  mutation Logout {
    logout {
      message
    }
  }
`;

export const GOOGLE_LOGIN = gql`
  mutation GoogleLogin($token: String!) {
    googleLogin(token: $token) {
      accessToken
      user {
        id
        full_name
        username
        email
        profile_picture
        country
        language_preference
        role
        subscription {
          plan
          end_date
        }
      }
    }
  }
`;

export const FACEBOOK_LOGIN = gql`
  mutation FacebookLogin($token: String!) {
    facebookLogin(token: $token) {
      accessToken
      user {
        id
        full_name
        username
        email
        profile_picture
        country
        language_preference
        role
        subscription {
          plan
          end_date
        }
      }
    }
  }
`;
