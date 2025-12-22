/**
 * Alert System
 * 告警系统
 */

import {
  AlertSeverity,
  AlertRule,
  Alert,
  AlertHandler,
} from './types';

// Re-export types for convenience
export { AlertSeverity } from './types';
export type { AlertRule, Alert, AlertHandler } from './types';

/**
 * 生成唯一 ID
 */
function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Alert Manager
 * 告警管理器
 */
export class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private handlers: Set<AlertHandler> = new Set();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private cooldowns: Map<string, number> = new Map();
  private maxHistorySize: number = 1000;

  /**
   * 添加告警规则
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.name, rule);
  }

  /**
   * 删除告警规则
   */
  removeRule(name: string): void {
    this.rules.delete(name);
  }

  /**
   * 获取所有规则
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 添加告警处理器
   */
  addHandler(handler: AlertHandler): void {
    this.handlers.add(handler);
  }

  /**
   * 删除告警处理器
   */
  removeHandler(handler: AlertHandler): void {
    this.handlers.delete(handler);
  }

  /**
   * 检查值并触发告警
   */
  async check(ruleName: string, value: number): Promise<void> {
    const rule = this.rules.get(ruleName);
    if (!rule) {
      return;
    }

    // 检查冷却时间
    const lastAlertTime = this.cooldowns.get(ruleName);
    const cooldown = rule.cooldown || 60000; // 默认 1 分钟

    if (lastAlertTime && Date.now() - lastAlertTime < cooldown) {
      return;
    }

    // 检查条件
    const shouldAlert = rule.condition(value);

    if (shouldAlert) {
      await this.triggerAlert(rule, value);
    } else {
      // 如果条件不满足，解决现有告警
      await this.resolveAlert(ruleName);
    }
  }

  /**
   * 触发告警
   */
  private async triggerAlert(rule: AlertRule, value: number): Promise<void> {
    const alert: Alert = {
      id: generateAlertId(),
      rule: rule.name,
      severity: rule.severity,
      message: rule.message,
      value,
      timestamp: Date.now(),
    };

    // 添加到活跃告警
    this.activeAlerts.set(rule.name, alert);

    // 添加到历史
    this.alertHistory.push(alert);
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.shift();
    }

    // 更新冷却时间
    this.cooldowns.set(rule.name, Date.now());

    // 调用处理器
    await this.notifyHandlers(alert);
  }

  /**
   * 解决告警
   */
  private async resolveAlert(ruleName: string): Promise<void> {
    const alert = this.activeAlerts.get(ruleName);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();

      // 从活跃告警中移除
      this.activeAlerts.delete(ruleName);

      // 通知处理器
      await this.notifyHandlers(alert);
    }
  }

  /**
   * 通知所有处理器
   */
  private async notifyHandlers(alert: Alert): Promise<void> {
    const promises = Array.from(this.handlers).map((handler) =>
      Promise.resolve(handler(alert)).catch((error) => {
        console.error('Alert handler error:', error);
      })
    );

    await Promise.all(promises);
  }

  /**
   * 获取活跃告警
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * 获取告警历史
   */
  getAlertHistory(limit?: number): Alert[] {
    if (limit) {
      return this.alertHistory.slice(-limit);
    }
    return [...this.alertHistory];
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.alertHistory = [];
  }

  /**
   * 手动解决告警
   */
  async manualResolve(ruleName: string): Promise<void> {
    await this.resolveAlert(ruleName);
  }

  /**
   * 重置冷却时间
   */
  resetCooldown(ruleName: string): void {
    this.cooldowns.delete(ruleName);
  }

  /**
   * 设置最大历史记录数
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(1, size);
  }
}

/**
 * 默认告警管理器实例
 */
export const defaultAlertManager = new AlertManager();

/**
 * Console Alert Handler
 */
