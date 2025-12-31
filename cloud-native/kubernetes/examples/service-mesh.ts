/**
 * Service Mesh Patterns
 *
 * Comprehensive examples of service mesh implementations including Istio, Linkerd,
 * traffic management, security policies, observability, and advanced routing patterns.
 */

/**
 * ============================================================================
 * 1. Istio Service Mesh - Basic Setup
 * ============================================================================
 *
 * Enable Istio sidecar injection and basic service mesh features.
 *
 * namespace.yaml:
 * ---------------
 * apiVersion: v1
 * kind: Namespace
 * metadata:
 *   name: production
 *   labels:
 *     istio-injection: enabled  # Enable automatic sidecar injection
 *
 * deployment.yaml:
 * ----------------
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: myapp
 *   namespace: production
 * spec:
 *   replicas: 3
 *   selector:
 *     matchLabels:
 *       app: myapp
 *   template:
 *     metadata:
 *       labels:
 *         app: myapp
 *         version: v1
 *       annotations:
 *         sidecar.istio.io/inject: "true"
 *     spec:
 *       containers:
 *       - name: app
 *         image: myapp:1.0.0
 *         ports:
 *         - containerPort: 3000
 * ---
 * apiVersion: v1
 * kind: Service
 * metadata:
 *   name: myapp
 *   namespace: production
 * spec:
 *   selector:
 *     app: myapp
 *   ports:
 *   - port: 80
 *     targetPort: 3000
 *     name: http
 */

/**
 * ============================================================================
 * 2. Istio Virtual Service - Advanced Routing
 * ============================================================================
 *
 * Traffic routing, canary deployments, A/B testing, and header-based routing.
 *
 * virtualservice.yaml:
 * --------------------
 * apiVersion: networking.istio.io/v1beta1
 * kind: VirtualService
 * metadata:
 *   name: myapp
 *   namespace: production
 * spec:
 *   hosts:
 *   - myapp.production.svc.cluster.local
 *   - myapp.example.com
 *   http:
 *   # Header-based routing (A/B testing)
 *   - match:
 *     - headers:
 *         x-version:
 *           exact: "v2"
 *     route:
 *     - destination:
 *         host: myapp
 *         subset: v2
 *
 *   # Canary deployment (10% to v2, 90% to v1)
 *   - match:
 *     - uri:
 *         prefix: "/api"
 *     route:
 *     - destination:
 *         host: myapp
 *         subset: v1
 *       weight: 90
 *     - destination:
 *         host: myapp
 *         subset: v2
 *       weight: 10
 *
 *   # Default route
 *   - route:
 *     - destination:
 *         host: myapp
 *         subset: v1
 *
 *   # Request timeout
 *   timeout: 10s
 *
 *   # Retry policy
 *   retries:
 *     attempts: 3
 *     perTryTimeout: 2s
 *     retryOn: 5xx,reset,connect-failure
 * ---
 * # Destination rule defines subsets and load balancing
 * apiVersion: networking.istio.io/v1beta1
 * kind: DestinationRule
 * metadata:
 *   name: myapp
 *   namespace: production
 * spec:
 *   host: myapp
 *   trafficPolicy:
 *     loadBalancer:
 *       consistentHash:
 *         httpCookie:
 *           name: user
 *           ttl: 0s
 *   subsets:
 *   - name: v1
 *     labels:
 *       version: v1
 *   - name: v2
 *     labels:
 *       version: v2
 */

/**
 * ============================================================================
 * 3. Istio Gateway and Ingress
 * ============================================================================
 *
 * External access configuration with TLS termination.
 *
 * gateway.yaml:
 * -------------
 * apiVersion: networking.istio.io/v1beta1
 * kind: Gateway
 * metadata:
 *   name: myapp-gateway
 *   namespace: production
 * spec:
 *   selector:
 *     istio: ingressgateway
 *   servers:
 *   # HTTPS
 *   - port:
 *       number: 443
 *       name: https
 *       protocol: HTTPS
 *     tls:
 *       mode: SIMPLE
 *       credentialName: myapp-tls-cert
 *     hosts:
 *     - myapp.example.com
 *   # HTTP redirect to HTTPS
 *   - port:
 *       number: 80
 *       name: http
 *       protocol: HTTP
 *     hosts:
 *     - myapp.example.com
 *     tls:
 *       httpsRedirect: true
 * ---
 * apiVersion: networking.istio.io/v1beta1
 * kind: VirtualService
 * metadata:
 *   name: myapp-ingress
 *   namespace: production
 * spec:
 *   hosts:
 *   - myapp.example.com
 *   gateways:
 *   - myapp-gateway
 *   http:
 *   - match:
 *     - uri:
 *         prefix: "/api"
 *     route:
 *     - destination:
 *         host: myapp
 *         port:
 *           number: 80
 */

