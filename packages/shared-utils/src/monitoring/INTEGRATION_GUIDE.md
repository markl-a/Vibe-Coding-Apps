# 监控工具集成指南

本指南将帮助你将可观测性和监控工具集成到你的应用中。

## 📋 目录

1. [快速开始](#快速开始)
2. [Express 应用集成](#express-应用集成)
3. [NestJS 应用集成](#nestjs-应用集成)
4. [数据库监控](#数据库监控)
5. [微服务追踪](#微服务追踪)
6. [Prometheus 集成](#prometheus-集成)
7. [Grafana 仪表盘](#grafana-仪表盘)
8. [告警配置](#告警配置)

## 🚀 快速开始

### 安装依赖

```bash
npm install @vibe/shared-utils
```

### 基础设置

```typescript
import {
  MetricsRegistry,
  createHttpMetrics,
  createSystemMetrics,
  AlertManager,
  addCommonRules,
  consoleAlertHandler,
  configureTracer,
  ConsoleSpanExporter,
} from '@vibe/shared-utils/monitoring';

// 创建指标注册中心
const registry = new MetricsRegistry('myapp_', {
  environment: process.env.NODE_ENV,
  version: process.env.APP_VERSION,
});

// 创建指标
const httpMetrics = createHttpMetrics(registry);
const systemMetrics = createSystemMetrics(registry);

// 配置追踪
configureTracer({
  exporter: new ConsoleSpanExporter(),
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

// 配置告警
const alertManager = new AlertManager();
addCommonRules(alertManager);
alertManager.addHandler(consoleAlertHandler);
```

## 🌐 Express 应用集成

### 完整示例

```typescript
import express from 'express';
import {
  MetricsRegistry,
  createHttpMetrics,
  createSystemMetrics,
  AlertManager,
  addCommonRules,
  consoleAlertHandler,
  SlackAlertHandler,
  defaultTracer,
  SpanKind,
  SpanStatus,
  injectTraceparent,
} from '@vibe/shared-utils/monitoring';

const app = express();
const registry = new MetricsRegistry('myapp_');
const httpMetrics = createHttpMetrics(registry);
const systemMetrics = createSystemMetrics(registry);
const alertManager = new AlertManager();

// 配置告警
addCommonRules(alertManager);
alertManager.addHandler(consoleAlertHandler);

if (process.env.SLACK_WEBHOOK) {
  alertManager.addHandler(
    new SlackAlertHandler(process.env.SLACK_WEBHOOK)
  );
}

// 监控中间件
app.use((req, res, next) => {
  const startTime = Date.now();
  const method = req.method;
  const path = req.route?.path || req.path;

  // 增加活跃请求数
  httpMetrics.activeRequests.inc(1, { method, path });

  // 开始追踪
  const span = defaultTracer.startSpan(`HTTP ${method} ${path}`, {
    kind: SpanKind.SERVER,
    attributes: {
      'http.method': method,
      'http.url': req.url,
      'http.target': path,
      'http.user_agent': req.get('user-agent'),
      'http.client_ip': req.ip,
    },
  });

  // 注入追踪上下文到响应头
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const status = res.statusCode.toString();
    const labels = { method, path, status };

    // 记录指标
    httpMetrics.requestCount.inc(1, labels);
    httpMetrics.requestDuration.observe(duration, labels);

    if (req.get('content-length')) {
      httpMetrics.requestSize.observe(
        parseInt(req.get('content-length')!),
        { method, path }
      );
    }

    if (res.get('content-length')) {
      httpMetrics.responseSize.observe(
        parseInt(res.get('content-length')!),
        { method, path }
      );
    }

    httpMetrics.activeRequests.dec(1, { method, path });

    // 检查告警
    if (duration > 1) {
      alertManager.check('slow_response', duration * 1000);
    }

    if (res.statusCode >= 500) {
      alertManager.check('high_error_rate', 10); // 简化示例
    }

    // 更新 span
    span.setAttribute('http.status_code', res.statusCode);
    span.setAttribute('http.response_size', res.get('content-length') || 0);
    span.setStatus(
      res.statusCode >= 500 ? SpanStatus.ERROR : SpanStatus.OK,
      res.statusCode >= 500 ? res.statusMessage : undefined
    );
    span.end();
  });

  // 在 span 上下文中执行
  defaultTracer.withSpan(span, () => next());
});

// 指标端点
app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(registry.export());
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 告警端点
app.get('/alerts', (req, res) => {
  res.json({
    active: alertManager.getActiveAlerts(),
    history: alertManager.getAlertHistory(50),
  });
});

// 业务路由
app.get('/api/users', async (req, res) => {
  // 业务逻辑...
  res.json({ users: [] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Metrics: http://localhost:${PORT}/metrics`);
  console.log(`Alerts: http://localhost:${PORT}/alerts`);
});
```

## 🏗️ NestJS 应用集成

### 创建监控模块

```typescript
// monitoring.module.ts
import { Module, Global } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { MonitoringInterceptor } from './monitoring.interceptor';

@Global()
@Module({
  providers: [MonitoringService, MonitoringInterceptor],
  exports: [MonitoringService],
})
export class MonitoringModule {}
```

### 监控服务

```typescript
// monitoring.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  MetricsRegistry,
  createHttpMetrics,
  createSystemMetrics,
  createDatabaseMetrics,
  AlertManager,
  addCommonRules,
  HttpMetrics,
  SystemMetrics,
  DatabaseMetrics,
} from '@vibe/shared-utils/monitoring';

@Injectable()
export class MonitoringService implements OnModuleInit {
  public registry: MetricsRegistry;
  public httpMetrics: HttpMetrics;
  public systemMetrics: SystemMetrics;
  public dbMetrics: DatabaseMetrics;
  public alertManager: AlertManager;

  constructor() {
    this.registry = new MetricsRegistry('nestapp_');
    this.httpMetrics = createHttpMetrics(this.registry);
    this.systemMetrics = createSystemMetrics(this.registry);
    this.dbMetrics = createDatabaseMetrics(this.registry);
    this.alertManager = new AlertManager();
  }

  onModuleInit() {
    addCommonRules(this.alertManager);
  }

  getMetrics(): string {
    return this.registry.export();
  }
}
```

### 监控拦截器

```typescript
// monitoring.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MonitoringService } from './monitoring.service';
import { defaultTracer, SpanKind, SpanStatus } from '@vibe/shared-utils/monitoring';

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  constructor(private monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, route } = request;
    const path = route?.path || url;

    this.monitoringService.httpMetrics.activeRequests.inc(1, { method, path });

    const span = defaultTracer.startSpan(`HTTP ${method} ${path}`, {
      kind: SpanKind.SERVER,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000;
          const status = response.statusCode.toString();

          this.monitoringService.httpMetrics.requestCount.inc(1, {
            method,
            path,
            status,
          });

          this.monitoringService.httpMetrics.requestDuration.observe(duration, {
            method,
            path,
            status,
          });

          this.monitoringService.httpMetrics.activeRequests.dec(1, {
            method,
            path,
          });

          span.setStatus(SpanStatus.OK);
          span.end();
        },
        error: (error) => {
          const duration = (Date.now() - startTime) / 1000;

          this.monitoringService.httpMetrics.requestCount.inc(1, {
            method,
            path,
            status: '500',
          });

          this.monitoringService.httpMetrics.requestDuration.observe(duration, {
            method,
            path,
            status: '500',
          });

          this.monitoringService.httpMetrics.activeRequests.dec(1, {
            method,
            path,
          });

          span.setStatus(SpanStatus.ERROR, error.message);
          span.end();
        },
      })
    );
  }
}
```

### 应用拦截器

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MonitoringInterceptor } from './monitoring/monitoring.interceptor';
import { MonitoringService } from './monitoring/monitoring.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const monitoringService = app.get(MonitoringService);
  app.useGlobalInterceptors(new MonitoringInterceptor(monitoringService));

  await app.listen(3000);
}
bootstrap();
```

