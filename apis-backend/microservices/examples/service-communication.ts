/**
 * Microservices Service Communication Examples
 *
 * Demonstrates:
 * - HTTP client calls between services (using Axios)
 * - gRPC patterns for high-performance RPC
 * - Service discovery with Consul/Eureka
 * - Load balancing strategies
 * - Retry logic and timeouts
 * - Request tracing and correlation IDs
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { v4 as uuidv4 } from 'uuid';
import Consul from 'consul';

// ============================================================================
// HTTP CLIENT SERVICE COMMUNICATION
// ============================================================================

/**
 * Base HTTP Client for inter-service communication
 * Includes retry logic, timeouts, and correlation ID tracking
 */
@Injectable()
export class HttpServiceClient {
  private readonly logger = new Logger(HttpServiceClient.name);
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add correlation ID and logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const correlationId = config.headers['X-Correlation-ID'] || uuidv4();
        config.headers['X-Correlation-ID'] = correlationId;

        this.logger.log(
          `→ Outgoing request: ${config.method?.toUpperCase()} ${config.url} [${correlationId}]`
        );

        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - logging and error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const correlationId = response.config.headers['X-Correlation-ID'];
        this.logger.log(
          `← Response received: ${response.status} from ${response.config.url} [${correlationId}]`
        );
        return response;
      },
      (error) => {
        const correlationId = error.config?.headers?.['X-Correlation-ID'];
        this.logger.error(
          `✖ Request failed: ${error.config?.url} [${correlationId}]`,
          error.message
        );
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make HTTP GET request with retry logic
   */
  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
    retries: number = 3
  ): Promise<T> {
    return this.executeWithRetry(
      async () => {
        const response = await this.axiosInstance.get<T>(url, config);
        return response.data;
      },
      retries,
      url
    );
  }

  /**
   * Make HTTP POST request with retry logic
   */
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    retries: number = 3
  ): Promise<T> {
    return this.executeWithRetry(
      async () => {
        const response = await this.axiosInstance.post<T>(url, data, config);
        return response.data;
      },
      retries,
      url
    );
  }

  /**
   * Make HTTP PUT request
   */
  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    retries: number = 3
  ): Promise<T> {
    return this.executeWithRetry(
      async () => {
        const response = await this.axiosInstance.put<T>(url, data, config);
        return response.data;
      },
      retries,
      url
    );
  }

  /**
   * Make HTTP DELETE request
   */
  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
    retries: number = 3
  ): Promise<T> {
    return this.executeWithRetry(
      async () => {
        const response = await this.axiosInstance.delete<T>(url, config);
        return response.data;
      },
      retries,
      url
    );
  }

  /**
   * Execute request with exponential backoff retry
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries: number,
    url: string,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt >= retries) {
        this.logger.error(`Failed after ${retries} retries: ${url}`);
        throw new HttpException(
          `Service communication failed: ${error.message}`,
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = Math.pow(2, attempt) * 1000;
      this.logger.warn(
        `Retry attempt ${attempt}/${retries} for ${url} after ${delay}ms`
      );

      await this.sleep(delay);
      return this.executeWithRetry(operation, retries, url, attempt + 1);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SERVICE-SPECIFIC CLIENTS
// ============================================================================

/**
 * User Service Client
 * Handles communication with the User microservice
 */
@Injectable()
export class UserServiceClient {
  private readonly logger = new Logger(UserServiceClient.name);
  private readonly baseUrl: string;

  constructor(private readonly httpClient: HttpServiceClient) {
    this.baseUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
  }

  async getUserById(userId: string): Promise<User> {
    this.logger.log(`Fetching user: ${userId}`);
    return await this.httpClient.get<User>(`${this.baseUrl}/users/${userId}`);
  }

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    this.logger.log(`Batch fetching ${userIds.length} users`);
    return await this.httpClient.post<User[]>(
      `${this.baseUrl}/users/batch`,
      { ids: userIds }
    );
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user: ${userData.email}`);
    return await this.httpClient.post<User>(
      `${this.baseUrl}/users`,
      userData
    );
  }

  async updateUser(userId: string, userData: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user: ${userId}`);
    return await this.httpClient.put<User>(
      `${this.baseUrl}/users/${userId}`,
      userData
    );
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      return await this.httpClient.post<User>(
        `${this.baseUrl}/auth/validate`,
        { email, password }
      );
    } catch (error) {
      return null;
    }
  }
}

/**
 * Order Service Client
 */
