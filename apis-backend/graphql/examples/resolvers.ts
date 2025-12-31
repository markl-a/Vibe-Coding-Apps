/**
 * GraphQL Resolvers Examples
 *
 * Demonstrates:
 * - Query resolvers with filtering, pagination, sorting
 * - Mutation resolvers with validation and error handling
 * - Field resolvers for complex relationships
 * - Context usage for authentication
 * - DataLoader integration
 */

import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  ResolveField,
  Parent,
  ID,
  Int
} from '@nestjs/graphql';
import {
  UseGuards,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { GraphQLError } from 'graphql';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

// Import types from schema-design.ts
import {
  User,
  Post,
  Comment,
  AuthPayload,
  PaginatedPosts,
  PaginatedUsers,
  CreateUserInput,
  UpdateUserInput,
  CreatePostInput,
  UpdatePostInput,
  CreateCommentInput,
  PaginationInput,
  FilterInput,
  SortInput,
  PostStatus,
  DeleteResponse,
  SearchResult
} from './schema-design';

// ============================================================================
// CONTEXT INTERFACE
// ============================================================================

export interface GraphQLContext {
  req: Request;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  loaders: {
    userLoader: DataLoader<string, User>;
    postLoader: DataLoader<string, Post>;
    commentsByPostLoader: DataLoader<string, Comment[]>;
    postsByAuthorLoader: DataLoader<string, Post[]>;
  };
}

// ============================================================================
// AUTH GUARD
// ============================================================================

export class GqlAuthGuard {
  canActivate(context: any): boolean {
    const ctx = context.getContext();
    if (!ctx.user) {
      throw new UnauthorizedException('Authentication required');
    }
    return true;
  }
}

// ============================================================================
// USER RESOLVER
// ============================================================================

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService
  ) {}

  // --------------------------------------------------------------------------
  // QUERIES
  // --------------------------------------------------------------------------

  @Query(() => User, { nullable: true, description: 'Get current authenticated user' })
  @UseGuards(GqlAuthGuard)
  async me(@Context() context: GraphQLContext): Promise<User | null> {
    if (!context.user) {
      return null;
    }
    return await context.loaders.userLoader.load(context.user.id);
  }

  @Query(() => User, { description: 'Get user by ID' })
  async user(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: GraphQLContext
  ): Promise<User> {
    const user = await context.loaders.userLoader.load(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Query(() => PaginatedUsers, { description: 'Get all users with pagination' })
  async users(
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
    @Args('search', { nullable: true }) search?: string
  ): Promise<PaginatedUsers> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const [items, totalItems] = await Promise.all([
      this.userService.find(filter, { skip, limit }),
      this.userService.count(filter)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      pageInfo: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  @Query(() => [User], { description: 'Search users by username or email' })
  async searchUsers(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number
  ): Promise<User[]> {
    if (query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    return await this.userService.search(query, limit);
  }

  // --------------------------------------------------------------------------
  // MUTATIONS
  // --------------------------------------------------------------------------

  @Mutation(() => AuthPayload, { description: 'Register new user' })
  async register(
    @Args('input') input: CreateUserInput
  ): Promise<AuthPayload> {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(input.email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const existingUsername = await this.userService.findByUsername(input.username);
    if (existingUsername) {
      throw new BadRequestException('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await this.userService.create({
      ...input,
      password: hashedPassword,
      role: 'USER',
      isEmailVerified: false
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user,
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    };
  }

  @Mutation(() => AuthPayload, { description: 'Login user' })
  async login(
    @Args('email') email: string,
    @Args('password') password: string
  ): Promise<AuthPayload> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.userService.update(user.id, {
      lastLoginAt: new Date()
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user,
      expiresAt: new Date(Date.now() + 3600000)
    };
  }

  @Mutation(() => User, { description: 'Update user profile' })
  @UseGuards(GqlAuthGuard)
  async updateProfile(
    @Args('input') input: UpdateUserInput,
    @Context() context: GraphQLContext
  ): Promise<User> {
    if (!context.user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check if email/username is taken by another user
    if (input.email) {
      const existingUser = await this.userService.findByEmail(input.email);
      if (existingUser && existingUser.id !== context.user.id) {
        throw new BadRequestException('Email already in use');
      }
    }

    if (input.username) {
      const existingUser = await this.userService.findByUsername(input.username);
      if (existingUser && existingUser.id !== context.user.id) {
        throw new BadRequestException('Username already taken');
      }
    }

    return await this.userService.update(context.user.id, input);
  }

  @Mutation(() => DeleteResponse, { description: 'Delete user account' })
  @UseGuards(GqlAuthGuard)
  async deleteAccount(
    @Args('password') password: string,
    @Context() context: GraphQLContext
  ): Promise<DeleteResponse> {
    if (!context.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.userService.findById(context.user.id);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    await this.userService.delete(context.user.id);

    return {
      success: true,
      message: 'Account deleted successfully',
      deletedId: context.user.id
    };
  }

  // --------------------------------------------------------------------------
  // FIELD RESOLVERS
  // --------------------------------------------------------------------------

  @ResolveField(() => [Post], { description: 'User posts' })
  async posts(
    @Parent() user: User,
    @Context() context: GraphQLContext,
    @Args('status', { type: () => PostStatus, nullable: true }) status?: PostStatus,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit?: number
  ): Promise<Post[]> {
    const posts = await context.loaders.postsByAuthorLoader.load(user.id);

    let filtered = posts;
    if (status) {
      filtered = posts.filter(post => post.status === status);
    }

    return filtered.slice(0, limit);
  }

  @ResolveField(() => Int, { description: 'Total posts count' })
  async postsCount(
    @Parent() user: User,
    @Context() context: GraphQLContext
  ): Promise<number> {
    const posts = await context.loaders.postsByAuthorLoader.load(user.id);
    return posts.length;
  }

  @ResolveField(() => [User], { description: 'User followers' })
  async followers(
    @Parent() user: User,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number
  ): Promise<User[]> {
    return await this.userService.getFollowers(user.id, limit);
  }

  @ResolveField(() => Int, { description: 'Followers count' })
  async followersCount(@Parent() user: User): Promise<number> {
    return await this.userService.getFollowersCount(user.id);
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  private generateAccessToken(user: User): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      { expiresIn: '7d' }
    );
  }
}

// ============================================================================
// POST RESOLVER
// ============================================================================

@Resolver(() => Post)
export class PostResolver {
  constructor(
    private readonly postService: PostService,
    private readonly commentService: CommentService
  ) {}

  // --------------------------------------------------------------------------
  // QUERIES
  // --------------------------------------------------------------------------

  @Query(() => Post, { description: 'Get post by ID' })
  async post(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: GraphQLContext
  ): Promise<Post> {
    const post = await context.loaders.postLoader.load(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Increment view count
    await this.postService.incrementViewCount(id);

    return post;
  }

  @Query(() => PaginatedPosts, { description: 'Get posts with filtering and pagination' })
  async posts(
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
    @Args('filter', { type: () => FilterInput, nullable: true })
    filter?: FilterInput,
    @Args('sort', { type: () => SortInput, nullable: true })
    sort?: SortInput
  ): Promise<PaginatedPosts> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    // Build query filter
    const query: any = {};

    if (filter?.status) {
      query.status = filter.status;
    }

    if (filter?.authorId) {
      query.authorId = filter.authorId;
    }

    if (filter?.categoryId) {
      query.categoryId = filter.categoryId;
    }

    if (filter?.tags && filter.tags.length > 0) {
      query.tags = { $in: filter.tags };
    }

    if (filter?.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { content: { $regex: filter.search, $options: 'i' } },
        { excerpt: { $regex: filter.search, $options: 'i' } }
      ];
    }

    if (filter?.startDate || filter?.endDate) {
      query.createdAt = {};
      if (filter.startDate) {
        query.createdAt.$gte = filter.startDate;
      }
      if (filter.endDate) {
        query.createdAt.$lte = filter.endDate;
      }
    }

    // Build sort options
    const sortOptions: any = {};
    if (sort) {
      sortOptions[sort.field] = sort.order === 'ASC' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1; // Default: newest first
    }

    const [items, totalItems] = await Promise.all([
      this.postService.find(query, { skip, limit, sort: sortOptions }),
      this.postService.count(query)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      pageInfo: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  // --------------------------------------------------------------------------
  // MUTATIONS
  // --------------------------------------------------------------------------

  @Mutation(() => Post, { description: 'Create new post' })
  @UseGuards(GqlAuthGuard)
  async createPost(
    @Args('input') input: CreatePostInput,
    @Context() context: GraphQLContext
  ): Promise<Post> {
    if (!context.user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Auto-generate excerpt if not provided
    if (!input.excerpt && input.content) {
      input.excerpt = input.content.substring(0, 200) + '...';
    }

    const post = await this.postService.create({
      ...input,
      authorId: context.user.id,
      publishedAt: input.status === PostStatus.PUBLISHED ? new Date() : null
    });

    return post;
  }

  @Mutation(() => Post, { description: 'Update post' })
  @UseGuards(GqlAuthGuard)
  async updatePost(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdatePostInput,
    @Context() context: GraphQLContext
  ): Promise<Post> {
    if (!context.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const post = await this.postService.findById(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Check ownership
    if (post.authorId !== context.user.id && context.user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own posts');
    }

    // Update publishedAt if status changes to PUBLISHED
    if (input.status === PostStatus.PUBLISHED && post.status !== PostStatus.PUBLISHED) {
      input.publishedAt = new Date();
    }

    return await this.postService.update(id, input);
  }

  @Mutation(() => DeleteResponse, { description: 'Delete post' })
  @UseGuards(GqlAuthGuard)
  async deletePost(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: GraphQLContext
  ): Promise<DeleteResponse> {
    if (!context.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const post = await this.postService.findById(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (post.authorId !== context.user.id && context.user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postService.delete(id);

    return {
      success: true,
      message: 'Post deleted successfully',
      deletedId: id
    };
  }

  @Mutation(() => Post, { description: 'Like a post' })
  @UseGuards(GqlAuthGuard)
  async likePost(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: GraphQLContext
  ): Promise<Post> {
    return await this.postService.incrementLikes(id);
  }

  // --------------------------------------------------------------------------
  // FIELD RESOLVERS
  // --------------------------------------------------------------------------

  @ResolveField(() => User, { description: 'Post author' })
  async author(
    @Parent() post: Post,
    @Context() context: GraphQLContext
  ): Promise<User> {
    return await context.loaders.userLoader.load(post.authorId);
  }

  @ResolveField(() => [Comment], { description: 'Post comments' })
  async comments(
    @Parent() post: Post,
    @Context() context: GraphQLContext,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number
  ): Promise<Comment[]> {
    const comments = await context.loaders.commentsByPostLoader.load(post.id);
    return comments.slice(0, limit);
  }

  @ResolveField(() => Int, { description: 'Comments count' })
  async commentsCount(
    @Parent() post: Post,
    @Context() context: GraphQLContext
  ): Promise<number> {
    const comments = await context.loaders.commentsByPostLoader.load(post.id);
    return comments.length;
  }
}

// ============================================================================
// COMMENT RESOLVER
// ============================================================================

@Resolver(() => Comment)
export class CommentResolver {
  constructor(private readonly commentService: CommentService) {}

  @Mutation(() => Comment, { description: 'Create comment' })
  @UseGuards(GqlAuthGuard)
  async createComment(
    @Args('input') input: CreateCommentInput,
    @Context() context: GraphQLContext
  ): Promise<Comment> {
    if (!context.user) {
      throw new UnauthorizedException('Authentication required');
    }

    return await this.commentService.create({
      ...input,
      authorId: context.user.id,
      isApproved: true
    });
  }

  @Mutation(() => DeleteResponse, { description: 'Delete comment' })
  @UseGuards(GqlAuthGuard)
  async deleteComment(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: GraphQLContext
  ): Promise<DeleteResponse> {
    if (!context.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const comment = await this.commentService.findById(id);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.authorId !== context.user.id && context.user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentService.delete(id);

    return {
      success: true,
      message: 'Comment deleted successfully',
      deletedId: id
    };
  }

  @ResolveField(() => User)
  async author(
    @Parent() comment: Comment,
    @Context() context: GraphQLContext
  ): Promise<User> {
    return await context.loaders.userLoader.load(comment.authorId);
  }

  @ResolveField(() => Post)
  async post(
    @Parent() comment: Comment,
    @Context() context: GraphQLContext
  ): Promise<Post> {
    return await context.loaders.postLoader.load(comment.postId);
  }
}

// Mock service interfaces (these would be actual services in a real app)
interface UserService {
  find(filter: any, options: any): Promise<User[]>;
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  count(filter: any): Promise<number>;
  search(query: string, limit: number): Promise<User[]>;
  create(data: any): Promise<User>;
  update(id: string, data: any): Promise<User>;
  delete(id: string): Promise<void>;
  getFollowers(userId: string, limit: number): Promise<User[]>;
  getFollowersCount(userId: string): Promise<number>;
}

interface PostService {
  find(filter: any, options: any): Promise<Post[]>;
  findById(id: string): Promise<Post>;
  count(filter: any): Promise<number>;
  create(data: any): Promise<Post>;
  update(id: string, data: any): Promise<Post>;
  delete(id: string): Promise<void>;
  incrementViewCount(id: string): Promise<void>;
  incrementLikes(id: string): Promise<Post>;
}

interface CommentService {
  findById(id: string): Promise<Comment>;
  create(data: any): Promise<Comment>;
  delete(id: string): Promise<void>;
}
