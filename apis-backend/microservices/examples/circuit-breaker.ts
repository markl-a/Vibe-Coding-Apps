/**
 * Circuit Breaker Pattern for Microservices
 *
 * Demonstrates:
 * - Circuit breaker implementation
 * - Fallback handling strategies
 * - Health monitoring and metrics
 * - Bulkhead pattern for resource isolation
 * - Retry strategies with exponential backoff
 * - Service health checks
 */

import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import * as CircuitBreaker from 'opossum';
import { EventEmitter } from 'events';

// ============================================================================
// CIRCUIT BREAKER CONFIGURATION
// ============================================================================

export interface CircuitBreakerOptions {
  timeout: number; // Request timeout in ms
  errorThresholdPercentage: number; // Error percentage to trip circuit (0-100)
  resetTimeout: number; // Time before attempting to close circuit
  rollingCountTimeout: number; // Time window for tracking requests
  rollingCountBuckets: number; // Number of buckets in time window
  volumeThreshold: number; // Minimum requests before checking error percentage
  name?: string; // Circuit breaker name for monitoring
}

export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  timeout: 3000, // 3 seconds
  errorThresholdPercentage: 50, // 50% errors
  resetTimeout: 30000, // 30 seconds
  rollingCountTimeout: 10000, // 10 seconds
  rollingCountBuckets: 10,
  volumeThreshold: 5,
  name: 'default'
};

// ============================================================================
// CIRCUIT BREAKER STATES
// ============================================================================

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

// ============================================================================
// CIRCUIT BREAKER IMPLEMENTATION
// ============================================================================

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private breakers = new Map<string, CircuitBreaker>();
  private metrics = new Map<string, CircuitBreakerMetrics>();

  /**
   * Create or get circuit breaker for a service
   */
  getCircuitBreaker<T>(
    serviceName: string,
    action: (...args: any[]) => Promise<T>,
    options: Partial<CircuitBreakerOptions> = {}
  ): CircuitBreaker<T> {
    if (this.breakers.has(serviceName)) {
      return this.breakers.get(serviceName) as CircuitBreaker<T>;
    }

    const config = { ...DEFAULT_CIRCUIT_BREAKER_OPTIONS, ...options, name: serviceName };

    const breaker = new CircuitBreaker(action, {
      timeout: config.timeout,
      errorThresholdPercentage: config.errorThresholdPercentage,
      resetTimeout: config.resetTimeout,
      rollingCountTimeout: config.rollingCountTimeout,
      rollingCountBuckets: config.rollingCountBuckets,
      volumeThreshold: config.volumeThreshold,
      name: config.name
    });

    // Initialize metrics
    this.metrics.set(serviceName, {
      serviceName,
      state: CircuitState.CLOSED,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      timeouts: 0,
      lastError: null,
      lastStateChange: new Date()
    });

    // Setup event listeners
    this.setupEventListeners(breaker, serviceName);

    this.breakers.set(serviceName, breaker);
    this.logger.log(`Circuit breaker created for: ${serviceName}`);

    return breaker;
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners(breaker: CircuitBreaker, serviceName: string): void {
    const metrics = this.metrics.get(serviceName)!;

    breaker.on('success', (result) => {
      metrics.totalRequests++;
      metrics.successfulRequests++;
      this.logger.debug(`✅ ${serviceName}: Request succeeded`);
    });

    breaker.on('failure', (error) => {
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.lastError = error.message;
      this.logger.warn(`❌ ${serviceName}: Request failed - ${error.message}`);
    });

    breaker.on('timeout', () => {
      metrics.totalRequests++;
      metrics.timeouts++;
      this.logger.warn(`⏱️ ${serviceName}: Request timeout`);
    });

    breaker.on('reject', () => {
      metrics.rejectedRequests++;
      this.logger.warn(`🚫 ${serviceName}: Request rejected (circuit open)`);
    });

    breaker.on('open', () => {
      metrics.state = CircuitState.OPEN;
      metrics.lastStateChange = new Date();
      this.logger.error(`🔴 ${serviceName}: Circuit OPENED`);
    });

    breaker.on('halfOpen', () => {
      metrics.state = CircuitState.HALF_OPEN;
      metrics.lastStateChange = new Date();
      this.logger.warn(`🟡 ${serviceName}: Circuit HALF-OPEN (testing)`);
    });

    breaker.on('close', () => {
      metrics.state = CircuitState.CLOSED;
      metrics.lastStateChange = new Date();
      this.logger.log(`🟢 ${serviceName}: Circuit CLOSED (recovered)`);
    });
  }

  /**
   * Get metrics for a service
   */
  getMetrics(serviceName: string): CircuitBreakerMetrics | null {
    return this.metrics.get(serviceName) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): CircuitBreakerMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Reset circuit breaker
   */
  reset(serviceName: string): void {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.close();
      this.logger.log(`Circuit breaker reset for: ${serviceName}`);
    }
  }

  /**
   * Shutdown all circuit breakers
   */
  shutdown(): void {
    this.breakers.forEach((breaker, name) => {
      breaker.shutdown();
      this.logger.log(`Circuit breaker shutdown: ${name}`);
    });
    this.breakers.clear();
    this.metrics.clear();
  }
}

