/**
 * API Helpers Examples
 * Demonstrates API response handling, error formatting, and retry logic
 */

import {
  successResponse,
  errorResponse,
  paginatedResponse,
  isSuccessResponse,
  isErrorResponse,
  ErrorCodes,
  SuccessCodes,
  type ApiResponse,
} from '@vibe/shared-utils';
import { retry, timeout } from '@vibe/shared-utils';

// =============================================================================
// Example 1: Basic API Response Handling
// =============================================================================

/**
 * Example: Creating success responses
 */
export function createSuccessResponseExample() {
  // Simple success response
  const userResponse = successResponse(
    { id: '123', name: 'John Doe', email: 'john@example.com' },
    'User retrieved successfully'
  );

  console.log('Success Response:', userResponse);
  // Output:
  // {
  //   success: true,
  //   code: 'SUCCESS',
  //   message: 'User retrieved successfully',
  //   data: { id: '123', name: 'John Doe', email: 'john@example.com' },
  //   timestamp: '2024-03-15T10:30:00.000Z'
  // }

  // Created response with custom code
  const createdResponse = successResponse(
    { id: '456', name: 'New User' },
    'User created successfully',
    SuccessCodes.CREATED
  );

  console.log('Created Response:', createdResponse);

  return { userResponse, createdResponse };
}

/**
 * Example: Creating error responses
 */
export function createErrorResponseExample() {
  // Validation error
  const validationError = errorResponse(
    ErrorCodes.VALIDATION_ERROR,
    'Invalid input data',
    {
      fields: {
        email: 'Invalid email format',
        password: 'Password too short',
      },
    }
  );

  console.log('Validation Error:', validationError);
  // Output:
  // {
  //   success: false,
  //   code: 'VALIDATION_ERROR',
  //   message: 'Invalid input data',
  //   error: {
  //     code: 'VALIDATION_ERROR',
  //     message: 'Invalid input data',
  //     details: {
  //       fields: {
  //         email: 'Invalid email format',
  //         password: 'Password too short'
  //       }
  //     }
  //   },
  //   timestamp: '2024-03-15T10:30:00.000Z'
  // }

  // Not found error
  const notFoundError = errorResponse(
    ErrorCodes.NOT_FOUND,
    'User not found',
    { userId: '999' }
  );

  // Unauthorized error
  const unauthorizedError = errorResponse(
    ErrorCodes.UNAUTHORIZED,
    'Authentication required'
  );

  return { validationError, notFoundError, unauthorizedError };
}

/**
 * Example: Paginated responses
 */
export function createPaginatedResponseExample() {
  const users = [
    { id: '1', name: 'User 1', email: 'user1@example.com' },
    { id: '2', name: 'User 2', email: 'user2@example.com' },
    { id: '3', name: 'User 3', email: 'user3@example.com' },
  ];

  const paginatedUsers = paginatedResponse(
    users,
    {
      page: 1,
      pageSize: 10,
      total: 100,
      totalPages: 10,
    },
    'Users retrieved successfully'
  );

  console.log('Paginated Response:', paginatedUsers);
  // Output:
  // {
  //   success: true,
  //   code: 'SUCCESS',
  //   message: 'Users retrieved successfully',
  //   data: {
  //     items: [...],
  //     pagination: {
  //       page: 1,
  //       pageSize: 10,
  //       total: 100,
  //       totalPages: 10
  //     }
  //   },
  //   timestamp: '2024-03-15T10:30:00.000Z'
  // }

  return paginatedUsers;
}

// =============================================================================
// Example 2: Type Guards for Response Handling
// =============================================================================

/**
 * Example: Using type guards to handle responses
 */
export async function handleApiResponse<T>(
  response: ApiResponse<T>
): Promise<T> {
  if (isSuccessResponse(response)) {
    // TypeScript knows response.data exists here
    console.log('Success! Data:', response.data);
    return response.data;
  }

  if (isErrorResponse(response)) {
    // TypeScript knows response.error exists here
    console.error('Error:', response.error.message);
    throw new Error(response.error.message);
  }

  throw new Error('Invalid response format');
}

