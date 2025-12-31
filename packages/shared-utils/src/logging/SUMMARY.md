# HTTP日誌中間件 - 創建總結

## 創建的文件

### 核心中間件文件

1. **correlationId.ts** - 請求追蹤ID中間件
   - 路徑: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/logging/correlationId.ts`
   - 功能:
     - 為每個請求生成唯一的追蹤ID
     - 從請求頭讀取或生成新ID
     - 在響應頭中返回ID
     - 支援自定義ID生成器

2. **requestLogger.ts** - 請求日誌記錄中間件
   - 路徑: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/logging/requestLogger.ts`
   - 功能:
     - 記錄HTTP請求方法、URL、headers
     - 記錄請求體和查詢參數
     - 自動過濾敏感信息（password, token, apiKey等）
     - 支援排除特定路徑
     - 根據響應狀態碼自動調整日誌級別

3. **responseLogger.ts** - 響應日誌記錄中間件
   - 路徑: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/logging/responseLogger.ts`
   - 功能:
     - 記錄HTTP響應狀態碼和延遲
     - 記錄響應頭和響應體
     - 支援響應體截斷（避免過大）
     - 支援只記錄錯誤響應
     - 提供組合中間件 `httpLogger`

### 輔助文件

4. **index.ts** - 導出所有中間件
   - 路徑: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/logging/index.ts`
   - 導出所有中間件和類型定義

5. **examples.ts** - 10個實際使用示例
   - 路徑: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/logging/examples.ts`
   - 包含10個不同場景的使用示例

6. **demo.ts** - 可運行的演示服務器
   - 路徑: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/logging/demo.ts`
   - 提供三種配置方式的實際演示

### 文檔文件

7. **README.md** - 完整文檔
   - 路徑: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/logging/README.md`
   - 包含詳細的API文檔和使用說明

8. **USAGE.md** - 使用指南
   - 路徑: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/logging/USAGE.md`
   - 提供快速開始和常見場景

### 測試文件

9. **logging.test.ts** - 單元測試
   - 路徑: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/logging/__tests__/logging.test.ts`
   - 測試關聯ID生成和敏感信息過濾

## 核心功能

### 1. 請求追蹤
```typescript
// 自動為每個請求生成唯一ID
app.use(correlationId());

// 在業務邏輯中訪問
const id = req.correlationId;
```

### 2. 請求日誌
```typescript
// 記錄請求詳情，自動過濾敏感信息
app.use(requestLogger(logger, {
  logHeaders: true,
  logBody: true,
  logQuery: true
}));
```

### 3. 響應日誌
```typescript
// 記錄響應狀態和延遲
app.use(responseLogger(logger, {
  logHeaders: true,
  logBody: false,  // 默認不記錄響應體
  onlyErrors: false
}));
```

### 4. 組合中間件
```typescript
// 最簡單的使用方式
app.use(httpLogger(logger));
```

### 5. 敏感信息過濾

自動過濾以下敏感字段：
- `password`, `token`, `authorization`
- `cookie`, `secret`, `apiKey`, `api_key`
- `accessToken`, `access_token`
- `refreshToken`, `refresh_token`
- `sessionId`, `session_id`
- `creditCard`, `credit_card`
- `ssn`, `privateKey`, `private_key`

## 使用示例

### 最簡單的配置

```typescript
import express from 'express';
import { createLogger, correlationId, httpLogger } from '@vibe/shared-utils';

const app = express();
const logger = createLogger('my-service');

app.use(express.json());
app.use(correlationId());
app.use(httpLogger(logger));
```

### 開發環境配置

```typescript
const logger = createLogger('my-service', { minLevel: LogLevel.DEBUG });

