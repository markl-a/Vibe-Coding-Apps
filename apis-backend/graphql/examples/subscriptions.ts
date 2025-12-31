/**
 * GraphQL Subscriptions Examples
 *
 * Demonstrates:
 * - WebSocket setup with subscriptions-transport-ws
 * - Subscription resolvers
 * - PubSub patterns (in-memory and Redis)
 * - Real-time event broadcasting
 * - Filtered subscriptions
 * - Authentication with subscriptions
 */

import {
  Resolver,
  Subscription,
  Args,
  Mutation,
  Context,
  ID
} from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import Redis from 'ioredis';

// Import types
import {
  Post,
  Comment,
  User,
  CreatePostInput,
  CreateCommentInput
} from './schema-design';

// ============================================================================
// PUBSUB CONFIGURATION
// ============================================================================

/**
 * In-Memory PubSub (for development/single instance)
 */
export const pubSub = new PubSub();

/**
 * Redis PubSub (for production/distributed systems)
 */
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times: number) => {
    return Math.min(times * 50, 2000);
  }
};

export const redisPubSub = new RedisPubSub({
  publisher: new Redis(redisOptions),
  subscriber: new Redis(redisOptions)
});

// Use Redis PubSub in production, in-memory for development
export const getPubSub = () => {
  return process.env.NODE_ENV === 'production' ? redisPubSub : pubSub;
};

// ============================================================================
// SUBSCRIPTION EVENTS
// ============================================================================

export enum SubscriptionEvent {
  POST_ADDED = 'POST_ADDED',
  POST_UPDATED = 'POST_UPDATED',
  POST_DELETED = 'POST_DELETED',
  POST_LIKED = 'POST_LIKED',

  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_UPDATED = 'COMMENT_UPDATED',
  COMMENT_DELETED = 'COMMENT_DELETED',

  USER_ONLINE = 'USER_ONLINE',
  USER_OFFLINE = 'USER_OFFLINE',

  NOTIFICATION_SENT = 'NOTIFICATION_SENT',
  MESSAGE_SENT = 'MESSAGE_SENT',
  TYPING_STARTED = 'TYPING_STARTED',
  TYPING_STOPPED = 'TYPING_STOPPED'
}

// ============================================================================
// SUBSCRIPTION PAYLOADS
// ============================================================================

export interface PostAddedPayload {
  postAdded: Post;
}

export interface PostUpdatedPayload {
  postUpdated: Post;
}

export interface PostDeletedPayload {
  postDeleted: {
    id: string;
    authorId: string;
  };
}

export interface CommentAddedPayload {
  commentAdded: Comment;
}

export interface UserStatusPayload {
  userId: string;
  status: 'online' | 'offline';
  timestamp: Date;
}

export interface NotificationPayload {
  notificationSent: {
    id: string;
    userId: string;
    type: string;
    message: string;
    link?: string;
    timestamp: Date;
  };
}

export interface TypingPayload {
  userId: string;
  username: string;
  channelId: string;
}

// ============================================================================
// WEBSOCKET AUTHENTICATION
// ============================================================================

export interface ConnectionParams {
  authorization?: string;
  token?: string;
}

export interface SubscriptionContext {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  connection?: any;
}

/**
 * Validate WebSocket connection and extract user from JWT
 */
export function validateWebSocketConnection(
  connectionParams: ConnectionParams
): SubscriptionContext {
  const token = connectionParams.authorization?.replace('Bearer ', '') || connectionParams.token;

  if (!token) {
    return {}; // Allow anonymous connections for public subscriptions
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    return {
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      }
    };
  } catch (error) {
    console.error('WebSocket authentication failed:', error);
    return {};
  }
}

// ============================================================================
// POST SUBSCRIPTIONS RESOLVER
// ============================================================================

@Resolver(() => Post)
export class PostSubscriptionResolver {
  constructor(
    private readonly postService: PostService,
    private readonly pubSubService = getPubSub()
  ) {}

  // --------------------------------------------------------------------------
  // SUBSCRIPTIONS
  // --------------------------------------------------------------------------

  /**
   * Subscribe to new posts
   * Filter by author or category if specified
   */
  @Subscription(() => Post, {
    description: 'Subscribe to new posts',
    filter: (payload: PostAddedPayload, variables: any, context: SubscriptionContext) => {
      const post = payload.postAdded;

      // Filter by author if specified
      if (variables.authorId && post.authorId !== variables.authorId) {
        return false;
      }

      // Filter by category if specified
      if (variables.categoryId && post.categoryId !== variables.categoryId) {
        return false;
      }

      // Only show published posts to non-authors
      if (context.user?.id !== post.authorId && post.status !== 'PUBLISHED') {
        return false;
      }

      return true;
    }
  })
  postAdded(
    @Args('authorId', { type: () => ID, nullable: true }) authorId?: string,
    @Args('categoryId', { type: () => ID, nullable: true }) categoryId?: string
  ) {
    return this.pubSubService.asyncIterator(SubscriptionEvent.POST_ADDED);
  }

