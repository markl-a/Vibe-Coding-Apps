const { gql } = require('graphql-tag');

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
    createdAt: String!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    comments: [Comment!]!
    published: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    post: Post!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    # 文章查詢
    posts(limit: Int, offset: Int): [Post!]!
    post(id: ID!): Post
    searchPosts(query: String!): [Post!]!

    # 用戶查詢
    user(id: ID!): User
    me: User

    # 評論查詢
    comments(postId: ID!): [Comment!]!
  }

  type Mutation {
    # 認證
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # 文章管理
    createPost(title: String!, content: String!, published: Boolean): Post!
    updatePost(id: ID!, title: String, content: String, published: Boolean): Post!
    deletePost(id: ID!): Boolean!

    # 評論管理
    addComment(postId: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;
