const { gql } = require('apollo-server-express');

const typeDefs = gql`
  # Enum types for role, visibility, plan, and status
  enum Role {
    user
    creator
    admin
  }

  enum VideoVisibility {
    public
    unlisted
  }

  enum SubscriptionPlan {
    free
    plus
    premium
  }

  enum PaymentStatus {
    pending
    completed
    failed
    refunded
  }

  enum AccountStatus {
    active
    suspended
    deleted
  }

  enum DataRetentionPreference {
    retain
    delete
    anonymize
  }

  # Postgresql Data

  type User {
    id: ID!
    full_name: String
    username: String!
    email: String
    is_verified: Boolean!
    role: String!
    oauth_provider: String
    oauth_provider_id: String
    email_verified: Boolean
    access_token: String
    token_expiry: String
    date_of_birth: String
    gender: String
    country: String
    language_preference: String
    profile_picture: String
    cover_photo: String
    bio: String
    account_status: AccountStatus
    terms_accepted: Boolean
    terms_date: String
    terms_version: String
    consent_given: Boolean
    consent_date: String
    consent_version: String
    data_retention_period: Int
    data_retention_end_date: String
    data_retention_policy: String
    data_retention_preference: DataRetentionPreference
    opt_out_date: String
    data_deleted: Boolean
    data_deletion_date: String
    data_deletion_method: String
    gdpr_compliant: Boolean
    user_rights_requested: String
    subscription: Subscription
  }

  type Video {
    id: ID!
    title: String!
    description: String
    duration: Int!
    views: Int!
    likes: Int!
    thumbnail_s3_key: String
    video_s3_key: String!
    available_resolutions: [String!]!
    hls_manifest_s3_key: String!
    uploaderName: String
    visibility: VideoVisibility!
    createdAt: String
    categories: [Category]
  }

  type VideoAnalytics {
    id: ID!
    video_id: ID!
    watch_time: Int
    completion_rate: Float
    average_watch_time: Float
    view_count: Int
    clicks: Int
    comments: Int
    impressions: Int
    likes: Int
    shares: Int
    created_at: String
    updated_at: String
  }

  type Subscription {
    id: ID!
    user_id: ID!
    plan: SubscriptionPlan!
    start_date: String
    end_date: String
    is_active: Boolean
  }

  type PaymentHistory {
    id: ID!
    user: User!
    subscription: Subscription
    amount: Float!
    currency: String!
    transaction_id: String!
    created_at: String!
    status: PaymentStatus!
  }

  type Category {
    id: ID!
    name: String!
    parent: Category
    subcategories: [Category]
    videos: [Video]
  }

  type VideoCategory {
    id: ID!
    video: Video!
    category: Category!
  }

  type WatchHistory {
    video_id: ID!
    watched_at: String!
    progress: Int
  }

  type PlaybackProgress {
    last_position: Int!
  }

  type RefreshTokenResponse {
    accessToken: String!
  }

  # New response type for authentication mutations
  type LogoutResponse {
    message: String
  }
  type AuthResponse {
    accessToken: String!
    refreshToken: String
    user: User!
    message: String
  }

  type Response {
    success: Boolean!
    message: String!
  }

  # MongoDB data

  type Notification {
    id: ID!
    user_id: String!
    notification_type: String!
    message: String!
    is_read: Boolean!
    created_at: String!
  }

  type SearchHistory {
    id: ID!
    user_id: String!
    search_terms: [String!]!
    created_at: String!
  }

  type Tag {
    id: ID!
    video_id: String!
    tags: [String!]!
  }

  type Comment {
    id: ID!
    video_id: String!
    user_id: String!
    comment_text: String!
    created_at: String!
    deleted_at: String
    replies: [Reply!]!
  }

  type Reply {
    id: ID!
    user_id: String!
    comment_text: String!
    created_at: String!
  }

  # Postgresql Query
  type Query {
    me: User
    getUser(id: ID!): User
    getUsers: [User!]
    getVideo(id: ID!): Video
    getVideos(parentCategoryId: ID!, subcategoryId: ID): [Video!]!
    getVideoPlaylist: [Video]
    getUserVideos(userId: ID!): [Video]
    getVideoAnalytics(video_id: ID!): VideoAnalytics
    getAllVideoAnalytics: [VideoAnalytics]
    getUserVideoAnalytics(userId: ID!): [VideoAnalytics]
    getSubscription(user_id: ID!): Subscription
    getPaymentHistory(user_id: ID!): [PaymentHistory!]
    getCategory(id: ID!): Category
    getAllCategories: [Category]
    getWatchHistory(user_id: ID!, limit: Int): [WatchHistory]!
    getPlaybackProgress(user_id: ID!, video_id: ID!): PlaybackProgress!

    getNotifications(user_id: String!): [Notification!]!
    getSearchHistory(user_id: String!): [SearchHistory!]!
    getTags(video_id: String!): Tag
    getCommentsForVideo(video_id: ID!): [Comment!]
  }

  # Postgresql Mutations
  type Mutation {
    register(
      full_name: String
      username: String!
      email: String!
      password: String!
      language_preference: String
      country: String
    ): User
    createVideo(
      title: String!
      description: String
      duration: Int!
      thumbnail_s3_key: String
      video_s3_key: String!
      available_resolutions: [String!]!
      hls_manifest_s3_key: String!
      uploader_id: ID!
      visibility: VideoVisibility!
      category_ids: [ID!]
    ): Video
    trackVideoAnalytics(
      video_id: ID!
      watch_time: Int
      completion_rate: Float
      average_watch_time: Float
      view_count: Int
      clicks: Int
      comments: Int
      impressions: Int
      likes: Int
      shares: Int
    ): Response!
    createSubscription(user_id: ID!): Subscription
    upgradeSubscription(user_id: ID!, new_plan: SubscriptionPlan!): Subscription
    createPaymentHistory(
      user_id: ID!
      subscription_id: ID
      amount: Float!
      currency: String!
      transaction_id: String!
      status: PaymentStatus!
    ): PaymentHistory
    updatePlaybackProgress(
      user_id: ID!
      video_id: ID!
      last_position: Int!
    ): Response!
    addToWatchHistory(user_id: ID!, video_id: ID!): Response!
    createCategory(name: String!, parent_id: ID): Category
    assignCategoryToVideo(video_id: ID!, category_id: ID!): Video
    updateUserProfile(input: UpdateUserProfileInput!): User

    # Authentication Mutations
    login(email: String!, password: String!): AuthResponse
    refreshToken: RefreshTokenResponse!
    logout: LogoutResponse
    googleLogin(token: String!): AuthResponse
    facebookLogin(token: String!): AuthResponse
  }

  # MongoDB Mutations
  type Mutation {
    markNotificationAsRead(id: ID!): Notification
    createNotification(
      user_id: String!
      notification_type: String!
      message: String!
    ): Notification

    addSearchTerm(user_id: String!, search_term: String!): SearchHistory
    clearSearchHistory(user_id: String!): Boolean

    addOrUpdateTags(video_id: String!, tags: [String!]!): Tag

    addComment(
      video_id: String!
      user_id: String!
      comment_text: String!
    ): Comment!
    addReplyToComment(
      comment_id: String!
      user_id: String!
      comment_text: String!
    ): Comment!
    deleteComment(comment_id: ID!): Boolean! # Soft delete comment
  }

  input UpdateUserProfileInput {
    id: ID!
    full_name: String
    username: String!
    email: String!
    date_of_birth: String
    gender: String
    country: String
    language_preference: String
    profile_picture: String
    cover_photo: String
    bio: String
  }
`;

module.exports = typeDefs;
