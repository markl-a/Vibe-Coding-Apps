const { ApolloServer } = require('@apollo/server');
const typeDefs = require('../schema/typeDefs');
const resolvers = require('../resolvers/index');
const { createLoaders } = require('../utils/dataLoaders');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Mock all models
jest.mock('../models/User');
jest.mock('../models/Post');
jest.mock('../models/Comment');
jest.mock('../utils/auth');

describe('GraphQL Integration Tests', () => {
  let server;

  beforeAll(() => {
    server = new ApolloServer({
      typeDefs,
      resolvers
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query Operations', () => {
    test('should query posts with pagination', async () => {
      const mockPosts = [
        { id: 'post1', title: 'Post 1', content: 'Content 1', author: 'user1' },
        { id: 'post2', title: 'Post 2', content: 'Content 2', author: 'user1' }
      ];

      Post.find.mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockPosts)
      });

      const query = `
        query GetPosts($limit: Int, $offset: Int) {
          posts(limit: $limit, offset: $offset) {
            id
            title
            content
          }
        }
      `;

      const result = await server.executeOperation({
        query,
        variables: { limit: 10, offset: 0 }
      });

      expect(result.body.kind).toBe('single');
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data.posts).toHaveLength(2);
    });

    test('should query single post by id', async () => {
      const mockPost = {
        id: 'post1',
        title: 'Test Post',
        content: 'Test Content',
        author: 'user1'
      };

      Post.findById.mockResolvedValue(mockPost);

      const query = `
        query GetPost($id: ID!) {
          post(id: $id) {
            id
            title
            content
          }
        }
      `;

      const result = await server.executeOperation({
        query,
        variables: { id: 'post1' }
      });

      expect(result.body.kind).toBe('single');
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data.post.title).toBe('Test Post');
    });

    test('should search posts', async () => {
      const mockPosts = [
        { id: 'post1', title: 'JavaScript Tutorial', content: 'Learn JS' }
      ];

      Post.find.mockResolvedValue(mockPosts);

      const query = `
        query SearchPosts($query: String!) {
          searchPosts(query: $query) {
            id
            title
            content
          }
        }
      `;

      const result = await server.executeOperation({
        query,
        variables: { query: 'JavaScript' }
      });

      expect(result.body.kind).toBe('single');
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data.searchPosts).toHaveLength(1);
    });

    test('should query user by id', async () => {
      const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com'
      };

      User.findById.mockResolvedValue(mockUser);

      const query = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
            email
          }
        }
      `;

      const result = await server.executeOperation({
        query,
        variables: { id: 'user1' }
      });

      expect(result.body.kind).toBe('single');
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data.user.name).toBe('Test User');
    });

    test('should query comments for a post', async () => {
      const mockComments = [
        { id: 'comment1', content: 'Great post!', post: 'post1', author: 'user1' },
        { id: 'comment2', content: 'Thanks!', post: 'post1', author: 'user2' }
      ];

      Comment.find.mockResolvedValue(mockComments);

      const query = `
        query GetComments($postId: ID!) {
          comments(postId: $postId) {
            id
            content
          }
        }
      `;

      const result = await server.executeOperation({
        query,
        variables: { postId: 'post1' }
      });

      expect(result.body.kind).toBe('single');
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data.comments).toHaveLength(2);
    });
  });

  describe('Mutation Operations', () => {
    test('should register new user', async () => {
      const mockUser = {
        id: 'user1',
        name: 'New User',
        email: 'new@example.com'
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      const mutation = `
        mutation Register($name: String!, $email: String!, $password: String!) {
          register(name: $name, email: $email, password: $password) {
            user {
              id
              name
              email
            }
          }
        }
      `;

      const result = await server.executeOperation({
        query: mutation,
        variables: {
          name: 'New User',
          email: 'new@example.com',
          password: 'password123'
        }
      });

      expect(result.body.kind).toBe('single');
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data.register.user.name).toBe('New User');
    });

    test('should create post when authenticated', async () => {
      const mockUser = { id: 'user1', name: 'Test User' };
      const mockPost = {
        id: 'post1',
        title: 'New Post',
        content: 'Post Content',
        author: 'user1',
        published: false
      };

      Post.create.mockResolvedValue(mockPost);

      const mutation = `
        mutation CreatePost($title: String!, $content: String!, $published: Boolean) {
          createPost(title: $title, content: $content, published: $published) {
            id
            title
            content
            published
          }
        }
      `;

      const result = await server.executeOperation(
        {
          query: mutation,
          variables: {
            title: 'New Post',
            content: 'Post Content',
            published: false
          }
        },
        {
          contextValue: {
            user: mockUser,
            loaders: createLoaders()
          }
        }
      );

      expect(result.body.kind).toBe('single');
      expect(result.body.singleResult.data.createPost.title).toBe('New Post');
    });

    test('should update post when authorized', async () => {
      const mockUser = { id: 'user1' };
      const mockPost = {
        id: 'post1',
        title: 'Original Title',
        content: 'Original Content',
        author: { toString: () => 'user1' },
        save: jest.fn().mockResolvedValue(true)
      };

      Post.findById.mockResolvedValue(mockPost);

      const mutation = `
        mutation UpdatePost($id: ID!, $title: String, $content: String) {
          updatePost(id: $id, title: $title, content: $content) {
            id
            title
            content
          }
        }
      `;

      const result = await server.executeOperation(
        {
          query: mutation,
          variables: {
            id: 'post1',
            title: 'Updated Title',
            content: 'Updated Content'
          }
        },
        {
          contextValue: {
            user: mockUser,
            loaders: createLoaders()
          }
        }
      );

      expect(result.body.kind).toBe('single');
      expect(mockPost.save).toHaveBeenCalled();
    });

    test('should delete post when authorized', async () => {
      const mockUser = { id: 'user1' };
      const mockPost = {
        id: 'post1',
        author: { toString: () => 'user1' }
      };

      Post.findById.mockResolvedValue(mockPost);
      Post.findByIdAndDelete.mockResolvedValue(mockPost);
      Comment.deleteMany.mockResolvedValue({ deletedCount: 2 });

      const mutation = `
        mutation DeletePost($id: ID!) {
          deletePost(id: $id)
        }
      `;

      const result = await server.executeOperation(
        {
          query: mutation,
          variables: { id: 'post1' }
        },
        {
          contextValue: {
            user: mockUser,
            loaders: createLoaders()
          }
        }
      );

      expect(result.body.kind).toBe('single');
      expect(result.body.singleResult.data.deletePost).toBe(true);
    });

    test('should add comment to post', async () => {
      const mockUser = { id: 'user1' };
      const mockPost = { id: 'post1' };
      const mockComment = {
        id: 'comment1',
        content: 'Great post!',
        author: 'user1',
        post: 'post1'
      };

      Post.findById.mockResolvedValue(mockPost);
      Comment.create.mockResolvedValue(mockComment);

      const mutation = `
        mutation AddComment($postId: ID!, $content: String!) {
          addComment(postId: $postId, content: $content) {
            id
            content
          }
        }
      `;

      const result = await server.executeOperation(
        {
          query: mutation,
          variables: {
            postId: 'post1',
            content: 'Great post!'
          }
        },
        {
          contextValue: {
            user: mockUser,
            loaders: createLoaders()
          }
        }
      );

      expect(result.body.kind).toBe('single');
      expect(result.body.singleResult.data.addComment.content).toBe('Great post!');
    });

    test('should delete comment when authorized', async () => {
      const mockUser = { id: 'user1' };
      const mockComment = {
        id: 'comment1',
        author: { toString: () => 'user1' }
      };

      Comment.findById.mockResolvedValue(mockComment);
      Comment.findByIdAndDelete.mockResolvedValue(mockComment);

      const mutation = `
        mutation DeleteComment($id: ID!) {
          deleteComment(id: $id)
        }
      `;

      const result = await server.executeOperation(
        {
          query: mutation,
          variables: { id: 'comment1' }
        },
        {
          contextValue: {
            user: mockUser,
            loaders: createLoaders()
          }
        }
      );

      expect(result.body.kind).toBe('single');
      expect(result.body.singleResult.data.deleteComment).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle authentication errors', async () => {
      const mutation = `
        mutation CreatePost($title: String!, $content: String!) {
          createPost(title: $title, content: $content) {
            id
            title
          }
        }
      `;

      const result = await server.executeOperation(
        {
          query: mutation,
          variables: {
            title: 'Test',
            content: 'Content'
          }
        },
        {
          contextValue: {
            user: null,
            loaders: createLoaders()
          }
        }
      );

      expect(result.body.kind).toBe('single');
      expect(result.body.singleResult.errors).toBeDefined();
      expect(result.body.singleResult.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });

    test('should handle not found errors', async () => {
      Post.findById.mockResolvedValue(null);

      const query = `
        query GetPost($id: ID!) {
          post(id: $id) {
            id
            title
          }
        }
      `;

      const result = await server.executeOperation({
        query,
        variables: { id: 'nonexistent' }
      });

      expect(result.body.kind).toBe('single');
      expect(result.body.singleResult.data.post).toBeNull();
    });

    test('should handle validation errors for duplicate email', async () => {
      User.findOne.mockResolvedValue({ email: 'existing@example.com' });

      const mutation = `
        mutation Register($name: String!, $email: String!, $password: String!) {
          register(name: $name, email: $email, password: $password) {
            user {
              id
            }
          }
        }
      `;

      const result = await server.executeOperation({
        query: mutation,
        variables: {
          name: 'Test',
          email: 'existing@example.com',
          password: 'password'
        }
      });

      expect(result.body.kind).toBe('single');
      expect(result.body.singleResult.errors).toBeDefined();
      expect(result.body.singleResult.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    });
  });
});
