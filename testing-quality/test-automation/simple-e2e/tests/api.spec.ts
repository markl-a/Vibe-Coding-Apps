import { test, expect } from '@playwright/test';
import { ApiClient } from '../src/utils/api-client.js';

/**
 * API Tests
 *
 * These tests demonstrate:
 * - Direct API testing with Playwright
 * - API client usage
 * - Request/response validation
 */

test.describe('API Tests', () => {
  let apiClient: ApiClient;

  test.beforeEach(async ({ request }) => {
    apiClient = new ApiClient(
      request,
      process.env.API_URL || 'https://jsonplaceholder.typicode.com'
    );
  });

  test('should fetch users list', async () => {
    const response = await apiClient.get<Array<{ id: number; name: string }>>('/users');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
  });

  test('should fetch single user', async () => {
    const response = await apiClient.get<{ id: number; name: string; email: string }>(
      '/users/1'
    );

    expect(response.status).toBe(200);
    expect(response.data.id).toBe(1);
    expect(response.data.name).toBeTruthy();
    expect(response.data.email).toBeTruthy();
  });

  test('should create new post', async () => {
    const newPost = {
      title: 'Test Post',
      body: 'This is a test post body',
      userId: 1,
    };

    const response = await apiClient.post<{ id: number; title: string }>('/posts', newPost);

    expect(response.status).toBe(201);
    expect(response.data.title).toBe(newPost.title);
  });

  test('should update existing post', async () => {
    const updateData = {
      id: 1,
      title: 'Updated Title',
      body: 'Updated body',
      userId: 1,
    };

    const response = await apiClient.put<{ id: number; title: string }>(
      '/posts/1',
      updateData
    );

    expect(response.status).toBe(200);
    expect(response.data.title).toBe(updateData.title);
  });

  test('should delete post', async () => {
    const response = await apiClient.delete('/posts/1');

    expect(response.status).toBe(200);
  });

  test('should handle 404 error', async () => {
    const response = await apiClient.get('/users/9999');

    expect(response.status).toBe(404);
  });

  test('should fetch with query parameters', async () => {
    const response = await apiClient.get<Array<{ id: number }>>('/posts', {
      params: { userId: '1' },
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });
});

test.describe('API Integration Tests', () => {
  test('should create and verify resource', async ({ request }) => {
    const apiClient = new ApiClient(
      request,
      'https://jsonplaceholder.typicode.com'
    );

    // Create
    const createResponse = await apiClient.post<{ id: number; title: string }>('/posts', {
      title: 'Integration Test Post',
      body: 'Testing create and verify flow',
      userId: 1,
    });

    expect(createResponse.status).toBe(201);
    const createdId = createResponse.data.id;

    // Note: JSONPlaceholder doesn't actually persist data,
    // but in real tests you would verify the created resource
    expect(createdId).toBeTruthy();
  });
});