## 🗄️ 数据库监控

### TypeORM 集成

```typescript
import { EntitySubscriberInterface, EventSubscriber } from 'typeorm';
import { createDatabaseMetrics, MetricsRegistry } from '@vibe/shared-utils/monitoring';

const registry = new MetricsRegistry('myapp_');
const dbMetrics = createDatabaseMetrics(registry);

@EventSubscriber()
export class DatabaseMonitoringSubscriber implements EntitySubscriberInterface {
  beforeQuery(event: any) {
    event.queryStartTime = Date.now();
  }

  afterQuery(event: any) {
    if (event.queryStartTime) {
      const duration = (Date.now() - event.queryStartTime) / 1000;
      const operation = this.getOperation(event.query);

      dbMetrics.queryDuration.observe(duration, {
        operation,
        table: event.entity?.name || 'unknown',
      });

      dbMetrics.queryCount.inc(1, {
        operation,
        table: event.entity?.name || 'unknown',
        status: 'success',
      });
    }
  }

  onQueryError(error: any, event: any) {
    const operation = this.getOperation(event.query);

    dbMetrics.queryCount.inc(1, {
      operation,
      table: event.entity?.name || 'unknown',
      status: 'error',
    });
  }

  private getOperation(query: string): string {
    const sql = query.trim().toUpperCase();
    if (sql.startsWith('SELECT')) return 'SELECT';
    if (sql.startsWith('INSERT')) return 'INSERT';
    if (sql.startsWith('UPDATE')) return 'UPDATE';
    if (sql.startsWith('DELETE')) return 'DELETE';
    return 'OTHER';
  }
}
```

