/**
 * Observability Example
 *
 * Demonstrates:
 * 1. Metrics collection (counters, gauges, histograms)
 * 2. Structured logging
 * 3. Distributed tracing
 * 4. Health checks
 */

import {
  Counter,
  Gauge,
  Histogram,
  formatMetrics,
  logger,
  Tracer,
  registerHealthCheck,
  runHealthChecks,
  healthCheckFactories,
} from './index.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Observability Example');
  console.log('='.repeat(60));

  // =========================================
  // 1. Metrics
  // =========================================
  console.log('\n📊 METRICS\n');

  // Counter - tracks total count
  const requestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    type: 'counter',
    labels: ['method', 'path', 'status'],
  });

  // Simulate some requests
  requestCounter.inc({ method: 'GET', path: '/api/users', status: '200' });
  requestCounter.inc({ method: 'GET', path: '/api/users', status: '200' });
  requestCounter.inc({ method: 'POST', path: '/api/users', status: '201' });
  requestCounter.inc({ method: 'GET', path: '/api/users', status: '500' });

  console.log('Request counter values:');
  console.log('  GET /api/users 200:', requestCounter.get({ method: 'GET', path: '/api/users', status: '200' }));
  console.log('  POST /api/users 201:', requestCounter.get({ method: 'POST', path: '/api/users', status: '201' }));

  // Gauge - tracks current value
  const activeConnections = new Gauge({
    name: 'active_connections',
    help: 'Current active connections',
    type: 'gauge',
  });

  activeConnections.set(10);
  activeConnections.inc({}, 5);
  activeConnections.dec({}, 3);
  console.log('\nActive connections:', activeConnections.get());

  // Histogram - tracks distribution
  const responseTime = new Histogram({
    name: 'http_response_time_seconds',
    help: 'HTTP response time in seconds',
    type: 'histogram',
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  });

  // Simulate response times
  responseTime.observe(0.025);
  responseTime.observe(0.15);
  responseTime.observe(0.08);
  responseTime.observe(0.5);
  responseTime.observe(2.1);

  const histData = responseTime.get();
  console.log('\nResponse time histogram:');
  console.log('  Count:', histData?.count);
  console.log('  Sum:', histData?.sum.toFixed(3), 's');
  console.log('  Avg:', histData ? (histData.sum / histData.count).toFixed(3) : 0, 's');

  // =========================================
  // 2. Logging
  // =========================================
  console.log('\n📝 LOGGING\n');

  logger.setLevel('debug');
  logger.setDefaultContext({ service: 'example-app', version: '1.0.0' });

  logger.debug('Debug message', { detail: 'some debug info' });
  logger.info('Application started', { port: 3000 });
  logger.warn('Deprecated API used', { endpoint: '/api/v1/old' });
  logger.error('Database connection failed', { host: 'localhost', error: 'ECONNREFUSED' });

  // Child logger with context
  const userLogger = logger.child({ module: 'users' });
  userLogger.info('User created', { userId: 'user_123' });

  // =========================================
  // 3. Tracing
  // =========================================
  console.log('\n🔍 TRACING\n');

  const tracer = new Tracer('example-service');

  // Simulate a traced operation
  const result = await tracer.trace('process_order', async (span) => {
    span.setAttribute('order.id', 'order_456');

    // Simulate database query
    await tracer.trace('database.query', async (dbSpan) => {
      dbSpan.setAttribute('db.type', 'postgresql');
      dbSpan.setAttribute('db.statement', 'SELECT * FROM orders');
      await new Promise((r) => setTimeout(r, 50));
    }, span.context);

    // Simulate external API call
    await tracer.trace('external.api', async (apiSpan) => {
      apiSpan.setAttribute('http.method', 'POST');
      apiSpan.setAttribute('http.url', 'https://api.payment.com/charge');
      apiSpan.addEvent('request_sent');
      await new Promise((r) => setTimeout(r, 100));
      apiSpan.addEvent('response_received');
    }, span.context);

    return { success: true };
  });

  console.log('Trace result:', result);

  // =========================================
  // 4. Health Checks
  // =========================================
  console.log('\n🏥 HEALTH CHECKS\n');

  // Register health checks
  registerHealthCheck('memory', healthCheckFactories.memory(90));

  registerHealthCheck('database', async () => ({
    status: 'healthy',
    message: 'Connected',
    details: { latency: '5ms' },
  }));

  registerHealthCheck('cache', async () => ({
    status: 'degraded',
    message: 'High latency',
    details: { latency: '150ms' },
  }));

  const healthStatus = await runHealthChecks();
  console.log('Health status:', healthStatus.status);
  console.log('Checks:');
  for (const [name, check] of Object.entries(healthStatus.checks)) {
    console.log(`  ${name}: ${check.status} - ${check.message}`);
  }

  // =========================================
  // 5. Prometheus Metrics Output
  // =========================================
  console.log('\n📈 PROMETHEUS METRICS\n');
  console.log(formatMetrics());

  console.log('='.repeat(60));
  console.log('Example completed!');
}

main().catch(console.error);
