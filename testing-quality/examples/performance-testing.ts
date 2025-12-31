/**
 * Performance and Load Testing Examples
 *
 * This file demonstrates performance testing patterns including:
 * - Load testing
 * - Stress testing
 * - Response time measurement
 * - Memory profiling
 * - Concurrent operations testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// 1. RESPONSE TIME PERFORMANCE TESTS
// ============================================================================

class PerformanceTimer {
  private startTime: number = 0;
  private endTime: number = 0;

  start(): void {
    this.startTime = performance.now();
  }

  stop(): number {
    this.endTime = performance.now();
    return this.getDuration();
  }

  getDuration(): number {
    return this.endTime - this.startTime;
  }
}

/**
 * Simulate a data processing service
 */
class DataProcessor {
  async processSmallDataset(data: number[]): Promise<number[]> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 10));
    return data.map(x => x * 2);
  }

  async processLargeDataset(data: number[]): Promise<number[]> {
    // Simulate longer processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    return data.map(x => x * 2);
  }

  async processWithCache(data: number[], useCache: boolean = false): Promise<number[]> {
    if (useCache) {
      // Fast cache retrieval
      await new Promise(resolve => setTimeout(resolve, 5));
    } else {
      // Slower database query
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return data.map(x => x * 2);
  }

  processSync(data: number[]): number[] {
    // Synchronous processing
    let result = [...data];
    for (let i = 0; i < 1000; i++) {
      result = result.map(x => x * 1.001);
    }
    return result;
  }
}

describe('Performance: Response Time Tests', () => {
  let processor: DataProcessor;
  let timer: PerformanceTimer;

  beforeEach(() => {
    processor = new DataProcessor();
    timer = new PerformanceTimer();
  });

  it('should process small dataset within acceptable time', async () => {
    const data = Array.from({ length: 100 }, (_, i) => i);

    timer.start();
    await processor.processSmallDataset(data);
    const duration = timer.stop();

    // Should complete within 50ms
    expect(duration).toBeLessThan(50);
  });

  it('should process large dataset efficiently', async () => {
    const data = Array.from({ length: 10000 }, (_, i) => i);

    timer.start();
    await processor.processLargeDataset(data);
    const duration = timer.stop();

    // Should complete within 150ms
    expect(duration).toBeLessThan(150);
  });

  it('should demonstrate cache performance benefit', async () => {
    const data = Array.from({ length: 1000 }, (_, i) => i);

    // Without cache
    timer.start();
    await processor.processWithCache(data, false);
    const withoutCache = timer.stop();

    // With cache
    timer.start();
    await processor.processWithCache(data, true);
    const withCache = timer.stop();

    // Cache should be significantly faster
    expect(withCache).toBeLessThan(withoutCache / 2);
  });

  it('should measure sync processing performance', () => {
    const data = Array.from({ length: 100 }, (_, i) => i);

    timer.start();
    processor.processSync(data);
    const duration = timer.stop();

    // Sync processing should be fast for small datasets
    expect(duration).toBeLessThan(100);
  });
});

// ============================================================================
// 2. LOAD TESTING - Concurrent Operations
// ============================================================================

class ApiService {
  private requestCount: number = 0;
  private maxConcurrent: number = 10;
  private currentConcurrent: number = 0;

  async fetchUser(id: string): Promise<{ id: string; name: string }> {
    this.requestCount++;
    this.currentConcurrent++;

    if (this.currentConcurrent > this.maxConcurrent) {
      this.currentConcurrent--;
      throw new Error('Too many concurrent requests');
    }

    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));

    this.currentConcurrent--;

    return {
      id,
      name: `User ${id}`,
    };
  }

  async batchFetchUsers(ids: string[]): Promise<Array<{ id: string; name: string }>> {
    const chunks = this.chunkArray(ids, 5);
    const results: Array<{ id: string; name: string }> = [];

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(id => this.fetchUser(id))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  reset(): void {
    this.requestCount = 0;
    this.currentConcurrent = 0;
  }
}

