import { APIRequestContext, expect } from '@playwright/test';

/**
 * API Test Client
 *
 * Provides utilities for API testing alongside E2E tests.
 * Useful for:
 * - Setting up test data
 * - Verifying backend state
 * - Testing API directly
 */

export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

export class ApiClient {
  private request: APIRequestContext;
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(
    request: APIRequestContext,
    baseUrl: string,
    headers: Record<string, string> = {}
  ) {
    this.request = request;
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
  }

  /**
   * Set authorization token
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Make GET request
   */
  async get<T = unknown>(
    path: string,
    options?: { headers?: Record<string, string>; params?: Record<string, string> }
  ): Promise<ApiResponse<T>> {
    const url = new URL(path, this.baseUrl);

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await this.request.get(url.toString(), {
      headers: { ...this.defaultHeaders, ...options?.headers },
    });

    return {
      status: response.status(),
      data: await response.json(),
      headers: response.headers(),
    };
  }

  /**
   * Make POST request
   */
  async post<T = unknown>(
    path: string,
    body: unknown,
    options?: { headers?: Record<string, string> }
  ): Promise<ApiResponse<T>> {
    const response = await this.request.post(`${this.baseUrl}${path}`, {
      headers: { ...this.defaultHeaders, ...options?.headers },
      data: body,
    });

    return {
      status: response.status(),
      data: await response.json(),
      headers: response.headers(),
    };
  }

  /**
   * Make PUT request
   */
  async put<T = unknown>(
    path: string,
    body: unknown,
    options?: { headers?: Record<string, string> }
  ): Promise<ApiResponse<T>> {
    const response = await this.request.put(`${this.baseUrl}${path}`, {
      headers: { ...this.defaultHeaders, ...options?.headers },
      data: body,
    });

    return {
      status: response.status(),
      data: await response.json(),
      headers: response.headers(),
    };
  }

  /**
   * Make DELETE request
   */
  async delete<T = unknown>(
    path: string,
    options?: { headers?: Record<string, string> }
  ): Promise<ApiResponse<T>> {
    const response = await this.request.delete(`${this.baseUrl}${path}`, {
      headers: { ...this.defaultHeaders, ...options?.headers },
    });

    return {
      status: response.status(),
      data: response.status() !== 204 ? await response.json() : null,
      headers: response.headers(),
    };
  }

  /**
   * Assert response status
   */
  static assertStatus(response: ApiResponse, expectedStatus: number): void {
    expect(response.status).toBe(expectedStatus);
  }

  /**
   * Assert response contains data
   */
  static assertHasData<T>(response: ApiResponse<T>, key: keyof T): void {
    expect(response.data).toHaveProperty(key as string);
  }
}

/**
 * Create authenticated API client
 */
export async function createAuthenticatedClient(
  request: APIRequestContext,
  baseUrl: string,
  credentials: { email: string; password: string }
): Promise<ApiClient> {
  const client = new ApiClient(request, baseUrl);

  // Login to get token
  const response = await client.post<{ token: string }>('/api/auth/login', credentials);

  if (response.status === 200 && response.data.token) {
    client.setAuthToken(response.data.token);
  }

  return client;
}
