/**
 * HTTP日誌中間件測試
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCorrelationId, sanitize, sanitizeHeaders } from '../index';

describe('correlationId', () => {
  describe('generateCorrelationId', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with correct format', () => {
      const id = generateCorrelationId();

      // 格式: timestamp-randomhex
      expect(id).toMatch(/^\d+-[a-f0-9]{16}$/);
    });
  });
});

describe('sanitize', () => {
  it('should redact sensitive fields', () => {
    const data = {
      username: 'john',
      password: 'secret123',
      token: 'abc123',
      apiKey: 'key123',
    };

    const sanitized = sanitize(data);

    expect(sanitized.username).toBe('john');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.token).toBe('[REDACTED]');
    expect(sanitized.apiKey).toBe('[REDACTED]');
  });

  it('should handle nested objects', () => {
    const data = {
      user: {
        name: 'john',
        credentials: {
          password: 'secret',
          token: 'abc123',
        },
      },
      metadata: {
        ip: '192.168.1.1',
      },
    };

    const sanitized = sanitize(data);

    expect(sanitized.user.name).toBe('john');
    expect(sanitized.user.credentials.password).toBe('[REDACTED]');
    expect(sanitized.user.credentials.token).toBe('[REDACTED]');
    expect(sanitized.metadata.ip).toBe('192.168.1.1');
  });

  it('should handle arrays', () => {
    const data = {
      users: [
        { name: 'john', password: 'secret1' },
        { name: 'jane', password: 'secret2' },
      ],
    };

    const sanitized = sanitize(data);

    expect(sanitized.users[0].name).toBe('john');
    expect(sanitized.users[0].password).toBe('[REDACTED]');
    expect(sanitized.users[1].name).toBe('jane');
    expect(sanitized.users[1].password).toBe('[REDACTED]');
  });

  it('should handle null and undefined', () => {
    expect(sanitize(null)).toBeNull();
    expect(sanitize(undefined)).toBeUndefined();
  });

  it('should handle primitive values', () => {
    expect(sanitize('string')).toBe('string');
    expect(sanitize(123)).toBe(123);
    expect(sanitize(true)).toBe(true);
  });

  it('should prevent infinite recursion', () => {
    const data = {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                level6: {
                  data: 'deep',
                },
              },
            },
          },
        },
      },
    };

    const sanitized = sanitize(data);

    // 應該在深度5處停止
    expect(sanitized.level1.level2.level3.level4.level5).toBe('[Max Depth Reached]');
  });
});

describe('sanitizeHeaders', () => {
  it('should redact authorization header', () => {
    const headers = {
      'content-type': 'application/json',
      'authorization': 'Bearer token123',
      'x-api-key': 'secret',
    };

    const sanitized = sanitizeHeaders(headers);

    expect(sanitized['content-type']).toBe('application/json');
    expect(sanitized['authorization']).toBe('[REDACTED]');
    expect(sanitized['x-api-key']).toBe('[REDACTED]');
  });

  it('should handle cookie header', () => {
    const headers = {
      'cookie': 'sessionId=abc123; token=xyz789',
      'user-agent': 'Mozilla/5.0',
    };

    const sanitized = sanitizeHeaders(headers);

    expect(sanitized['cookie']).toBe('[REDACTED]');
    expect(sanitized['user-agent']).toBe('Mozilla/5.0');
  });

  it('should be case insensitive', () => {
    const headers = {
      'Authorization': 'Bearer token123',
      'X-API-KEY': 'secret',
      'COOKIE': 'session=abc',
    };

    const sanitized = sanitizeHeaders(headers);

    expect(sanitized['Authorization']).toBe('[REDACTED]');
    expect(sanitized['X-API-KEY']).toBe('[REDACTED]');
    expect(sanitized['COOKIE']).toBe('[REDACTED]');
  });
});

describe('Integration tests', () => {
  it('should sanitize complex request body', () => {
    const requestBody = {
      user: {
        username: 'john.doe',
        email: 'john@example.com',
        password: 'SecurePassword123!',
        profile: {
          age: 30,
          preferences: {
            theme: 'dark',
            apiKey: 'my-secret-api-key',
          },
        },
      },
      payment: {
        method: 'credit_card',
        creditCard: {
          number: '4532-1234-5678-9010',
          cvv: '123',
        },
        token: 'payment-token-xyz',
      },
    };

    const sanitized = sanitize(requestBody);

    // 正常字段應該保留
    expect(sanitized.user.username).toBe('john.doe');
    expect(sanitized.user.email).toBe('john@example.com');
    expect(sanitized.user.profile.age).toBe(30);
    expect(sanitized.user.profile.preferences.theme).toBe('dark');
    expect(sanitized.payment.method).toBe('credit_card');

    // 敏感字段應該被過濾
    expect(sanitized.user.password).toBe('[REDACTED]');
    expect(sanitized.user.profile.preferences.apiKey).toBe('[REDACTED]');
    expect(sanitized.payment.creditCard).toBe('[REDACTED]');
    expect(sanitized.payment.token).toBe('[REDACTED]');
  });

  it('should handle mixed data types', () => {
    const data = {
      string: 'value',
      number: 42,
      boolean: true,
      null: null,
      undefined: undefined,
      array: [1, 2, 3],
      object: {
        nested: 'value',
        password: 'secret',
      },
      arrayOfObjects: [
        { id: 1, token: 'abc' },
        { id: 2, token: 'xyz' },
      ],
    };

    const sanitized = sanitize(data);

    expect(sanitized.string).toBe('value');
    expect(sanitized.number).toBe(42);
    expect(sanitized.boolean).toBe(true);
    expect(sanitized.null).toBeNull();
    expect(sanitized.undefined).toBeUndefined();
    expect(sanitized.array).toEqual([1, 2, 3]);
    expect(sanitized.object.nested).toBe('value');
    expect(sanitized.object.password).toBe('[REDACTED]');
    expect(sanitized.arrayOfObjects[0].id).toBe(1);
    expect(sanitized.arrayOfObjects[0].token).toBe('[REDACTED]');
    expect(sanitized.arrayOfObjects[1].id).toBe(2);
    expect(sanitized.arrayOfObjects[1].token).toBe('[REDACTED]');
  });
});
