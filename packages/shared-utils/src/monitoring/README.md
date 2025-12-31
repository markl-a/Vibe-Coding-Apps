# 监控和可观测性工具

完整的监控和可观测性解决方案，包含指标收集、分布式追踪和告警系统。

## 功能特性

### 📊 指标收集 (Metrics)
- **Prometheus 格式**：兼容 Prometheus 的指标导出
- **多种指标类型**：Counter、Gauge、Histogram、Summary
- **预定义指标**：HTTP、数据库、系统资源、业务指标
- **自定义标签**：支持多维度指标

### 🔍 分布式追踪 (Tracing)
- **OpenTelemetry 标准**：遵循 OpenTelemetry 规范
- **上下文传播**：自动传播追踪上下文
- **装饰器支持**：简化追踪代码
- **多种导出器**：Console、HTTP、批量导出

### 🚨 告警系统 (Alerts)
- **规则引擎**：灵活的告警规则配置
- **多级别告警**：INFO、WARNING、ERROR、CRITICAL
- **多通道通知**：Console、Email、Webhook、Slack
- **冷却机制**：防止告警风暴

## 安装

```bash
npm install @vibe/shared-utils
```

## 快速开始

### 1. 指标收集

```typescript
import {
  MetricsRegistry,
  createHttpMetrics,
  createSystemMetrics,
} from '@vibe/shared-utils/monitoring';

// 创建注册中心
const registry = new MetricsRegistry('myapp_');

// 创建 HTTP 指标
const httpMetrics = createHttpMetrics(registry);

// 记录请求
httpMetrics.requestCount.inc(1, {
  method: 'GET',
  path: '/api/users',
  status: '200',
});

httpMetrics.requestDuration.observe(0.123, {
  method: 'GET',
  path: '/api/users',
  status: '200',
});

// 导出 Prometheus 格式
console.log(registry.export());
```

### 2. 分布式追踪

```typescript
import {
  configureTracer,
  traceAsync,
  SpanKind,
  ConsoleSpanExporter,
} from '@vibe/shared-utils/monitoring';

// 配置 tracer
configureTracer({
  exporter: new ConsoleSpanExporter(),
  sampleRate: 1.0,
});

// 追踪异步操作
await traceAsync('processOrder', async (span) => {
  span.setAttribute('orderId', '12345');

  // 执行业务逻辑
  await processPayment();

  span.addEvent('payment_completed');
}, { kind: SpanKind.SERVER });
```

### 3. 告警系统

```typescript
import {
  AlertManager,
  alert,
  AlertSeverity,
  consoleAlertHandler,
} from '@vibe/shared-utils/monitoring';

// 创建告警管理器
const alertManager = new AlertManager();

// 添加处理器
alertManager.addHandler(consoleAlertHandler);

// 创建告警规则
const rule = alert()
  .name('high_cpu')
  .greaterThan(80)
  .severity(AlertSeverity.WARNING)
  .message('CPU usage is above 80%')
  .cooldown(300000)
  .build();

alertManager.addRule(rule);

// 检查并触发告警
await alertManager.check('high_cpu', 85);
```

## 详细使用

### HTTP 监控

```typescript
import { createHttpMetrics } from '@vibe/shared-utils/monitoring';

const httpMetrics = createHttpMetrics(registry);

// 在请求处理前
const startTime = Date.now();
httpMetrics.activeRequests.inc(1, { method, path });

// 在请求处理后
const duration = (Date.now() - startTime) / 1000;
httpMetrics.requestCount.inc(1, { method, path, status });
httpMetrics.requestDuration.observe(duration, { method, path, status });
httpMetrics.requestSize.observe(requestSize, { method, path });
httpMetrics.responseSize.observe(responseSize, { method, path });
httpMetrics.activeRequests.dec(1, { method, path });
```

### 数据库监控

