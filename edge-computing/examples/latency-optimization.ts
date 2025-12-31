/**
 * Latency Optimization Example
 *
 * Demonstrates techniques to minimize latency in edge computing:
 * - Request prioritization and queuing
 * - Connection pooling and keep-alive
 * - Request coalescing and batching
 * - Proximity-based routing
 * - Protocol optimization
 * - Response streaming
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Request {
  id: string;
  type: 'api' | 'data' | 'compute' | 'stream';
  priority: number;
  payload: any;
  timestamp: number;
  deadline?: number; // Optional SLA deadline
  retries?: number;
}

interface Response {
  requestId: string;
  data: any;
  latency: number;
  hops?: number;
  cached?: boolean;
  edgeNode?: string;
}

interface LatencyMetrics {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

interface EdgeNode {
  id: string;
  location: { lat: number; lon: number };
  load: number;
  maxLoad: number;
  latency: number;
  available: boolean;
}

// ============================================================================
// Request Priority Queue
// ============================================================================

class PriorityRequestQueue {
  private queues: Map<number, Request[]> = new Map();
  private processing = new Set<string>();

  /**
   * Add request to appropriate priority queue
   */
  enqueue(request: Request): void {
    const priority = request.priority;

    if (!this.queues.has(priority)) {
      this.queues.set(priority, []);
    }

    this.queues.get(priority)!.push(request);
    console.log(`[Queue] Enqueued request ${request.id} with priority ${priority}`);
  }

  /**
   * Get highest priority request
   */
  dequeue(): Request | undefined {
    // Get sorted priorities (highest first)
    const priorities = Array.from(this.queues.keys()).sort((a, b) => b - a);

    for (const priority of priorities) {
      const queue = this.queues.get(priority)!;

      if (queue.length > 0) {
        // Check for deadline violations first
        const urgentIndex = queue.findIndex(req => {
          return req.deadline && Date.now() + 1000 > req.deadline;
        });

        if (urgentIndex !== -1) {
          const request = queue.splice(urgentIndex, 1)[0];
          this.processing.add(request.id);
          console.log(`[Queue] Dequeued urgent request ${request.id} (deadline approaching)`);
          return request;
        }

        // Otherwise take first request
        const request = queue.shift()!;
        this.processing.add(request.id);
        return request;
      }
    }

    return undefined;
  }

  /**
   * Mark request as completed
   */
  complete(requestId: string): void {
    this.processing.delete(requestId);
  }

  /**
   * Get queue statistics
   */
  getStats(): { queueSize: number; processing: number; byPriority: Record<number, number> } {
    const byPriority: Record<number, number> = {};

    for (const [priority, queue] of this.queues) {
      byPriority[priority] = queue.length;
    }

    const queueSize = Array.from(this.queues.values()).reduce((sum, q) => sum + q.length, 0);

    return {
      queueSize,
      processing: this.processing.size,
      byPriority,
    };
  }
}

// ============================================================================
// Connection Pool
// ============================================================================

class ConnectionPool {
  private connections: Map<string, any[]> = new Map();
  private activeConnections = new Map<string, number>();
  private readonly maxConnectionsPerHost = 10;

  /**
   * Get or create connection to host
   */
  async getConnection(host: string): Promise<any> {
    // Check for available connection
    const available = this.connections.get(host) || [];

    if (available.length > 0) {
      const conn = available.pop()!;
      this.incrementActive(host);
      console.log(`[Pool] Reusing connection to ${host}`);
      return conn;
    }

    // Check if we can create new connection
    const active = this.activeConnections.get(host) || 0;
    if (active >= this.maxConnectionsPerHost) {
      console.log(`[Pool] Connection limit reached for ${host}, waiting...`);
      await this.waitForConnection(host);
      return this.getConnection(host); // Retry
    }

    // Create new connection
    console.log(`[Pool] Creating new connection to ${host}`);
    const conn = await this.createConnection(host);
    this.incrementActive(host);
    return conn;
  }