describe('Performance: Load Testing', () => {
  let apiService: ApiService;
  let timer: PerformanceTimer;

  beforeEach(() => {
    apiService = new ApiService();
    timer = new PerformanceTimer();
  });

  afterEach(() => {
    apiService.reset();
  });

  it('should handle multiple concurrent requests', async () => {
    const userIds = Array.from({ length: 50 }, (_, i) => `user-${i}`);

    timer.start();
    const results = await Promise.all(
      userIds.slice(0, 10).map(id => apiService.fetchUser(id))
    );
    const duration = timer.stop();

    expect(results).toHaveLength(10);
    expect(duration).toBeLessThan(200); // Should handle concurrency efficiently
  });

  it('should batch large number of requests', async () => {
    const userIds = Array.from({ length: 100 }, (_, i) => `user-${i}`);

    timer.start();
    const results = await apiService.batchFetchUsers(userIds);
    const duration = timer.stop();

    expect(results).toHaveLength(100);
    // Batching should complete in reasonable time
    expect(duration).toBeLessThan(3000);
  });

  it('should track request throughput', async () => {
    const requests = 20;
    const userIds = Array.from({ length: requests }, (_, i) => `user-${i}`);

    timer.start();
    await Promise.all(userIds.slice(0, 10).map(id => apiService.fetchUser(id)));
    const duration = timer.stop();

    const throughput = (10 / duration) * 1000; // requests per second

    // Should handle reasonable throughput
    expect(throughput).toBeGreaterThan(50); // At least 50 req/s
  });
});

// ============================================================================
// 3. STRESS TESTING - Breaking Point Analysis
// ============================================================================

class ResourcePool {
  private available: number;
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
    this.available = maxSize;
  }

  acquire(): boolean {
    if (this.available > 0) {
      this.available--;
      return true;
    }
    return false;
  }

  release(): void {
    if (this.available < this.maxSize) {
      this.available++;
    }
  }

  getAvailable(): number {
    return this.available;
  }

  getUtilization(): number {
    return ((this.maxSize - this.available) / this.maxSize) * 100;
  }
}

class WorkloadSimulator {
  private resourcePool: ResourcePool;
  private successCount: number = 0;
  private failureCount: number = 0;

  constructor(poolSize: number) {
    this.resourcePool = new ResourcePool(poolSize);
  }

  async simulateRequest(): Promise<boolean> {
    const acquired = this.resourcePool.acquire();

    if (!acquired) {
      this.failureCount++;
      return false;
    }

    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 10));

    this.resourcePool.release();
    this.successCount++;
    return true;
  }

  async runWorkload(concurrentRequests: number): Promise<{
    success: number;
    failure: number;
    utilization: number;
  }> {
    const requests = Array.from(
      { length: concurrentRequests },
      () => this.simulateRequest()
    );

    await Promise.all(requests);

    return {
      success: this.successCount,
      failure: this.failureCount,
      utilization: this.resourcePool.getUtilization(),
    };
  }

  reset(): void {
    this.successCount = 0;
    this.failureCount = 0;
  }
}

describe('Performance: Stress Testing', () => {
  it('should handle load within capacity', async () => {
    const simulator = new WorkloadSimulator(100);
    const result = await simulator.runWorkload(50);

    expect(result.success).toBe(50);
    expect(result.failure).toBe(0);
    expect(result.utilization).toBeLessThan(100);
  });

  it('should identify breaking point', async () => {
    const simulator = new WorkloadSimulator(50);
    const result = await simulator.runWorkload(100);

    // Some requests should fail when exceeding capacity
    expect(result.failure).toBeGreaterThan(0);
    expect(result.success).toBeLessThan(100);
  });

  it('should measure system degradation', async () => {
    const results: number[] = [];

    for (let load = 10; load <= 100; load += 10) {
      const simulator = new WorkloadSimulator(50);
      const timer = new PerformanceTimer();

      timer.start();
      await simulator.runWorkload(load);
      const duration = timer.stop();

      results.push(duration);
    }

    // Response time should increase with load
    expect(results[results.length - 1]).toBeGreaterThan(results[0]);
  });
});

// ============================================================================
// 4. MEMORY PERFORMANCE TESTS
// ============================================================================

class DataCache<T> {
  private cache: Map<string, T> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry (first key)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }

  getMemoryUsage(): number {
    // Rough estimate of memory usage
    let size = 0;
    for (const [key, value] of this.cache) {
      size += key.length * 2; // 2 bytes per char
      size += JSON.stringify(value).length * 2;
    }
    return size;
  }
}