  /**
   * Subscribe to post updates
   */
  @Subscription(() => Post, {
    description: 'Subscribe to post updates',
    filter: (payload: PostUpdatedPayload, variables: any) => {
      return !variables.postId || payload.postUpdated.id === variables.postId;
    }
  })
  postUpdated(
    @Args('postId', { type: () => ID, nullable: true }) postId?: string
  ) {
    return this.pubSubService.asyncIterator(SubscriptionEvent.POST_UPDATED);
  }

  /**
   * Subscribe to post deletions
   */
  @Subscription(() => String, {
    description: 'Subscribe to post deletions',
    resolve: (payload: PostDeletedPayload) => payload.postDeleted.id
  })
  postDeleted() {
    return this.pubSubService.asyncIterator(SubscriptionEvent.POST_DELETED);
  }

  /**
   * Subscribe to post likes
   */
  @Subscription(() => Post, {
    description: 'Subscribe to post likes',
    filter: (payload: any, variables: any) => {
      return !variables.postId || payload.postLiked.id === variables.postId;
    }
  })
  postLiked(
    @Args('postId', { type: () => ID, nullable: true }) postId?: string
  ) {
    return this.pubSubService.asyncIterator(SubscriptionEvent.POST_LIKED);
  }

  // --------------------------------------------------------------------------
  // MUTATIONS THAT TRIGGER SUBSCRIPTIONS
  // --------------------------------------------------------------------------

  @Mutation(() => Post, { description: 'Create post and notify subscribers' })
  async createPost(
    @Args('input') input: CreatePostInput,
    @Context() context: any
  ): Promise<Post> {
    if (!context.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const post = await this.postService.create({
      ...input,
      authorId: context.user.id
    });

    // Publish event to subscribers
    await this.pubSubService.publish(SubscriptionEvent.POST_ADDED, {
      postAdded: post
    });

    return post;
  }

  @Mutation(() => Post, { description: 'Update post and notify subscribers' })
  async updatePost(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: any,
    @Context() context: any
  ): Promise<Post> {
    const post = await this.postService.update(id, input);

    // Publish update event
    await this.pubSubService.publish(SubscriptionEvent.POST_UPDATED, {
      postUpdated: post
    });

    return post;
  }

  @Mutation(() => Boolean, { description: 'Delete post and notify subscribers' })
  async deletePost(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any
  ): Promise<boolean> {
    const post = await this.postService.findById(id);
    await this.postService.delete(id);

    // Publish deletion event
    await this.pubSubService.publish(SubscriptionEvent.POST_DELETED, {
      postDeleted: {
        id: post.id,
        authorId: post.authorId
      }
    });

    return true;
  }

  @Mutation(() => Post, { description: 'Like post and notify subscribers' })
  async likePost(
    @Args('id', { type: () => ID }) id: string
  ): Promise<Post> {
    const post = await this.postService.incrementLikes(id);

    // Publish like event
    await this.pubSubService.publish(SubscriptionEvent.POST_LIKED, {
      postLiked: post
    });

    return post;
  }
}

// ============================================================================
// COMMENT SUBSCRIPTIONS RESOLVER
// ============================================================================

@Resolver(() => Comment)
export class CommentSubscriptionResolver {
  constructor(
    private readonly commentService: CommentService,
    private readonly pubSubService = getPubSub()
  ) {}

  /**
   * Subscribe to comments on a specific post
   */
  @Subscription(() => Comment, {
    description: 'Subscribe to new comments on a post',
    filter: (payload: CommentAddedPayload, variables: { postId: string }) => {
      return payload.commentAdded.postId === variables.postId;
    }
  })
  commentAdded(
    @Args('postId', { type: () => ID }) postId: string
  ) {
    return this.pubSubService.asyncIterator(SubscriptionEvent.COMMENT_ADDED);
  }

  /**
   * Subscribe to comment updates
   */
  @Subscription(() => Comment, {
    description: 'Subscribe to comment updates'
  })
  commentUpdated() {
    return this.pubSubService.asyncIterator(SubscriptionEvent.COMMENT_UPDATED);
  }

  @Mutation(() => Comment, { description: 'Create comment and notify subscribers' })
  async createComment(
    @Args('input') input: CreateCommentInput,
    @Context() context: any
  ): Promise<Comment> {
    if (!context.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const comment = await this.commentService.create({
      ...input,
      authorId: context.user.id
    });

    // Publish to subscribers
    await this.pubSubService.publish(SubscriptionEvent.COMMENT_ADDED, {
      commentAdded: comment
    });

    return comment;
  }
}

// ============================================================================
// USER PRESENCE SUBSCRIPTIONS
// ============================================================================

@Resolver()
export class UserPresenceResolver {
  @WebSocketServer()
  private server: Server;

  private readonly pubSubService = getPubSub();
  private onlineUsers = new Map<string, Date>();

  /**
   * Subscribe to user online/offline status
   */
  @Subscription(() => UserStatusPayload, {
    description: 'Subscribe to user presence changes',
    filter: (payload: UserStatusPayload, variables: any) => {
      // Filter by specific user if provided
      if (variables.userId) {
        return payload.userId === variables.userId;
      }
      return true;
    }
  })
  userStatusChanged(
    @Args('userId', { type: () => ID, nullable: true }) userId?: string
  ) {
    return this.pubSubService.asyncIterator([
      SubscriptionEvent.USER_ONLINE,
      SubscriptionEvent.USER_OFFLINE
    ]);
  }