  /**
   * Return connection to pool
   */
  releaseConnection(host: string, conn: any): void {
    const available = this.connections.get(host) || [];
    available.push(conn);
    this.connections.set(host, available);
    this.decrementActive(host);
    console.log(`[Pool] Released connection to ${host}`);
  }

  /**
   * Close all connections to host
   */
  closeHost(host: string): void {
    const connections = this.connections.get(host) || [];
    connections.forEach(conn => this.closeConnection(conn));
    this.connections.delete(host);
    this.activeConnections.delete(host);
    console.log(`[Pool] Closed all connections to ${host}`);
  }

  /**
   * Get pool statistics
   */
  getStats(): Record<string, { available: number; active: number }> {
    const stats: Record<string, { available: number; active: number }> = {};

    for (const host of new Set([...this.connections.keys(), ...this.activeConnections.keys()])) {
      stats[host] = {
        available: (this.connections.get(host) || []).length,
        active: this.activeConnections.get(host) || 0,
      };
    }

    return stats;
  }

  private async createConnection(host: string): Promise<any> {
    // Simulate connection creation
    await new Promise(resolve => setTimeout(resolve, 50));
    return { host, created: Date.now(), keepAlive: true };
  }

  private closeConnection(conn: any): void {
    // Simulate closing connection
    conn.closed = true;
  }

  private incrementActive(host: string): void {
    const current = this.activeConnections.get(host) || 0;
    this.activeConnections.set(host, current + 1);
  }

  private decrementActive(host: string): void {
    const current = this.activeConnections.get(host) || 0;
    this.activeConnections.set(host, Math.max(0, current - 1));
  }