@Injectable()
export class OrderServiceClient {
  private readonly logger = new Logger(OrderServiceClient.name);
  private readonly baseUrl: string;

  constructor(private readonly httpClient: HttpServiceClient) {
    this.baseUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3002';
  }

  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    this.logger.log(`Creating order for user: ${orderData.userId}`);
    return await this.httpClient.post<Order>(
      `${this.baseUrl}/orders`,
      orderData
    );
  }

  async getOrderById(orderId: string): Promise<Order> {
    return await this.httpClient.get<Order>(
      `${this.baseUrl}/orders/${orderId}`
    );
  }

  async getUserOrders(userId: string, page = 1, limit = 10): Promise<PaginatedOrders> {
    return await this.httpClient.get<PaginatedOrders>(
      `${this.baseUrl}/orders/user/${userId}`,
      { params: { page, limit } }
    );
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order> {
    return await this.httpClient.put<Order>(
      `${this.baseUrl}/orders/${orderId}/status`,
      { status }
    );
  }
}

/**
 * Payment Service Client
 */
@Injectable()
export class PaymentServiceClient {
  private readonly logger = new Logger(PaymentServiceClient.name);
  private readonly baseUrl: string;

  constructor(private readonly httpClient: HttpServiceClient) {
    this.baseUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003';
  }

  async processPayment(paymentData: ProcessPaymentDto): Promise<PaymentResult> {
    this.logger.log(`Processing payment for order: ${paymentData.orderId}`);
    return await this.httpClient.post<PaymentResult>(
      `${this.baseUrl}/payments/process`,
      paymentData,
      undefined,
      1 // No retries for payment processing (idempotency concerns)
    );
  }

  async refundPayment(paymentId: string, amount: number): Promise<RefundResult> {
    return await this.httpClient.post<RefundResult>(
      `${this.baseUrl}/payments/${paymentId}/refund`,
      { amount }
    );
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    return await this.httpClient.get<PaymentStatus>(
      `${this.baseUrl}/payments/${paymentId}/status`
    );
  }
}

// ============================================================================
// GRPC SERVICE COMMUNICATION
// ============================================================================

/**
 * gRPC Client for high-performance service communication
 */
@Injectable()
export class GrpcServiceClient {
  private readonly logger = new Logger(GrpcServiceClient.name);
  private client: any;

  constructor(
    private readonly protoPath: string,
    private readonly serviceName: string,
    private readonly serverAddress: string
  ) {
    this.initializeClient();
  }

  /**
   * Initialize gRPC client from proto file
   */
  private initializeClient(): void {
    const packageDefinition = protoLoader.loadSync(this.protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;

    // Create client instance
    const ServiceClient = protoDescriptor[this.serviceName];
    this.client = new ServiceClient(
      this.serverAddress,
      grpc.credentials.createInsecure()
    );

    this.logger.log(`gRPC client initialized for ${this.serviceName} at ${this.serverAddress}`);
  }

  /**
   * Make unary RPC call
   */
  async call<TRequest, TResponse>(
    method: string,
    request: TRequest
  ): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      this.client[method](request, (error: any, response: TResponse) => {
        if (error) {
          this.logger.error(`gRPC call failed: ${method}`, error);
          reject(error);
        } else {
          this.logger.log(`gRPC call successful: ${method}`);
          resolve(response);
        }
      });
    });
  }

  /**
   * Make server streaming RPC call
   */
  async callServerStream<TRequest, TResponse>(
    method: string,
    request: TRequest,
    onData: (data: TResponse) => void,
    onEnd?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const stream = this.client[method](request);

    stream.on('data', onData);
    stream.on('end', () => {
      this.logger.log(`gRPC stream ended: ${method}`);
      onEnd?.();
    });
    stream.on('error', (error: Error) => {
      this.logger.error(`gRPC stream error: ${method}`, error);
      onError?.(error);
    });
  }

  /**
   * Close gRPC client
   */
  close(): void {
    if (this.client) {
      this.client.close();
      this.logger.log('gRPC client closed');
    }
  }
}

/**
 * Example: User Service gRPC Client
 */
@Injectable()
export class UserGrpcClient extends GrpcServiceClient {
  constructor() {
    super(
      './protos/user.proto',
      'UserService',
      process.env.USER_GRPC_URL || 'localhost:50051'
    );
  }

  async getUser(userId: string): Promise<User> {
    return this.call<{ id: string }, User>('GetUser', { id: userId });
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    return this.call<CreateUserDto, User>('CreateUser', userData);
  }

