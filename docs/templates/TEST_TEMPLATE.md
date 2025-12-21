# 測試編寫指南

## 單元測試模板 (TypeScript)
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    service = new ServiceName();
    vi.clearAllMocks();
  });

  describe('methodName', () => {
    it('should return expected result when given valid input', () => {
      const result = service.methodName('validInput');
      expect(result).toBe('expectedOutput');
    });

    it('should throw error when given invalid input', () => {
      expect(() => service.methodName(null)).toThrow('Invalid input');
    });
  });
});
```

## 測試命名規範
- 測試文件: `*.test.ts` 或 `*.spec.ts`
- 描述格式: `should [expected behavior] when [condition]`

## 覆蓋率要求
- 最低覆蓋率: 75%
- 關鍵業務邏輯: 90%+
