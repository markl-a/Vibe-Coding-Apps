# HTTP日誌中間件

提供完整的HTTP請求/響應日誌記錄功能，支援請求追蹤、敏感信息過濾和結構化日誌輸出。

## 功能特性

- **請求追蹤**: 自動生成唯一的關聯ID (Correlation ID)，追蹤整個請求生命週期
- **請求日誌**: 記錄HTTP請求的詳細信息（方法、URL、headers、body、query等）
- **響應日誌**: 記錄HTTP響應的詳細信息（狀態碼、延遲、headers、body等）
- **敏感信息過濾**: 自動過濾密碼、token、API密鑰等敏感字段
- **靈活配置**: 支援自定義日誌選項、排除路徑、Content-Type過濾等
- **性能優化**: 可配置只記錄錯誤，減少生產環境日誌量
- **TypeScript支援**: 完整的類型定義

## 快速開始

### 基本使用

```typescript
import express from 'express';
import { createLogger } from '@vibe/shared-utils';
import { correlationId, httpLogger } from '@vibe/shared-utils/logging';

const app = express();
const logger = createLogger('my-service');

// 添加中間件
app.use(express.json());
app.use(correlationId());
app.use(httpLogger(logger));

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});
```

## 中間件說明

### 1. correlationId - 請求追蹤ID

為每個請求生成唯一的追蹤ID，用於關聯所有相關的日誌記錄。

```typescript
import { correlationId } from '@vibe/shared-utils/logging';

app.use(correlationId({
  headerName: 'X-Correlation-ID',  // 自定義header名稱
  includeInResponse: true,          // 在響應中返回ID
  generator: () => customIdGenerator() // 自定義ID生成器
}));
```

**功能**:
- 從請求頭讀取現有的關聯ID，如果不存在則生成新的
- 將ID附加到 `req.correlationId`
- 在響應頭中返回ID（可選）
- 支援自定義ID生成邏輯

### 2. requestLogger - 請求日誌記錄

記錄HTTP請求的詳細信息。

```typescript
import { requestLogger } from '@vibe/shared-utils/logging';

app.use(requestLogger(logger, {
  logHeaders: true,                // 記錄請求頭
  logBody: true,                   // 記錄請求體
  logQuery: true,                  // 記錄查詢參數
  excludePaths: ['/health'],       // 排除的路徑
  additionalSensitiveFields: ['email'] // 額外的敏感字段
}));
```

**記錄內容**:
- HTTP方法和URL
- 請求頭（自動過濾敏感信息）
- 請求體（自動過濾敏感信息）
- 查詢參數
- 客戶端IP和User-Agent
- 關聯ID（如果有）

**敏感信息過濾**:
自動過濾以下字段：
- `password`, `token`, `authorization`
- `cookie`, `secret`, `apiKey`
- `accessToken`, `refreshToken`
- `sessionId`, `creditCard`, `ssn`
- `privateKey` 等

### 3. responseLogger - 響應日誌記錄

記錄HTTP響應的詳細信息。

```typescript
import { responseLogger } from '@vibe/shared-utils/logging';

app.use(responseLogger(logger, {
  logHeaders: true,                // 記錄響應頭
  logBody: false,                  // 記錄響應體（默認關閉）
  maxBodyLength: 1000,             // 響應體最大長度
  excludePaths: ['/health'],       // 排除的路徑
  excludeContentTypes: ['image/'], // 排除的Content-Type
  onlyErrors: false                // 只記錄錯誤響應
}));
```

**記錄內容**:
- HTTP狀態碼
- 響應時間（延遲）
- 響應頭
- 響應體（可選，支援截斷）
- Content-Length

### 4. httpLogger - 組合中間件

將請求和響應日誌組合為一個中間件，提供最便捷的使用方式。

```typescript
import { httpLogger } from '@vibe/shared-utils/logging';

app.use(httpLogger(logger, {
  logRequestBody: true,
  logRequestHeaders: true,
  logResponseBody: false,
  logResponseHeaders: true,
  maxBodyLength: 1000,
  excludePaths: ['/health', '/metrics'],
  onlyErrors: false
}));
```

## 使用場景

### 場景 1: 開發環境 - 詳細日誌

```typescript
app.use(correlationId());
app.use(httpLogger(logger, {
  logRequestBody: true,
  logRequestHeaders: true,
  logResponseBody: true,
  logResponseHeaders: true,
  maxBodyLength: 5000
}));
```

### 場景 2: 生產環境 - 只記錄錯誤

```typescript
app.use(correlationId());
app.use(httpLogger(logger, {
  logRequestBody: false,
  logResponseBody: false,
  onlyErrors: true,  // 只記錄4xx和5xx
  excludePaths: ['/health', '/metrics']
}));
```

