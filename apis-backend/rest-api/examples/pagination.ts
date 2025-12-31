/**
 * Production-Ready Pagination Patterns
 * Complete cursor and offset pagination implementations
 *
 * Features:
 * - Offset-based pagination (page/limit)
 * - Cursor-based pagination (for large datasets)
 * - Keyset pagination (performance optimized)
 * - Search and filtering
 * - Sorting
 * - Response metadata
 * - Performance optimization
 * - Database query optimization
 */

import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, LessThan, MoreThan, Not, IsNull } from 'typeorm';
import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ============================================================================
// Entity Example
// ============================================================================

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('posts')
@Index(['createdAt', 'id']) // Composite index for cursor pagination
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index() // Index for filtering
  title: string;

  @Column('text')
  content: string;

  @Column()
  @Index() // Index for filtering
  authorId: string;

  @Column()
  @Index() // Index for filtering
  categoryId: string;

  @Column({ default: 0 })
  @Index() // Index for sorting
  viewCount: number;

  @Column({ default: 0 })
  @Index() // Index for sorting
  likeCount: number;

  @Column({ default: true })
  @Index() // Index for filtering
  published: boolean;

  @CreateDateColumn()
  @Index() // Index for sorting
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ============================================================================
// Pagination DTOs
// ============================================================================

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum SortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  VIEW_COUNT = 'viewCount',
  LIKE_COUNT = 'likeCount',
  TITLE = 'title',
}

/**
 * Offset-based pagination DTO
 */
export class OffsetPaginationDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(SortField)
  @IsOptional()
  sortBy?: SortField = SortField.CREATED_AT;

  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  authorId?: string;
}

/**
 * Cursor-based pagination DTO
 */
export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  cursor?: string; // Base64 encoded cursor

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(SortField)
  @IsOptional()
  sortBy?: SortField = SortField.CREATED_AT;

  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsString()
  @IsOptional()
  categoryId?: string;
}

/**
 * Keyset pagination DTO
 */
export class KeysetPaginationDto {
  @IsString()
  @IsOptional()
  afterId?: string;

  @IsString()
  @IsOptional()
  beforeId?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}

// ============================================================================
// Pagination Response Interfaces
// ============================================================================

export interface OffsetPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OffsetPaginationResponse<T> {
  data: T[];
  meta: OffsetPaginationMeta;
  links?: {
    first?: string;
    previous?: string;
    next?: string;
    last?: string;
  };
}

export interface CursorPaginationMeta {
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: string;
  previousCursor?: string;
}

export interface CursorPaginationResponse<T> {
  data: T[];
  meta: CursorPaginationMeta;
  links?: {
    next?: string;
    previous?: string;
  };
}

// ============================================================================
// Cursor Utility
// ============================================================================

export class CursorUtil {
  /**
   * Encode cursor from date and id
   */
  static encode(date: Date, id: string): string {
    const cursor = JSON.stringify({
      date: date.toISOString(),
      id,
    });
    return Buffer.from(cursor).toString('base64');
  }

  /**
   * Decode cursor to date and id
   */
  static decode(cursor: string): { date: Date; id: string } {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      return {
        date: new Date(parsed.date),
        id: parsed.id,
      };
    } catch (error) {
      throw new BadRequestException('Invalid cursor');
    }
  }
}

// ============================================================================
// Pagination Service
// ============================================================================

@Injectable()
export class PaginationService {
  private readonly logger = new Logger(PaginationService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /**
   * Offset-based pagination (traditional page/limit)
   * Best for: Small to medium datasets, UI with page numbers
   * Cons: Performance degrades with large offsets, inconsistent with real-time updates
   */
  async offsetPagination(
    dto: OffsetPaginationDto,
  ): Promise<OffsetPaginationResponse<Post>> {
    const { page, limit, search, sortBy, sortOrder, categoryId, authorId } = dto;

    this.logger.log(`Offset pagination: page=${page}, limit=${limit}`);

    const queryBuilder = this.postRepository.createQueryBuilder('post');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(post.title LIKE :search OR post.content LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId });
    }