describe('Performance: Memory Tests', () => {
  let cache: DataCache<any>;

  beforeEach(() => {
    cache = new DataCache(1000);
  });

  afterEach(() => {
    cache.clear();
  });

  it('should respect memory limits', () => {
    // Add more items than max size
    for (let i = 0; i < 1500; i++) {
      cache.set(`key-${i}`, { data: `value-${i}` });
    }

    // Should not exceed max size
    expect(cache.size()).toBe(1000);
  });

  it('should handle large data efficiently', () => {
    const largeObject = {
      data: Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      })),
    };

    const timer = new PerformanceTimer();
    timer.start();

    cache.set('large-data', largeObject);
    const retrieved = cache.get('large-data');

    const duration = timer.stop();

    expect(retrieved).toBeDefined();
    expect(duration).toBeLessThan(50); // Should be fast
  });

  it('should track memory usage', () => {
    // Add items and check memory growth
    for (let i = 0; i < 100; i++) {
      cache.set(`key-${i}`, { data: `value-${i}` });
    }

    const memoryUsage = cache.getMemoryUsage();
    expect(memoryUsage).toBeGreaterThan(0);
  });

  it('should clear memory when cleared', () => {
    for (let i = 0; i < 100; i++) {
      cache.set(`key-${i}`, { data: `value-${i}` });
    }

    const beforeClear = cache.getMemoryUsage();
    cache.clear();
    const afterClear = cache.getMemoryUsage();

    expect(afterClear).toBe(0);
    expect(beforeClear).toBeGreaterThan(afterClear);
  });
});

// ============================================================================
// 5. DATABASE QUERY PERFORMANCE
// ============================================================================

interface QueryStats {
  executionTime: number;
  rowsReturned: number;
  rowsScanned: number;
}

class QueryOptimizer {
  private data: Array<{ id: number; name: string; age: number; email: string }>;

  constructor() {
    // Generate test data
    this.data = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      age: 20 + (i % 50),
      email: `user${i}@example.com`,
    }));
  }

  // Unoptimized query - scans all rows
  queryUnoptimized(ageFilter: number): { results: any[]; stats: QueryStats } {
    const timer = new PerformanceTimer();
    timer.start();

    const results = this.data.filter(row => row.age > ageFilter);

    const executionTime = timer.stop();

    return {
      results,
      stats: {
        executionTime,
        rowsReturned: results.length,
        rowsScanned: this.data.length,
      },
    };
  }

  // Optimized query with index simulation
  queryOptimized(ageFilter: number): { results: any[]; stats: QueryStats } {
    const timer = new PerformanceTimer();
    timer.start();

    // Simulate indexed lookup - only scan relevant rows
    const estimatedRows = Math.ceil(this.data.length * 0.3);
    const results = this.data
      .slice(0, estimatedRows)
      .filter(row => row.age > ageFilter);

    const executionTime = timer.stop();

    return {
      results,
      stats: {
        executionTime,
        rowsReturned: results.length,
        rowsScanned: estimatedRows,
      },
    };
  }

  // Batch query
  queryBatch(ids: number[]): { results: any[]; stats: QueryStats } {
    const timer = new PerformanceTimer();
    timer.start();

    const idSet = new Set(ids);
    const results = this.data.filter(row => idSet.has(row.id));

    const executionTime = timer.stop();

    return {
      results,
      stats: {
        executionTime,
        rowsReturned: results.length,
        rowsScanned: this.data.length,
      },
    };
  }
}

describe('Performance: Database Query Optimization', () => {
  let optimizer: QueryOptimizer;

  beforeEach(() => {
    optimizer = new QueryOptimizer();
  });

  it('should demonstrate optimization benefit', () => {
    const unoptimized = optimizer.queryUnoptimized(30);
    const optimized = optimizer.queryOptimized(30);

    // Optimized should be faster
    expect(optimized.stats.executionTime).toBeLessThan(
      unoptimized.stats.executionTime
    );

    // Optimized should scan fewer rows
    expect(optimized.stats.rowsScanned).toBeLessThan(
      unoptimized.stats.rowsScanned
    );
  });

  it('should measure query performance metrics', () => {
    const result = optimizer.queryUnoptimized(40);

    expect(result.stats.executionTime).toBeDefined();
    expect(result.stats.rowsReturned).toBeGreaterThan(0);
    expect(result.stats.rowsScanned).toBe(10000);

    // Calculate efficiency
    const efficiency = (result.stats.rowsReturned / result.stats.rowsScanned) * 100;
    expect(efficiency).toBeLessThan(100);
  });

  it('should optimize batch queries', () => {
    const ids = Array.from({ length: 100 }, (_, i) => i * 10);

    const timer = new PerformanceTimer();
    timer.start();
    const result = optimizer.queryBatch(ids);
    const duration = timer.stop();

    expect(result.results).toHaveLength(100);
    expect(duration).toBeLessThan(50); // Should be fast with Set lookup
  });
});

