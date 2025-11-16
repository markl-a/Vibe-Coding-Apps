const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    email: String!
    displayName: String
    bio: String
    avatarUrl: String
    followersCount: Int!
    followingCount: Int!
    postsCount: Int!
    isFollowedByMe: Boolean!
    posts(limit: Int): [Post!]!
    createdAt: String!
  }

  type Post {
    id: ID!
    content: String!
    imageUrl: String
    author: User!
    likes: [Like!]!
    likesCount: Int!
    comments: [Comment!]!
    commentsCount: Int!
    hashtags: [Hashtag!]!
    isLikedByMe: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Like {
    id: ID!
    user: User!
    post: Post!
    createdAt: String!
  }

  type Comment {
    id: ID!
    content: String!
    user: User!
    post: Post!
    createdAt: String!
  }

  type Hashtag {
    id: ID!
    tag: String!
    postsCount: Int!
    posts(limit: Int): [Post!]!
    createdAt: String!
  }

  type Notification {
    id: ID!
    type: String!
    content: String!
    isRead: Boolean!
    referenceId: ID
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    # 用戶相關
    me: User
    user(username: String!): User
    searchUsers(query: String!, limit: Int): [User!]!

    # 貼文相關
    post(id: ID!): Post
    feed(limit: Int, offset: Int): [Post!]!
    userPosts(username: String!, limit: Int): [Post!]!
    searchPosts(query: String!, limit: Int): [Post!]!
    timeline(limit: Int, offset: Int): [Post!]!

    # 標籤
    trendingHashtags(limit: Int): [Hashtag!]!
    postsByHashtag(tag: String!, limit: Int): [Post!]!

    # 通知
    myNotifications(limit: Int): [Notification!]!
    unreadNotificationCount: Int!
  }

  type Mutation {
    # 用戶認證
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    updateProfile(displayName: String, bio: String, avatarUrl: String): User!

    # 關注系統
    followUser(username: String!): Boolean!
    unfollowUser(username: String!): Boolean!

    # 貼文管理
    createPost(content: String!, imageUrl: String, hashtags: [String!]): Post!
    updatePost(id: ID!, content: String!): Post!
    deletePost(id: ID!): Boolean!

    # 互動
    likePost(postId: ID!): Boolean!
    unlikePost(postId: ID!): Boolean!
    addComment(postId: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!

    # 通知
    markNotificationAsRead(id: ID!): Boolean!
    markAllNotificationsAsRead: Boolean!
  }

  type Subscription {
    notificationReceived: Notification!
    newPostFromFollowing: Post!
    postLiked(postId: ID!): Like!
    commentAdded(postId: ID!): Comment!
  }
`;

module.exports = typeDefs;
