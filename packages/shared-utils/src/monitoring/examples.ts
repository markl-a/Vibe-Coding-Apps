/**
 * Monitoring Integration Examples
 * 监控工具集成示例
 */

import {
  // Metrics
  MetricsRegistry,
  createHttpMetrics,
  createDatabaseMetrics,
  createSystemMetrics,
  createBusinessMetrics,
  defaultRegistry,

  // Tracing
  defaultTracer,
  configureTracer,
  traceHttp,
  traceDatabase,
  trace,
  traceAsync,
  SpanKind,
  SpanStatus,
  BatchSpanExporter,
  ConsoleSpanExporter,
  HttpSpanExporter,

  // Alerts
  AlertManager,
  defaultAlertManager,
  consoleAlertHandler,
  createSlackAlertHandler,
  createWebhookAlertHandler,
  alert,
  AlertSeverity,
  addCommonRules,
} from './index';

/**
 * 示例 1: 基础指标收集
 */
export function example1_BasicMetrics() {
  // 创建注册中心
  const registry = new MetricsRegistry('myapp_');

  // 创建 HTTP 指标
  const httpMetrics = createHttpMetrics(registry);

  // 模拟 HTTP 请求
  const startTime = Date.now();
  httpMetrics.activeRequests.inc(1, { method: 'GET', path: '/api/users' });

  // 处理请求...
  setTimeout(() => {
    const duration = (Date.now() - startTime) / 1000;

    httpMetrics.requestCount.inc(1, {
      method: 'GET',
      path: '/api/users',
      status: '200',
    });

    httpMetrics.requestDuration.observe(duration, {
      method: 'GET',
      path: '/api/users',
      status: '200',
    });

    httpMetrics.activeRequests.dec(1, { method: 'GET', path: '/api/users' });

    // 导出 Prometheus 格式
    console.log(registry.export());
  }, 100);
}

/**
 * 示例 2: 数据库监控
 */
