const { query } = require('../utils/db');
const { generateToken, hashPassword, comparePassword, requireAuth } = require('../utils/auth');
const { pubsub, EVENTS } = require('../utils/pubsub');
const { GraphQLError } = require('graphql');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (!context.userId) return null;
      const result = await query('SELECT * FROM users WHERE id = $1', [context.userId]);
      return result.rows[0] || null;
    },

    user: async (parent, { username }) => {
      const result = await query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) {
        throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
      }
      return result.rows[0];
    },

    searchUsers: async (parent, { query: searchQuery, limit = 20 }) => {
      const result = await query(
        `SELECT * FROM users
         WHERE username ILIKE $1 OR display_name ILIKE $1
         LIMIT $2`,
        [`%${searchQuery}%`, limit]
      );
      return result.rows;
    },

    post: async (parent, { id }) => {
      const result = await query('SELECT * FROM posts WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        throw new GraphQLError('Post not found', { extensions: { code: 'NOT_FOUND' } });
      }
      return result.rows[0];
    },

    feed: async (parent, { limit = 20, offset = 0 }) => {
      const result = await query(
        'SELECT * FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      return result.rows;
    },

    userPosts: async (parent, { username, limit = 20 }) => {
      const result = await query(
        `SELECT p.* FROM posts p
         JOIN users u ON p.user_id = u.id
         WHERE u.username = $1
         ORDER BY p.created_at DESC
         LIMIT $2`,
        [username, limit]
      );
      return result.rows;
    },

    searchPosts: async (parent, { query: searchQuery, limit = 20 }) => {
      const result = await query(
        'SELECT * FROM posts WHERE content ILIKE $1 ORDER BY created_at DESC LIMIT $2',
        [`%${searchQuery}%`, limit]
      );
      return result.rows;
    },

    timeline: async (parent, { limit = 20, offset = 0 }, context) => {
      requireAuth(context.userId);

      const result = await query(
        `SELECT DISTINCT p.* FROM posts p
         JOIN follows f ON p.user_id = f.following_id
         WHERE f.follower_id = $1
         ORDER BY p.created_at DESC
         LIMIT $2 OFFSET $3`,
        [context.userId, limit, offset]
      );
      return result.rows;
    },

    trendingHashtags: async (parent, { limit = 10 }) => {
      const result = await query(
        `SELECT h.*, COUNT(ph.post_id) as post_count
         FROM hashtags h
         LEFT JOIN post_hashtags ph ON h.id = ph.hashtag_id
         GROUP BY h.id
         ORDER BY post_count DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    },

    postsByHashtag: async (parent, { tag, limit = 20 }) => {
      const result = await query(
        `SELECT p.* FROM posts p
         JOIN post_hashtags ph ON p.id = ph.post_id
         JOIN hashtags h ON ph.hashtag_id = h.id
         WHERE h.tag = $1
         ORDER BY p.created_at DESC
         LIMIT $2`,
        [tag, limit]
      );
      return result.rows;
    },

    myNotifications: async (parent, { limit = 20 }, context) => {
      requireAuth(context.userId);

      const result = await query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [context.userId, limit]
      );
      return result.rows;
    },

    unreadNotificationCount: async (parent, args, context) => {
      requireAuth(context.userId);

      const result = await query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
        [context.userId]
      );
      return parseInt(result.rows[0].count);
    }
  },

  Mutation: {
    register: async (parent, { username, email, password }) => {
      const existingUser = await query(
        'SELECT * FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        throw new GraphQLError('Email or username already exists', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const hashedPassword = await hashPassword(password);
      const result = await query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
        [username, email, hashedPassword]
      );

      const user = result.rows[0];
      const token = generateToken(user.id);

      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        throw new GraphQLError('Invalid credentials', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      const user = result.rows[0];
      const isValid = await comparePassword(password, user.password);

      if (!isValid) {
        throw new GraphQLError('Invalid credentials', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      const token = generateToken(user.id);
      return { token, user };
    },

    updateProfile: async (parent, { displayName, bio, avatarUrl }, context) => {
      requireAuth(context.userId);

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (displayName !== undefined) {
        updates.push(`display_name = $${paramCount++}`);
        values.push(displayName);
      }
      if (bio !== undefined) {
        updates.push(`bio = $${paramCount++}`);
        values.push(bio);
      }
      if (avatarUrl !== undefined) {
        updates.push(`avatar_url = $${paramCount++}`);
        values.push(avatarUrl);
      }

      if (updates.length === 0) {
        throw new GraphQLError('No fields to update', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      values.push(context.userId);
      const result = await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      return result.rows[0];
    },

    followUser: async (parent, { username }, context) => {
      requireAuth(context.userId);

      const targetUser = await query('SELECT id FROM users WHERE username = $1', [username]);
      if (targetUser.rows.length === 0) {
        throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
      }

      const targetUserId = targetUser.rows[0].id;

      if (targetUserId === context.userId) {
        throw new GraphQLError('Cannot follow yourself', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      try {
        await query(
          'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
          [context.userId, targetUserId]
        );

        // 創建通知
        const currentUser = await query('SELECT username FROM users WHERE id = $1', [context.userId]);
        await query(
          'INSERT INTO notifications (user_id, type, content, reference_id) VALUES ($1, $2, $3, $4) RETURNING *',
          [targetUserId, 'follow', `${currentUser.rows[0].username} started following you`, context.userId]
        );

        return true;
      } catch (error) {
        if (error.code === '23505') {
          throw new GraphQLError('Already following this user', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        throw error;
      }
    },

    unfollowUser: async (parent, { username }, context) => {
      requireAuth(context.userId);

      const targetUser = await query('SELECT id FROM users WHERE username = $1', [username]);
      if (targetUser.rows.length === 0) {
        throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
      }

      await query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [context.userId, targetUser.rows[0].id]
      );

      return true;
    },

    createPost: async (parent, { content, imageUrl, hashtags }, context) => {
      requireAuth(context.userId);

      const result = await query(
        'INSERT INTO posts (user_id, content, image_url) VALUES ($1, $2, $3) RETURNING *',
        [context.userId, content, imageUrl]
      );

      const post = result.rows[0];

      // 處理 hashtags
      if (hashtags && hashtags.length > 0) {
        for (const tag of hashtags) {
          let hashtagResult = await query('SELECT id FROM hashtags WHERE tag = $1', [tag]);

          let hashtagId;
          if (hashtagResult.rows.length === 0) {
            const newHashtag = await query(
              'INSERT INTO hashtags (tag) VALUES ($1) RETURNING id',
              [tag]
            );
            hashtagId = newHashtag.rows[0].id;
          } else {
            hashtagId = hashtagResult.rows[0].id;
          }

          await query(
            'INSERT INTO post_hashtags (post_id, hashtag_id) VALUES ($1, $2)',
            [post.id, hashtagId]
          );
        }
      }

      // 發布新貼文事件給關注者
      pubsub.publish(EVENTS.NEW_POST_FROM_FOLLOWING, { newPostFromFollowing: post });

      return post;
    },

    updatePost: async (parent, { id, content }, context) => {
      requireAuth(context.userId);

      const result = await query(
        'UPDATE posts SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
        [content, id, context.userId]
      );

      if (result.rows.length === 0) {
        throw new GraphQLError('Post not found or unauthorized', { extensions: { code: 'FORBIDDEN' } });
      }

      return result.rows[0];
    },

    deletePost: async (parent, { id }, context) => {
      requireAuth(context.userId);

      const result = await query(
        'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, context.userId]
      );

      if (result.rows.length === 0) {
        throw new GraphQLError('Post not found or unauthorized', { extensions: { code: 'FORBIDDEN' } });
      }

      return true;
    },

    likePost: async (parent, { postId }, context) => {
      requireAuth(context.userId);

      try {
        const result = await query(
          'INSERT INTO likes (user_id, post_id) VALUES ($1, $2) RETURNING *',
          [context.userId, postId]
        );

        const like = result.rows[0];

        // 獲取貼文作者
        const post = await query('SELECT user_id FROM posts WHERE id = $1', [postId]);
        const postAuthorId = post.rows[0].user_id;

        // 如果不是自己的貼文，創建通知
        if (postAuthorId !== context.userId) {
          const currentUser = await query('SELECT username FROM users WHERE id = $1', [context.userId]);
          await query(
            'INSERT INTO notifications (user_id, type, content, reference_id) VALUES ($1, $2, $3, $4)',
            [postAuthorId, 'like', `${currentUser.rows[0].username} liked your post`, postId]
          );
        }

        // 發布事件
        pubsub.publish(EVENTS.POST_LIKED, { postLiked: like });

        return true;
      } catch (error) {
        if (error.code === '23505') {
          throw new GraphQLError('Already liked this post', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        throw error;
      }
    },

    unlikePost: async (parent, { postId }, context) => {
      requireAuth(context.userId);

      await query(
        'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
        [context.userId, postId]
      );

      return true;
    },

    addComment: async (parent, { postId, content }, context) => {
      requireAuth(context.userId);

      const result = await query(
        'INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING *',
        [context.userId, postId, content]
      );

      const comment = result.rows[0];

      // 獲取貼文作者
      const post = await query('SELECT user_id FROM posts WHERE id = $1', [postId]);
      const postAuthorId = post.rows[0].user_id;

      // 如果不是自己的貼文，創建通知
      if (postAuthorId !== context.userId) {
        const currentUser = await query('SELECT username FROM users WHERE id = $1', [context.userId]);
        await query(
          'INSERT INTO notifications (user_id, type, content, reference_id) VALUES ($1, $2, $3, $4)',
          [postAuthorId, 'comment', `${currentUser.rows[0].username} commented on your post`, postId]
        );
      }

      // 發布事件
      pubsub.publish(EVENTS.COMMENT_ADDED, { commentAdded: comment });

      return comment;
    },

    deleteComment: async (parent, { id }, context) => {
      requireAuth(context.userId);

      const result = await query(
        'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, context.userId]
      );

      if (result.rows.length === 0) {
        throw new GraphQLError('Comment not found or unauthorized', { extensions: { code: 'FORBIDDEN' } });
      }

      return true;
    },

    markNotificationAsRead: async (parent, { id }, context) => {
      requireAuth(context.userId);

      await query(
        'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
        [id, context.userId]
      );

      return true;
    },

    markAllNotificationsAsRead: async (parent, args, context) => {
      requireAuth(context.userId);

      await query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
        [context.userId]
      );

      return true;
    }
  },

  Subscription: {
    notificationReceived: {
      subscribe: () => pubsub.asyncIterator([EVENTS.NOTIFICATION_RECEIVED])
    },

    newPostFromFollowing: {
      subscribe: () => pubsub.asyncIterator([EVENTS.NEW_POST_FROM_FOLLOWING])
    },

    postLiked: {
      subscribe: (parent, { postId }) => {
        if (postId) {
          return pubsub.asyncIterator([`${EVENTS.POST_LIKED}_${postId}`]);
        }
        return pubsub.asyncIterator([EVENTS.POST_LIKED]);
      }
    },

    commentAdded: {
      subscribe: (parent, { postId }) => {
        if (postId) {
          return pubsub.asyncIterator([`${EVENTS.COMMENT_ADDED}_${postId}`]);
        }
        return pubsub.asyncIterator([EVENTS.COMMENT_ADDED]);
      }
    }
  },

  User: {
    followersCount: async (parent) => {
      const result = await query(
        'SELECT COUNT(*) FROM follows WHERE following_id = $1',
        [parent.id]
      );
      return parseInt(result.rows[0].count);
    },

    followingCount: async (parent) => {
      const result = await query(
        'SELECT COUNT(*) FROM follows WHERE follower_id = $1',
        [parent.id]
      );
      return parseInt(result.rows[0].count);
    },

    postsCount: async (parent) => {
      const result = await query(
        'SELECT COUNT(*) FROM posts WHERE user_id = $1',
        [parent.id]
      );
      return parseInt(result.rows[0].count);
    },

    isFollowedByMe: async (parent, args, context) => {
      if (!context.userId) return false;

      const result = await query(
        'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
        [context.userId, parent.id]
      );

      return result.rows.length > 0;
    },

    posts: async (parent, { limit = 20 }) => {
      const result = await query(
        'SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [parent.id, limit]
      );
      return result.rows;
    }
  },

  Post: {
    author: async (parent) => {
      const result = await query('SELECT * FROM users WHERE id = $1', [parent.user_id]);
      return result.rows[0];
    },

    likes: async (parent) => {
      const result = await query('SELECT * FROM likes WHERE post_id = $1', [parent.id]);
      return result.rows;
    },

    likesCount: async (parent) => {
      const result = await query('SELECT COUNT(*) FROM likes WHERE post_id = $1', [parent.id]);
      return parseInt(result.rows[0].count);
    },

    comments: async (parent) => {
      const result = await query(
        'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC',
        [parent.id]
      );
      return result.rows;
    },

    commentsCount: async (parent) => {
      const result = await query('SELECT COUNT(*) FROM comments WHERE post_id = $1', [parent.id]);
      return parseInt(result.rows[0].count);
    },

    hashtags: async (parent) => {
      const result = await query(
        `SELECT h.* FROM hashtags h
         JOIN post_hashtags ph ON h.id = ph.hashtag_id
         WHERE ph.post_id = $1`,
        [parent.id]
      );
      return result.rows;
    },

    isLikedByMe: async (parent, args, context) => {
      if (!context.userId) return false;

      const result = await query(
        'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
        [context.userId, parent.id]
      );

      return result.rows.length > 0;
    }
  },

  Like: {
    user: async (parent) => {
      const result = await query('SELECT * FROM users WHERE id = $1', [parent.user_id]);
      return result.rows[0];
    },

    post: async (parent) => {
      const result = await query('SELECT * FROM posts WHERE id = $1', [parent.post_id]);
      return result.rows[0];
    }
  },

  Comment: {
    user: async (parent) => {
      const result = await query('SELECT * FROM users WHERE id = $1', [parent.user_id]);
      return result.rows[0];
    },

    post: async (parent) => {
      const result = await query('SELECT * FROM posts WHERE id = $1', [parent.post_id]);
      return result.rows[0];
    }
  },

  Hashtag: {
    postsCount: async (parent) => {
      const result = await query(
        'SELECT COUNT(*) FROM post_hashtags WHERE hashtag_id = $1',
        [parent.id]
      );
      return parseInt(result.rows[0].count);
    },

    posts: async (parent, { limit = 20 }) => {
      const result = await query(
        `SELECT p.* FROM posts p
         JOIN post_hashtags ph ON p.id = ph.post_id
         WHERE ph.hashtag_id = $1
         ORDER BY p.created_at DESC
         LIMIT $2`,
        [parent.id, limit]
      );
      return result.rows;
    }
  }
};

module.exports = resolvers;