  async streamUsers(
    onUser: (user: User) => void,
    onEnd?: () => void
  ): Promise<void> {
    return this.callServerStream<{}, User>(
      'StreamUsers',
      {},
      onUser,
      onEnd
    );
  }
}

// ============================================================================
// SERVICE DISCOVERY
// ============================================================================

/**
 * Consul Service Discovery
 */
@Injectable()
export class ConsulServiceDiscovery {
  private readonly logger = new Logger(ConsulServiceDiscovery.name);
  private readonly consul: Consul.Consul;
  private serviceCache = new Map<string, ServiceInstance[]>();

  constructor() {
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'localhost',
      port: process.env.CONSUL_PORT || '8500'
    });
  }

  /**
   * Register service with Consul
   */
  async registerService(
    serviceName: string,
    serviceId: string,
    port: number,
    healthCheckUrl: string
  ): Promise<void> {
    try {
      await this.consul.agent.service.register({
        id: serviceId,
        name: serviceName,
        port,
        check: {
          http: healthCheckUrl,
          interval: '10s',
          timeout: '5s'
        },
        tags: [`v${process.env.SERVICE_VERSION || '1.0.0'}`]
      });

      this.logger.log(`Service registered: ${serviceName} (${serviceId})`);
    } catch (error) {
      this.logger.error('Failed to register service with Consul', error);
      throw error;
    }
  }

  /**
   * Discover service instances
   */
  async discoverService(serviceName: string): Promise<ServiceInstance[]> {
    try {
      const result: any = await this.consul.health.service({
        service: serviceName,
        passing: true // Only return healthy instances
      });

      const instances: ServiceInstance[] = result.map((entry: any) => ({
        id: entry.Service.ID,
        address: entry.Service.Address,
        port: entry.Service.Port,
        tags: entry.Service.Tags
      }));

      // Cache the result
      this.serviceCache.set(serviceName, instances);

      this.logger.log(`Discovered ${instances.length} instances of ${serviceName}`);
      return instances;
    } catch (error) {
      this.logger.error(`Failed to discover service: ${serviceName}`, error);

      // Return cached instances if available
      return this.serviceCache.get(serviceName) || [];
    }
  }

  /**
   * Get service URL with load balancing
   */
  async getServiceUrl(serviceName: string): Promise<string> {
    const instances = await this.discoverService(serviceName);

    if (instances.length === 0) {
      throw new Error(`No healthy instances found for service: ${serviceName}`);
    }

    // Simple round-robin load balancing
    const instance = instances[Math.floor(Math.random() * instances.length)];
    return `http://${instance.address}:${instance.port}`;
  }

  /**
   * Deregister service
   */
  async deregisterService(serviceId: string): Promise<void> {
    try {
      await this.consul.agent.service.deregister(serviceId);
      this.logger.log(`Service deregistered: ${serviceId}`);
    } catch (error) {
      this.logger.error('Failed to deregister service', error);
    }
  }
}

/**
 * Service Discovery-aware HTTP Client
 */
@Injectable()
export class DiscoveryAwareHttpClient {
  constructor(
    private readonly httpClient: HttpServiceClient,
    private readonly serviceDiscovery: ConsulServiceDiscovery
  ) {}

  async get<T>(serviceName: string, path: string): Promise<T> {
    const baseUrl = await this.serviceDiscovery.getServiceUrl(serviceName);
    return this.httpClient.get<T>(`${baseUrl}${path}`);
  }

  async post<T>(serviceName: string, path: string, data?: any): Promise<T> {
    const baseUrl = await this.serviceDiscovery.getServiceUrl(serviceName);
    return this.httpClient.post<T>(`${baseUrl}${path}`, data);
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

interface CreateUserDto {
  email: string;
  name: string;
  password: string;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface CreateOrderDto {
  userId: string;
  items: OrderItem[];
}

interface PaginatedOrders {
  items: Order[];
  total: number;
  page: number;
  limit: number;
}

enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

interface ProcessPaymentDto {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

interface PaymentResult {
  paymentId: string;
  status: 'success' | 'failed';
  transactionId?: string;
  message?: string;
}

interface RefundResult {
  refundId: string;
  status: 'success' | 'failed';
  amount: number;
}

interface PaymentStatus {
  paymentId: string;
  status: string;
  amount: number;
  timestamp: Date;
}

interface ServiceInstance {
  id: string;
  address: string;
  port: number;
  tags: string[];
}