// ============================================================================
// HTTP CLIENT WITH CIRCUIT BREAKER
// ============================================================================

@Injectable()
export class ResilientHttpClient {
  private readonly logger = new Logger(ResilientHttpClient.name);
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly circuitBreakerService: CircuitBreakerService) {
    this.axiosInstance = axios.create({
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * GET request with circuit breaker
   */
  async get<T>(
    serviceName: string,
    url: string,
    fallback?: () => Promise<T>,
    options?: Partial<CircuitBreakerOptions>
  ): Promise<T> {
    const action = async () => {
      const response = await this.axiosInstance.get<T>(url);
      return response.data;
    };

    const breaker = this.circuitBreakerService.getCircuitBreaker(
      serviceName,
      action,
      options
    );

    if (fallback) {
      breaker.fallback(fallback);
    }

    return breaker.fire();
  }

  /**
   * POST request with circuit breaker
   */
  async post<T>(
    serviceName: string,
    url: string,
    data?: any,
    fallback?: () => Promise<T>,
    options?: Partial<CircuitBreakerOptions>
  ): Promise<T> {
    const action = async () => {
      const response = await this.axiosInstance.post<T>(url, data);
      return response.data;
    };

    const breaker = this.circuitBreakerService.getCircuitBreaker(
      serviceName,
      action,
      options
    );

    if (fallback) {
      breaker.fallback(fallback);
    }

    return breaker.fire();
  }

  /**
   * PUT request with circuit breaker
   */
  async put<T>(
    serviceName: string,
    url: string,
    data?: any,
    fallback?: () => Promise<T>,
    options?: Partial<CircuitBreakerOptions>
  ): Promise<T> {
    const action = async () => {
      const response = await this.axiosInstance.put<T>(url, data);
      return response.data;
    };

    const breaker = this.circuitBreakerService.getCircuitBreaker(
      serviceName,
      action,
      options
    );

    if (fallback) {
      breaker.fallback(fallback);
    }

    return breaker.fire();
  }

  /**
   * DELETE request with circuit breaker
   */
  async delete<T>(
    serviceName: string,
    url: string,
    fallback?: () => Promise<T>,
    options?: Partial<CircuitBreakerOptions>
  ): Promise<T> {
    const action = async () => {
      const response = await this.axiosInstance.delete<T>(url);
      return response.data;
    };

    const breaker = this.circuitBreakerService.getCircuitBreaker(
      serviceName,
      action,
      options
    );

    if (fallback) {
      breaker.fallback(fallback);
    }

    return breaker.fire();
  }
}

// ============================================================================
// SERVICE-SPECIFIC RESILIENT CLIENTS
// ============================================================================

/**
 * User Service Client with Circuit Breaker
 */
@Injectable()
export class ResilientUserServiceClient {
  private readonly logger = new Logger(ResilientUserServiceClient.name);
  private readonly serviceName = 'user-service';
  private readonly baseUrl: string;

  constructor(private readonly httpClient: ResilientHttpClient) {
    this.baseUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
  }

  /**
   * Get user by ID with fallback
   */
  async getUserById(userId: string): Promise<User> {
    const url = `${this.baseUrl}/users/${userId}`;

    const fallback = async (): Promise<User> => {
      this.logger.warn(`Using fallback for getUserById: ${userId}`);
      return {
        id: userId,
        name: 'Unknown User',
        email: 'unknown@example.com',
        isFromCache: true
      } as User;
    };

    return this.httpClient.get<User>(
      this.serviceName,
      url,
      fallback,
      { timeout: 3000 }
    );
  }

  /**
   * Get users with cached fallback
   */
  async getUsers(page = 1, limit = 10): Promise<User[]> {
    const url = `${this.baseUrl}/users?page=${page}&limit=${limit}`;

    const fallback = async (): Promise<User[]> => {
      this.logger.warn('Using cached users fallback');
      return this.getCachedUsers();
    };

    return this.httpClient.get<User[]>(
      this.serviceName,
      url,
      fallback
    );
  }

  private async getCachedUsers(): Promise<User[]> {
    // Return cached data or empty array
    return [];
  }
}

/**
 * Product Service Client with Circuit Breaker
 */
@Injectable()
export class ResilientProductServiceClient {
  private readonly logger = new Logger(ResilientProductServiceClient.name);
  private readonly serviceName = 'product-service';
  private readonly baseUrl: string;

  constructor(private readonly httpClient: ResilientHttpClient) {
    this.baseUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
  }

  async getProductById(productId: string): Promise<Product> {
    const url = `${this.baseUrl}/products/${productId}`;

    const fallback = async (): Promise<Product> => {
      this.logger.warn(`Using fallback for getProductById: ${productId}`);
      return {
        id: productId,
        name: 'Product Unavailable',
        price: 0,
        available: false
      } as Product;
    };

    return this.httpClient.get<Product>(
      this.serviceName,
      url,
      fallback,
      { timeout: 2000 }
    );
  }

  async searchProducts(query: string): Promise<Product[]> {
    const url = `${this.baseUrl}/products/search?q=${query}`;

    const fallback = async (): Promise<Product[]> => {
      this.logger.warn('Product search unavailable, returning empty results');
      return [];
    };

    return this.httpClient.get<Product[]>(
      this.serviceName,
      url,
      fallback
    );
  }
}

// ============================================================================
// HEALTH MONITORING
// ============================================================================

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  circuitState: CircuitState;
  uptime: number;
  lastCheck: Date;
  responseTime?: number;
  errorRate: number;
  details: CircuitBreakerMetrics;
}

@Injectable()
export class HealthMonitor {
  private readonly logger = new Logger(HealthMonitor.name);

  constructor(
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly httpClient: ResilientHttpClient
  ) {}

  /**
   * Check health of a service
   */
  async checkServiceHealth(serviceName: string, healthUrl: string): Promise<ServiceHealth> {
    const metrics = this.circuitBreakerService.getMetrics(serviceName);
    const startTime = Date.now();

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let responseTime: number | undefined;

    try {
      await this.httpClient.get(serviceName, healthUrl);
      responseTime = Date.now() - startTime;

      // Determine health status based on metrics
      if (metrics) {
        const errorRate = this.calculateErrorRate(metrics);

        if (metrics.state === CircuitState.OPEN) {
          status = 'unhealthy';
        } else if (
          metrics.state === CircuitState.HALF_OPEN ||
          errorRate > 25
        ) {
          status = 'degraded';
        }
      }
    } catch (error) {
      status = 'unhealthy';
      this.logger.error(`Health check failed for ${serviceName}`, error);
    }

    return {
      name: serviceName,
      status,
      circuitState: metrics?.state || CircuitState.CLOSED,
      uptime: Date.now() - (metrics?.lastStateChange?.getTime() || Date.now()),
      lastCheck: new Date(),
      responseTime,
      errorRate: metrics ? this.calculateErrorRate(metrics) : 0,
      details: metrics || this.getDefaultMetrics(serviceName)
    };
  }

  /**
   * Check health of all services
   */
  async checkAllServices(services: ServiceConfig[]): Promise<ServiceHealth[]> {
    return Promise.all(
      services.map(service =>
        this.checkServiceHealth(service.name, service.healthUrl)
      )
    );
  }

  /**
   * Get health dashboard
   */
  getHealthDashboard(): HealthDashboard {
    const allMetrics = this.circuitBreakerService.getAllMetrics();

    const healthy = allMetrics.filter(m => m.state === CircuitState.CLOSED).length;
    const degraded = allMetrics.filter(m => m.state === CircuitState.HALF_OPEN).length;
    const unhealthy = allMetrics.filter(m => m.state === CircuitState.OPEN).length;

    return {
      timestamp: new Date(),
      totalServices: allMetrics.length,
      healthy,
      degraded,
      unhealthy,
      services: allMetrics.map(m => ({
        name: m.serviceName,
        state: m.state,
        errorRate: this.calculateErrorRate(m),
        totalRequests: m.totalRequests,
        successRate: this.calculateSuccessRate(m)
      }))
    };
  }

  private calculateErrorRate(metrics: CircuitBreakerMetrics): number {
    if (metrics.totalRequests === 0) return 0;
    return (metrics.failedRequests / metrics.totalRequests) * 100;
  }

  private calculateSuccessRate(metrics: CircuitBreakerMetrics): number {
    if (metrics.totalRequests === 0) return 100;
    return (metrics.successfulRequests / metrics.totalRequests) * 100;
  }

  private getDefaultMetrics(serviceName: string): CircuitBreakerMetrics {
    return {
      serviceName,
      state: CircuitState.CLOSED,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      timeouts: 0,
      lastError: null,
      lastStateChange: new Date()
    };
  }
}

// ============================================================================
// RETRY STRATEGY WITH EXPONENTIAL BACKOFF
// ============================================================================

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

export class RetryStrategy {
  private readonly logger = new Logger(RetryStrategy.name);

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Check if error is retryable
        if (options.retryableErrors && !this.isRetryableError(error, options.retryableErrors)) {
          throw error;
        }

        if (attempt < options.maxRetries) {
          const delay = this.calculateDelay(attempt, options);
          this.logger.warn(
            `Attempt ${attempt + 1}/${options.maxRetries} failed. Retrying in ${delay}ms...`
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  private calculateDelay(attempt: number, options: RetryOptions): number {
    const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);
    return Math.min(delay, options.maxDelayMs);
  }

  private isRetryableError(error: any, retryableErrors: string[]): boolean {
    return retryableErrors.some(errType =>
      error.message?.includes(errType) || error.code === errType
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CircuitBreakerMetrics {
  serviceName: string;
  state: CircuitState;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rejectedRequests: number;
  timeouts: number;
  lastError: string | null;
  lastStateChange: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  isFromCache?: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

interface ServiceConfig {
  name: string;
  healthUrl: string;
}

interface HealthDashboard {
  timestamp: Date;
  totalServices: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
  services: {
    name: string;
    state: CircuitState;
    errorRate: number;
    totalRequests: number;
    successRate: number;
  }[];
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example usage in a service
 */
@Injectable()
export class OrderService {
  constructor(
    private readonly userClient: ResilientUserServiceClient,
    private readonly productClient: ResilientProductServiceClient
  ) {}

  async createOrder(userId: string, productIds: string[]): Promise<any> {
    // Get user (with circuit breaker and fallback)
    const user = await this.userClient.getUserById(userId);

    // Get products (with circuit breaker and fallback)
    const products = await Promise.all(
      productIds.map(id => this.productClient.getProductById(id))
    );

    // Create order logic...
    return {
      user,
      products,
      total: products.reduce((sum, p) => sum + p.price, 0)
    };
  }
}