### 場景 3: 性能監控

```typescript
app.use(correlationId());
app.use(requestLogger(logger, {
  getLogLevel: (req, res) => {
    // 根據響應時間動態調整日誌級別
    const duration = res.getHeader('X-Response-Time');
    if (duration > 1000) return 'warn';
    if (duration > 5000) return 'error';
    return 'info';
  }
}));
```

### 場景 4: 微服務 - 傳遞關聯ID

```typescript
app.use(correlationId());
app.use(httpLogger(logger));

app.get('/api/aggregate', async (req, res) => {
  // 調用其他服務時傳遞關聯ID
  const response = await fetch('http://service-b/api/data', {
    headers: {
      'X-Correlation-ID': req.correlationId!
    }
  });

  const data = await response.json();
  res.json(data);
});
```

### 場景 5: 與錯誤處理集成

```typescript
app.use(correlationId());
app.use(httpLogger(logger));

// 錯誤處理中間件
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err, {
    traceId: req.correlationId,
    method: req.method,
    path: req.path
  });

  res.status(500).json({
    error: {
      message: err.message,
      correlationId: req.correlationId  // 返回給客戶端用於追蹤
    }
  });
});
```

## 日誌輸出格式

所有日誌都以JSON格式輸出，便於日誌聚合系統（如ELK、Splunk）解析。

### 請求日誌示例

```json
{
  "level": "INFO",
  "message": "HTTP Request",
  "timestamp": "2025-12-21T10:30:45.123Z",
  "context": {
    "service": "my-service",
    "traceId": "1703155845123-a1b2c3d4e5f6g7h8",
    "method": "POST",
    "url": "/api/users",
    "path": "/api/users",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "headers": {
      "content-type": "application/json",
      "authorization": "[REDACTED]"
    },
    "body": {
      "username": "john",
      "password": "[REDACTED]"
    }
  }
}
```

### 響應日誌示例

```json
{
  "level": "INFO",
  "message": "HTTP POST /api/users 201 - 45ms",
  "timestamp": "2025-12-21T10:30:45.168Z",
  "context": {
    "service": "my-service",
    "traceId": "1703155845123-a1b2c3d4e5f6g7h8",
    "method": "POST",
    "url": "/api/users",
    "path": "/api/users",
    "statusCode": 201,
    "duration": "45ms",
    "contentLength": "156"
  }
}
```

## 工具函數

### sanitize - 過濾敏感信息

```typescript
import { sanitize } from '@vibe/shared-utils/logging';

const data = {
  username: 'john',
  password: 'secret123',
  token: 'abc123'
};

const sanitized = sanitize(data);
// { username: 'john', password: '[REDACTED]', token: '[REDACTED]' }
```

### getCorrelationId - 獲取關聯ID

```typescript
import { getCorrelationId } from '@vibe/shared-utils/logging';

app.get('/api/data', (req, res) => {
  const correlationId = getCorrelationId(req);

  logger.info('Fetching data', {
    traceId: correlationId,
    userId: req.user?.id
  });

  res.json({ data: [] });
});
```

## 最佳實踐

1. **始終使用關聯ID**: 在微服務架構中，關聯ID是追蹤請求的關鍵
2. **生產環境優化**: 使用 `onlyErrors: true` 減少日誌量
3. **避免記錄大型響應體**: 默認不記錄響應體，只在調試時開啟
4. **排除健康檢查端點**: 使用 `excludePaths` 排除 `/health`、`/metrics` 等端點
5. **傳遞關聯ID**: 在調用其他服務時傳遞關聯ID
6. **與監控系統集成**: 將日誌發送到 ELK、Datadog 等監控系統

## TypeScript 支援

所有中間件都提供完整的TypeScript類型定義：

```typescript
import type {
  CorrelationIdOptions,
  RequestLoggerOptions,
  ResponseLoggerOptions,
  HttpLoggerOptions
} from '@vibe/shared-utils/logging';
```

## 性能考慮

- **請求日誌**: 幾乎無性能影響（~0.1ms）
- **響應日誌（不記錄body）**: 輕微影響（~0.2ms）
- **響應日誌（記錄body）**: 中等影響（~1-5ms，取決於響應大小）

建議：
- 開發環境：記錄所有內容
- 測試環境：記錄請求和錯誤響應
- 生產環境：只記錄錯誤（`onlyErrors: true`）

## 相關文檔

- [Logger API](../logger/index.ts) - 結構化日誌器
- [Examples](./examples.ts) - 更多使用示例
- [Middleware](../middleware/index.ts) - 其他中間件
