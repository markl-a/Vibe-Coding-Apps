/**
 * GraphQL Schema Design Examples
 *
 * Demonstrates:
 * - Type definitions using TypeGraphQL/NestJS GraphQL
 * - Input types for mutations
 * - Custom scalars (DateTime, Email, URL)
 * - Enums and unions
 * - Interfaces and object types
 */

import {
  ObjectType,
  Field,
  ID,
  Int,
  Float,
  InputType,
  registerEnumType,
  InterfaceType,
  createUnionType,
  Directive
} from '@nestjs/graphql';
import { GraphQLScalarType, Kind } from 'graphql';
import { IsEmail, IsUrl, Min, Max, Length } from 'class-validator';

// ============================================================================
// CUSTOM SCALARS
// ============================================================================

/**
 * DateTime Scalar - ISO 8601 format
 */
export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO 8601 date-time string',

  serialize(value: Date): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    throw new Error('DateTime must be a Date object');
  },

  parseValue(value: string): Date {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid DateTime value');
    }
    return date;
  },

  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid DateTime value');
      }
      return date;
    }
    throw new Error('DateTime must be a string');
  }
});

/**
 * Email Scalar - Email validation
 */
export const EmailScalar = new GraphQLScalarType({
  name: 'Email',
  description: 'Email address',

  serialize(value: string): string {
    if (typeof value !== 'string') {
      throw new Error('Email must be a string');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }
    return value.toLowerCase();
  },

  parseValue(value: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }
    return value.toLowerCase();
  },

  parseLiteral(ast): string {
    if (ast.kind === Kind.STRING) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(ast.value)) {
        throw new Error('Invalid email format');
      }
      return ast.value.toLowerCase();
    }
    throw new Error('Email must be a string');
  }
});

/**
 * URL Scalar - URL validation
 */
export const URLScalar = new GraphQLScalarType({
  name: 'URL',
  description: 'Valid URL string',

  serialize(value: string): string {
    try {
      new URL(value);
      return value;
    } catch {
      throw new Error('Invalid URL format');
    }
  },

  parseValue(value: string): string {
    try {
      new URL(value);
      return value;
    } catch {
      throw new Error('Invalid URL format');
    }
  },

  parseLiteral(ast): string {
    if (ast.kind === Kind.STRING) {
      try {
        new URL(ast.value);
        return ast.value;
      } catch {
        throw new Error('Invalid URL format');
      }
    }
    throw new Error('URL must be a string');
  }
});

// ============================================================================
// ENUMS
// ============================================================================

export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
  GUEST = 'GUEST'
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role in the system'
});

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

registerEnumType(PostStatus, {
  name: 'PostStatus',
  description: 'Post publication status'
});

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC'
}

registerEnumType(SortOrder, {
  name: 'SortOrder',
  description: 'Sort order direction'
});

// ============================================================================
// INTERFACES
// ============================================================================

@InterfaceType()
export abstract class Node {
  @Field(() => ID)
  id: string;
}

@InterfaceType()
export abstract class Timestamped {
  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

// ============================================================================
// OBJECT TYPES
// ============================================================================

@ObjectType({ implements: () => [Node, Timestamped] })
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;

  @Field(() => EmailScalar)
  email: string;

  @Field({ nullable: true })
  @IsUrl()
  avatar?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => Boolean)
  isEmailVerified: boolean;

  @Field(() => Date, { nullable: true })
  lastLoginAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  // Virtual fields (resolved via field resolvers)
  @Field(() => [Post], { nullable: true })
  posts?: Post[];

  @Field(() => Int)
  postsCount?: number;

  @Field(() => [User], { nullable: true })
  followers?: User[];

  @Field(() => Int)
  followersCount?: number;
}

@ObjectType({ implements: () => [Node, Timestamped] })
export class Post {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field({ nullable: true })
  excerpt?: string;

  @Field(() => URLScalar, { nullable: true })
  featuredImage?: string;

  @Field(() => PostStatus)
  status: PostStatus;

  @Field(() => [String])
  tags: string[];

  @Field(() => Int, { defaultValue: 0 })
  viewCount: number;

  @Field(() => Int, { defaultValue: 0 })
  likeCount: number;

  @Field(() => Date, { nullable: true })
  publishedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  // Relationships
  @Field(() => User)
  author: User;

  @Field(() => ID)
  authorId: string;

  @Field(() => [Comment], { nullable: true })
  comments?: Comment[];

  @Field(() => Int)
  commentsCount?: number;

  @Field(() => Category, { nullable: true })
  category?: Category;
}

@ObjectType({ implements: () => [Node, Timestamped] })
export class Comment {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field(() => Boolean, { defaultValue: true })
  isApproved: boolean;