    if (authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId });
    }

    queryBuilder.andWhere('post.published = :published', { published: true });

    // Apply sorting
    queryBuilder.orderBy(`post.${sortBy}`, sortOrder);

    // Count total items
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const data = await queryBuilder.getMany();

    // Calculate metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Cursor-based pagination
   * Best for: Large datasets, infinite scroll, real-time data
   * Pros: Consistent performance, handles real-time updates well
   */
  async cursorPagination(
    dto: CursorPaginationDto,
  ): Promise<CursorPaginationResponse<Post>> {
    const { cursor, limit, search, sortBy, sortOrder, categoryId } = dto;

    this.logger.log(`Cursor pagination: cursor=${cursor}, limit=${limit}`);

    const queryBuilder = this.postRepository.createQueryBuilder('post');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(post.title LIKE :search OR post.content LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId });
    }

    queryBuilder.andWhere('post.published = :published', { published: true });

    // Apply cursor
    if (cursor) {
      const { date, id } = CursorUtil.decode(cursor);

      if (sortOrder === SortOrder.DESC) {
        queryBuilder.andWhere(
          `(post.${sortBy} < :date OR (post.${sortBy} = :date AND post.id < :id))`,
          { date, id },
        );
      } else {
        queryBuilder.andWhere(
          `(post.${sortBy} > :date OR (post.${sortBy} = :date AND post.id > :id))`,
          { date, id },
        );
      }
    }

    // Apply sorting
    queryBuilder.orderBy(`post.${sortBy}`, sortOrder);
    queryBuilder.addOrderBy('post.id', sortOrder); // Secondary sort for consistency

    // Fetch limit + 1 to check if there's a next page
    queryBuilder.take(limit + 1);

    // Execute query
    const items = await queryBuilder.getMany();

    // Check if there's a next page
    const hasNextPage = items.length > limit;
    const data = hasNextPage ? items.slice(0, -1) : items;

    // Generate cursors
    let nextCursor: string | undefined;
    let previousCursor: string | undefined;

    if (data.length > 0) {
      const lastItem = data[data.length - 1];
      const firstItem = data[0];

      if (hasNextPage) {
        nextCursor = CursorUtil.encode(
          lastItem[sortBy as keyof Post] as Date,
          lastItem.id,
        );
      }

      if (cursor) {
        previousCursor = CursorUtil.encode(
          firstItem[sortBy as keyof Post] as Date,
          firstItem.id,
        );
      }
    }

    return {
      data,
      meta: {
        limit,
        hasNextPage,
        hasPreviousPage: !!cursor,
        nextCursor,
        previousCursor,
      },
    };
  }

  /**
   * Keyset pagination (seek method)
   * Best for: Very large datasets, highest performance
   * Pros: Fastest pagination method, consistent performance
   * Cons: Can only navigate forward/backward, no random page access
   */
  async keysetPagination(
    dto: KeysetPaginationDto,
  ): Promise<CursorPaginationResponse<Post>> {
    const { afterId, beforeId, limit, sortOrder } = dto;

    this.logger.log(
      `Keyset pagination: afterId=${afterId}, beforeId=${beforeId}, limit=${limit}`,
    );

    const queryBuilder = this.postRepository.createQueryBuilder('post');

    queryBuilder.andWhere('post.published = :published', { published: true });

    // Navigate forward
    if (afterId) {
      if (sortOrder === SortOrder.DESC) {
        queryBuilder.andWhere('post.id < :afterId', { afterId });
      } else {
        queryBuilder.andWhere('post.id > :afterId', { afterId });
      }
    }

    // Navigate backward
    if (beforeId) {
      if (sortOrder === SortOrder.DESC) {
        queryBuilder.andWhere('post.id > :beforeId', { beforeId });
      } else {
        queryBuilder.andWhere('post.id < :beforeId', { beforeId });
      }
    }

    // Apply sorting
    queryBuilder.orderBy('post.id', sortOrder);

    // Fetch limit + 1 to check if there's more data
    queryBuilder.take(limit + 1);

    // Execute query
    const items = await queryBuilder.getMany();

    // Check if there's more data
    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, -1) : items;

    const hasNextPage = afterId ? hasMore : false;
    const hasPreviousPage = !!beforeId;

    return {
      data,
      meta: {
        limit,
        hasNextPage,
        hasPreviousPage,
        nextCursor: hasNextPage && data.length > 0 ? data[data.length - 1].id : undefined,
        previousCursor: hasPreviousPage && data.length > 0 ? data[0].id : undefined,
      },
    };
  }

  /**
   * Hybrid pagination - combines offset for small pages and cursor for navigation
   * Best for: Medium datasets with page numbers and infinite scroll
   */
  async hybridPagination(
    page: number = 1,
    limit: number = 10,
    cursor?: string,
  ): Promise<OffsetPaginationResponse<Post>> {
    if (cursor) {
      // Use cursor for navigation
      const cursorData = await this.cursorPagination({
        cursor,
        limit,
        sortBy: SortField.CREATED_AT,
        sortOrder: SortOrder.DESC,
      });

      // Convert to offset format
      return {
        data: cursorData.data,
        meta: {
          page,
          limit,
          total: 0, // Don't count for performance
          totalPages: 0,
          hasNextPage: cursorData.meta.hasNextPage,
          hasPreviousPage: cursorData.meta.hasPreviousPage,
        },
      };
    } else {
      // Use offset for initial page
      return this.offsetPagination({
        page,
        limit,
        sortBy: SortField.CREATED_AT,
        sortOrder: SortOrder.DESC,
      });
    }
  }

  /**
   * Optimized count query
   * For large datasets, counting can be expensive
   */
  async getApproximateCount(): Promise<number> {
    // Use database-specific approximate count for better performance
    // PostgreSQL example:
    const result = await this.postRepository.query(`
      SELECT reltuples::bigint AS estimate
      FROM pg_class
      WHERE relname = 'posts'
    `);

    return result[0]?.estimate || 0;
  }

  /**
   * Search with pagination
   */
  async searchPosts(
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<OffsetPaginationResponse<Post>> {
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .where('post.published = :published', { published: true })
      .andWhere('(post.title LIKE :query OR post.content LIKE :query)', {
        query: `%${query}%`,
      })
      .orderBy('post.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const skip = (page - 1) * limit;

    const data = await queryBuilder.skip(skip).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}

// ============================================================================
// Pagination Controller
// ============================================================================

@ApiTags('pagination')
@Controller('posts')
export class PaginationController {
  private readonly logger = new Logger(PaginationController.name);

  constructor(private readonly paginationService: PaginationService) {}

  /**
   * Offset pagination endpoint
   */
  @Get('offset')
  @ApiOperation({ summary: 'Get posts with offset pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: SortField })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  @ApiResponse({ status: 200, description: 'Posts retrieved with offset pagination' })
  async offsetPagination(
    @Query() dto: OffsetPaginationDto,
  ): Promise<OffsetPaginationResponse<Post>> {
    this.logger.log('Offset pagination endpoint called');
    return this.paginationService.offsetPagination(dto);
  }

  /**
   * Cursor pagination endpoint
   */
  @Get('cursor')
  @ApiOperation({ summary: 'Get posts with cursor pagination' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: SortField })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  @ApiResponse({ status: 200, description: 'Posts retrieved with cursor pagination' })
  async cursorPagination(
    @Query() dto: CursorPaginationDto,
  ): Promise<CursorPaginationResponse<Post>> {
    this.logger.log('Cursor pagination endpoint called');
    return this.paginationService.cursorPagination(dto);
  }

  /**
   * Keyset pagination endpoint
   */
  @Get('keyset')
  @ApiOperation({ summary: 'Get posts with keyset pagination' })
  @ApiQuery({ name: 'afterId', required: false, type: String })
  @ApiQuery({ name: 'beforeId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  @ApiResponse({ status: 200, description: 'Posts retrieved with keyset pagination' })
  async keysetPagination(
    @Query() dto: KeysetPaginationDto,
  ): Promise<CursorPaginationResponse<Post>> {
    this.logger.log('Keyset pagination endpoint called');
    return this.paginationService.keysetPagination(dto);
  }

  /**
   * Search endpoint
   */
  @Get('search')
  @ApiOperation({ summary: 'Search posts with pagination' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<OffsetPaginationResponse<Post>> {
    this.logger.log(`Search endpoint called: query=${query}`);
    return this.paginationService.searchPosts(query, page, limit);
  }
}

// ============================================================================
// Performance Tips
// ============================================================================

/**
 * PAGINATION PERFORMANCE BEST PRACTICES:
 *
 * 1. Offset Pagination (page/limit):
 *    - Pros: Simple, supports page numbers, easy to implement
 *    - Cons: Slow for large offsets (OFFSET 1000000), inconsistent with real-time data
 *    - Use when: Dataset < 10k rows, need page numbers, rarely navigate to deep pages
 *
 * 2. Cursor Pagination:
 *    - Pros: Consistent performance, works well with real-time data
 *    - Cons: Can't jump to arbitrary pages, more complex implementation
 *    - Use when: Large datasets, infinite scroll, real-time feeds
 *
 * 3. Keyset Pagination:
 *    - Pros: Fastest method, most efficient database queries
 *    - Cons: Only sequential navigation, requires unique sorted column
 *    - Use when: Very large datasets (millions of rows), performance critical
 *
 * 4. Database Optimizations:
 *    - Always index columns used in WHERE, ORDER BY
 *    - Use composite indexes for cursor pagination (e.g., [createdAt, id])
 *    - Avoid COUNT(*) on large tables - use approximate counts
 *    - Consider read replicas for heavy read workloads
 *
 * 5. Caching Strategies:
 *    - Cache first page with short TTL
 *    - Cache total count with longer TTL
 *    - Use CDN for public endpoints
 *
 * 6. API Design:
 *    - Return consistent metadata (hasNextPage, total, etc.)
 *    - Provide navigation links in response
 *    - Limit max page size to prevent abuse
 *    - Document pagination clearly
 */

export default {
  PaginationController,
  PaginationService,
  CursorUtil,
};
