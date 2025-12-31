/**
 * 共享 TypeScript 類型定義
 */

// =============================================================================
// API 響應類型
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export interface ResponseMeta {
  requestId?: string;
  duration?: number;
}

// =============================================================================
// 分頁類型
// =============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  skip?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =============================================================================
// 用戶相關類型
// =============================================================================

export interface BaseUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'user' | 'guest' | 'moderator';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// =============================================================================
// 請求相關類型
// =============================================================================

export interface AuthenticatedRequest<TBody = unknown, TParams = unknown, TQuery = unknown> {
  user?: BaseUser;
  body: TBody;
  params: TParams;
  query: TQuery;
  pagination?: PaginationParams;
}

// =============================================================================
// 排序和篩選類型
// =============================================================================

export type SortOrder = 'asc' | 'desc';

export interface SortParams<T extends string = string> {
  field: T;
  order: SortOrder;
}

export interface FilterParams {
  [key: string]: string | number | boolean | string[] | undefined;
}

// =============================================================================
// 通用實體類型
// =============================================================================

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletableEntity extends BaseEntity {
  deletedAt?: Date;
  isDeleted: boolean;
}

export interface AuditableEntity extends BaseEntity {
  createdBy?: string;
  updatedBy?: string;
}

// =============================================================================
// 事件類型
// =============================================================================

export interface DomainEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
  correlationId?: string;
}

// =============================================================================
// 配置類型
// =============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface AppConfig {
  env: 'development' | 'test' | 'staging' | 'production';
  port: number;
  name: string;
  version: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