/**
 * ============================================================================
 * 4. Circuit Breaker and Outlier Detection
 * ============================================================================
 *
 * Fault tolerance and automatic ejection of unhealthy instances.
 *
 * circuit-breaker.yaml:
 * ---------------------
 * apiVersion: networking.istio.io/v1beta1
 * kind: DestinationRule
 * metadata:
 *   name: myapp-circuit-breaker
 *   namespace: production
 * spec:
 *   host: myapp
 *   trafficPolicy:
 *     # Connection pool settings
 *     connectionPool:
 *       tcp:
 *         maxConnections: 100
 *       http:
 *         http1MaxPendingRequests: 50
 *         http2MaxRequests: 100
 *         maxRequestsPerConnection: 2
 *
 *     # Circuit breaker
 *     outlierDetection:
 *       consecutive5xxErrors: 5
 *       interval: 30s
 *       baseEjectionTime: 30s
 *       maxEjectionPercent: 50
 *       minHealthPercent: 40
 *
 *     # Load balancing
 *     loadBalancer:
 *       simple: LEAST_REQUEST
 */

/**
 * ============================================================================
 * 5. Mutual TLS (mTLS) Authentication
 * ============================================================================
 *
 * Secure service-to-service communication with automatic mTLS.
 *
 * peer-authentication.yaml:
 * -------------------------
 * apiVersion: security.istio.io/v1beta1
 * kind: PeerAuthentication
 * metadata:
 *   name: default
 *   namespace: production
 * spec:
 *   mtls:
 *     mode: STRICT  # STRICT, PERMISSIVE, or DISABLE
 * ---
 * # Service-specific mTLS
 * apiVersion: security.istio.io/v1beta1
 * kind: PeerAuthentication
 * metadata:
 *   name: myapp-mtls
 *   namespace: production
 * spec:
 *   selector:
 *     matchLabels:
 *       app: myapp
 *   mtls:
 *     mode: STRICT
 *   portLevelMtls:
 *     3000:
 *       mode: STRICT
 */

/**
 * ============================================================================
 * 6. Authorization Policies
 * ============================================================================
 *
 * Fine-grained access control between services.
 *
 * authorization-policy.yaml:
 * --------------------------
 * apiVersion: security.istio.io/v1beta1
 * kind: AuthorizationPolicy
 * metadata:
 *   name: myapp-authz
 *   namespace: production
 * spec:
 *   selector:
 *     matchLabels:
 *       app: myapp
 *   action: ALLOW
 *   rules:
 *   # Allow from frontend service
 *   - from:
 *     - source:
 *         principals: ["cluster.local/ns/production/sa/frontend"]
 *     to:
 *     - operation:
 *         methods: ["GET", "POST"]
 *         paths: ["/api/*"]
 *
 *   # Allow from specific namespace
 *   - from:
 *     - source:
 *         namespaces: ["production"]
 *     to:
 *     - operation:
 *         methods: ["GET"]
 *
 *   # Deny specific path
 *   - from:
 *     - source:
 *         notNamespaces: ["admin"]
 *     to:
 *     - operation:
 *         paths: ["/admin/*"]
 *     when:
 *     - key: request.headers[x-admin]
 *       notValues: ["true"]
 * ---
 * # Deny all by default
 * apiVersion: security.istio.io/v1beta1
 * kind: AuthorizationPolicy
 * metadata:
 *   name: deny-all
 *   namespace: production
 * spec:
 *   {}  # Empty spec denies all
 */

