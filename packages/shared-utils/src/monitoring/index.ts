/**
 * Monitoring and Observability Tools
 * 监控和可观测性工具
 *
 * 包含：
 * - Metrics: Prometheus 格式的指标收集
 * - Tracing: OpenTelemetry 分布式追踪
 * - Alerts: 告警系统
 */

// Types
export * from './types';

// Metrics
export {
  MetricsRegistry,
  createHttpMetrics,
  createDatabaseMetrics,
  createSystemMetrics,
  createBusinessMetrics,
  defaultRegistry,
} from './metrics';

// Tracing
export {
  defaultTracer,
  configureTracer,
  traceHttp,
  traceDatabase,
  trace,
  traceAsync,
  traceSync,
  extractTraceparent,
  injectTraceparent,
  parseTraceparent,
  ConsoleSpanExporter,
  BatchSpanExporter,
  HttpSpanExporter,
} from './tracing';

export type { SpanExporter } from './tracing';

// Alerts
export {
  AlertManager,
  defaultAlertManager,
  consoleAlertHandler,
  createEmailAlertHandler,
  createWebhookAlertHandler,
  createSlackAlertHandler,
  EmailAlertHandler,
  WebhookAlertHandler,
  SlackAlertHandler,
  createCommonAlertRules,
  addCommonRules,
  AlertRuleBuilder,
  alert,
} from './alerts';
