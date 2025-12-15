const { parse, buildSchema } = require('graphql');
const typeDefs = require('../schema/typeDefs');

describe('GraphQL Schema', () => {
  let schema;

  beforeAll(() => {
    // Build schema from typeDefs
    schema = buildSchema(typeDefs.loc.source.body);
  });

  test('should parse schema without errors', () => {
    expect(() => {
      parse(typeDefs.loc.source.body);
    }).not.toThrow();
  });

  describe('Type Definitions', () => {
    test('should have User type with required fields', () => {
      const userType = schema.getType('User');

      expect(userType).toBeDefined();
      expect(userType.getFields().id).toBeDefined();
      expect(userType.getFields().name).toBeDefined();
      expect(userType.getFields().email).toBeDefined();
      expect(userType.getFields().posts).toBeDefined();
      expect(userType.getFields().createdAt).toBeDefined();
    });

    test('should have Post type with required fields', () => {
      const postType = schema.getType('Post');

      expect(postType).toBeDefined();
      expect(postType.getFields().id).toBeDefined();
      expect(postType.getFields().title).toBeDefined();
      expect(postType.getFields().content).toBeDefined();
      expect(postType.getFields().author).toBeDefined();
      expect(postType.getFields().comments).toBeDefined();
      expect(postType.getFields().published).toBeDefined();
      expect(postType.getFields().createdAt).toBeDefined();
      expect(postType.getFields().updatedAt).toBeDefined();
    });

    test('should have Comment type with required fields', () => {
      const commentType = schema.getType('Comment');

      expect(commentType).toBeDefined();
      expect(commentType.getFields().id).toBeDefined();
      expect(commentType.getFields().content).toBeDefined();
      expect(commentType.getFields().author).toBeDefined();
      expect(commentType.getFields().post).toBeDefined();
      expect(commentType.getFields().createdAt).toBeDefined();
    });

    test('should have AuthPayload type', () => {
      const authPayloadType = schema.getType('AuthPayload');

      expect(authPayloadType).toBeDefined();
      expect(authPayloadType.getFields().token).toBeDefined();
      expect(authPayloadType.getFields().user).toBeDefined();
    });
  });

  describe('Query Type', () => {
    test('should have all required queries', () => {
      const queryType = schema.getType('Query');

      expect(queryType).toBeDefined();
      expect(queryType.getFields().posts).toBeDefined();
      expect(queryType.getFields().post).toBeDefined();
      expect(queryType.getFields().searchPosts).toBeDefined();
      expect(queryType.getFields().user).toBeDefined();
      expect(queryType.getFields().me).toBeDefined();
      expect(queryType.getFields().comments).toBeDefined();
    });

    test('posts query should accept limit and offset arguments', () => {
      const queryType = schema.getType('Query');
      const postsField = queryType.getFields().posts;

      expect(postsField.args).toHaveLength(2);
      expect(postsField.args.find(arg => arg.name === 'limit')).toBeDefined();
      expect(postsField.args.find(arg => arg.name === 'offset')).toBeDefined();
    });

    test('post query should require id argument', () => {
      const queryType = schema.getType('Query');
      const postField = queryType.getFields().post;

      expect(postField.args).toHaveLength(1);
      expect(postField.args[0].name).toBe('id');
    });

    test('searchPosts query should require query argument', () => {
      const queryType = schema.getType('Query');
      const searchPostsField = queryType.getFields().searchPosts;

      expect(searchPostsField.args).toHaveLength(1);
      expect(searchPostsField.args[0].name).toBe('query');
    });

    test('comments query should require postId argument', () => {
      const queryType = schema.getType('Query');
      const commentsField = queryType.getFields().comments;

      expect(commentsField.args).toHaveLength(1);
      expect(commentsField.args[0].name).toBe('postId');
    });
  });

  describe('Mutation Type', () => {
    test('should have all required mutations', () => {
      const mutationType = schema.getType('Mutation');

      expect(mutationType).toBeDefined();
      expect(mutationType.getFields().register).toBeDefined();
      expect(mutationType.getFields().login).toBeDefined();
      expect(mutationType.getFields().createPost).toBeDefined();
      expect(mutationType.getFields().updatePost).toBeDefined();
      expect(mutationType.getFields().deletePost).toBeDefined();
      expect(mutationType.getFields().addComment).toBeDefined();
      expect(mutationType.getFields().deleteComment).toBeDefined();
    });

    test('register mutation should have required arguments', () => {
      const mutationType = schema.getType('Mutation');
      const registerField = mutationType.getFields().register;

      expect(registerField.args).toHaveLength(3);
      expect(registerField.args.find(arg => arg.name === 'name')).toBeDefined();
      expect(registerField.args.find(arg => arg.name === 'email')).toBeDefined();
      expect(registerField.args.find(arg => arg.name === 'password')).toBeDefined();
    });

    test('login mutation should have required arguments', () => {
      const mutationType = schema.getType('Mutation');
      const loginField = mutationType.getFields().login;

      expect(loginField.args).toHaveLength(2);
      expect(loginField.args.find(arg => arg.name === 'email')).toBeDefined();
      expect(loginField.args.find(arg => arg.name === 'password')).toBeDefined();
    });

    test('createPost mutation should have required arguments', () => {
      const mutationType = schema.getType('Mutation');
      const createPostField = mutationType.getFields().createPost;

      expect(createPostField.args.find(arg => arg.name === 'title')).toBeDefined();
      expect(createPostField.args.find(arg => arg.name === 'content')).toBeDefined();
      expect(createPostField.args.find(arg => arg.name === 'published')).toBeDefined();
    });

    test('updatePost mutation should have id and optional fields', () => {
      const mutationType = schema.getType('Mutation');
      const updatePostField = mutationType.getFields().updatePost;

      expect(updatePostField.args.find(arg => arg.name === 'id')).toBeDefined();
      expect(updatePostField.args.find(arg => arg.name === 'title')).toBeDefined();
      expect(updatePostField.args.find(arg => arg.name === 'content')).toBeDefined();
      expect(updatePostField.args.find(arg => arg.name === 'published')).toBeDefined();
    });

    test('deletePost mutation should require id argument', () => {
      const mutationType = schema.getType('Mutation');
      const deletePostField = mutationType.getFields().deletePost;

      expect(deletePostField.args).toHaveLength(1);
      expect(deletePostField.args[0].name).toBe('id');
    });

    test('addComment mutation should have required arguments', () => {
      const mutationType = schema.getType('Mutation');
      const addCommentField = mutationType.getFields().addComment;

      expect(addCommentField.args.find(arg => arg.name === 'postId')).toBeDefined();
      expect(addCommentField.args.find(arg => arg.name === 'content')).toBeDefined();
    });

    test('deleteComment mutation should require id argument', () => {
      const mutationType = schema.getType('Mutation');
      const deleteCommentField = mutationType.getFields().deleteComment;

      expect(deleteCommentField.args).toHaveLength(1);
      expect(deleteCommentField.args[0].name).toBe('id');
    });
  });

  describe('Field Relationships', () => {
    test('User.posts should return array of Posts', () => {
      const userType = schema.getType('User');
      const postsField = userType.getFields().posts;

      expect(postsField).toBeDefined();
      expect(postsField.type.toString()).toContain('Post');
    });

    test('Post.author should return User', () => {
      const postType = schema.getType('Post');
      const authorField = postType.getFields().author;

      expect(authorField).toBeDefined();
      expect(authorField.type.toString()).toContain('User');
    });

    test('Post.comments should return array of Comments', () => {
      const postType = schema.getType('Post');
      const commentsField = postType.getFields().comments;

      expect(commentsField).toBeDefined();
      expect(commentsField.type.toString()).toContain('Comment');
    });

    test('Comment.author should return User', () => {
      const commentType = schema.getType('Comment');
      const authorField = commentType.getFields().author;

      expect(authorField).toBeDefined();
      expect(authorField.type.toString()).toContain('User');
    });

    test('Comment.post should return Post', () => {
      const commentType = schema.getType('Comment');
      const postField = commentType.getFields().post;

      expect(postField).toBeDefined();
      expect(postField.type.toString()).toContain('Post');
    });
  });
});
