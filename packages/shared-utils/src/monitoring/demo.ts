#!/usr/bin/env node
/**
 * Monitoring Tools Demo
 * 演示监控工具的基本用法
 */

import {
  // Metrics
  MetricsRegistry,
  createHttpMetrics,

  // Tracing
  configureTracer,
  traceAsync,
  ConsoleSpanExporter,
  SpanKind,

  // Alerts
  AlertManager,
  alert,
  AlertSeverity,
  consoleAlertHandler,
} from './index';

async function main() {
  console.log('=== 监控工具演示 ===\n');

  // 1. 指标收集
  console.log('1. 指标收集演示');
  const registry = new MetricsRegistry('demo_');
  const httpMetrics = createHttpMetrics(registry);

  // 模拟 HTTP 请求
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

  console.log('\nPrometheus 格式输出:');
  console.log(registry.export());
  console.log('\n');

  // 2. 分布式追踪
  console.log('2. 分布式追踪演示');
  configureTracer({
    exporter: new ConsoleSpanExporter(),
    sampleRate: 1.0,
  });

  await traceAsync('processOrder', async (span) => {
    span.setAttribute('orderId', '12345');
    span.setAttribute('userId', '67890');

    console.log('开始处理订单...');

    // 模拟处理时间
    await new Promise((resolve) => setTimeout(resolve, 100));

    span.addEvent('payment_completed', {
      amount: 99.99,
      currency: 'USD',
    });

    console.log('订单处理完成\n');
  }, { kind: SpanKind.SERVER });

  // 3. 告警系统
  console.log('3. 告警系统演示');
  const alertManager = new AlertManager();

  // 添加处理器
  alertManager.addHandler(consoleAlertHandler);

  // 创建告警规则
  const cpuRule = alert()
    .name('high_cpu')
    .greaterThan(80)
    .severity(AlertSeverity.WARNING)
    .message('CPU 使用率超过 80%')
    .cooldown(5000)
    .build();

  alertManager.addRule(cpuRule);

  // 触发告警
  console.log('\n检查 CPU 使用率: 85%');
  await alertManager.check('high_cpu', 85);

  console.log('\n活跃告警:');
  console.log(JSON.stringify(alertManager.getActiveAlerts(), null, 2));

  console.log('\n=== 演示完成 ===');
}

// 运行演示
if (require.main === module) {
  main().catch(console.error);
}

export { main };
