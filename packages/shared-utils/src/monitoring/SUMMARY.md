# 监控工具模块总结

## 📦 已创建的模块列表

### 核心模块

1. **types.ts** - 类型定义
   - 所有监控相关的 TypeScript 类型和接口
   - Metrics、Tracing、Alerts 的类型定义
   - 路径: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/monitoring/types.ts`

2. **metrics.ts** - 指标收集（Prometheus 格式）
   - Counter（计数器）
   - Gauge（仪表盘）
   - Histogram（直方图）
   - Summary（摘要）
   - HTTP、数据库、系统、业务指标
   - 路径: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/monitoring/metrics.ts`

3. **tracing.ts** - 分布式追踪（OpenTelemetry）
   - Span 管理
   - 上下文传播
   - 多种导出器（Console、HTTP、Batch）
   - 追踪装饰器
   - 路径: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/monitoring/tracing.ts`

4. **alerts.ts** - 告警工具
   - 告警管理器
   - 告警规则引擎
   - 多种告警处理器（Console、Email、Webhook、Slack）
   - 告警历史记录
   - 路径: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/monitoring/alerts.ts`

5. **index.ts** - 模块导出
   - 统一的 API 导出
   - 路径: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/monitoring/index.ts`

### 示例和文档

6. **examples.ts** - 使用示例
   - 12 个完整的使用示例
   - Express 集成示例
   - 路径: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/monitoring/examples.ts`

7. **demo.ts** - 快速演示脚本
   - 可执行的演示脚本
   - 展示核心功能
   - 路径: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/monitoring/demo.ts`

8. **README.md** - 使用文档
   - 完整的 API 文档
   - 使用示例
   - 最佳实践
   - 路径: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/monitoring/README.md`

9. **INTEGRATION_GUIDE.md** - 集成指南
   - Express 集成
   - NestJS 集成
   - 数据库监控（TypeORM、Prisma）
   - Prometheus 和 Grafana 配置
   - 路径: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/monitoring/INTEGRATION_GUIDE.md`

### 测试文件

10. **metrics.test.ts** - 指标测试
    - 全面的单元测试
    - 路径: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/monitoring/__tests__/metrics.test.ts`

11. **alerts.test.ts** - 告警测试
    - 全面的单元测试
    - 路径: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/monitoring/__tests__/alerts.test.ts`

## 🎯 核心功能

### 1. 指标收集（Metrics）

#### HTTP 请求监控
```typescript
import { MetricsRegistry, createHttpMetrics } from '@vibe/shared-utils/monitoring';

const registry = new MetricsRegistry('myapp_');
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
```

#### 数据库查询监控
```typescript
import { createDatabaseMetrics } from '@vibe/shared-utils/monitoring';

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
```

#### 系统资源监控
```typescript
import { createSystemMetrics } from '@vibe/shared-utils/monitoring';

// 自动收集 CPU、内存、事件循环延迟等指标
const systemMetrics = createSystemMetrics(registry);
```

#### 自定义业务指标
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
```

### 2. 分布式追踪（Tracing）

#### 基础追踪
```typescript
import { traceAsync, SpanKind } from '@vibe/shared-utils/monitoring';

await traceAsync('processOrder', async (span) => {
  span.setAttribute('orderId', '12345');
  span.setAttribute('userId', '67890');

  // 执行业务逻辑
  await processPayment();

  span.addEvent('payment_completed');
}, { kind: SpanKind.SERVER });
```

#### 上下文传播
```typescript
import { injectTraceparent, parseTraceparent } from '@vibe/shared-utils/monitoring';

// 客户端：注入追踪上下文
const headers: Record<string, string> = {};
injectTraceparent(headers);

await fetch('http://service-b/api', { headers });

// 服务端：提取追踪上下文
const traceparent = req.headers['traceparent'];
if (traceparent) {
  const context = parseTraceparent(traceparent);
  // 使用 context 创建子 span
}
```

#### 配置导出器
```typescript
import {
  configureTracer,
  BatchSpanExporter,
  HttpSpanExporter,
} from '@vibe/shared-utils/monitoring';

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

### 3. 告警系统（Alerts）

#### 创建告警规则
```typescript
import { alert, AlertSeverity } from '@vibe/shared-utils/monitoring';

const cpuRule = alert()
  .name('high_cpu')
  .greaterThan(80)
  .severity(AlertSeverity.WARNING)
  .message('CPU 使用率超过 80%')
  .cooldown(300000) // 5 分钟
  .build();

alertManager.addRule(cpuRule);
```

#### 添加告警处理器
```typescript
import {
  AlertManager,
  consoleAlertHandler,
  createSlackAlertHandler,
  createWebhookAlertHandler,
} from '@vibe/shared-utils/monitoring';

const alertManager = new AlertManager();

// Console 处理器
alertManager.addHandler(consoleAlertHandler);

// Slack 处理器
alertManager.addHandler(
  createSlackAlertHandler('https://hooks.slack.com/services/...')
);

// Webhook 处理器
alertManager.addHandler(
  createWebhookAlertHandler('https://api.example.com/alerts')
);
```

#### 检查和触发告警
```typescript
// 检查指标
await alertManager.check('high_cpu', 85);

// 查看活跃告警
const activeAlerts = alertManager.getActiveAlerts();

// 查看历史
const history = alertManager.getAlertHistory(50);
```

## 📊 Prometheus 格式输出

所有指标都以标准的 Prometheus 格式导出：

```
# HELP myapp_http_requests_total Total number of HTTP requests
# TYPE myapp_http_requests_total counter
myapp_http_requests_total{method="GET",path="/api/users",status="200"} 42

