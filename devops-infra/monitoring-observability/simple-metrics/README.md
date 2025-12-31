# Simple Metrics - Observability Library

A lightweight observability library providing metrics, logging, tracing, and health checks for Node.js applications.

## Features

- **Metrics**: Prometheus-compatible counters, gauges, and histograms
- **Logging**: Structured logging with context and trace correlation
- **Tracing**: Distributed tracing with spans and context propagation
- **Health Checks**: Readiness and liveness probes

## Quick Start

```bash
pnpm install
pnpm example
```

## Usage

### Metrics

```typescript
import { Counter, Gauge, Histogram, formatMetrics } from '@vibe/simple-metrics';

// Counter - only increases
const requests = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  type: 'counter',
  labels: ['method', 'status'],
});

requests.inc({ method: 'GET', status: '200' });

// Gauge - can go up or down
const connections = new Gauge({
  name: 'active_connections',
  help: 'Current connections',
  type: 'gauge',
});

connections.set(10);
connections.inc();
connections.dec();

// Histogram - distribution of values
const duration = new Histogram({
  name: 'request_duration_seconds',
  help: 'Request duration',
  type: 'histogram',
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
});

const end = duration.startTimer();
// ... do work ...
end(); // Records duration

// Export as Prometheus format
console.log(formatMetrics());
```

### Logging

```typescript
import { logger } from '@vibe/simple-metrics';

// Configure
logger.setLevel('debug');
logger.setDefaultContext({ service: 'my-app' });

// Log levels
logger.debug('Debug message');
logger.info('User logged in', { userId: '123' });
logger.warn('Rate limit approaching');
logger.error('Database connection failed', { error: err.message });

// Child logger with context
const userLogger = logger.child({ module: 'users' });
userLogger.info('User created', { userId: '456' });
```

### Tracing

```typescript
import { Tracer } from '@vibe/simple-metrics';

const tracer = new Tracer('my-service');

// Manual spans
const span = tracer.startSpan('operation');
span.setAttribute('key', 'value');
span.addEvent('event_name');
// ... do work ...
span.end();

// Async wrapper
const result = await tracer.trace('process', async (span) => {
  span.setAttribute('order.id', orderId);

  // Nested span
  await tracer.trace('database.query', async (dbSpan) => {
    dbSpan.setAttribute('db.type', 'postgresql');
    await db.query('SELECT ...');
  }, span.context);

  return result;
});

// Express middleware
app.use(tracer.middleware());
```

### Health Checks

```typescript
import {
  registerHealthCheck,
  runHealthChecks,
  healthCheckFactories
} from '@vibe/simple-metrics';

// Built-in checks
registerHealthCheck('memory', healthCheckFactories.memory(90));
registerHealthCheck('api', healthCheckFactories.http('http://api.example.com/health'));

// Custom check
registerHealthCheck('database', async () => {
  const connected = await db.ping();
  return {
    status: connected ? 'healthy' : 'unhealthy',
    message: connected ? 'Connected' : 'Disconnected',
  };
});

// Run all checks
const status = await runHealthChecks();
// { status: 'healthy', checks: { memory: {...}, database: {...} } }
```

## Express Integration

```typescript
import express from 'express';
import {
  formatMetrics,
  Tracer,
  runHealthChecks,
  livenessCheck
} from '@vibe/simple-metrics';

const app = express();
const tracer = new Tracer('my-app');

// Add tracing middleware
app.use(tracer.middleware());

// Metrics endpoint (for Prometheus scraping)
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(formatMetrics());
});

// Health endpoints
app.get('/health/live', async (req, res) => {
  const result = await livenessCheck();
  res.status(result.status === 'healthy' ? 200 : 503).json(result);
});

app.get('/health/ready', async (req, res) => {
  const status = await runHealthChecks();
  res.status(status.status === 'healthy' ? 200 : 503).json(status);
});
```

## Metric Types

### Counter
- Only increases (or resets)
- Use for: requests, errors, completions

### Gauge
- Can increase or decrease
- Use for: temperature, queue size, connections

### Histogram
- Distribution of values in buckets
- Use for: response times, request sizes

## Prometheus Output

```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 150
http_requests_total{method="POST",status="201"} 42

# HELP active_connections Current active connections
# TYPE active_connections gauge
active_connections 25

# HELP request_duration_seconds Request duration
# TYPE request_duration_seconds histogram
request_duration_seconds_bucket{le="0.01"} 5
request_duration_seconds_bucket{le="0.05"} 22
request_duration_seconds_bucket{le="0.1"} 45
request_duration_seconds_bucket{le="+Inf"} 50
request_duration_seconds_sum 2.5
request_duration_seconds_count 50
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application                            │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Metrics  │  │ Logging  │  │ Tracing  │  │  Health  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       │             │             │             │          │
│       ▼             ▼             ▼             ▼          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Prometheus│  │   JSON   │  │  Spans   │  │ Probes   │   │
│  │  Format  │  │   Logs   │  │  Export  │  │ Results  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
           ┌──────────────────────────┐
           │   Monitoring Backend     │
           │  (Prometheus, Grafana,   │
           │   Jaeger, etc.)          │
           └──────────────────────────┘
```

## Best Practices

1. **Use labels wisely** - High cardinality labels increase memory usage
2. **Name metrics clearly** - Follow Prometheus naming conventions
3. **Add context to logs** - Include request ID, user ID, etc.
4. **Propagate trace context** - Pass context to child operations
5. **Register health checks** - Check all critical dependencies

## Resources

- [Prometheus](https://prometheus.io/)
- [OpenTelemetry](https://opentelemetry.io/)
- [Grafana](https://grafana.com/)
- [Jaeger](https://www.jaegertracing.io/)

## License

MIT