### Prisma 集成

```typescript
import { PrismaClient } from '@prisma/client';
import { createDatabaseMetrics, MetricsRegistry } from '@vibe/shared-utils/monitoring';

const registry = new MetricsRegistry('myapp_');
const dbMetrics = createDatabaseMetrics(registry);

const prisma = new PrismaClient();

// 添加中间件
prisma.$use(async (params, next) => {
  const startTime = Date.now();

  try {
    const result = await next(params);
    const duration = (Date.now() - startTime) / 1000;

    dbMetrics.queryCount.inc(1, {
      operation: params.action,
      table: params.model || 'unknown',
      status: 'success',
    });

    dbMetrics.queryDuration.observe(duration, {
      operation: params.action,
      table: params.model || 'unknown',
    });

    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    dbMetrics.queryCount.inc(1, {
      operation: params.action,
      table: params.model || 'unknown',
      status: 'error',
    });

    dbMetrics.queryDuration.observe(duration, {
      operation: params.action,
      table: params.model || 'unknown',
    });

    throw error;
  }
});

export default prisma;
```

## 🔗 微服务追踪

### 服务间追踪

```typescript
import { defaultTracer, injectTraceparent, parseTraceparent } from '@vibe/shared-utils/monitoring';

// 服务 A - 发起请求
async function callServiceB() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 注入追踪上下文
  injectTraceparent(headers);

  const response = await fetch('http://service-b/api/endpoint', {
    method: 'POST',
    headers,
    body: JSON.stringify({ data: 'example' }),
  });

  return response.json();
}

// 服务 B - 接收请求
app.use((req, res, next) => {
  const traceparent = req.headers['traceparent'];

  if (traceparent) {
    const context = parseTraceparent(traceparent as string);
    if (context) {
      // 使用父级上下文创建新 span
      const span = defaultTracer.startSpan('Service B Processing', {
        kind: SpanKind.SERVER,
      });

      // span 会自动使用传播的上下文
      defaultTracer.withSpan(span, () => {
        // 处理请求
        next();
      });

      res.on('finish', () => {
        span.end();
      });
      return;
    }
  }

  next();
});
```

## 📊 Prometheus 集成

### Prometheus 配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'myapp'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s
```

### Docker Compose 配置

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production

  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

volumes:
  prometheus-data:
```

## 📈 Grafana 仪表盘

### Grafana 配置

```yaml
# docker-compose.yml (添加 Grafana)
grafana:
  image: grafana/grafana:latest
  ports:
    - '3001:3000'
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
  volumes:
    - grafana-data:/var/lib/grafana
  depends_on:
    - prometheus

volumes:
  grafana-data:
```

### 常用查询

