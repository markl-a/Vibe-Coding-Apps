import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  isSuccessResponse,
  isErrorResponse,
  ErrorCodes,
  SuccessCodes,
  type ApiResponse,
} from '../api-response';

describe('API Response Utils', () => {
  beforeEach(() => {
    // Mock Date to ensure consistent timestamps in tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('successResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: 1, name: 'John' };
      const response = successResponse(data);

      expect(response).toEqual({
        success: true,
        code: 'SUCCESS',
        message: 'Success',
        data: { id: 1, name: 'John' },
        timestamp: '2025-12-15T10:30:00.000Z',
      });
    });

    it('should create a success response with custom message', () => {
      const data = { id: 1 };
      const response = successResponse(data, 'User created successfully');

      expect(response.message).toBe('User created successfully');
      expect(response.success).toBe(true);
    });

    it('should create a success response with custom code', () => {
      const data = { id: 1 };
      const response = successResponse(data, 'Created', SuccessCodes.CREATED);

      expect(response.code).toBe('CREATED');
      expect(response.success).toBe(true);
    });

    it('should handle null data', () => {
      const response = successResponse(null);

      expect(response.data).toBeNull();
      expect(response.success).toBe(true);
    });

    it('should handle array data', () => {
      const data = [1, 2, 3];
      const response = successResponse(data);

      expect(response.data).toEqual([1, 2, 3]);
      expect(response.success).toBe(true);
    });

    it('should include timestamp', () => {
      const response = successResponse({ id: 1 });

      expect(response.timestamp).toBe('2025-12-15T10:30:00.000Z');
    });

    it('should not include error property', () => {
      const response = successResponse({ id: 1 });

      expect(response.error).toBeUndefined();
    });
  });

  describe('errorResponse', () => {
    it('should create an error response with code and message', () => {
      const response = errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input'
      );

      expect(response).toEqual({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
        },
        timestamp: '2025-12-15T10:30:00.000Z',
      });
    });

    it('should create an error response with details', () => {
      const details = { field: 'email', issue: 'invalid format' };
      const response = errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        details
      );

      expect(response.error?.details).toEqual(details);
    });

    it('should handle custom error codes', () => {
      const response = errorResponse('CUSTOM_ERROR', 'Custom error message');

      expect(response.code).toBe('CUSTOM_ERROR');
      expect(response.error?.code).toBe('CUSTOM_ERROR');
    });

    it('should not include data property', () => {
      const response = errorResponse(ErrorCodes.NOT_FOUND, 'Not found');

      expect(response.data).toBeUndefined();
    });

    it('should include timestamp', () => {
      const response = errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error');

      expect(response.timestamp).toBe('2025-12-15T10:30:00.000Z');
    });

    it('should handle complex details object', () => {
      const details = {
        errors: [
          { field: 'email', message: 'Invalid' },
          { field: 'password', message: 'Too short' },
        ],
        requestId: '123',
      };
      const response = errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Multiple errors',
        details
      );

      expect(response.error?.details).toEqual(details);
    });

    it('should handle undefined details gracefully', () => {
      const response = errorResponse(ErrorCodes.NOT_FOUND, 'Not found');

      expect(response.error?.details).toBeUndefined();
    });
  });

  describe('paginatedResponse', () => {
    it('should create a paginated success response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        pageSize: 10,
        total: 100,
        totalPages: 10,
      };
      const response = paginatedResponse(data, pagination);

      expect(response).toEqual({
        success: true,
        code: 'SUCCESS',
        message: 'Success',
        data: {
          items: data,
          pagination,
        },
        timestamp: '2025-12-15T10:30:00.000Z',
      });
    });

    it('should accept custom message', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      };
      const response = paginatedResponse(data, pagination, 'Users retrieved');

      expect(response.message).toBe('Users retrieved');
    });

    it('should handle empty array', () => {
      const pagination = {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      };
      const response = paginatedResponse([], pagination);

      expect(response.data?.items).toEqual([]);
    });

    it('should include pagination metadata', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 2,
        pageSize: 20,
        total: 50,
        totalPages: 3,
      };
      const response = paginatedResponse(data, pagination);

      expect(response.data?.pagination).toEqual(pagination);
    });
  });

  describe('isSuccessResponse', () => {
    it('should return true for success response', () => {
      const response = successResponse({ id: 1 });

      expect(isSuccessResponse(response)).toBe(true);
    });

    it('should return false for error response', () => {
      const response = errorResponse(ErrorCodes.NOT_FOUND, 'Not found');

      expect(isSuccessResponse(response)).toBe(false);
    });

    it('should narrow type correctly', () => {
      const response = successResponse({ id: 1, name: 'John' });

      if (isSuccessResponse(response)) {
        // TypeScript should know data exists
        expect(response.data).toBeDefined();
        expect(response.data.id).toBe(1);
      }
    });
  });

  describe('isErrorResponse', () => {
    it('should return true for error response', () => {
      const response = errorResponse(ErrorCodes.NOT_FOUND, 'Not found');

      expect(isErrorResponse(response)).toBe(true);
    });

    it('should return false for success response', () => {
      const response = successResponse({ id: 1 });

      expect(isErrorResponse(response)).toBe(false);
    });

    it('should narrow type correctly', () => {
      const response = errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid',
        { field: 'email' }
      );

      if (isErrorResponse(response)) {
        // TypeScript should know error exists
        expect(response.error).toBeDefined();
        expect(response.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('ErrorCodes', () => {
    it('should have all standard client error codes', () => {
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCodes.CONFLICT).toBe('CONFLICT');
      expect(ErrorCodes.BAD_REQUEST).toBe('BAD_REQUEST');
      expect(ErrorCodes.TOO_MANY_REQUESTS).toBe('TOO_MANY_REQUESTS');
    });

    it('should have all standard server error codes', () => {
      expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCodes.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
      expect(ErrorCodes.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCodes.TIMEOUT).toBe('TIMEOUT');
    });

    it('should have business logic error codes', () => {
      expect(ErrorCodes.BUSINESS_LOGIC_ERROR).toBe('BUSINESS_LOGIC_ERROR');
      expect(ErrorCodes.RESOURCE_EXHAUSTED).toBe('RESOURCE_EXHAUSTED');
      expect(ErrorCodes.PRECONDITION_FAILED).toBe('PRECONDITION_FAILED');
    });
  });

  describe('SuccessCodes', () => {
    it('should have all standard success codes', () => {
      expect(SuccessCodes.SUCCESS).toBe('SUCCESS');
      expect(SuccessCodes.CREATED).toBe('CREATED');
      expect(SuccessCodes.UPDATED).toBe('UPDATED');
      expect(SuccessCodes.DELETED).toBe('DELETED');
      expect(SuccessCodes.ACCEPTED).toBe('ACCEPTED');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle typical success flow', () => {
      const user = { id: 1, name: 'John', email: 'john@example.com' };
      const response = successResponse(user, 'User created', SuccessCodes.CREATED);

      expect(isSuccessResponse(response)).toBe(true);
      expect(response.code).toBe('CREATED');
      if (isSuccessResponse(response)) {
        expect(response.data.email).toBe('john@example.com');
      }
    });

    it('should handle typical error flow', () => {
      const response = errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Email is required',
        { field: 'email', constraint: 'required' }
      );

      expect(isErrorResponse(response)).toBe(true);
      if (isErrorResponse(response)) {
        expect(response.error.details).toEqual({
          field: 'email',
          constraint: 'required',
        });
      }
    });

    it('should handle paginated list flow', () => {
      const users = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ];
      const response = paginatedResponse(
        users,
        { page: 1, pageSize: 2, total: 10, totalPages: 5 },
        'Users retrieved'
      );

      expect(isSuccessResponse(response)).toBe(true);
      if (isSuccessResponse(response)) {
        expect(response.data.items).toHaveLength(2);
        expect(response.data.pagination.totalPages).toBe(5);
      }
    });
  });
});
