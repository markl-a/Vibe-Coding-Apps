const { GraphQLError } = require('graphql');
const resolvers = require('../resolvers/index');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { generateToken } = require('../utils/auth');

// Mock models
jest.mock('../models/User');
jest.mock('../models/Post');
jest.mock('../models/Comment');
jest.mock('../utils/auth');

describe('Query Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('posts', () => {
    test('should return posts with default pagination', async () => {
      const mockPosts = [
        { id: '1', title: 'Post 1', content: 'Content 1' },
        { id: '2', title: 'Post 2', content: 'Content 2' }
      ];

      Post.find.mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockPosts)
      });

      const result = await resolvers.Query.posts({}, {});

      expect(Post.find).toHaveBeenCalled();
      expect(result).toEqual(mockPosts);
    });

    test('should respect limit and offset parameters', async () => {
      const mockPosts = [{ id: '1', title: 'Post 1' }];

      const limitMock = jest.fn().mockReturnThis();
      const skipMock = jest.fn().mockReturnThis();
      const sortMock = jest.fn().mockResolvedValue(mockPosts);

      Post.find.mockReturnValue({
        limit: limitMock,
        skip: skipMock,
        sort: sortMock
      });

      await resolvers.Query.posts({}, { limit: 5, offset: 10 });

      expect(limitMock).toHaveBeenCalledWith(5);
      expect(skipMock).toHaveBeenCalledWith(10);
    });
  });

  describe('post', () => {
    test('should return a single post by id', async () => {
      const mockPost = { id: '1', title: 'Test Post', content: 'Content' };
      Post.findById.mockResolvedValue(mockPost);

      const result = await resolvers.Query.post({}, { id: '1' });

      expect(Post.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockPost);
    });

    test('should return null if post not found', async () => {
      Post.findById.mockResolvedValue(null);

      const result = await resolvers.Query.post({}, { id: 'nonexistent' });

      expect(result).toBeNull();
    });
  });

  describe('searchPosts', () => {
    test('should search posts by query', async () => {
      const mockPosts = [
        { id: '1', title: 'JavaScript Guide', content: 'Learn JS' }
      ];

      Post.find.mockResolvedValue(mockPosts);

      const result = await resolvers.Query.searchPosts({}, { query: 'JavaScript' });

      expect(Post.find).toHaveBeenCalledWith({ $text: { $search: 'JavaScript' } });
      expect(result).toEqual(mockPosts);
    });
  });

  describe('user', () => {
    test('should return a user by id', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
      User.findById.mockResolvedValue(mockUser);

      const result = await resolvers.Query.user({}, { id: '1' });

      expect(User.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('me', () => {
    test('should return current user if authenticated', async () => {
      const mockUser = { id: '1', name: 'Test User' };
      const context = { user: mockUser };

      const result = await resolvers.Query.me({}, {}, context);

      expect(result).toEqual(mockUser);
    });

    test('should throw error if not authenticated', async () => {
      const context = { user: null };

      await expect(
        resolvers.Query.me({}, {}, context)
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('comments', () => {
    test('should return comments for a post', async () => {
      const mockComments = [
        { id: '1', content: 'Comment 1', post: 'post1' },
        { id: '2', content: 'Comment 2', post: 'post1' }
      ];

      Comment.find.mockResolvedValue(mockComments);

      const result = await resolvers.Query.comments({}, { postId: 'post1' });

      expect(Comment.find).toHaveBeenCalledWith({ post: 'post1' });
      expect(result).toEqual(mockComments);
    });
  });
});

describe('Mutation Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('should register a new user successfully', async () => {
      const mockUser = {
        id: '1',
        name: 'New User',
        email: 'new@example.com'
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('mock-token');

      const result = await resolvers.Mutation.register(
        {},
        { name: 'New User', email: 'new@example.com', password: 'password123' }
      );

      expect(User.findOne).toHaveBeenCalledWith({ email: 'new@example.com' });
      expect(User.create).toHaveBeenCalled();
      expect(result.token).toBe('mock-token');
      expect(result.user).toEqual(mockUser);
    });

    test('should throw error if email already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'existing@example.com' });

      await expect(
        resolvers.Mutation.register(
          {},
          { name: 'User', email: 'existing@example.com', password: 'password123' }
        )
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('login', () => {
    test('should login user with valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('mock-token');

      const result = await resolvers.Mutation.login(
        {},
        { email: 'test@example.com', password: 'password123' }
      );

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(result.token).toBe('mock-token');
      expect(result.user).toEqual(mockUser);
    });

    test('should throw error if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        resolvers.Mutation.login(
          {},
          { email: 'nonexistent@example.com', password: 'password123' }
        )
      ).rejects.toThrow(GraphQLError);
    });

    test('should throw error if password is invalid', async () => {
      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockResolvedValue(mockUser);

      await expect(
        resolvers.Mutation.login(
          {},
          { email: 'test@example.com', password: 'wrongpassword' }
        )
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('createPost', () => {
    test('should create a post when authenticated', async () => {
      const mockUser = { id: 'user1' };
      const mockPost = {
        id: 'post1',
        title: 'New Post',
        content: 'Content',
        author: 'user1'
      };

      Post.create.mockResolvedValue(mockPost);

      const result = await resolvers.Mutation.createPost(
        {},
        { title: 'New Post', content: 'Content', published: true },
        { user: mockUser }
      );

      expect(Post.create).toHaveBeenCalledWith({
        title: 'New Post',
        content: 'Content',
        published: true,
        author: 'user1'
      });
      expect(result).toEqual(mockPost);
    });

    test('should throw error if not authenticated', async () => {
      await expect(
        resolvers.Mutation.createPost(
          {},
          { title: 'New Post', content: 'Content' },
          { user: null }
        )
      ).rejects.toThrow(GraphQLError);
    });

    test('should set published to false by default', async () => {
      const mockUser = { id: 'user1' };
      Post.create.mockResolvedValue({});

      await resolvers.Mutation.createPost(
        {},
        { title: 'New Post', content: 'Content' },
        { user: mockUser }
      );

      expect(Post.create).toHaveBeenCalledWith(
        expect.objectContaining({ published: false })
      );
    });
  });

  describe('updatePost', () => {
    test('should update post when authorized', async () => {
      const mockUser = { id: 'user1' };
      const mockPost = {
        id: 'post1',
        title: 'Old Title',
        content: 'Old Content',
        author: 'user1',
        save: jest.fn().mockResolvedValue(true)
      };

      Post.findById.mockResolvedValue(mockPost);

      const result = await resolvers.Mutation.updatePost(
        {},
        { id: 'post1', title: 'New Title', content: 'New Content' },
        { user: mockUser }
      );

      expect(mockPost.title).toBe('New Title');
      expect(mockPost.content).toBe('New Content');
      expect(mockPost.save).toHaveBeenCalled();
    });

    test('should throw error if post not found', async () => {
      const mockUser = { id: 'user1' };
      Post.findById.mockResolvedValue(null);

      await expect(
        resolvers.Mutation.updatePost(
          {},
          { id: 'nonexistent', title: 'Title' },
          { user: mockUser }
        )
      ).rejects.toThrow(GraphQLError);
    });

    test('should throw error if not authorized', async () => {
      const mockUser = { id: 'user1' };
      const mockPost = {
        author: { toString: () => 'user2' }
      };

      Post.findById.mockResolvedValue(mockPost);

      await expect(
        resolvers.Mutation.updatePost(
          {},
          { id: 'post1', title: 'Title' },
          { user: mockUser }
        )
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('deletePost', () => {
    test('should delete post and its comments when authorized', async () => {
      const mockUser = { id: 'user1' };
      const mockPost = {
        id: 'post1',
        author: { toString: () => 'user1' }
      };

      Post.findById.mockResolvedValue(mockPost);
      Post.findByIdAndDelete.mockResolvedValue(mockPost);
      Comment.deleteMany.mockResolvedValue({ deletedCount: 2 });

      const result = await resolvers.Mutation.deletePost(
        {},
        { id: 'post1' },
        { user: mockUser }
      );

      expect(Post.findByIdAndDelete).toHaveBeenCalledWith('post1');
      expect(Comment.deleteMany).toHaveBeenCalledWith({ post: 'post1' });
      expect(result).toBe(true);
    });

    test('should throw error if not authorized', async () => {
      const mockUser = { id: 'user1' };
      const mockPost = {
        author: { toString: () => 'user2' }
      };

      Post.findById.mockResolvedValue(mockPost);

      await expect(
        resolvers.Mutation.deletePost(
          {},
          { id: 'post1' },
          { user: mockUser }
        )
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('addComment', () => {
    test('should add comment to post when authenticated', async () => {
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

      const result = await resolvers.Mutation.addComment(
        {},
        { postId: 'post1', content: 'Great post!' },
        { user: mockUser }
      );

      expect(Post.findById).toHaveBeenCalledWith('post1');
      expect(Comment.create).toHaveBeenCalledWith({
        content: 'Great post!',
        author: 'user1',
        post: 'post1'
      });
      expect(result).toEqual(mockComment);
    });

    test('should throw error if post not found', async () => {
      const mockUser = { id: 'user1' };
      Post.findById.mockResolvedValue(null);

      await expect(
        resolvers.Mutation.addComment(
          {},
          { postId: 'nonexistent', content: 'Comment' },
          { user: mockUser }
        )
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('deleteComment', () => {
    test('should delete comment when authorized', async () => {
      const mockUser = { id: 'user1' };
      const mockComment = {
        id: 'comment1',
        author: { toString: () => 'user1' }
      };

      Comment.findById.mockResolvedValue(mockComment);
      Comment.findByIdAndDelete.mockResolvedValue(mockComment);

      const result = await resolvers.Mutation.deleteComment(
        {},
        { id: 'comment1' },
        { user: mockUser }
      );

      expect(Comment.findByIdAndDelete).toHaveBeenCalledWith('comment1');
      expect(result).toBe(true);
    });

    test('should throw error if not authorized', async () => {
      const mockUser = { id: 'user1' };
      const mockComment = {
        author: { toString: () => 'user2' }
      };

      Comment.findById.mockResolvedValue(mockComment);

      await expect(
        resolvers.Mutation.deleteComment(
          {},
          { id: 'comment1' },
          { user: mockUser }
        )
      ).rejects.toThrow(GraphQLError);
    });
  });
});

describe('Field Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Post.author', () => {
    test('should load author using dataloader', async () => {
      const mockUser = { id: 'user1', name: 'Author' };
      const mockLoaders = {
        userLoader: {
          load: jest.fn().mockResolvedValue(mockUser)
        }
      };

      const parent = { author: 'user1' };
      const result = await resolvers.Post.author(parent, {}, { loaders: mockLoaders });

      expect(mockLoaders.userLoader.load).toHaveBeenCalledWith('user1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('Post.comments', () => {
    test('should load comments using dataloader', async () => {
      const mockComments = [
        { id: 'comment1', content: 'Comment 1' },
        { id: 'comment2', content: 'Comment 2' }
      ];
      const mockLoaders = {
        commentsByPostLoader: {
          load: jest.fn().mockResolvedValue(mockComments)
        }
      };

      const parent = { id: 'post1' };
      const result = await resolvers.Post.comments(parent, {}, { loaders: mockLoaders });

      expect(mockLoaders.commentsByPostLoader.load).toHaveBeenCalledWith('post1');
      expect(result).toEqual(mockComments);
    });
  });

  describe('User.posts', () => {
    test('should load user posts using dataloader', async () => {
      const mockPosts = [
        { id: 'post1', title: 'Post 1' },
        { id: 'post2', title: 'Post 2' }
      ];
      const mockLoaders = {
        postsByAuthorLoader: {
          load: jest.fn().mockResolvedValue(mockPosts)
        }
      };

      const parent = { id: 'user1' };
      const result = await resolvers.User.posts(parent, {}, { loaders: mockLoaders });

      expect(mockLoaders.postsByAuthorLoader.load).toHaveBeenCalledWith('user1');
      expect(result).toEqual(mockPosts);
    });
  });

  describe('Comment.author', () => {
    test('should load comment author using dataloader', async () => {
      const mockUser = { id: 'user1', name: 'Commenter' };
      const mockLoaders = {
        userLoader: {
          load: jest.fn().mockResolvedValue(mockUser)
        }
      };

      const parent = { author: 'user1' };
      const result = await resolvers.Comment.author(parent, {}, { loaders: mockLoaders });

      expect(mockLoaders.userLoader.load).toHaveBeenCalledWith('user1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('Comment.post', () => {
    test('should load comment post using dataloader', async () => {
      const mockPost = { id: 'post1', title: 'Post' };
      const mockLoaders = {
        postLoader: {
          load: jest.fn().mockResolvedValue(mockPost)
        }
      };

      const parent = { post: 'post1' };
      const result = await resolvers.Comment.post(parent, {}, { loaders: mockLoaders });

      expect(mockLoaders.postLoader.load).toHaveBeenCalledWith('post1');
      expect(result).toEqual(mockPost);
    });
  });
});