```promql
# HTTP 请求率
rate(myapp_http_requests_total[5m])

# 平均响应时间
rate(myapp_http_request_duration_seconds_sum[5m]) / rate(myapp_http_request_duration_seconds_count[5m])

# P95 响应时间
histogram_quantile(0.95, rate(myapp_http_request_duration_seconds_bucket[5m]))

# 错误率
rate(myapp_http_requests_total{status=~"5.."}[5m]) / rate(myapp_http_requests_total[5m])

# CPU 使用率
myapp_process_cpu_usage_percent

# 内存使用率
myapp_process_memory_usage_bytes / myapp_system_memory_total_bytes * 100

# 数据库查询率
rate(myapp_db_queries_total[5m])

# 活跃请求数
myapp_http_requests_active
```

## 🚨 告警配置

### 自定义告警规则

```typescript
import {
  alert,
  AlertSeverity,
  SlackAlertHandler,
  WebhookAlertHandler,
} from '@vibe/shared-utils/monitoring';

// CPU 告警
alertManager.addRule(
  alert()
    .name('high_cpu')
    .greaterThan(80)
    .severity(AlertSeverity.WARNING)
    .message('CPU usage is above 80%')
    .cooldown(300000) // 5 分钟
    .build()
);

// 内存告警
alertManager.addRule(
  alert()
    .name('high_memory')
    .greaterThan(85)
    .severity(AlertSeverity.WARNING)
    .message('Memory usage is above 85%')
    .cooldown(300000)
    .build()
);

// 错误率告警
alertManager.addRule(
  alert()
    .name('api_errors')
    .greaterThan(5)
    .severity(AlertSeverity.ERROR)
    .message('API error rate is above 5%')
    .cooldown(180000) // 3 分钟
    .build()
);

// 响应时间告警
alertManager.addRule(
  alert()
    .name('slow_api')
    .greaterThan(2000)
    .severity(AlertSeverity.WARNING)
    .message('API response time is above 2s')
    .cooldown(300000)
    .build()
);
```

### Slack 集成

```typescript
// 配置 Slack 通知
const slackHandler = new SlackAlertHandler(
  process.env.SLACK_WEBHOOK_URL!
);

alertManager.addHandler(slackHandler);
```

### PagerDuty 集成

```typescript
import { WebhookAlertHandler } from '@vibe/shared-utils/monitoring';

const pagerDutyHandler = new WebhookAlertHandler(
  'https://events.pagerduty.com/v2/enqueue',
  {
    'Content-Type': 'application/json',
    'Authorization': `Token token=${process.env.PAGERDUTY_TOKEN}`,
  }
);

alertManager.addHandler(pagerDutyHandler);
```

## 🧪 测试环境配置

```typescript
// test setup
import { MetricsRegistry } from '@vibe/shared-utils/monitoring';

let testRegistry: MetricsRegistry;

beforeEach(() => {
  testRegistry = new MetricsRegistry('test_');
});

afterEach(() => {
  testRegistry.reset();
});

test('should track metrics', () => {
  const counter = testRegistry.counter({
    name: 'test_counter',
    help: 'Test counter',
  });

  counter.inc();
  expect(counter.get()).toBe(1);
});
```

## 📝 最佳实践

1. **指标命名规范**
   - 使用有意义的前缀
   - 包含单位信息
   - 保持一致性

2. **标签使用**
   - 避免高基数标签
   - 使用有限的标签值
   - 合理设计标签结构

3. **采样策略**
   - 开发环境：100%
   - 测试环境：50-100%
   - 生产环境：1-10%

4. **告警配置**
   - 设置合理的阈值
   - 使用冷却时间
   - 分级处理

5. **性能优化**
   - 使用批量导出
   - 定期清理数据
   - 合理设置收集间隔

## 🔍 故障排查

1. **指标未显示**
   - 检查端点是否可访问
   - 验证 Prometheus 配置
   - 查看应用日志

2. **追踪数据丢失**
   - 检查采样率
   - 验证导出器配置
   - 确认网络连接

3. **告警未触发**
   - 检查规则条件
   - 验证处理器配置
   - 查看冷却时间

## 📚 更多资源

- [Prometheus 文档](https://prometheus.io/docs/)
- [OpenTelemetry 文档](https://opentelemetry.io/docs/)
- [Grafana 文档](https://grafana.com/docs/)
