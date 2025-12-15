/**
 * API Response Format Utilities
 * Standardized response format for API endpoints
 */

/**
 * Standard API response structure
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response code (for success, typically 'SUCCESS') */
  code: string;
  /** Human-readable message */
  message: string;
  /** Response data (only present on success) */
  data?: T;
  /** Error details (only present on failure) */
  error?: {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Additional error details */
    details?: unknown;
  };
  /** ISO 8601 timestamp */
  timestamp: string;
}

/**
 * Standard error codes used across the application
 */
export const ErrorCodes = {
  // Client errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  BAD_REQUEST: 'BAD_REQUEST',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Business logic errors
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  RESOURCE_EXHAUSTED: 'RESOURCE_EXHAUSTED',
  PRECONDITION_FAILED: 'PRECONDITION_FAILED',
} as const;

/**
 * Type for error code values
 */
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Success response codes
 */
export const SuccessCodes = {
  SUCCESS: 'SUCCESS',
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  DELETED: 'DELETED',
  ACCEPTED: 'ACCEPTED',
} as const;

/**
 * Type for success code values
 */
export type SuccessCode = typeof SuccessCodes[keyof typeof SuccessCodes];

/**
 * Creates a successful API response
 *
 * @param data - The data to return
 * @param message - Optional success message
 * @param code - Optional success code (defaults to 'SUCCESS')
 * @returns Formatted success response
 *
 * @example
 * ```typescript
 * const response = successResponse({ id: 1, name: 'John' }, 'User created');
 * // {
 * //   success: true,
 * //   code: 'SUCCESS',
 * //   message: 'User created',
 * //   data: { id: 1, name: 'John' },
 * //   timestamp: '2025-12-15T10:30:00.000Z'
 * // }
 * ```
 */
export function successResponse<T>(
  data: T,
  message: string = 'Success',
  code: SuccessCode | string = SuccessCodes.SUCCESS
): ApiResponse<T> {
  return {
    success: true,
    code,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an error API response
 *
 * @param code - Error code
 * @param message - Error message
 * @param details - Optional additional error details
 * @returns Formatted error response
 *
 * @example
 * ```typescript
 * const response = errorResponse(
 *   ErrorCodes.VALIDATION_ERROR,
 *   'Invalid input',
 *   { field: 'email', issue: 'invalid format' }
 * );
 * // {
 * //   success: false,
 * //   code: 'VALIDATION_ERROR',
 * //   message: 'Invalid input',
 * //   error: {
 * //     code: 'VALIDATION_ERROR',
 * //     message: 'Invalid input',
 * //     details: { field: 'email', issue: 'invalid format' }
 * //   },
 * //   timestamp: '2025-12-15T10:30:00.000Z'
 * // }
 * ```
 */
export function errorResponse(
  code: ErrorCode | string,
  message: string,
  details?: unknown
): ApiResponse<never> {
  return {
    success: false,
    code,
    message,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a paginated success response
 *
 * @param data - Array of items
 * @param pagination - Pagination metadata
 * @param message - Optional success message
 * @returns Formatted success response with pagination
 *
 * @example
 * ```typescript
 * const response = paginatedResponse(
 *   [{ id: 1 }, { id: 2 }],
 *   { page: 1, pageSize: 10, total: 100, totalPages: 10 }
 * );
 * ```
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  },
  message: string = 'Success'
): ApiResponse<{ items: T[]; pagination: typeof pagination }> {
  return successResponse(
    {
      items: data,
      pagination,
    },
    message
  );
}

/**
 * Type guard to check if response is successful
 *
 * @param response - API response to check
 * @returns True if response is successful
 *
 * @example
 * ```typescript
 * const response = successResponse({ id: 1 });
 * if (isSuccessResponse(response)) {
 *   console.log(response.data); // TypeScript knows data exists
 * }
 * ```
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 *
 * @param response - API response to check
 * @returns True if response is an error
 *
 * @example
 * ```typescript
 * const response = errorResponse('ERROR', 'Something went wrong');
 * if (isErrorResponse(response)) {
 *   console.log(response.error); // TypeScript knows error exists
 * }
 * ```
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: false; error: NonNullable<ApiResponse<T>['error']> } {
  return response.success === false;
}