/**
 * ============================================================================
 * 7. Request Authentication (JWT)
 * ============================================================================
 *
 * Validate JWT tokens at the ingress gateway.
 *
 * request-authentication.yaml:
 * ----------------------------
 * apiVersion: security.istio.io/v1beta1
 * kind: RequestAuthentication
 * metadata:
 *   name: jwt-auth
 *   namespace: production
 * spec:
 *   selector:
 *     matchLabels:
 *       app: myapp
 *   jwtRules:
 *   - issuer: "https://auth.example.com"
 *     jwksUri: "https://auth.example.com/.well-known/jwks.json"
 *     audiences:
 *     - "myapp-api"
 *     forwardOriginalToken: true
 * ---
 * # Require JWT for specific paths
 * apiVersion: security.istio.io/v1beta1
 * kind: AuthorizationPolicy
 * metadata:
 *   name: require-jwt
 *   namespace: production
 * spec:
 *   selector:
 *     matchLabels:
 *       app: myapp
 *   action: ALLOW
 *   rules:
 *   - from:
 *     - source:
 *         requestPrincipals: ["*"]
 *     to:
 *     - operation:
 *         paths: ["/api/*"]
 */

/**
 * ============================================================================
 * 8. Traffic Mirroring (Dark Launch)
 * ============================================================================
 *
 * Mirror production traffic to test new version without affecting users.
 *
 * traffic-mirroring.yaml:
 * -----------------------
 * apiVersion: networking.istio.io/v1beta1
 * kind: VirtualService
 * metadata:
 *   name: myapp-mirror
 *   namespace: production
 * spec:
 *   hosts:
 *   - myapp
 *   http:
 *   - match:
 *     - uri:
 *         prefix: "/api"
 *     route:
 *     - destination:
 *         host: myapp
 *         subset: v1
 *       weight: 100
 *     # Mirror to v2 for testing
 *     mirror:
 *       host: myapp
 *       subset: v2
 *     mirrorPercentage:
 *       value: 100.0
 */

/**
 * ============================================================================
 * 9. Fault Injection for Testing
 * ============================================================================
 *
 * Test resilience by injecting delays and errors.
 *
 * fault-injection.yaml:
 * ---------------------
 * apiVersion: networking.istio.io/v1beta1
 * kind: VirtualService
 * metadata:
 *   name: myapp-fault-injection
 *   namespace: production
 * spec:
 *   hosts:
 *   - myapp
 *   http:
 *   - match:
 *     - headers:
 *         x-test-fault:
 *           exact: "true"
 *     fault:
 *       delay:
 *         percentage:
 *           value: 10.0
 *         fixedDelay: 5s
 *       abort:
 *         percentage:
 *           value: 5.0
 *         httpStatus: 503
 *     route:
 *     - destination:
 *         host: myapp
 *   - route:
 *     - destination:
 *         host: myapp
 */

/**
 * ============================================================================
 * 10. Service Mesh Observability
 * ============================================================================
 *
 * Telemetry, metrics, tracing, and logging configuration.
 *
 * telemetry.yaml:
 * ---------------
 * apiVersion: telemetry.istio.io/v1alpha1
 * kind: Telemetry
 * metadata:
 *   name: mesh-telemetry
 *   namespace: istio-system
 * spec:
 *   # Metrics
 *   metrics:
 *   - providers:
 *     - name: prometheus
 *     dimensions:
 *       request_protocol: request.protocol
 *       response_code: response.code
 *
 *   # Tracing
 *   tracing:
 *   - providers:
 *     - name: jaeger
 *     randomSamplingPercentage: 10.0
 *     customTags:
 *       environment:
 *         literal:
 *           value: "production"
 *
 *   # Access logging
 *   accessLogging:
 *   - providers:
 *     - name: envoy
 *     filter:
 *       expression: "response.code >= 400"
 */

/**
 * ============================================================================
 * 11. Linkerd Service Mesh (Alternative)
 * ============================================================================
 *
 * Lightweight service mesh with automatic mTLS and observability.
 *
 * linkerd-deployment.yaml:
 * ------------------------
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: myapp
 *   namespace: production
 *   annotations:
 *     linkerd.io/inject: enabled
 * spec:
 *   replicas: 3
 *   selector:
 *     matchLabels:
 *       app: myapp
 *   template:
 *     metadata:
 *       labels:
 *         app: myapp
 *       annotations:
 *         linkerd.io/inject: enabled
 *         config.linkerd.io/skip-outbound-ports: "3306,6379"
 *         config.linkerd.io/trace-collector: jaeger.linkerd-jaeger:14268
 *     spec:
 *       containers:
 *       - name: app
 *         image: myapp:1.0.0
 *         ports:
 *         - containerPort: 3000
 * ---
 * # Linkerd TrafficSplit for canary
 * apiVersion: split.smi-spec.io/v1alpha2
 * kind: TrafficSplit
 * metadata:
 *   name: myapp-canary
 *   namespace: production
 * spec:
 *   service: myapp
 *   backends:
 *   - service: myapp-v1
 *     weight: 900
 *   - service: myapp-v2
 *     weight: 100
 */

