/**
 * Metrics Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MetricsRegistry,
  createHttpMetrics,
  createDatabaseMetrics,
  createSystemMetrics,
} from '../metrics';

describe('MetricsRegistry', () => {
  let registry: MetricsRegistry;

  beforeEach(() => {
    registry = new MetricsRegistry('test_');
  });

  describe('Counter', () => {
    it('should increment counter', () => {
      const counter = registry.counter({
        name: 'requests_total',
        help: 'Total requests',
      });

      counter.inc();
      expect(counter.get()).toBe(1);

      counter.inc(5);
      expect(counter.get()).toBe(6);
    });

    it('should support labels', () => {
      const counter = registry.counter({
        name: 'requests_total',
        help: 'Total requests',
        labels: ['method', 'status'],
      });

      counter.inc(1, { method: 'GET', status: 200 });
      counter.inc(2, { method: 'POST', status: 201 });

      expect(counter.get({ method: 'GET', status: 200 })).toBe(1);
      expect(counter.get({ method: 'POST', status: 201 })).toBe(2);
    });

    it('should export Prometheus format', () => {
      const counter = registry.counter({
        name: 'requests_total',
        help: 'Total requests',
      });

      counter.inc(5);

      const output = registry.export();
      expect(output).toContain('# HELP test_requests_total Total requests');
      expect(output).toContain('# TYPE test_requests_total counter');
      expect(output).toContain('test_requests_total 5');
    });
  });

  describe('Gauge', () => {
    it('should set gauge value', () => {
      const gauge = registry.gauge({
        name: 'temperature',
        help: 'Current temperature',
      });

      gauge.set(25);
      expect(gauge.get()).toBe(25);

      gauge.set(30);
      expect(gauge.get()).toBe(30);
    });

    it('should increment and decrement', () => {
      const gauge = registry.gauge({
        name: 'connections',
        help: 'Active connections',
      });

      gauge.set(10);
      gauge.inc(5);
      expect(gauge.get()).toBe(15);

      gauge.dec(3);
      expect(gauge.get()).toBe(12);
    });

    it('should support labels', () => {
      const gauge = registry.gauge({
        name: 'queue_size',
        help: 'Queue size',
        labels: ['queue'],
      });

      gauge.set(10, { queue: 'email' });
      gauge.set(5, { queue: 'sms' });

      expect(gauge.get({ queue: 'email' })).toBe(10);
      expect(gauge.get({ queue: 'sms' })).toBe(5);
    });
  });

  describe('Histogram', () => {
    it('should observe values', () => {
      const histogram = registry.histogram({
        name: 'request_duration',
        help: 'Request duration',
      });

      histogram.observe(0.1);
      histogram.observe(0.5);
      histogram.observe(1.0);

      const data = histogram.get();
      expect(data.count).toBe(3);
      expect(data.sum).toBeCloseTo(1.6);
    });

    it('should track buckets', () => {
      const histogram = registry.histogram(
        {
          name: 'request_duration',
          help: 'Request duration',
        },
        [0.1, 0.5, 1.0]
      );

      histogram.observe(0.05);
      histogram.observe(0.3);
      histogram.observe(0.8);
      histogram.observe(1.5);

      const data = histogram.get();
      expect(data.buckets.get(0.1)).toBe(1); // 0.05
      expect(data.buckets.get(0.5)).toBe(2); // 0.05, 0.3
      expect(data.buckets.get(1.0)).toBe(3); // 0.05, 0.3, 0.8
      expect(data.buckets.get(Infinity)).toBe(4); // all values
    });

    it('should export Prometheus format', () => {
      const histogram = registry.histogram(
        {
          name: 'request_duration',
          help: 'Request duration',
        },
        [0.5, 1.0]
      );

      histogram.observe(0.3);
      histogram.observe(0.7);

      const output = registry.export();
      expect(output).toContain('# TYPE test_request_duration histogram');
      expect(output).toContain('test_request_duration_bucket{le="0.5"}');
      expect(output).toContain('test_request_duration_sum');
      expect(output).toContain('test_request_duration_count');
    });
  });

  describe('Summary', () => {
    it('should observe values and calculate quantiles', () => {
      const summary = registry.summary(
        {
          name: 'response_time',
          help: 'Response time',
        },
        [0.5, 0.9, 0.99]
      );

      for (let i = 1; i <= 100; i++) {
        summary.observe(i);
      }

      const data = summary.get();
      expect(data.count).toBe(100);
      expect(data.sum).toBe(5050); // 1+2+...+100 = 5050

      // 检查分位数
      expect(data.quantiles.get(0.5)).toBeGreaterThanOrEqual(40);
      expect(data.quantiles.get(0.5)).toBeLessThanOrEqual(60);
      expect(data.quantiles.get(0.9)).toBeGreaterThanOrEqual(85);
      expect(data.quantiles.get(0.99)).toBeGreaterThanOrEqual(95);
    });
  });

  describe('HTTP Metrics', () => {
    it('should create HTTP metrics', () => {
      const httpMetrics = createHttpMetrics(registry);

      expect(httpMetrics.requestCount).toBeDefined();
      expect(httpMetrics.requestDuration).toBeDefined();
      expect(httpMetrics.requestSize).toBeDefined();
      expect(httpMetrics.responseSize).toBeDefined();
      expect(httpMetrics.activeRequests).toBeDefined();
    });

    it('should track HTTP requests', () => {
      const httpMetrics = createHttpMetrics(registry);

      httpMetrics.activeRequests.inc(1, { method: 'GET', path: '/users' });
      httpMetrics.requestCount.inc(1, {
        method: 'GET',
        path: '/users',
        status: '200',
      });
      httpMetrics.requestDuration.observe(0.123, {
        method: 'GET',
        path: '/users',
        status: '200',
      });

      expect(httpMetrics.activeRequests.get({ method: 'GET', path: '/users' })).toBe(1);
      expect(
        httpMetrics.requestCount.get({
          method: 'GET',
          path: '/users',
          status: '200',
        })
      ).toBe(1);
    });
  });

  describe('Database Metrics', () => {
    it('should create database metrics', () => {
      const dbMetrics = createDatabaseMetrics(registry);

      expect(dbMetrics.queryCount).toBeDefined();
      expect(dbMetrics.queryDuration).toBeDefined();
      expect(dbMetrics.connectionPoolSize).toBeDefined();
      expect(dbMetrics.connectionPoolActive).toBeDefined();
      expect(dbMetrics.connectionPoolIdle).toBeDefined();
    });

    it('should track database queries', () => {
      const dbMetrics = createDatabaseMetrics(registry);

      dbMetrics.queryCount.inc(1, {
        operation: 'SELECT',
        table: 'users',
        status: 'success',
      });

      dbMetrics.queryDuration.observe(0.05, {
        operation: 'SELECT',
        table: 'users',
      });

      dbMetrics.connectionPoolSize.set(10);
      dbMetrics.connectionPoolActive.set(3);
      dbMetrics.connectionPoolIdle.set(7);

      expect(
        dbMetrics.queryCount.get({
          operation: 'SELECT',
          table: 'users',
          status: 'success',
        })
      ).toBe(1);
      expect(dbMetrics.connectionPoolSize.get()).toBe(10);
    });
  });

  describe('Registry Management', () => {
    it('should reset all metrics', () => {
      const counter = registry.counter({
        name: 'test_counter',
        help: 'Test counter',
      });

      counter.inc(5);
      expect(counter.get()).toBe(5);

      registry.reset();
      expect(counter.get()).toBe(0);
    });

    it('should count metrics', () => {
      registry.counter({ name: 'counter1', help: 'Counter 1' });
      registry.gauge({ name: 'gauge1', help: 'Gauge 1' });
      registry.histogram({ name: 'histogram1', help: 'Histogram 1' });

      expect(registry.getMetricCount()).toBe(3);
    });

    it('should use prefix', () => {
      const prefixedRegistry = new MetricsRegistry('myapp_');
      const counter = prefixedRegistry.counter({
        name: 'requests',
        help: 'Requests',
      });

      counter.inc(1);

      const output = prefixedRegistry.export();
      expect(output).toContain('myapp_requests');
    });
  });
});