// ============================================================================
// 6. ALGORITHM PERFORMANCE COMPARISON
// ============================================================================

class SortingBenchmark {
  // Bubble sort - O(n²)
  bubbleSort(arr: number[]): { sorted: number[]; comparisons: number } {
    const data = [...arr];
    let comparisons = 0;

    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data.length - i - 1; j++) {
        comparisons++;
        if (data[j] > data[j + 1]) {
          [data[j], data[j + 1]] = [data[j + 1], data[j]];
        }
      }
    }

    return { sorted: data, comparisons };
  }

  // Quick sort - O(n log n)
  quickSort(arr: number[]): { sorted: number[]; comparisons: number } {
    let comparisons = 0;

    const sort = (data: number[]): number[] => {
      if (data.length <= 1) return data;

      const pivot = data[Math.floor(data.length / 2)];
      const left = data.filter(x => {
        comparisons++;
        return x < pivot;
      });
      const middle = data.filter(x => {
        comparisons++;
        return x === pivot;
      });
      const right = data.filter(x => {
        comparisons++;
        return x > pivot;
      });

      return [...sort(left), ...middle, ...sort(right)];
    };

    return { sorted: sort([...arr]), comparisons };
  }

  // Native sort
  nativeSort(arr: number[]): number[] {
    return [...arr].sort((a, b) => a - b);
  }
}

describe('Performance: Algorithm Comparison', () => {
  let benchmark: SortingBenchmark;

  beforeEach(() => {
    benchmark = new SortingBenchmark();
  });

  it('should compare sorting algorithms on small dataset', () => {
    const data = [5, 2, 8, 1, 9, 3, 7, 4, 6];

    const timer = new PerformanceTimer();

    timer.start();
    const bubble = benchmark.bubbleSort(data);
    const bubbleTime = timer.stop();

    timer.start();
    const quick = benchmark.quickSort(data);
    const quickTime = timer.stop();

    // Quick sort should use fewer comparisons
    expect(quick.comparisons).toBeLessThan(bubble.comparisons);

    // Both should produce correct result
    expect(bubble.sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(quick.sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should show performance difference on larger dataset', () => {
    const data = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000));
    const timer = new PerformanceTimer();

    timer.start();
    const bubble = benchmark.bubbleSort(data);
    const bubbleTime = timer.stop();

    timer.start();
    const quick = benchmark.quickSort(data);
    const quickTime = timer.stop();

    timer.start();
    const native = benchmark.nativeSort(data);
    const nativeTime = timer.stop();

    // Quick sort should be faster than bubble sort
    expect(quickTime).toBeLessThan(bubbleTime);

    // Native sort should be competitive
    expect(nativeTime).toBeLessThan(bubbleTime);

    // Log performance metrics
    console.log('Performance Comparison:');
    console.log(`Bubble Sort: ${bubbleTime.toFixed(2)}ms (${bubble.comparisons} comparisons)`);
    console.log(`Quick Sort: ${quickTime.toFixed(2)}ms (${quick.comparisons} comparisons)`);
    console.log(`Native Sort: ${nativeTime.toFixed(2)}ms`);
  });

  it('should measure scalability', () => {
    const sizes = [10, 50, 100, 200];
    const results: Array<{ size: number; time: number }> = [];

    for (const size of sizes) {
      const data = Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
      const timer = new PerformanceTimer();

      timer.start();
      benchmark.quickSort(data);
      const time = timer.stop();

      results.push({ size, time });
    }

    // Time should grow sub-quadratically for quick sort
    const timeRatio = results[results.length - 1].time / results[0].time;
    const sizeRatio = sizes[sizes.length - 1] / sizes[0];

    expect(timeRatio).toBeLessThan(sizeRatio * sizeRatio); // Better than O(n²)
  });
});

export {};