```typescript
import { createDatabaseMetrics } from '@vibe/shared-utils/monitoring';

const dbMetrics = createDatabaseMetrics(registry);

// 记录查询
const startTime = Date.now();
try {
  await db.query(sql);
  const duration = (Date.now() - startTime) / 1000;

  dbMetrics.queryCount.inc(1, {
    operation: 'SELECT',
    table: 'users',
    status: 'success',
  });

  dbMetrics.queryDuration.observe(duration, {
    operation: 'SELECT',
    table: 'users',
  });
} catch (error) {
  dbMetrics.queryCount.inc(1, {
    operation: 'SELECT',
    table: 'users',
    status: 'error',
  });
}

// 更新连接池状态
dbMetrics.connectionPoolSize.set(10);
dbMetrics.connectionPoolActive.set(3);
dbMetrics.connectionPoolIdle.set(7);
```

### 系统监控

```typescript
import { createSystemMetrics } from '@vibe/shared-utils/monitoring';

// 系统指标会自动收集
const systemMetrics = createSystemMetrics(registry);

// 指标包括：
// - CPU 使用率
// - 内存使用情况
// - 堆内存统计
// - 事件循环延迟
```

### 自定义业务指标

```typescript
import { createBusinessMetrics } from '@vibe/shared-utils/monitoring';

const businessMetrics = createBusinessMetrics(registry);

// 用户注册
businessMetrics.userSignups.inc(1, { source: 'google' });

// 订单
businessMetrics.orders.inc(1, {
  status: 'completed',
  payment_method: 'credit_card',
});

// 收入
businessMetrics.revenue.inc(99.99, { currency: 'USD' });

// 活跃用户
businessMetrics.activeUsers.set(1234);
```

### 使用装饰器追踪

```typescript
import { traceHttp, traceDatabase, trace } from '@vibe/shared-utils/monitoring';

class UserController {
  @traceHttp({ name: 'GET /users' })
  async getUsers(req: any, res: any) {
    return await this.userService.findAll();
  }
}

class UserRepository {
  @traceDatabase({ operation: 'SELECT' })
  async findAll(sql: string) {
    return await db.query(sql);
  }
}

class OrderService {
  @trace('processOrder')
  async processOrder(orderId: string) {
    // 业务逻辑
  }
}
```

### 上下文传播

```typescript
import {
  defaultTracer,
  extractTraceparent,
  injectTraceparent,
  parseTraceparent,
} from '@vibe/shared-utils/monitoring';

// 在客户端注入追踪上下文
const headers: Record<string, string> = {};
injectTraceparent(headers);

// 发送请求
await fetch('https://api.example.com', { headers });

// 在服务端提取追踪上下文
const traceparent = req.headers['traceparent'];
if (traceparent) {
  const context = parseTraceparent(traceparent);
  // 使用 context 创建子 span
}
```

### 告警处理器

```typescript
import {
  SlackAlertHandler,
  WebhookAlertHandler,
  EmailAlertHandler,
} from '@vibe/shared-utils/monitoring';

const alertManager = new AlertManager();

// Slack 通知
alertManager.addHandler(
  new SlackAlertHandler('https://hooks.slack.com/services/...')
);

// Webhook 通知
alertManager.addHandler(
  new WebhookAlertHandler('https://api.example.com/alerts', {
    'Authorization': 'Bearer token',
  })
);

// 邮件通知
alertManager.addHandler(
  new EmailAlertHandler({
    to: ['admin@example.com'],
    from: 'alerts@example.com',
  })
);
```

### 预定义告警规则

```typescript
import { addCommonRules } from '@vibe/shared-utils/monitoring';

// 添加常用告警规则
addCommonRules(alertManager);

// 包含的规则：
// - high_cpu_usage (>80%)
// - critical_cpu_usage (>95%)
// - high_memory_usage (>80%)
// - critical_memory_usage (>95%)
// - high_error_rate (>5%)
// - critical_error_rate (>10%)
// - slow_response (>1s)
// - very_slow_response (>3s)
// - db_pool_exhausted (<2)
// - event_loop_lag (>100ms)
```

## Express 集成示例