// ============================================================================
// TypeScript Service Mesh Client Integration
// ============================================================================

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Service mesh aware HTTP client with tracing headers
 */
export class ServiceMeshClient {
  private client: AxiosInstance;

  constructor(private serviceName: string, baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || `http://${serviceName}`,
      timeout: 10000
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add tracing headers
    this.client.interceptors.request.use((config) => {
      // Add distributed tracing headers
      config.headers['x-request-id'] = this.generateRequestId();
      config.headers['x-b3-traceid'] = this.generateTraceId();
      config.headers['x-b3-spanid'] = this.generateSpanId();

      // Add service mesh headers
      config.headers['x-forwarded-client-cert'] = ''; // Istio mTLS
      config.headers['x-envoy-decorator-operation'] = `${this.serviceName}.default.svc.cluster.local`;

      console.log(`[ServiceMesh] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Response interceptor - handle retries and circuit breaker
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[ServiceMesh] Response: ${response.status}`);
        return response;
      },
      async (error) => {
        const config = error.config as AxiosRequestConfig & { _retry?: number };

        // Retry logic (service mesh also handles this)
        if (this.shouldRetry(error) && (!config._retry || config._retry < 3)) {
          config._retry = (config._retry || 0) + 1;
          console.log(`[ServiceMesh] Retry attempt ${config._retry}`);

          await this.sleep(1000 * config._retry);
          return this.client.request(config);
        }

        throw error;
      }
    );
  }

  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(path, config);
    return response.data;
  }

  async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(path, data, config);
    return response.data;
  }

  private shouldRetry(error: any): boolean {
    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      (error.response && error.response.status >= 500)
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateSpanId(): string {
    return Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Circuit breaker implementation for service mesh integration
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private serviceName: string = 'unknown'
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime! >= this.timeout) {
        console.log(`[CircuitBreaker:${this.serviceName}] HALF_OPEN`);
        this.state = 'HALF_OPEN';
      } else {
        throw new Error(`Circuit breaker OPEN for ${this.serviceName}`);
      }
    }

    try {
      const result = await fn();

      if (this.state === 'HALF_OPEN') {
        console.log(`[CircuitBreaker:${this.serviceName}] CLOSED`);
        this.state = 'CLOSED';
      }
      this.failures = 0;

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        console.log(`[CircuitBreaker:${this.serviceName}] OPEN`);
        this.state = 'OPEN';
      }

      throw error;
    }
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Service mesh metrics collector
 */
export class ServiceMeshMetrics {
  private metrics = new Map<string, number>();

  recordRequest(service: string, status: number, duration: number): void {
    this.increment(`requests_total{service="${service}",status="${status}"}`);
    this.record(`request_duration_ms{service="${service}"}`, duration);
  }

  recordError(service: string, errorType: string): void {
    this.increment(`errors_total{service="${service}",type="${errorType}"}`);
  }

  private increment(metric: string): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + 1);
  }

  private record(metric: string, value: number): void {
    this.metrics.set(metric, value);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}

// Usage example
export async function serviceMeshExample(): Promise<void> {
  // Create service mesh aware client
  const client = new ServiceMeshClient('user-service');

  // Call another service in the mesh
  try {
    const users = await client.get('/api/users');
    console.log('Users:', users);
  } catch (error) {
    console.error('Service call failed:', error);
  }

  // Circuit breaker example
  const breaker = new CircuitBreaker(5, 60000, 'user-service');

  try {
    await breaker.execute(async () => {
      return await client.get('/api/users');
    });
  } catch (error) {
    console.error('Circuit breaker prevented call:', error);
  }
}

export default ServiceMeshClient;