export const consoleAlertHandler: AlertHandler = (alert: Alert) => {
  const emoji = {
    [AlertSeverity.INFO]: 'ℹ️',
    [AlertSeverity.WARNING]: '⚠️',
    [AlertSeverity.ERROR]: '❌',
    [AlertSeverity.CRITICAL]: '🚨',
  };

  const status = alert.resolved ? '[RESOLVED]' : '[ACTIVE]';
  const icon = emoji[alert.severity];

  console.log(
    `${icon} ${status} [${alert.severity.toUpperCase()}] ${alert.message}`,
    {
      rule: alert.rule,
      value: alert.value,
      timestamp: new Date(alert.timestamp).toISOString(),
      resolvedAt: alert.resolvedAt
        ? new Date(alert.resolvedAt).toISOString()
        : undefined,
    }
  );
};

/**
 * Create Email Alert Handler
 */
export function createEmailAlertHandler(config: {
  to: string[];
  from: string;
}): AlertHandler {
  return async (alert: Alert) => {
    // 这里应该调用实际的邮件服务
    console.log('[Email Alert]', {
      to: config.to,
      from: config.from,
      subject: `${alert.severity.toUpperCase()}: ${alert.rule}`,
      body: alert.message,
      alert,
    });
  };
}

// 保留类版本以保持向后兼容
export class EmailAlertHandler {
  private handler: AlertHandler;

  constructor(config: { to: string[]; from: string }) {
    this.handler = createEmailAlertHandler(config);
  }

  async handle(alert: Alert): Promise<void> {
    await this.handler(alert);
  }
}

/**
 * Create Webhook Alert Handler
 */
export function createWebhookAlertHandler(
  url: string,
  headers: Record<string, string> = {}
): AlertHandler {
  return async (alert: Alert) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(alert),
      });

      if (!response.ok) {
        console.error('Webhook alert failed:', response.statusText);
      }
    } catch (error) {
      console.error('Webhook alert error:', error);
    }
  };
}

// 保留类版本以保持向后兼容
export class WebhookAlertHandler {
  private handler: AlertHandler;

  constructor(url: string, headers: Record<string, string> = {}) {
    this.handler = createWebhookAlertHandler(url, headers);
  }

  async handle(alert: Alert): Promise<void> {
    await this.handler(alert);
  }
}

/**
 * Create Slack Alert Handler
 */
export function createSlackAlertHandler(webhookUrl: string): AlertHandler {
  return async (alert: Alert) => {
    const color = {
      [AlertSeverity.INFO]: '#36a64f',
      [AlertSeverity.WARNING]: '#ff9800',
      [AlertSeverity.ERROR]: '#f44336',
      [AlertSeverity.CRITICAL]: '#9c27b0',
    };

    const payload = {
      attachments: [
        {
          color: color[alert.severity],
          title: `${alert.severity.toUpperCase()}: ${alert.rule}`,
          text: alert.message,
          fields: [
            {
              title: 'Value',
              value: alert.value.toString(),
              short: true,
            },
            {
              title: 'Status',
              value: alert.resolved ? 'Resolved' : 'Active',
              short: true,
            },
            {
              title: 'Timestamp',
              value: new Date(alert.timestamp).toISOString(),
              short: true,
            },
          ],
          footer: 'Vibe Monitoring System',
          ts: Math.floor(alert.timestamp / 1000),
        },
      ],
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Slack alert failed:', response.statusText);
      }
    } catch (error) {
      console.error('Slack alert error:', error);
    }
  };
}

// 保留类版本以保持向后兼容
export class SlackAlertHandler {
  private handler: AlertHandler;

  constructor(webhookUrl: string) {
    this.handler = createSlackAlertHandler(webhookUrl);
  }

  async handle(alert: Alert): Promise<void> {
    await this.handler(alert);
  }
}

/**
 * 创建常用告警规则
 */