```typescript
import express from 'express';
import {
  MetricsRegistry,
  createHttpMetrics,
  createSystemMetrics,
  AlertManager,
  addCommonRules,
  consoleAlertHandler,
  defaultTracer,
  SpanKind,
  SpanStatus,
} from '@vibe/shared-utils/monitoring';

const app = express();
const registry = new MetricsRegistry('myapp_');
const httpMetrics = createHttpMetrics(registry);
const systemMetrics = createSystemMetrics(registry);
const alertManager = new AlertManager();

// 配置告警
addCommonRules(alertManager);
alertManager.addHandler(consoleAlertHandler);

// 监控中间件
app.use((req, res, next) => {
  const startTime = Date.now();
  const { method, path } = req;

  httpMetrics.activeRequests.inc(1, { method, path });

  const span = defaultTracer.startSpan(`HTTP ${method} ${path}`, {
    kind: SpanKind.SERVER,
  });

  span.setAttribute('http.method', method);
  span.setAttribute('http.url', req.url);

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const status = res.statusCode.toString();

    httpMetrics.requestCount.inc(1, { method, path, status });
    httpMetrics.requestDuration.observe(duration, { method, path, status });
    httpMetrics.activeRequests.dec(1, { method, path });

    if (duration > 1) {
      alertManager.check('slow_response', duration * 1000);
    }

    span.setStatus(
      res.statusCode >= 500 ? SpanStatus.ERROR : SpanStatus.OK
    );
    span.end();
  });

  defaultTracer.withSpan(span, () => next());
});

// 指标端点
app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(registry.export());
});

// 告警端点
app.get('/alerts', (req, res) => {
  res.json({
    active: alertManager.getActiveAlerts(),
    history: alertManager.getAlertHistory(50),
  });
});

app.listen(3000);
```

## Prometheus 集成

在 `prometheus.yml` 中配置：

```yaml
scrape_configs:
  - job_name: 'myapp'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

## OpenTelemetry Collector 集成

```typescript
import { HttpSpanExporter, BatchSpanExporter } from '@vibe/shared-utils/monitoring';

const exporter = new BatchSpanExporter(
  new HttpSpanExporter('http://localhost:4318/v1/traces'),
  100,  // 批量大小
  5000  // 超时时间
);

configureTracer({
  exporter,
  sampleRate: 0.1, // 10% 采样率
});
```

## API 参考

### MetricsRegistry

```typescript
class MetricsRegistry {
  constructor(prefix?: string, defaultLabels?: MetricLabels);
  counter(options: MetricOptions): CounterMetric;
  gauge(options: MetricOptions): GaugeMetric;
  histogram(options: MetricOptions, buckets?: number[]): HistogramMetric;
  summary(options: MetricOptions, quantiles?: number[]): SummaryMetric;
  export(): string;
  reset(): void;
}
```

### Tracer

```typescript
interface Tracer {
  startSpan(name: string, options?: SpanOptions): Span;
  getCurrentSpan(): Span | null;
  withSpan<T>(span: Span, fn: () => T): T;
}
```

### AlertManager

```typescript
class AlertManager {
  addRule(rule: AlertRule): void;
  removeRule(name: string): void;
  addHandler(handler: AlertHandler): void;
  check(ruleName: string, value: number): Promise<void>;
  getActiveAlerts(): Alert[];
  getAlertHistory(limit?: number): Alert[];
}
```

## 最佳实践

### 1. 指标命名

- 使用有意义的前缀（如 `myapp_`）
- 使用小写和下划线
- 包含单位（如 `_seconds`、`_bytes`、`_total`）
- 示例：`myapp_http_request_duration_seconds`

### 2. 标签使用

- 避免高基数标签（如用户 ID）
- 使用有限的标签值
- 常用标签：`method`、`status`、`path`、`operation`

### 3. 追踪采样

- 生产环境使用较低的采样率（如 0.1）
- 开发环境使用 100% 采样
- 根据流量调整采样率

### 4. 告警配置

- 设置合理的阈值
- 使用冷却时间防止告警风暴
- 分级告警（WARNING、ERROR、CRITICAL）
- 测试告警规则

### 5. 性能考虑

- 使用批量导出器减少网络开销
- 避免在热路径上进行复杂计算
- 定期清理历史数据
- 合理设置指标收集间隔

## 故障排除

### 指标未显示

1. 检查是否正确初始化注册中心
2. 确认指标名称没有重复
3. 验证标签值的格式

### 追踪数据丢失

1. 检查采样率设置
2. 确认导出器配置正确
3. 验证网络连接

### 告警未触发

1. 检查规则条件
2. 确认冷却时间设置
3. 验证处理器配置

## 示例代码

完整示例请参考 `examples.ts` 文件。

## 许可证

MIT