export async function example2_DatabaseMonitoring() {
  const registry = new MetricsRegistry('myapp_');
  const dbMetrics = createDatabaseMetrics(registry);

  // 模拟数据库查询
  const startTime = Date.now();

  try {
    // 执行查询...
    await new Promise((resolve) => setTimeout(resolve, 50));

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

  console.log(registry.export());
}

/**
 * 示例 3: 系统监控
 */
export function example3_SystemMonitoring() {
  const registry = new MetricsRegistry('myapp_');
  const systemMetrics = createSystemMetrics(registry);

  // 系统指标会自动收集
  setTimeout(() => {
    console.log(registry.export());
  }, 6000);
}

/**
 * 示例 4: 自定义业务指标
 */
export function example4_BusinessMetrics() {
  const registry = new MetricsRegistry('myapp_');
  const businessMetrics = createBusinessMetrics(registry);

  // 用户注册
  (businessMetrics.userSignups as any).inc(1, { source: 'google' });
  (businessMetrics.userSignups as any).inc(1, { source: 'facebook' });

  // 用户登录
  (businessMetrics.userLogins as any).inc(1, { method: 'email' });

  // 订单
  (businessMetrics.orders as any).inc(1, {
    status: 'completed',
    payment_method: 'credit_card',
  });

  (businessMetrics.revenue as any).inc(99.99, { currency: 'USD' });
  (businessMetrics.orderValue as any).observe(99.99, { currency: 'USD' });

  // 活跃用户
  (businessMetrics.activeUsers as any).set(1234);

  console.log(registry.export());
}

/**
 * 示例 5: 分布式追踪 - HTTP 请求
 */
export async function example5_HttpTracing() {
  // 配置 tracer
  configureTracer({
    exporter: new ConsoleSpanExporter(),
    sampleRate: 1.0,
  });

  // 使用手动追踪
  await traceAsync('GET /users', async (span) => {
    span.setAttribute('http.method', 'GET');
    span.setAttribute('http.url', '/users');

    // 业务逻辑
    await new Promise((resolve) => setTimeout(resolve, 100));

    return { users: [] };
  }, { kind: SpanKind.SERVER });
}

/**
 * 示例 6: 分布式追踪 - 数据库查询
 */
export async function example6_DatabaseTracing() {
  configureTracer({
    exporter: new ConsoleSpanExporter(),
    sampleRate: 1.0,
  });

  // 使用手动追踪
  await traceAsync('SELECT users', async (span) => {
    span.setAttribute('db.system', 'sql');
    span.setAttribute('db.operation', 'SELECT');
    span.setAttribute('db.statement', 'SELECT * FROM users WHERE id = ?');

    await new Promise((resolve) => setTimeout(resolve, 50));

    return { id: 1, name: 'John' };
  }, { kind: SpanKind.CLIENT });
}

/**
 * 示例 7: 手动追踪
 */
export async function example7_ManualTracing() {
  configureTracer({
    exporter: new ConsoleSpanExporter(),
    sampleRate: 1.0,
  });

  await traceAsync('processOrder', async (span) => {
    span.setAttribute('orderId', '12345');
    span.setAttribute('userId', '67890');

    // 模拟处理
    await new Promise((resolve) => setTimeout(resolve, 100));

    span.addEvent('payment_processed', {
      amount: 99.99,
      currency: 'USD',
    });

    // 嵌套 span
    await traceAsync('validateInventory', async (childSpan) => {
      childSpan.setAttribute('productId', 'ABC123');
      await new Promise((resolve) => setTimeout(resolve, 50));
    }, { kind: SpanKind.INTERNAL });

    span.addEvent('order_completed');
  }, { kind: SpanKind.SERVER });
}

/**
 * 示例 8: 告警系统
 */
export async function example8_AlertSystem() {
  const alertManager = new AlertManager();

  // 添加处理器
  alertManager.addHandler(consoleAlertHandler);

  // 添加常用规则
  addCommonRules(alertManager);

  // 或创建自定义规则
  const customRule = alert()
    .name('api_error_rate')
    .greaterThan(5)
    .severity(AlertSeverity.WARNING)
    .message('API error rate is above 5%')
    .cooldown(300000)
    .build();

  alertManager.addRule(customRule);

  // 模拟检查
  await alertManager.check('high_cpu_usage', 85); // 触发告警
  await alertManager.check('high_cpu_usage', 70); // 解决告警

  // 查看活跃告警
  console.log('Active alerts:', alertManager.getActiveAlerts());

  // 查看历史
  console.log('Alert history:', alertManager.getAlertHistory(10));
}

/**
 * 示例 9: Webhook 告警
 */
export async function example9_WebhookAlerts() {
  const alertManager = new AlertManager();

  // 添加 Webhook 处理器
  const webhookHandler = createWebhookAlertHandler(
    'https://example.com/alerts',
    { 'Authorization': 'Bearer token123' }
  );

  alertManager.addHandler(webhookHandler);

  // 添加规则并触发
  alertManager.addRule({
    name: 'test_alert',
    condition: (value) => value > 50,
    severity: AlertSeverity.ERROR,
    message: 'Test alert triggered',
  });

  await alertManager.check('test_alert', 75);
}

/**
 * 示例 10: Slack 告警
 */
export async function example10_SlackAlerts() {
  const alertManager = new AlertManager();

  // 添加 Slack 处理器
  const slackHandler = createSlackAlertHandler(
    'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
  );

  alertManager.addHandler(slackHandler);
  addCommonRules(alertManager);

  // 模拟触发
  await alertManager.check('critical_memory_usage', 97);
}

/**
 * 示例 11: 完整集成 - Express 中间件
 */
export function example11_ExpressMiddleware() {
  const registry = new MetricsRegistry('myapp_');
  const httpMetrics = createHttpMetrics(registry);
  const alertManager = new AlertManager();

  addCommonRules(alertManager);
  alertManager.addHandler(consoleAlertHandler);

  // Express 中间件
  function monitoringMiddleware(req: Record<string, unknown>, res: Record<string, unknown>, next: () => void) {
    const startTime = Date.now();
    const { method, path } = req;

    // 增加活跃请求
    httpMetrics.activeRequests.inc(1, { method, path });

    // 追踪请求
    const span = defaultTracer.startSpan(`HTTP ${method} ${path}`, {
      kind: SpanKind.SERVER,
    });

    span.setAttribute('http.method', method);
    span.setAttribute('http.url', req.url);

    // 在响应结束时收集指标
    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const status = res.statusCode.toString();

      // 记录指标
      httpMetrics.requestCount.inc(1, { method, path, status });
      httpMetrics.requestDuration.observe(duration, { method, path, status });
      httpMetrics.activeRequests.dec(1, { method, path });

      // 检查告警
      if (duration > 1) {
        alertManager.check('slow_response', duration * 1000);
      }

      // 结束 span
      span.setStatus(
        res.statusCode >= 500 ? SpanStatus.ERROR : SpanStatus.OK
      );
      span.end();
    });

    defaultTracer.withSpan(span, () => next());
  }

  // 指标端点
  function metricsEndpoint(req: Record<string, unknown>, res: { setHeader: (name: string, value: string) => void; send: (body: string) => void }) {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(registry.export());
  }

  return { monitoringMiddleware, metricsEndpoint };
}

/**
 * 示例 12: 批量导出追踪数据
 */
export async function example12_BatchTracing() {
  // 配置批量导出
  const batchExporter = new BatchSpanExporter(
    new HttpSpanExporter('http://localhost:4318/v1/traces'),
    100, // 批量大小
    5000 // 超时时间
  );

  configureTracer({
    exporter: batchExporter,
    sampleRate: 0.1, // 10% 采样率
  });

  // 生成多个 span
  for (let i = 0; i < 10; i++) {
    await traceAsync(`operation_${i}`, async (span) => {
      span.setAttribute('index', i);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }

  // 手动刷新
  batchExporter.flush();
}

// 运行示例
if (require.main === module) {
  (async () => {
    console.log('=== Example 1: Basic Metrics ===');
    example1_BasicMetrics();

    await new Promise((resolve) => setTimeout(resolve, 200));

    console.log('\n=== Example 2: Database Monitoring ===');
    await example2_DatabaseMonitoring();

    console.log('\n=== Example 4: Business Metrics ===');
    example4_BusinessMetrics();

    console.log('\n=== Example 5: HTTP Tracing ===');
    await example5_HttpTracing();

    console.log('\n=== Example 6: Database Tracing ===');
    await example6_DatabaseTracing();

    console.log('\n=== Example 7: Manual Tracing ===');
    await example7_ManualTracing();

    console.log('\n=== Example 8: Alert System ===');
    await example8_AlertSystem();
  })();
}
