const { gql } = require('graphql-tag');

/**
 * 增強版 GraphQL Schema
 * 包含：
 * - 自定義 Scalars (DateTime, Email, URL, PositiveInt)
 * - 自定義 Directives (@auth, @rateLimit, @cacheControl, @deprecated)
 * - Interfaces 和 Unions
 * - AI 輔助功能
 * - 高級分頁
 * - 完善的錯誤類型
 */
const typeDefsEnhanced = gql`
  # ============================================
  # 自定義 Scalars
  # ============================================
  scalar DateTime
  scalar Email
  scalar URL
  scalar PositiveInt

  # ============================================
  # 自定義 Directives
  # ============================================
  directive @auth(requires: Role = USER) on OBJECT | FIELD_DEFINITION
  directive @rateLimit(limit: Int = 10, duration: Int = 60) on FIELD_DEFINITION
  directive @cacheControl(maxAge: Int, scope: CacheControlScope) on FIELD_DEFINITION | OBJECT
  directive @deprecated(reason: String = "No longer supported") on FIELD_DEFINITION | ENUM_VALUE

  enum Role {
    ADMIN
    USER
    GUEST
  }

  enum CacheControlScope {
    PUBLIC
    PRIVATE
  }

  # ============================================
  # Interfaces
  # ============================================
  interface Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  interface Author {
    id: ID!
    name: String!
    email: Email!
  }

  # ============================================
  # 基本類型
  # ============================================
  type User implements Node & Author {
    id: ID!
    name: String!
    email: Email!
    avatar: URL
    bio: String
    role: Role!
    posts: [Post!]!
    comments: [Comment!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Post implements Node @cacheControl(maxAge: 120, scope: PUBLIC) {
    id: ID!
    title: String!
    content: String!
    excerpt: String
    slug: String!
    author: User!
    comments: [Comment!]!
    tags: [String!]!
    published: Boolean!
    views: PositiveInt!
    likes: PositiveInt!

    # AI 生成的內容
    aiSummary: String
    aiSEO: SEOMetadata
    aiSentiment: SentimentAnalysis
    aiRecommendations: [Post!]!

    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Comment implements Node {
    id: ID!
    content: String!
    author: User!
    post: Post!
    replies: [Comment!]!
    parentComment: Comment
    likes: PositiveInt!

    # AI 分析
    aiSentiment: SentimentAnalysis

    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # ============================================
  # AI 相關類型
  # ============================================
  type SEOMetadata {
    title: String!
    description: String!
    keywords: [String!]!
    slug: String!
    ogImage: URL
  }

  type SentimentAnalysis {
    overall: SentimentType!
    score: Float!
    emotions: EmotionScores!
    keywords: [String!]!
  }

  enum SentimentType {
    POSITIVE
    NEGATIVE
    NEUTRAL
    MIXED
  }

  type EmotionScores {
    joy: Float!
    trust: Float!
    surprise: Float!
    sadness: Float!
    anger: Float!
  }

  type ContentSuggestion {
    type: String!
    suggestion: String!
    priority: Int!
  }

  type SearchEnhancement {
    query: String!
    suggestions: [String!]!
    correctedQuery: String
  }

  # ============================================
  # 分頁類型（Cursor-based Pagination）
  # ============================================
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
    totalCount: Int!
  }

  type PostEdge {
    node: Post!
    cursor: String!
  }

  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  # ============================================
  # 輸入類型
  # ============================================
  input CreatePostInput {
    title: String!
    content: String!
    tags: [String!]
    published: Boolean
    generateSEO: Boolean
    generateSummary: Boolean
  }

  input UpdatePostInput {
    title: String
    content: String
    tags: [String!]
    published: Boolean
  }

  input PostFilter {
    author: ID
    tags: [String!]
    published: Boolean
    dateFrom: DateTime
    dateTo: DateTime
    minViews: Int
  }

  input PostSort {
    field: PostSortField!
    order: SortOrder!
  }

  enum PostSortField {
    CREATED_AT
    UPDATED_AT
    TITLE
    VIEWS
    LIKES
  }

  enum SortOrder {
    ASC
    DESC
  }

  # ============================================
  # 認證類型
  # ============================================
  type AuthPayload {
    token: String!
    user: User!
    expiresAt: DateTime!
  }

  # ============================================
  # 錯誤類型
  # ============================================
  type ValidationError {
    field: String!
    message: String!
  }

  type MutationError {
    code: String!
    message: String!
    field: String
  }

  # ============================================
  # Union Types
  # ============================================
  union SearchResult = Post | User | Comment

  # ============================================
  # Query
  # ============================================
  type Query {
    # 文章查詢
    posts(
      limit: PositiveInt
      offset: Int
      filter: PostFilter
      sort: PostSort
    ): [Post!]! @cacheControl(maxAge: 60)

    # Cursor-based 分頁
    postsConnection(
      first: PositiveInt
      after: String
      filter: PostFilter
      sort: PostSort
    ): PostConnection! @cacheControl(maxAge: 60)

    post(id: ID!): Post @cacheControl(maxAge: 120)
    postBySlug(slug: String!): Post @cacheControl(maxAge: 120)

    # 智能搜尋
    searchPosts(query: String!): [Post!]!
    enhancedSearch(query: String!): SearchEnhancement!

    # 推薦
    recommendedPosts(postId: ID, limit: PositiveInt): [Post!]! @cacheControl(maxAge: 300)
    trendingPosts(limit: PositiveInt): [Post!]! @cacheControl(maxAge: 300)

    # 用戶查詢
    user(id: ID!): User @cacheControl(maxAge: 60)
    me: User @auth

    # 評論查詢
    comments(postId: ID!): [Comment!]!
    comment(id: ID!): Comment

    # 通用搜尋
    search(query: String!, type: [String!]): [SearchResult!]!

    # 統計
    stats: Stats! @cacheControl(maxAge: 300)
  }

  type Stats {
    totalPosts: Int!
    totalUsers: Int!
    totalComments: Int!
    postsToday: Int!
  }

  # ============================================
  # Mutation
  # ============================================
  type Mutation {
    # 認證
    register(
      name: String!
      email: Email!
      password: String!
    ): AuthPayload! @rateLimit(limit: 3, duration: 3600)

    login(
      email: Email!
      password: String!
    ): AuthPayload! @rateLimit(limit: 5, duration: 300)

    # 文章管理
    createPost(input: CreatePostInput!): Post! @auth @rateLimit(limit: 10, duration: 3600)
    updatePost(id: ID!, input: UpdatePostInput!): Post! @auth
    deletePost(id: ID!): Boolean! @auth

    # AI 輔助功能
    generatePostSummary(postId: ID!): String! @auth @rateLimit(limit: 20, duration: 60)
    generatePostSEO(postId: ID!): SEOMetadata! @auth @rateLimit(limit: 20, duration: 60)
    generatePostTags(postId: ID!): [String!]! @auth @rateLimit(limit: 20, duration: 60)
    analyzePostSentiment(postId: ID!): SentimentAnalysis! @auth @rateLimit(limit: 20, duration: 60)
    suggestContentImprovements(postId: ID!): [ContentSuggestion!]! @auth @rateLimit(limit: 10, duration: 60)

    # 內容創作輔助
    generateOutline(topic: String!, keywords: [String!]): String! @auth @rateLimit(limit: 10, duration: 60)
    expandContent(outline: String!, section: String!): String! @auth @rateLimit(limit: 10, duration: 60)
    proofreadContent(content: String!): String! @auth @rateLimit(limit: 10, duration: 60)
    translateContent(content: String!, targetLanguage: String!): String! @auth @rateLimit(limit: 10, duration: 60)

    # 評論管理
    addComment(postId: ID!, content: String!, parentId: ID): Comment! @auth @rateLimit(limit: 30, duration: 60)
    updateComment(id: ID!, content: String!): Comment! @auth
    deleteComment(id: ID!): Boolean! @auth

    # 互動
    likePost(postId: ID!): Post! @auth @rateLimit(limit: 100, duration: 60)
    unlikePost(postId: ID!): Post! @auth
    likeComment(commentId: ID!): Comment! @auth @rateLimit(limit: 100, duration: 60)
    unlikeComment(commentId: ID!): Comment! @auth

    # 用戶管理
    updateProfile(name: String, bio: String, avatar: URL): User! @auth
    changePassword(oldPassword: String!, newPassword: String!): Boolean! @auth
  }

  # ============================================
  # Subscription（即時更新）
  # ============================================
  type Subscription {
    # 新文章通知
    postAdded: Post!
    postUpdated(postId: ID!): Post!
    postDeleted: ID!

    # 新評論通知
    commentAdded(postId: ID!): Comment!

    # 用戶活動
    userActivity(userId: ID!): UserActivity!
  }

  type UserActivity {
    type: UserActivityType!
    user: User!
    post: Post
    comment: Comment
    timestamp: DateTime!
  }

  enum UserActivityType {
    POST_CREATED
    POST_UPDATED
    COMMENT_ADDED
    POST_LIKED
  }
`;

module.exports = typeDefsEnhanced;
