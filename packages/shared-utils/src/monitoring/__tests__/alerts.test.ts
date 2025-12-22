/**
 * Alert System Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AlertManager,
  alert,
  AlertSeverity,
  createCommonAlertRules,
} from '../alerts';
import type { Alert, AlertHandler } from '../types';

describe('AlertManager', () => {
  let alertManager: AlertManager;

  beforeEach(() => {
    alertManager = new AlertManager();
  });

  describe('Rule Management', () => {
    it('should add and remove rules', () => {
      const rule = alert()
        .name('test_rule')
        .greaterThan(50)
        .severity(AlertSeverity.WARNING)
        .message('Test message')
        .build();

      alertManager.addRule(rule);
      expect(alertManager.getRules()).toHaveLength(1);

      alertManager.removeRule('test_rule');
      expect(alertManager.getRules()).toHaveLength(0);
    });

    it('should get all rules', () => {
      const rule1 = alert()
        .name('rule1')
        .greaterThan(50)
        .severity(AlertSeverity.WARNING)
        .message('Message 1')
        .build();

      const rule2 = alert()
        .name('rule2')
        .lessThan(10)
        .severity(AlertSeverity.ERROR)
        .message('Message 2')
        .build();

      alertManager.addRule(rule1);
      alertManager.addRule(rule2);

      const rules = alertManager.getRules();
      expect(rules).toHaveLength(2);
      expect(rules.map((r) => r.name)).toContain('rule1');
      expect(rules.map((r) => r.name)).toContain('rule2');
    });
  });

  describe('Alert Triggering', () => {
    it('should trigger alert when condition is met', async () => {
      const handler = vi.fn();
      alertManager.addHandler(handler);

      const rule = alert()
        .name('high_value')
        .greaterThan(80)
        .severity(AlertSeverity.WARNING)
        .message('Value is too high')
        .build();

      alertManager.addRule(rule);

      await alertManager.check('high_value', 90);

      expect(handler).toHaveBeenCalled();
      const callArg = handler.mock.calls[0][0] as Alert;
      expect(callArg.rule).toBe('high_value');
      expect(callArg.severity).toBe(AlertSeverity.WARNING);
      expect(callArg.value).toBe(90);
      expect(callArg.resolved).toBeUndefined();
    });

    it('should not trigger alert when condition is not met', async () => {
      const handler = vi.fn();
      alertManager.addHandler(handler);

      const rule = alert()
        .name('high_value')
        .greaterThan(80)
        .severity(AlertSeverity.WARNING)
        .message('Value is too high')
        .build();

      alertManager.addRule(rule);

      await alertManager.check('high_value', 70);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should resolve alert when condition is no longer met', async () => {
      const handler = vi.fn();
      alertManager.addHandler(handler);

      const rule = alert()
        .name('high_value')
        .greaterThan(80)
        .severity(AlertSeverity.WARNING)
        .message('Value is too high')
        .cooldown(0)
        .build();

      alertManager.addRule(rule);

      // 触发告警
      await alertManager.check('high_value', 90);
      expect(alertManager.getActiveAlerts()).toHaveLength(1);

      // 解决告警
      handler.mockClear();
      await alertManager.check('high_value', 70);

      expect(handler).toHaveBeenCalled();
      const callArg = handler.mock.calls[0][0] as Alert;
      expect(callArg.resolved).toBe(true);
      expect(callArg.resolvedAt).toBeDefined();
      expect(alertManager.getActiveAlerts()).toHaveLength(0);
    });

    it('should respect cooldown period', async () => {
      const handler = vi.fn();
      alertManager.addHandler(handler);

      const rule = alert()
        .name('test_rule')
        .greaterThan(50)
        .severity(AlertSeverity.WARNING)
        .message('Test message')
        .cooldown(1000) // 1 秒冷却
        .build();

      alertManager.addRule(rule);

      // 第一次检查 - 应该触发
      await alertManager.check('test_rule', 60);
      expect(handler).toHaveBeenCalledTimes(1);

      // 立即第二次检查 - 应该被冷却阻止
      handler.mockClear();
      await alertManager.check('test_rule', 70);
      expect(handler).not.toHaveBeenCalled();

      // 重置冷却时间
      alertManager.resetCooldown('test_rule');

      // 再次检查 - 应该触发
      await alertManager.check('test_rule', 80);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Handler Management', () => {
    it('should add and remove handlers', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      alertManager.addHandler(handler1);
      alertManager.addHandler(handler2);

      const rule = alert()
        .name('test_rule')
        .greaterThan(50)
        .severity(AlertSeverity.WARNING)
        .message('Test message')
        .build();

      alertManager.addRule(rule);
      await alertManager.check('test_rule', 60);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();

      // 移除一个处理器
      alertManager.removeHandler(handler1);
      handler1.mockClear();
      handler2.mockClear();

      alertManager.resetCooldown('test_rule');
      await alertManager.check('test_rule', 70);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should handle async handlers', async () => {
      const handler: AlertHandler = async (alert: Alert) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      };

      alertManager.addHandler(handler);

      const rule = alert()
        .name('test_rule')
        .greaterThan(50)
        .severity(AlertSeverity.WARNING)
        .message('Test message')
        .build();

      alertManager.addRule(rule);

      // 应该等待异步处理器完成
      await alertManager.check('test_rule', 60);
      expect(alertManager.getActiveAlerts()).toHaveLength(1);
    });

    it('should continue on handler errors', async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
      const successHandler = vi.fn();

      alertManager.addHandler(errorHandler);
      alertManager.addHandler(successHandler);

      const rule = alert()
        .name('test_rule')
        .greaterThan(50)
        .severity(AlertSeverity.WARNING)
        .message('Test message')
        .build();

      alertManager.addRule(rule);

      // 即使一个处理器失败，其他处理器应该继续执行
      await alertManager.check('test_rule', 60);

      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });
  });

  describe('Alert History', () => {
    it('should track alert history', async () => {
      const handler = vi.fn();
      alertManager.addHandler(handler);

      const rule = alert()
        .name('test_rule')
        .greaterThan(50)
        .severity(AlertSeverity.WARNING)
        .message('Test message')
        .cooldown(0)
        .build();

      alertManager.addRule(rule);

      await alertManager.check('test_rule', 60);
      await alertManager.check('test_rule', 70);
      await alertManager.check('test_rule', 80);

      const history = alertManager.getAlertHistory();
      expect(history.length).toBeGreaterThanOrEqual(3);
    });

    it('should limit history size', async () => {
      const handler = vi.fn();
      alertManager.addHandler(handler);
      alertManager.setMaxHistorySize(5);

      const rule = alert()
        .name('test_rule')
        .greaterThan(50)
        .severity(AlertSeverity.WARNING)
        .message('Test message')
        .cooldown(0)
        .build();

      alertManager.addRule(rule);

      // 触发 10 次告警
      for (let i = 0; i < 10; i++) {
        await alertManager.check('test_rule', 60 + i);
        alertManager.resetCooldown('test_rule');
      }

      const history = alertManager.getAlertHistory();
      expect(history).toHaveLength(5);
    });

    it('should get limited history', async () => {
      const handler = vi.fn();
      alertManager.addHandler(handler);

      const rule = alert()
        .name('test_rule')
        .greaterThan(50)
        .severity(AlertSeverity.WARNING)
        .message('Test message')
        .cooldown(0)
        .build();

      alertManager.addRule(rule);

      for (let i = 0; i < 5; i++) {
        await alertManager.check('test_rule', 60 + i);
        alertManager.resetCooldown('test_rule');
      }

      const history = alertManager.getAlertHistory(3);
      expect(history).toHaveLength(3);
    });

    it('should clear history', async () => {
      const handler = vi.fn();
      alertManager.addHandler(handler);

      const rule = alert()
        .name('test_rule')
        .greaterThan(50)
        .severity(AlertSeverity.WARNING)
        .message('Test message')
        .build();

      alertManager.addRule(rule);

      await alertManager.check('test_rule', 60);
      expect(alertManager.getAlertHistory()).toHaveLength(1);

      alertManager.clearHistory();
      expect(alertManager.getAlertHistory()).toHaveLength(0);
    });
  });

  describe('Manual Resolution', () => {
    it('should manually resolve alerts', async () => {
      const handler = vi.fn();
      alertManager.addHandler(handler);

      const rule = alert()
        .name('test_rule')
        .greaterThan(50)
        .severity(AlertSeverity.WARNING)
        .message('Test message')
        .build();

      alertManager.addRule(rule);

      await alertManager.check('test_rule', 60);
      expect(alertManager.getActiveAlerts()).toHaveLength(1);

      handler.mockClear();
      await alertManager.manualResolve('test_rule');

      expect(handler).toHaveBeenCalled();
      const callArg = handler.mock.calls[0][0] as Alert;
      expect(callArg.resolved).toBe(true);
      expect(alertManager.getActiveAlerts()).toHaveLength(0);
    });
  });

  describe('Alert Rule Builder', () => {
    it('should build rule with greaterThan', () => {
      const rule = alert()
        .name('test')
        .greaterThan(50)
        .severity(AlertSeverity.WARNING)
        .message('Test')
        .build();

      expect(rule.condition(60)).toBe(true);
      expect(rule.condition(40)).toBe(false);
    });

    it('should build rule with lessThan', () => {
      const rule = alert()
        .name('test')
        .lessThan(50)
        .severity(AlertSeverity.WARNING)
        .message('Test')
        .build();

      expect(rule.condition(40)).toBe(true);
      expect(rule.condition(60)).toBe(false);
    });

    it('should build rule with between', () => {
      const rule = alert()
        .name('test')
        .between(30, 70)
        .severity(AlertSeverity.WARNING)
        .message('Test')
        .build();

      expect(rule.condition(50)).toBe(true);
      expect(rule.condition(20)).toBe(false);
      expect(rule.condition(80)).toBe(false);
    });

    it('should throw error if required fields are missing', () => {
      expect(() => {
        alert().name('test').build();
      }).toThrow();

      expect(() => {
        alert()
          .name('test')
          .greaterThan(50)
          .severity(AlertSeverity.WARNING)
          .build();
      }).toThrow();
    });
  });

  describe('Common Alert Rules', () => {
    it('should create common alert rules', () => {
      const rules = createCommonAlertRules();

      expect(rules.length).toBeGreaterThan(0);

      const ruleNames = rules.map((r) => r.name);
      expect(ruleNames).toContain('high_cpu_usage');
      expect(ruleNames).toContain('high_memory_usage');
      expect(ruleNames).toContain('high_error_rate');
      expect(ruleNames).toContain('slow_response');
    });

    it('should have valid common rules', () => {
      const rules = createCommonAlertRules();

      rules.forEach((rule) => {
        expect(rule.name).toBeDefined();
        expect(rule.condition).toBeDefined();
        expect(rule.severity).toBeDefined();
        expect(rule.message).toBeDefined();
      });
    });
  });
});