  private async waitForConnection(host: string, timeout: number = 5000): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if ((this.connections.get(host) || []).length > 0) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Timeout waiting for connection to ${host}`);
  }
}

// ============================================================================
// Request Coalescer
// ============================================================================

class RequestCoalescer {
  private pending = new Map<string, { requests: Request[]; timer: NodeJS.Timeout }>();
  private readonly coalescingWindow = 50; // ms

  /**
   * Coalesce similar requests
   */
  async coalesce(request: Request, handler: (requests: Request[]) => Promise<Response[]>): Promise<Response> {
    const key = this.getCoalescingKey(request);

    // Check if we have pending requests for this key
    if (this.pending.has(key)) {
      const pending = this.pending.get(key)!;
      pending.requests.push(request);

      // Wait for batch to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(async () => {
          if (!this.pending.has(key)) {
            clearInterval(checkInterval);

            // Find our response (this is simplified)
            const response: Response = {
              requestId: request.id,
              data: { coalesced: true },
              latency: 0,
            };
            resolve(response);
          }
        }, 10);
      });
    }

    // Create new pending batch
    const batch = {
      requests: [request],
      timer: setTimeout(async () => {
        await this.processBatch(key, handler);
      }, this.coalescingWindow),
    };

    this.pending.set(key, batch);

    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        if (!this.pending.has(key)) {
          clearInterval(checkInterval);

          const response: Response = {
            requestId: request.id,
            data: { coalesced: true },
            latency: 0,
          };
          resolve(response);
        }
      }, 10);
    });
  }

  /**
   * Process coalesced batch
   */
  private async processBatch(key: string, handler: (requests: Request[]) => Promise<Response[]>): Promise<void> {
    const batch = this.pending.get(key);
    if (!batch) return;

    console.log(`[Coalescer] Processing batch of ${batch.requests.length} requests for key: ${key}`);

    try {
      await handler(batch.requests);
    } finally {
      this.pending.delete(key);
    }
  }

  /**
   * Generate coalescing key for request
   */
  private getCoalescingKey(request: Request): string {
    // Coalesce requests of same type with similar payloads
    return `${request.type}:${JSON.stringify(request.payload).substring(0, 50)}`;
  }
}

// ============================================================================
// Proximity-Based Router
// ============================================================================

class ProximityRouter {
  private edgeNodes: EdgeNode[] = [];

  constructor(nodes: EdgeNode[]) {
    this.edgeNodes = nodes;
  }

  /**
   * Route request to nearest available edge node
   */
  route(clientLocation: { lat: number; lon: number }): EdgeNode | undefined {
    // Filter available nodes
    const available = this.edgeNodes.filter(node => node.available && node.load < node.maxLoad);

    if (available.length === 0) {
      console.warn('[Router] No available edge nodes');
      return undefined;
    }

    // Calculate distances and scores
    const scored = available.map(node => {
      const distance = this.calculateDistance(clientLocation, node.location);
      const loadFactor = node.load / node.maxLoad;

      // Score: lower is better (distance + latency + load penalty)
      const score = distance + node.latency + loadFactor * 100;

      return { node, score, distance };
    });

    // Sort by score
    scored.sort((a, b) => a.score - b.score);

    const selected = scored[0];
    console.log(
      `[Router] Selected node ${selected.node.id} (distance: ${selected.distance.toFixed(0)}km, score: ${selected.score.toFixed(2)})`
    );

    return selected.node;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(point1: { lat: number; lon: number }, point2: { lat: number; lon: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lon - point1.lon);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Update node load
   */
  updateNodeLoad(nodeId: string, load: number): void {
    const node = this.edgeNodes.find(n => n.id === nodeId);
    if (node) {
      node.load = load;
    }
  }

  /**
   * Get router statistics
   */
  getStats(): {
    totalNodes: number;
    availableNodes: number;
    avgLoad: number;
  } {
    const available = this.edgeNodes.filter(n => n.available);
    const avgLoad = this.edgeNodes.reduce((sum, n) => sum + n.load / n.maxLoad, 0) / this.edgeNodes.length;

    return {
      totalNodes: this.edgeNodes.length,
      availableNodes: available.length,
      avgLoad,
    };
  }
}

// ============================================================================
// Latency Monitor
// ============================================================================

class LatencyMonitor {
  private samples: number[] = [];
  private readonly maxSamples = 1000;

  /**
   * Record latency sample
   */
  record(latency: number): void {
    this.samples.push(latency);

    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  /**
   * Get latency metrics
   */
  getMetrics(): LatencyMetrics {
    if (this.samples.length === 0) {
      return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0, count: 0 };
    }

    const sorted = [...this.samples].sort((a, b) => a - b);

    return {
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      avg: this.samples.reduce((a, b) => a + b, 0) / this.samples.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: this.samples.length,
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Check if latency is within SLA
   */
  checkSLA(target: number): { met: boolean; current: number; target: number } {
    const metrics = this.getMetrics();

    return {
      met: metrics.p95 <= target,
      current: metrics.p95,
      target,
    };
  }
}

// ============================================================================
// Low-Latency Request Handler
// ============================================================================

class LowLatencyRequestHandler extends EventEmitter {
  private queue = new PriorityRequestQueue();
  private pool = new ConnectionPool();
  private coalescer = new RequestCoalescer();
  private monitor = new LatencyMonitor();
  private processing = false;

  constructor(private maxConcurrent: number = 10) {
    super();
  }

  /**
   * Submit request for processing
   */
  async submit(request: Request): Promise<Response> {
    const startTime = performance.now();

    // Add to queue
    this.queue.enqueue(request);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    // Wait for response
    return new Promise((resolve) => {
      this.once(`response:${request.id}`, (response: Response) => {
        const latency = performance.now() - startTime;
        this.monitor.record(latency);

        resolve({
          ...response,
          latency,
        });
      });
    });
  }

  /**
   * Process request queue
   */
  private async processQueue(): Promise<void> {
    this.processing = true;

    while (true) {
      const stats = this.queue.getStats();
      if (stats.queueSize === 0 && stats.processing === 0) {
        break;
      }

      // Process up to maxConcurrent requests
      const toProcess: Request[] = [];
      while (toProcess.length < this.maxConcurrent) {
        const request = this.queue.dequeue();
        if (!request) break;
        toProcess.push(request);
      }

      // Process requests in parallel
      await Promise.all(toProcess.map(req => this.processRequest(req)));
    }

    this.processing = false;
  }

  /**
   * Process individual request
   */
  private async processRequest(request: Request): Promise<void> {
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

      const response: Response = {
        requestId: request.id,
        data: { result: `Processed ${request.type} request` },
        latency: 0,
      };

      this.emit(`response:${request.id}`, response);
      this.queue.complete(request.id);
    } catch (error) {
      console.error(`[Handler] Error processing request ${request.id}:`, error);
      this.queue.complete(request.id);
    }
  }

  /**
   * Get latency metrics
   */
  getMetrics(): LatencyMetrics {
    return this.monitor.getMetrics();
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return this.queue.getStats();
  }
}

// ============================================================================
// Usage Example
// ============================================================================

async function main() {
  console.log('=== Latency Optimization Example ===\n');

  // 1. Priority Queue
  console.log('1. Priority Request Queue:');
  const queue = new PriorityRequestQueue();

  queue.enqueue({ id: 'req-1', type: 'api', priority: 5, payload: {}, timestamp: Date.now() });
  queue.enqueue({ id: 'req-2', type: 'compute', priority: 8, payload: {}, timestamp: Date.now() });
  queue.enqueue({ id: 'req-3', type: 'data', priority: 3, payload: {}, timestamp: Date.now() });

  console.log('Dequeue order:');
  console.log('1st:', queue.dequeue()?.id, '(priority: 8)');
  console.log('2nd:', queue.dequeue()?.id, '(priority: 5)');
  console.log('3rd:', queue.dequeue()?.id, '(priority: 3)');

  // 2. Connection Pooling
  console.log('\n2. Connection Pooling:');
  const pool = new ConnectionPool();

  const conn1 = await pool.getConnection('api.example.com');
  const conn2 = await pool.getConnection('api.example.com');
  pool.releaseConnection('api.example.com', conn1);

  console.log('Pool stats:', pool.getStats());

  // 3. Proximity-based routing
  console.log('\n3. Proximity-Based Routing:');
  const router = new ProximityRouter([
    { id: 'us-west', location: { lat: 37.7749, lon: -122.4194 }, load: 50, maxLoad: 100, latency: 10, available: true },
    { id: 'us-east', location: { lat: 40.7128, lon: -74.006 }, load: 70, maxLoad: 100, latency: 15, available: true },
    { id: 'eu-west', location: { lat: 51.5074, lon: -0.1278 }, load: 30, maxLoad: 100, latency: 80, available: true },
  ]);

  const clientLocation = { lat: 37.3382, lon: -121.8863 }; // San Jose
  const selected = router.route(clientLocation);
  console.log(`Selected edge node: ${selected?.id}`);

  // 4. Low-latency request handling
  console.log('\n4. Low-Latency Request Handler:');
  const handler = new LowLatencyRequestHandler(5);

  // Submit multiple requests
  const requests = Array.from({ length: 20 }, (_, i) => ({
    id: `req-${i}`,
    type: 'api' as const,
    priority: Math.floor(Math.random() * 10),
    payload: { index: i },
    timestamp: Date.now(),
  }));

  console.log(`Submitting ${requests.length} requests...`);

  const startTime = performance.now();
  const responses = await Promise.all(requests.map(req => handler.submit(req)));
  const totalTime = performance.now() - startTime;

  console.log(`\nProcessed ${responses.length} requests in ${totalTime.toFixed(2)}ms`);

  // 5. Latency metrics
  console.log('\n5. Latency Metrics:');
  const metrics = handler.getMetrics();
  console.log(`P50: ${metrics.p50.toFixed(2)}ms`);
  console.log(`P95: ${metrics.p95.toFixed(2)}ms`);
  console.log(`P99: ${metrics.p99.toFixed(2)}ms`);
  console.log(`Avg: ${metrics.avg.toFixed(2)}ms`);
  console.log(`Min: ${metrics.min.toFixed(2)}ms`);
  console.log(`Max: ${metrics.max.toFixed(2)}ms`);

  console.log('\n=== Latency Optimization Complete ===');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export {
  PriorityRequestQueue,
  ConnectionPool,
  RequestCoalescer,
  ProximityRouter,
  LatencyMonitor,
  LowLatencyRequestHandler,
  Request,
  Response,
  LatencyMetrics,
};