export function createCommonAlertRules(): AlertRule[] {
  return [
    // CPU 使用率告警
    {
      name: 'high_cpu_usage',
      condition: (value) => value > 80,
      severity: AlertSeverity.WARNING,
      message: 'CPU usage is above 80%',
      cooldown: 300000, // 5 分钟
    },
    {
      name: 'critical_cpu_usage',
      condition: (value) => value > 95,
      severity: AlertSeverity.CRITICAL,
      message: 'CPU usage is above 95%',
      cooldown: 300000,
    },

    // 内存使用率告警
    {
      name: 'high_memory_usage',
      condition: (value) => value > 80,
      severity: AlertSeverity.WARNING,
      message: 'Memory usage is above 80%',
      cooldown: 300000,
    },
    {
      name: 'critical_memory_usage',
      condition: (value) => value > 95,
      severity: AlertSeverity.CRITICAL,
      message: 'Memory usage is above 95%',
      cooldown: 300000,
    },

    // HTTP 错误率告警
    {
      name: 'high_error_rate',
      condition: (value) => value > 5,
      severity: AlertSeverity.WARNING,
      message: 'HTTP error rate is above 5%',
      cooldown: 300000,
    },
    {
      name: 'critical_error_rate',
      condition: (value) => value > 10,
      severity: AlertSeverity.CRITICAL,
      message: 'HTTP error rate is above 10%',
      cooldown: 300000,
    },

    // 响应时间告警
    {
      name: 'slow_response',
      condition: (value) => value > 1000,
      severity: AlertSeverity.WARNING,
      message: 'Average response time is above 1s',
      cooldown: 300000,
    },
    {
      name: 'very_slow_response',
      condition: (value) => value > 3000,
      severity: AlertSeverity.ERROR,
      message: 'Average response time is above 3s',
      cooldown: 300000,
    },

    // 数据库连接池告警
    {
      name: 'db_pool_exhausted',
      condition: (value) => value < 2,
      severity: AlertSeverity.CRITICAL,
      message: 'Database connection pool is nearly exhausted',
      cooldown: 300000,
    },

    // 事件循环延迟告警
    {
      name: 'event_loop_lag',
      condition: (value) => value > 100,
      severity: AlertSeverity.WARNING,
      message: 'Event loop lag is above 100ms',
      cooldown: 300000,
    },
  ];
}

/**
 * 批量添加规则
 */
export function addCommonRules(manager: AlertManager = defaultAlertManager): void {
  const rules = createCommonAlertRules();
  rules.forEach((rule) => manager.addRule(rule));
}

/**
 * Alert Builder - 流式 API 构建告警规则
 */
export class AlertRuleBuilder {
  private rule: Partial<AlertRule> = {};

  name(name: string): this {
    this.rule.name = name;
    return this;
  }

  condition(condition: (value: number) => boolean): this {
    this.rule.condition = condition;
    return this;
  }

  severity(severity: AlertSeverity): this {
    this.rule.severity = severity;
    return this;
  }

  message(message: string): this {
    this.rule.message = message;
    return this;
  }

  cooldown(cooldown: number): this {
    this.rule.cooldown = cooldown;
    return this;
  }

  // 便捷方法
  greaterThan(threshold: number): this {
    this.rule.condition = (value) => value > threshold;
    return this;
  }

  lessThan(threshold: number): this {
    this.rule.condition = (value) => value < threshold;
    return this;
  }

  between(min: number, max: number): this {
    this.rule.condition = (value) => value >= min && value <= max;
    return this;
  }

  build(): AlertRule {
    if (!this.rule.name || !this.rule.condition || !this.rule.severity || !this.rule.message) {
      throw new Error('Alert rule must have name, condition, severity, and message');
    }

    return this.rule as AlertRule;
  }
}

/**
 * 创建告警规则构建器
 */
export function alert(): AlertRuleBuilder {
  return new AlertRuleBuilder();
}

/**
 * 使用示例:
 *
 * const rule = alert()
 *   .name('high_cpu')
 *   .greaterThan(80)
 *   .severity(AlertSeverity.WARNING)
 *   .message('CPU usage is too high')
 *   .cooldown(300000)
 *   .build();
 *
 * alertManager.addRule(rule);
 */