# HELP myapp_http_request_duration_seconds HTTP request duration in seconds
# TYPE myapp_http_request_duration_seconds histogram
myapp_http_request_duration_seconds_bucket{method="GET",path="/api/users",status="200",le="0.005"} 0
myapp_http_request_duration_seconds_bucket{method="GET",path="/api/users",status="200",le="0.01"} 5
myapp_http_request_duration_seconds_sum{method="GET",path="/api/users",status="200"} 5.234
myapp_http_request_duration_seconds_count{method="GET",path="/api/users",status="200"} 42
```

## 🔧 集成方式

### Express 应用

```typescript
import express from 'express';
import { MetricsRegistry, createHttpMetrics } from '@vibe/shared-utils/monitoring';

const app = express();
const registry = new MetricsRegistry('myapp_');
const httpMetrics = createHttpMetrics(registry);

app.use((req, res, next) => {
  const startTime = Date.now();
  const { method, path } = req;

  httpMetrics.activeRequests.inc(1, { method, path });

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const status = res.statusCode.toString();

    httpMetrics.requestCount.inc(1, { method, path, status });
    httpMetrics.requestDuration.observe(duration, { method, path, status });
    httpMetrics.activeRequests.dec(1, { method, path });
  });

  next();
});

app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(registry.export());
});

app.listen(3000);
```

### NestJS 应用

详见 `INTEGRATION_GUIDE.md` 中的 NestJS 集成部分。

### 数据库监控

支持 TypeORM 和 Prisma，详见 `INTEGRATION_GUIDE.md`。

## 📈 可视化和告警

### Prometheus 配置

```yaml
scrape_configs:
  - job_name: 'myapp'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Grafana 仪表盘

常用查询示例：

```promql
# HTTP 请求率
rate(myapp_http_requests_total[5m])

# P95 响应时间
histogram_quantile(0.95, rate(myapp_http_request_duration_seconds_bucket[5m]))

# 错误率
rate(myapp_http_requests_total{status=~"5.."}[5m]) / rate(myapp_http_requests_total[5m])
```

## 🧪 测试

运行测试：

```bash
cd packages/shared-utils
npm test src/monitoring/__tests__/
```

## 📝 使用建议

1. **指标命名**
   - 使用有意义的前缀
   - 包含单位信息
   - 遵循 Prometheus 命名约定

2. **标签使用**
   - 避免高基数标签
   - 使用有限的标签值
   - 合理设计标签结构

3. **采样策略**
   - 开发环境：100%
   - 生产环境：1-10%

4. **告警配置**
   - 设置合理的阈值
   - 使用冷却时间
   - 分级处理

5. **性能优化**
   - 使用批量导出
   - 定期清理数据
   - 合理设置收集间隔

## 🔗 相关文档

- [README.md](./README.md) - 详细 API 文档
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - 完整集成指南
- [examples.ts](./examples.ts) - 代码示例
- [demo.ts](./demo.ts) - 快速演示

## 📦 导出的 API

### Metrics
- `MetricsRegistry`
- `createHttpMetrics`
- `createDatabaseMetrics`
- `createSystemMetrics`
- `createBusinessMetrics`
- `defaultRegistry`

### Tracing
- `defaultTracer`
- `configureTracer`
- `traceAsync`
- `traceSync`
- `traceHttp` (装饰器)
- `traceDatabase` (装饰器)
- `trace` (装饰器)
- `extractTraceparent`
- `injectTraceparent`
- `parseTraceparent`
- `ConsoleSpanExporter`
- `BatchSpanExporter`
- `HttpSpanExporter`

### Alerts
- `AlertManager`
- `defaultAlertManager`
- `consoleAlertHandler`
- `createEmailAlertHandler`
- `createWebhookAlertHandler`
- `createSlackAlertHandler`
- `EmailAlertHandler` (类)
- `WebhookAlertHandler` (类)
- `SlackAlertHandler` (类)
- `createCommonAlertRules`
- `addCommonRules`
- `AlertRuleBuilder`
- `alert`
- `AlertSeverity` (枚举)

### Types
所有相关的 TypeScript 类型和接口

## ✅ 特性清单

- ✅ HTTP 请求计数和延迟
- ✅ 数据库查询监控
- ✅ 内存和 CPU 使用率
- ✅ 自定义业务指标
- ✅ 追踪上下文传播
- ✅ Prometheus 格式导出
- ✅ OpenTelemetry 兼容
- ✅ 多级别告警
- ✅ 多通道通知
- ✅ 完整的 TypeScript 类型支持
- ✅ 单元测试
- ✅ 详细文档

## 🎉 总结

监控和可观测性工具已完全实现，包含：

1. **3 个核心模块** - metrics、tracing、alerts
2. **完整的类型定义** - 全面的 TypeScript 支持
3. **12 个使用示例** - 涵盖各种场景
4. **2 份详细文档** - README 和集成指南
5. **单元测试** - 保证代码质量
6. **演示脚本** - 快速上手

所有功能都已集成到 `@vibe/shared-utils` 包中，可以直接使用：

```typescript
import {
  MetricsRegistry,
  createHttpMetrics,
  traceAsync,
  AlertManager,
  alert,
} from '@vibe/shared-utils/monitoring';
```

开始使用：查看 `README.md` 和 `INTEGRATION_GUIDE.md` 了解更多详情。
