const { createLoaders } = require('../utils/dataLoaders');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Mock models
jest.mock('../models/User');
jest.mock('../models/Post');
jest.mock('../models/Comment');

describe('DataLoaders', () => {
  let loaders;

  beforeEach(() => {
    jest.clearAllMocks();
    loaders = createLoaders();
  });

  describe('userLoader', () => {
    test('should load single user', async () => {
      const mockUser = { id: 'user1', name: 'User 1', email: 'user1@example.com' };

      User.find.mockResolvedValue([mockUser]);

      const result = await loaders.userLoader.load('user1');

      expect(User.find).toHaveBeenCalledWith({ _id: { $in: ['user1'] } });
      expect(result).toEqual(mockUser);
    });

    test('should batch load multiple users', async () => {
      const mockUsers = [
        { id: 'user1', name: 'User 1', email: 'user1@example.com' },
        { id: 'user2', name: 'User 2', email: 'user2@example.com' }
      ];

      User.find.mockResolvedValue(mockUsers);

      const results = await loaders.userLoader.loadMany(['user1', 'user2']);

      expect(User.find).toHaveBeenCalledWith({ _id: { $in: ['user1', 'user2'] } });
      expect(results).toHaveLength(2);
    });

    test('should return null for non-existent user', async () => {
      User.find.mockResolvedValue([]);

      const result = await loaders.userLoader.load('nonexistent');

      expect(result).toBeNull();
    });

    test('should cache loaded users', async () => {
      const mockUser = { id: 'user1', name: 'User 1', email: 'user1@example.com' };

      User.find.mockResolvedValue([mockUser]);

      // First load
      await loaders.userLoader.load('user1');
      // Second load (should use cache)
      await loaders.userLoader.load('user1');

      // Should only call database once due to caching
      expect(User.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('postLoader', () => {
    test('should load single post', async () => {
      const mockPost = { id: 'post1', title: 'Post 1', content: 'Content 1' };

      Post.find.mockResolvedValue([mockPost]);

      const result = await loaders.postLoader.load('post1');

      expect(Post.find).toHaveBeenCalledWith({ _id: { $in: ['post1'] } });
      expect(result).toEqual(mockPost);
    });

    test('should batch load multiple posts', async () => {
      const mockPosts = [
        { id: 'post1', title: 'Post 1', content: 'Content 1' },
        { id: 'post2', title: 'Post 2', content: 'Content 2' }
      ];

      Post.find.mockResolvedValue(mockPosts);

      const results = await loaders.postLoader.loadMany(['post1', 'post2']);

      expect(Post.find).toHaveBeenCalledWith({ _id: { $in: ['post1', 'post2'] } });
      expect(results).toHaveLength(2);
    });

    test('should return null for non-existent post', async () => {
      Post.find.mockResolvedValue([]);

      const result = await loaders.postLoader.load('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('commentsByPostLoader', () => {
    test('should load comments for single post', async () => {
      const mockComments = [
        { id: 'comment1', post: 'post1', content: 'Comment 1' },
        { id: 'comment2', post: 'post1', content: 'Comment 2' }
      ];

      Comment.find.mockResolvedValue(mockComments);

      const result = await loaders.commentsByPostLoader.load('post1');

      expect(Comment.find).toHaveBeenCalledWith({ post: { $in: ['post1'] } });
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockComments);
    });

    test('should batch load comments for multiple posts', async () => {
      const mockComments = [
        { id: 'comment1', post: 'post1', content: 'Comment 1' },
        { id: 'comment2', post: 'post2', content: 'Comment 2' }
      ];

      Comment.find.mockResolvedValue(mockComments);

      const results = await loaders.commentsByPostLoader.loadMany(['post1', 'post2']);

      expect(Comment.find).toHaveBeenCalledWith({ post: { $in: ['post1', 'post2'] } });
      expect(results).toHaveLength(2);
    });

    test('should return empty array for post with no comments', async () => {
      Comment.find.mockResolvedValue([]);

      const result = await loaders.commentsByPostLoader.load('post-no-comments');

      expect(result).toEqual([]);
    });

    test('should group comments by post correctly', async () => {
      const mockComments = [
        { id: 'comment1', post: 'post1', content: 'Comment 1' },
        { id: 'comment2', post: 'post1', content: 'Comment 2' },
        { id: 'comment3', post: 'post2', content: 'Comment 3' }
      ];

      Comment.find.mockResolvedValue(mockComments);

      const results = await loaders.commentsByPostLoader.loadMany(['post1', 'post2']);

      expect(results[0]).toHaveLength(2); // post1 has 2 comments
      expect(results[1]).toHaveLength(1); // post2 has 1 comment
    });
  });

  describe('postsByAuthorLoader', () => {
    test('should load posts for single author', async () => {
      const mockPosts = [
        { id: 'post1', author: 'user1', title: 'Post 1' },
        { id: 'post2', author: 'user1', title: 'Post 2' }
      ];

      Post.find.mockResolvedValue(mockPosts);

      const result = await loaders.postsByAuthorLoader.load('user1');

      expect(Post.find).toHaveBeenCalledWith({ author: { $in: ['user1'] } });
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockPosts);
    });

    test('should batch load posts for multiple authors', async () => {
      const mockPosts = [
        { id: 'post1', author: 'user1', title: 'Post 1' },
        { id: 'post2', author: 'user2', title: 'Post 2' }
      ];

      Post.find.mockResolvedValue(mockPosts);

      const results = await loaders.postsByAuthorLoader.loadMany(['user1', 'user2']);

      expect(Post.find).toHaveBeenCalledWith({ author: { $in: ['user1', 'user2'] } });
      expect(results).toHaveLength(2);
    });

    test('should return empty array for author with no posts', async () => {
      Post.find.mockResolvedValue([]);

      const result = await loaders.postsByAuthorLoader.load('user-no-posts');

      expect(result).toEqual([]);
    });

    test('should group posts by author correctly', async () => {
      const mockPosts = [
        { id: 'post1', author: 'user1', title: 'Post 1' },
        { id: 'post2', author: 'user1', title: 'Post 2' },
        { id: 'post3', author: 'user2', title: 'Post 3' }
      ];

      Post.find.mockResolvedValue(mockPosts);

      const results = await loaders.postsByAuthorLoader.loadMany(['user1', 'user2']);

      expect(results[0]).toHaveLength(2); // user1 has 2 posts
      expect(results[1]).toHaveLength(1); // user2 has 1 post
    });
  });

  describe('Loader creation', () => {
    test('should create all required loaders', () => {
      const loaders = createLoaders();

      expect(loaders.userLoader).toBeDefined();
      expect(loaders.postLoader).toBeDefined();
      expect(loaders.commentsByPostLoader).toBeDefined();
      expect(loaders.postsByAuthorLoader).toBeDefined();
    });

    test('should create new loader instances each time', () => {
      const loaders1 = createLoaders();
      const loaders2 = createLoaders();

      expect(loaders1.userLoader).not.toBe(loaders2.userLoader);
      expect(loaders1.postLoader).not.toBe(loaders2.postLoader);
    });
  });

  describe('Performance optimization', () => {
    test('should deduplicate simultaneous requests', async () => {
      const mockUser = { id: 'user1', name: 'User 1' };
      User.find.mockResolvedValue([mockUser]);

      // Make multiple simultaneous requests for the same user
      const [result1, result2, result3] = await Promise.all([
        loaders.userLoader.load('user1'),
        loaders.userLoader.load('user1'),
        loaders.userLoader.load('user1')
      ]);

      // Should only make one database call
      expect(User.find).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockUser);
      expect(result2).toEqual(mockUser);
      expect(result3).toEqual(mockUser);
    });

    test('should batch requests made in the same tick', async () => {
      const mockUsers = [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
        { id: 'user3', name: 'User 3' }
      ];

      User.find.mockResolvedValue(mockUsers);

      // Make multiple requests in the same tick
      const promise1 = loaders.userLoader.load('user1');
      const promise2 = loaders.userLoader.load('user2');
      const promise3 = loaders.userLoader.load('user3');

      await Promise.all([promise1, promise2, promise3]);

      // Should batch into single database call
      expect(User.find).toHaveBeenCalledTimes(1);
      expect(User.find).toHaveBeenCalledWith({
        _id: { $in: ['user1', 'user2', 'user3'] }
      });
    });
  });
});