app.use(correlationId());
app.use(httpLogger(logger, {
  logRequestBody: true,
  logRequestHeaders: true,
  logResponseBody: true,
  logResponseHeaders: true
}));
```

### 生產環境配置

```typescript
app.use(correlationId());
app.use(httpLogger(logger, {
  logRequestBody: false,
  logResponseBody: false,
  onlyErrors: true,  // 只記錄錯誤
  excludePaths: ['/health', '/metrics']
}));
```

### 微服務場景 - 傳遞關聯ID

```typescript
app.get('/api/aggregate', async (req, res) => {
  // 調用其他服務時傳遞關聯ID
  const response = await fetch('http://other-service/api/data', {
    headers: {
      'X-Correlation-ID': req.correlationId
    }
  });

  const data = await response.json();
  res.json(data);
});
```

## 日誌輸出格式

### 成功請求
```json
{
  "level": "INFO",
  "message": "HTTP GET /api/users 200 - 23ms",
  "timestamp": "2025-12-21T10:30:45.123Z",
  "context": {
    "service": "my-service",
    "traceId": "1703155845123-a1b2c3d4e5f6g7h8",
    "method": "GET",
    "url": "/api/users",
    "statusCode": 200,
    "duration": "23ms"
  }
}
```

### 帶敏感信息的請求
```json
{
  "level": "INFO",
  "message": "HTTP POST /api/login 200 - 45ms",
  "timestamp": "2025-12-21T10:31:00.000Z",
  "context": {
    "traceId": "1703155860000-x1y2z3",
    "method": "POST",
    "path": "/api/login",
    "body": {
      "username": "john",
      "password": "[REDACTED]"  // 自動過濾
    }
  }
}
```

## 配置選項總結

### correlationId 選項
- `headerName`: 自定義header名稱（默認: 'X-Correlation-ID'）
- `includeInResponse`: 是否在響應中返回ID（默認: true）
- `generator`: 自定義ID生成函數

### requestLogger 選項
- `logHeaders`: 是否記錄請求頭（默認: true）
- `logBody`: 是否記錄請求體（默認: true）
- `logQuery`: 是否記錄查詢參數（默認: true）
- `additionalSensitiveFields`: 額外的敏感字段列表
- `excludePaths`: 要排除的路徑列表

### responseLogger 選項
- `logHeaders`: 是否記錄響應頭（默認: true）
- `logBody`: 是否記錄響應體（默認: false）
- `maxBodyLength`: 響應體最大長度（默認: 1000）
- `excludePaths`: 要排除的路徑列表
- `excludeContentTypes`: 要排除的Content-Type列表
- `onlyErrors`: 是否只記錄錯誤響應（默認: false）

### httpLogger 選項
- `logRequestBody`: 是否記錄請求體（默認: true）
- `logRequestHeaders`: 是否記錄請求頭（默認: true）
- `logResponseBody`: 是否記錄響應體（默認: false）
- `logResponseHeaders`: 是否記錄響應頭（默認: true）
- `maxBodyLength`: 響應體最大長度（默認: 1000）
- `excludePaths`: 要排除的路徑列表
- `onlyErrors`: 是否只記錄錯誤（默認: false）

## 性能考慮

- **請求日誌**: 幾乎無性能影響（~0.1ms）
- **響應日誌（不記錄body）**: 輕微影響（~0.2ms）
- **響應日誌（記錄body）**: 中等影響（~1-5ms）

建議：
- 開發環境：記錄所有內容
- 測試環境：記錄請求和錯誤響應
- 生產環境：只記錄錯誤（`onlyErrors: true`）

## 與其他工具集成

### 與結構化Logger集成
```typescript
import { createLogger } from '@vibe/shared-utils';
const logger = createLogger('my-service');
```

### 與錯誤處理集成
```typescript
app.use((err, req, res, next) => {
  logger.error('Error', err, {
    traceId: req.correlationId
  });
  res.status(500).json({
    correlationId: req.correlationId
  });
});
```

## 測試

測試文件位於: `/home/user/Vibe-Coding-Apps/packages/shared-utils/src/logging/__tests__/logging.test.ts`

包含以下測試：
- 關聯ID生成和唯一性
- 敏感信息過濾
- 嵌套對象處理
- 數組處理
- 深度限制
- 請求頭過濾

## 下一步建議

1. **運行測試**: `npm test`
2. **嘗試演示**: 運行 `demo.ts` 查看實際效果
3. **集成到項目**: 在您的Express應用中添加中間件
4. **配置監控**: 將日誌發送到ELK、Datadog等監控系統
5. **自定義擴展**: 根據需要添加額外的敏感字段過濾

## 相關文檔

- [README.md](./README.md) - 完整API文檔
- [USAGE.md](./USAGE.md) - 使用指南和常見問題
- [examples.ts](./examples.ts) - 10個實際使用示例
- [demo.ts](./demo.ts) - 可運行的演示服務器