  @Field(() => Int, { defaultValue: 0 })
  likeCount: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  // Relationships
  @Field(() => User)
  author: User;

  @Field(() => ID)
  authorId: string;

  @Field(() => Post)
  post: Post;

  @Field(() => ID)
  postId: string;

  @Field(() => Comment, { nullable: true })
  parentComment?: Comment;

  @Field(() => ID, { nullable: true })
  parentCommentId?: string;

  @Field(() => [Comment], { nullable: true })
  replies?: Comment[];
}

@ObjectType()
export class Category {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int, { defaultValue: 0 })
  postsCount: number;

  @Field(() => [Post], { nullable: true })
  posts?: Post[];
}

// ============================================================================
// INPUT TYPES
// ============================================================================

@InputType()
export class CreateUserInput {
  @Field()
  @Length(3, 20)
  username: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(8, 100)
  password: string;

  @Field({ nullable: true })
  @IsUrl()
  avatar?: string;

  @Field({ nullable: true })
  @Length(0, 500)
  bio?: string;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @Length(3, 20)
  username?: string;

  @Field({ nullable: true })
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsUrl()
  avatar?: string;

  @Field({ nullable: true })
  @Length(0, 500)
  bio?: string;
}

@InputType()
export class CreatePostInput {
  @Field()
  @Length(1, 200)
  title: string;

  @Field()
  @Length(1, 50000)
  content: string;

  @Field({ nullable: true })
  @Length(0, 500)
  excerpt?: string;

  @Field(() => URLScalar, { nullable: true })
  featuredImage?: string;

  @Field(() => PostStatus, { defaultValue: PostStatus.DRAFT })
  status: PostStatus;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => ID, { nullable: true })
  categoryId?: string;
}

@InputType()
export class UpdatePostInput {
  @Field({ nullable: true })
  @Length(1, 200)
  title?: string;

  @Field({ nullable: true })
  @Length(1, 50000)
  content?: string;

  @Field({ nullable: true })
  @Length(0, 500)
  excerpt?: string;

  @Field(() => URLScalar, { nullable: true })
  featuredImage?: string;

  @Field(() => PostStatus, { nullable: true })
  status?: PostStatus;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => ID, { nullable: true })
  categoryId?: string;
}

@InputType()
export class CreateCommentInput {
  @Field()
  @Length(1, 5000)
  content: string;

  @Field(() => ID)
  postId: string;

  @Field(() => ID, { nullable: true })
  parentCommentId?: string;
}

@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  @Min(1)
  @Max(100)
  limit: number;
}

@InputType()
export class FilterInput {
  @Field({ nullable: true })
  search?: string;

  @Field(() => PostStatus, { nullable: true })
  status?: PostStatus;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => ID, { nullable: true })
  categoryId?: string;

  @Field(() => ID, { nullable: true })
  authorId?: string;

  @Field(() => Date, { nullable: true })
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;
}

@InputType()
export class SortInput {
  @Field()
  field: string;

  @Field(() => SortOrder, { defaultValue: SortOrder.DESC })
  order: SortOrder;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

@ObjectType()
export class PageInfo {
  @Field(() => Int)
  currentPage: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  totalItems: number;

  @Field(() => Int)
  itemsPerPage: number;

  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => Boolean)
  hasPreviousPage: boolean;
}

@ObjectType()
export class PaginatedPosts {
  @Field(() => [Post])
  items: Post[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}

@ObjectType()
export class PaginatedUsers {
  @Field(() => [User])
  items: User[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}

@ObjectType()
export class PaginatedComments {
  @Field(() => [Comment])
  items: Comment[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}

// ============================================================================
// UNION TYPES
// ============================================================================

export const SearchResult = createUnionType({
  name: 'SearchResult',
  types: () => [Post, User, Comment] as const,
  resolveType(value) {
    if ('title' in value) {
      return Post;
    }
    if ('username' in value) {
      return User;
    }
    if ('postId' in value) {
      return Comment;
    }
    return null;
  }
});

// ============================================================================
// RESPONSE TYPES
// ============================================================================

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field(() => User)
  user: User;

  @Field(() => Date)
  expiresAt: Date;
}

@ObjectType()
export class MutationResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field({ nullable: true })
  code?: string;
}

@ObjectType()
export class DeleteResponse extends MutationResponse {
  @Field(() => ID, { nullable: true })
  deletedId?: string;
}

// ============================================================================
// DIRECTIVES (for schema annotations)
// ============================================================================

/**
 * Usage example in schema:
 *
 * @Directive('@auth(requires: ADMIN)')
 * @Directive('@rateLimit(limit: 10, duration: 60)')
 * @Directive('@cacheControl(maxAge: 300)')
 */
