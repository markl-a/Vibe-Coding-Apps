# HTTP日誌中間件使用指南

## 快速開始

### 1. 基本設置（推薦）

最簡單的使用方式，適合大多數應用：

```typescript
import express from 'express';
import { createLogger, correlationId, httpLogger } from '@vibe/shared-utils';

const app = express();
const logger = createLogger('my-service');

// 添加JSON解析中間件
app.use(express.json());

// 添加關聯ID中間件
app.use(correlationId());

// 添加HTTP日誌中間件
app.use(httpLogger(logger));

// 你的路由
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 2. 開發環境配置

開發時記錄詳細信息：

```typescript
import { createLogger, LogLevel } from '@vibe/shared-utils';
import { correlationId, httpLogger } from '@vibe/shared-utils';

const logger = createLogger('my-service', { minLevel: LogLevel.DEBUG });

app.use(correlationId());
app.use(httpLogger(logger, {
  logRequestBody: true,      // 記錄請求體
  logRequestHeaders: true,   // 記錄請求頭
  logResponseBody: true,     // 記錄響應體
  logResponseHeaders: true,  // 記錄響應頭
  maxBodyLength: 5000,       // 響應體最大長度
}));
```

### 3. 生產環境配置

生產環境只記錄錯誤：

```typescript
const logger = createLogger('my-service', { minLevel: LogLevel.INFO });

app.use(correlationId());
app.use(httpLogger(logger, {
  logRequestBody: false,     // 不記錄請求體（性能）
  logResponseBody: false,    // 不記錄響應體（性能）
  onlyErrors: true,          // 只記錄4xx和5xx響應
  excludePaths: [            // 排除健康檢查端點
    '/health',
    '/metrics',
    '/favicon.ico'
  ]
}));
```

### 4. 環境自適應配置

根據環境自動調整：

```typescript
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger('my-service', {
  minLevel: isDev ? LogLevel.DEBUG : LogLevel.INFO
});

app.use(correlationId());
app.use(httpLogger(logger, {
  logRequestBody: isDev,
  logRequestHeaders: true,
  logResponseBody: isDev,
  logResponseHeaders: !isProd,
  onlyErrors: isProd,
  excludePaths: ['/health', '/metrics'],
}));
```

## 高級用法

### 1. 分開配置請求和響應日誌

如果需要更細粒度的控制：

```typescript
import {
  correlationId,
  requestLogger,
  responseLogger
} from '@vibe/shared-utils';

app.use(correlationId());

// 請求日誌
app.use(requestLogger(logger, {
  logHeaders: true,
  logBody: true,
  excludePaths: ['/health']
}));

// 響應日誌（只記錄錯誤）
app.use(responseLogger(logger, {
  logBody: true,
  onlyErrors: true,
  maxBodyLength: 1000
}));
```

### 2. 自定義關聯ID

使用自定義的ID生成邏輯：

```typescript
import { v4 as uuidv4 } from 'uuid';

app.use(correlationId({
  headerName: 'X-Request-ID',
  generator: () => uuidv4(),
  includeInResponse: true
}));
```

### 3. 過濾額外的敏感字段

```typescript
app.use(requestLogger(logger, {
  logBody: true,
  additionalSensitiveFields: [
    'email',
    'phoneNumber',
    'ssn',
    'creditCardNumber'
  ]
}));
```

### 4. 在業務邏輯中使用關聯ID

```typescript
app.get('/api/orders/:id', async (req, res) => {
  const correlationId = req.correlationId;

  // 記錄業務日誌
  logger.info('Fetching order', {
    traceId: correlationId,
    orderId: req.params.id,
    userId: req.user?.id
  });

  try {
    const order = await orderService.findById(req.params.id);

    // 調用其他服務時傳遞關聯ID
    const payment = await fetch('http://payment-service/api/payment', {
      headers: {
        'X-Correlation-ID': correlationId
      }
    });

    res.json({ order, payment: await payment.json() });
  } catch (error) {
    logger.error('Failed to fetch order', error, {
      traceId: correlationId,
      orderId: req.params.id
    });
    throw error;
  }
});
```

### 5. 與錯誤處理集成

```typescript
app.use(correlationId());
app.use(httpLogger(logger));

