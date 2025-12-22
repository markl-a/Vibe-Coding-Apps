/**
 * Shared Utilities Package
 * Common utility functions used across Vibe-Coding-Apps
 */

// Basic utilities
export * from './string';
export * from './array';
export * from './object';
export * from './date';
export * from './async';

// API Response utilities
export type { ApiResponse, ErrorCode, SuccessCode } from './api-response';
export {
  ErrorCodes,
  SuccessCodes,
  successResponse,
  errorResponse,
  paginatedResponse,
  isSuccessResponse,
  isErrorResponse,
} from './api-response';

// Error handling - use ./errors which is the comprehensive version
export * from './errors';

// Logger - use ./logger which is the main version
export { Logger, LogLevel, createLogger } from './logger';
export type { LogContext, LogEntry } from './logger';

// Advanced logging modules (HTTP middleware)
export * from './logging';
export * from './middleware';
export * from './health';
export * from './database';
export * from './types';
export * from './rateLimit';
export * from './security';
export * from './react';
export * from './cache';
export * from './monitoring';
export * from './docs';

// Validation - comprehensive validation and sanitization utilities
export * from './validation';