/**
 * Example: Pattern matching with response types
 */
export function processUserResponse(response: ApiResponse<{ id: string; name: string }>) {
  if (isSuccessResponse(response)) {
    const user = response.data;
    console.log(`Welcome, ${user.name}!`);
    return user;
  }

  if (isErrorResponse(response)) {
    switch (response.error.code) {
      case ErrorCodes.NOT_FOUND:
        console.error('User not found');
        break;
      case ErrorCodes.UNAUTHORIZED:
        console.error('Please log in');
        break;
      case ErrorCodes.VALIDATION_ERROR:
        console.error('Invalid data:', response.error.details);
        break;
      default:
        console.error('An error occurred:', response.error.message);
    }
    return null;
  }

  return null;
}

// =============================================================================
// Example 3: Retry Logic with Exponential Backoff
// =============================================================================

/**
 * Example: Retry failed API calls
 */
export async function retryApiCallExample() {
  let attemptCount = 0;

  const fetchUser = async () => {
    attemptCount++;
    console.log(`Attempt ${attemptCount}...`);

    // Simulate API call that fails first 2 times
    if (attemptCount < 3) {
      throw new Error('Network error');
    }

    return { id: '123', name: 'John Doe' };
  };

  try {
    const user = await retry(fetchUser, {
      retries: 3,
      delay: 1000, // Start with 1 second delay
      backoff: 2, // Double the delay each time
    });

    console.log('Success after retries:', user);
    return successResponse(user, 'User fetched successfully after retries');
  } catch (error) {
    console.error('Failed after all retries:', error);
    return errorResponse(
      ErrorCodes.SERVICE_UNAVAILABLE,
      'Service temporarily unavailable',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Example: Retry with custom retry logic
 */
export async function retryWithCustomLogic<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error, attempt: number) => boolean,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxRetries || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      console.log(`Retry attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

/**
 * Example: Using retry with custom logic
 */
export async function fetchWithRetryExample() {
  const shouldRetry = (error: Error, attempt: number) => {
    // Only retry on network errors, not on 4xx errors
    const isNetworkError = error.message.includes('network') || error.message.includes('timeout');
    const canRetry = attempt < 3;

    console.log(`Retry decision: network error=${isNetworkError}, can retry=${canRetry}`);
    return isNetworkError && canRetry;
  };

  try {
    const data = await retryWithCustomLogic(
      async () => {
        // Simulate API call
        const random = Math.random();
        if (random < 0.7) {
          throw new Error('network timeout');
        }
        return { data: 'Success!' };
      },
      shouldRetry,
      3,
      1000
    );

    return successResponse(data, 'Data fetched successfully');
  } catch (error) {
    return errorResponse(
      ErrorCodes.TIMEOUT,
      'Request timed out after multiple retries',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

// =============================================================================
// Example 4: Timeout Handling
// =============================================================================

/**
 * Example: Add timeout to API calls
 */
export async function fetchWithTimeout<T>(
  fetchFn: () => Promise<T>,
  timeoutMs: number = 5000
): Promise<ApiResponse<T>> {
  try {
    const result = await timeout(fetchFn(), timeoutMs);
    return successResponse(result, 'Request completed successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'Timeout') {
      return errorResponse(
        ErrorCodes.TIMEOUT,
        `Request timed out after ${timeoutMs}ms`,
        { timeout: timeoutMs }
      );
    }

    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Request failed',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Example: Using timeout with retry
 */
export async function fetchWithTimeoutAndRetry() {
  const fetchData = async () => {
    // Simulate slow API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    return { data: 'Loaded!' };
  };

  try {
    // Retry up to 3 times, with 2 second timeout for each attempt
    const result = await retry(
      () => timeout(fetchData(), 2000),
      {
        retries: 3,
        delay: 500,
        backoff: 2,
      }
    );

    return successResponse(result, 'Data loaded successfully');
  } catch (error) {
    return errorResponse(
      ErrorCodes.TIMEOUT,
      'Failed to load data within timeout period',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

// =============================================================================
// Example 5: Real-World API Client
// =============================================================================

interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/**
 * Example: Complete API client with error handling and retries
 */
export class ApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 5000,
      retries: 3,
      headers: {},
      ...config,
    };
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;

    try {
      const result = await retry(
        async () => {
          const response = await timeout(
            fetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json',
                ...this.config.headers,
              },
              body: data ? JSON.stringify(data) : undefined,
            }),
            this.config.timeout
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
          }

          const responseData = await response.json();
          return responseData as T;
        },
        {
          retries: this.config.retries,
          delay: 1000,
          backoff: 2,
        }
      );

      return successResponse(result, 'Request successful');
    } catch (error) {
      if (error instanceof Error && error.message === 'Timeout') {
        return errorResponse(
          ErrorCodes.TIMEOUT,
          `Request timed out after ${this.config.timeout}ms`
        );
      }

      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Request failed',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
}

/**
 * Example: Using the API client
 */
export async function useApiClientExample() {
  const client = new ApiClient({
    baseURL: 'https://api.example.com',
    timeout: 10000,
    retries: 3,
    headers: {
      'Authorization': 'Bearer token123',
    },
  });

  // GET request
  const userResponse = await client.get<{ id: string; name: string }>('/users/123');
  if (isSuccessResponse(userResponse)) {
    console.log('User:', userResponse.data);
  }

  // POST request
  const createResponse = await client.post<{ id: string }>('/users', {
    name: 'John Doe',
    email: 'john@example.com',
  });
  if (isSuccessResponse(createResponse)) {
    console.log('Created user ID:', createResponse.data.id);
  }

  // Handle errors
  if (isErrorResponse(createResponse)) {
    console.error('Error:', createResponse.error.message);

    // Handle specific error codes
    switch (createResponse.error.code) {
      case ErrorCodes.VALIDATION_ERROR:
        console.error('Validation failed:', createResponse.error.details);
        break;
      case ErrorCodes.TIMEOUT:
        console.error('Request timed out, please try again');
        break;
      case ErrorCodes.UNAUTHORIZED:
        console.error('Please log in again');
        break;
      default:
        console.error('An unexpected error occurred');
    }
  }

  return { userResponse, createResponse };
}

// =============================================================================
// Example 6: Error Formatting Helpers
// =============================================================================

/**
 * Format error for user display
 */
export function formatErrorForUser(response: ApiResponse<unknown>): string {
  if (!isErrorResponse(response)) {
    return 'An unknown error occurred';
  }

  const errorMessages: Record<string, string> = {
    [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again',
    [ErrorCodes.UNAUTHORIZED]: 'You need to log in to continue',
    [ErrorCodes.FORBIDDEN]: 'You don\'t have permission to do that',
    [ErrorCodes.NOT_FOUND]: 'The requested resource was not found',
    [ErrorCodes.TIMEOUT]: 'The request took too long. Please try again',
    [ErrorCodes.TOO_MANY_REQUESTS]: 'Too many requests. Please wait a moment',
    [ErrorCodes.INTERNAL_ERROR]: 'Something went wrong on our end',
    [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable',
  };

  return errorMessages[response.error.code] || response.error.message;
}

/**
 * Extract validation errors from response
 */
export function extractValidationErrors(
  response: ApiResponse<unknown>
): Record<string, string> | null {
  if (!isErrorResponse(response)) {
    return null;
  }

  if (response.error.code !== ErrorCodes.VALIDATION_ERROR) {
    return null;
  }

  const details = response.error.details as { fields?: Record<string, string> } | undefined;
  return details?.fields || null;
}

/**
 * Example: Using error formatting
 */
export function handleFormSubmitError(response: ApiResponse<unknown>) {
  if (isSuccessResponse(response)) {
    console.log('Form submitted successfully!');
    return;
  }

  // Show general error message to user
  const userMessage = formatErrorForUser(response);
  console.log('User-friendly error:', userMessage);

  // Extract field-specific validation errors
  const validationErrors = extractValidationErrors(response);
  if (validationErrors) {
    console.log('Field errors:', validationErrors);
    // Display field errors in form
    Object.entries(validationErrors).forEach(([field, error]) => {
      console.log(`  ${field}: ${error}`);
    });
  }
}