// 你的路由...

// 錯誤處理中間件（必須在最後）
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', err, {
    traceId: req.correlationId,
    method: req.method,
    path: req.path,
    query: req.query
  });

  res.status(500).json({
    error: {
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
      correlationId: req.correlationId  // 返回給客戶端用於追蹤
    }
  });
});
```

## 日誌輸出示例

### 成功的請求

```json
{
  "level": "INFO",
  "message": "HTTP GET /api/users 200 - 23ms",
  "timestamp": "2025-12-21T10:30:45.123Z",
  "context": {
    "service": "my-service",
    "traceId": "1703155845123-a1b2c3d4e5f6g7h8",
    "method": "GET",
    "url": "/api/users?page=1&limit=10",
    "path": "/api/users",
    "statusCode": 200,
    "duration": "23ms",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### 錯誤的請求

```json
{
  "level": "ERROR",
  "message": "HTTP POST /api/users 500 - 156ms",
  "timestamp": "2025-12-21T10:31:12.456Z",
  "context": {
    "service": "my-service",
    "traceId": "1703155872456-x9y8z7w6v5u4t3s2",
    "method": "POST",
    "url": "/api/users",
    "path": "/api/users",
    "statusCode": 500,
    "duration": "156ms",
    "body": {
      "username": "john",
      "password": "[REDACTED]"
    }
  }
}
```

## 性能提示

1. **生產環境使用 `onlyErrors: true`**
   - 大幅減少日誌量
   - 只在出問題時記錄

2. **不要記錄響應體**
   - 響應體可能很大
   - 會影響性能和存儲

3. **排除健康檢查端點**
   - 使用 `excludePaths: ['/health']`
   - 避免無用的日誌

4. **合理設置 `maxBodyLength`**
   - 防止記錄過大的響應
   - 建議值: 1000-5000 字節

## 與監控系統集成

### ELK Stack

日誌已經是JSON格式，可以直接發送到Elasticsearch：

```typescript
// 配置Winston傳輸到Elasticsearch
import { createLogger } from '@vibe/shared-utils';
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const esTransport = new ElasticsearchTransport({
  level: 'info',
  clientOpts: { node: 'http://localhost:9200' },
  index: 'logs'
});

// 自定義Logger以使用Winston
```

### Datadog

```typescript
// 使用Datadog的日誌格式
import { createLogger } from '@vibe/shared-utils';

const logger = createLogger('my-service');

app.use(correlationId());
app.use(httpLogger(logger, {
  // Datadog會自動索引JSON日誌
  onlyErrors: false
}));
```

## 常見問題

### Q: 日誌太多了怎麼辦？

A: 使用 `onlyErrors: true` 和 `excludePaths`：

```typescript
app.use(httpLogger(logger, {
  onlyErrors: true,
  excludePaths: ['/health', '/metrics', '/static']
}));
```

### Q: 如何記錄用戶信息？

A: 在認證中間件之後使用自定義中間件：

```typescript
app.use(authMiddleware); // 設置 req.user

app.use((req, res, next) => {
  if (req.user) {
    logger.info('Authenticated request', {
      traceId: req.correlationId,
      userId: req.user.id,
      username: req.user.username
    });
  }
  next();
});
```

### Q: 如何追蹤跨服務的請求？

A: 在調用其他服務時傳遞關聯ID：

```typescript
const response = await fetch('http://service-b/api/data', {
  headers: {
    'X-Correlation-ID': req.correlationId
  }
});
```

### Q: 關聯ID會自動傳遞嗎？

A: 不會。你需要手動在HTTP請求中傳遞：

```typescript
// 使用axios
const client = axios.create({
  headers: {
    'X-Correlation-ID': req.correlationId
  }
});

// 使用fetch
fetch(url, {
  headers: {
    'X-Correlation-ID': req.correlationId
  }
});
```

## 總結

這個日誌中間件提供了：
- 自動的請求/響應日誌記錄
- 請求追蹤（關聯ID）
- 敏感信息過濾
- 靈活的配置選項
- 生產就緒的性能優化

從最簡單的配置開始，根據需要逐步添加功能。