  /**
   * Mark user as online
   */
  async userConnected(userId: string): Promise<void> {
    this.onlineUsers.set(userId, new Date());

    await this.pubSubService.publish(SubscriptionEvent.USER_ONLINE, {
      userId,
      status: 'online',
      timestamp: new Date()
    });
  }

  /**
   * Mark user as offline
   */
  async userDisconnected(userId: string): Promise<void> {
    this.onlineUsers.delete(userId);

    await this.pubSubService.publish(SubscriptionEvent.USER_OFFLINE, {
      userId,
      status: 'offline',
      timestamp: new Date()
    });
  }

  /**
   * Get online users
   */
  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }
}

// ============================================================================
// REAL-TIME NOTIFICATIONS
// ============================================================================

@Resolver()
export class NotificationResolver {
  private readonly pubSubService = getPubSub();

  /**
   * Subscribe to notifications for current user
   */
  @Subscription(() => NotificationPayload, {
    description: 'Subscribe to user notifications',
    filter: (payload: NotificationPayload, variables: any, context: SubscriptionContext) => {
      // Only send to the intended recipient
      if (!context.user) {
        return false;
      }
      return payload.notificationSent.userId === context.user.id;
    }
  })
  notificationReceived(@Context() context: SubscriptionContext) {
    if (!context.user) {
      throw new UnauthorizedException('Authentication required for notifications');
    }
    return this.pubSubService.asyncIterator(SubscriptionEvent.NOTIFICATION_SENT);
  }

  /**
   * Send notification to user
   */
  async sendNotification(
    userId: string,
    type: string,
    message: string,
    link?: string
  ): Promise<void> {
    await this.pubSubService.publish(SubscriptionEvent.NOTIFICATION_SENT, {
      notificationSent: {
        id: Math.random().toString(36),
        userId,
        type,
        message,
        link,
        timestamp: new Date()
      }
    });
  }
}

// ============================================================================
// TYPING INDICATORS
// ============================================================================

@Resolver()
export class TypingIndicatorResolver {
  private readonly pubSubService = getPubSub();

  /**
   * Subscribe to typing indicators in a channel
   */
  @Subscription(() => TypingPayload, {
    description: 'Subscribe to typing indicators',
    filter: (payload: TypingPayload, variables: { channelId: string }) => {
      return payload.channelId === variables.channelId;
    }
  })
  userTyping(
    @Args('channelId', { type: () => ID }) channelId: string
  ) {
    return this.pubSubService.asyncIterator([
      SubscriptionEvent.TYPING_STARTED,
      SubscriptionEvent.TYPING_STOPPED
    ]);
  }

  /**
   * Broadcast typing started
   */
  @Mutation(() => Boolean)
  async startTyping(
    @Args('channelId', { type: () => ID }) channelId: string,
    @Context() context: any
  ): Promise<boolean> {
    if (!context.user) {
      throw new UnauthorizedException('Authentication required');
    }

    await this.pubSubService.publish(SubscriptionEvent.TYPING_STARTED, {
      userId: context.user.id,
      username: context.user.username,
      channelId
    });

    return true;
  }

  /**
   * Broadcast typing stopped
   */
  @Mutation(() => Boolean)
  async stopTyping(
    @Args('channelId', { type: () => ID }) channelId: string,
    @Context() context: any
  ): Promise<boolean> {
    if (!context.user) {
      throw new UnauthorizedException('Authentication required');
    }

    await this.pubSubService.publish(SubscriptionEvent.TYPING_STOPPED, {
      userId: context.user.id,
      username: context.user.username,
      channelId
    });

    return true;
  }
}

// ============================================================================
// APOLLO SERVER SUBSCRIPTION SETUP
// ============================================================================

/**
 * Example Apollo Server configuration with subscriptions
 */
export const apolloServerConfig = {
  subscriptions: {
    'graphql-ws': {
      onConnect: (context: any) => {
        const { connectionParams } = context;
        return validateWebSocketConnection(connectionParams);
      },
      onDisconnect: async (context: any) => {
        // Clean up on disconnect
        if (context.user) {
          const presenceResolver = new UserPresenceResolver();
          await presenceResolver.userDisconnected(context.user.id);
        }
      }
    },
    'subscriptions-transport-ws': {
      onConnect: (connectionParams: ConnectionParams) => {
        return validateWebSocketConnection(connectionParams);
      },
      onDisconnect: async (webSocket: any, context: any) => {
        if (context.user) {
          const presenceResolver = new UserPresenceResolver();
          await presenceResolver.userDisconnected(context.user.id);
        }
      }
    }
  }
};

// Mock service interfaces
interface PostService {
  create(data: any): Promise<Post>;
  update(id: string, data: any): Promise<Post>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Post>;
  incrementLikes(id: string): Promise<Post>;
}

interface CommentService {
  create(data: any): Promise<Comment>;
}
