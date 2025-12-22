/**
 * HTTP日誌中間件使用示例
 * 展示如何在Express應用中使用日誌中間件
 */

import express from 'express';
import { createLogger } from '../logger';
import {
  correlationId,
  requestLogger,
  responseLogger,
  httpLogger,
} from './index';

const app = express();
const logger = createLogger('my-service');

// ============================================
// 示例 1: 基本使用 - 只記錄請求
// ============================================
function example1() {
  app.use(express.json());

  // 首先添加關聯ID中間件
  app.use(correlationId());

  // 然後添加請求日誌中間件
  app.use(requestLogger(logger));

  app.get('/api/users', (req, res) => {
    res.json({ users: [] });
  });
}

// ============================================
// 示例 2: 完整日誌 - 請求和響應
// ============================================
function example2() {
  app.use(express.json());

  // 關聯ID
  app.use(correlationId({
    headerName: 'X-Request-ID',
    includeInResponse: true,
  }));

  // 請求日誌
  app.use(requestLogger(logger, {
    logHeaders: true,
    logBody: true,
    logQuery: true,
    excludePaths: ['/health', '/metrics'],
  }));

  // 響應日誌
  app.use(responseLogger(logger, {
    logHeaders: true,
    logBody: false, // 響應體可能很大，默認不記錄
    onlyErrors: false,
  }));

  app.post('/api/users', (req, res) => {
    const user = req.body;
    res.status(201).json({ id: '123', ...user });
  });
}

// ============================================
// 示例 3: 使用組合中間件 - 最簡單的方式
// ============================================
function example3() {
  app.use(express.json());

  // 關聯ID
  app.use(correlationId());

  // HTTP日誌器（組合了請求和響應日誌）
  app.use(httpLogger(logger, {
    logRequestBody: true,
    logRequestHeaders: true,
    logResponseBody: false,
    logResponseHeaders: true,
    excludePaths: ['/health', '/metrics'],
    onlyErrors: false, // 記錄所有請求
  }));

  app.get('/api/products/:id', (req, res) => {
    res.json({ id: req.params.id, name: 'Product' });
  });
}

// ============================================
// 示例 4: 只記錄錯誤響應
// ============================================
function example4() {
  app.use(express.json());
  app.use(correlationId());

  // 只記錄4xx和5xx響應
  app.use(httpLogger(logger, {
    logRequestBody: true,
    logResponseBody: true, // 錯誤時記錄響應體很有用
    maxBodyLength: 500,
    onlyErrors: true, // 只記錄錯誤
  }));

  app.get('/api/error', (req, res) => {
    res.status(500).json({ error: 'Something went wrong' });
  });
}

// ============================================
// 示例 5: 自定義敏感字段過濾
// ============================================
function example5() {
  app.use(express.json());
  app.use(correlationId());

  app.use(requestLogger(logger, {
    logBody: true,
    additionalSensitiveFields: [
      'creditCard',
      'ssn',
      'phoneNumber',
      'email', // 如果你想過濾郵箱
    ],
  }));

  app.post('/api/payment', (req, res) => {
    // req.body.creditCard 會被過濾為 [REDACTED]
    res.json({ success: true });
  });
}

// ============================================
// 示例 6: 在其他中間件中使用關聯ID
// ============================================
function example6() {
  app.use(express.json());
  app.use(correlationId());

  // 自定義中間件可以訪問關聯ID
  app.use((req, res, next) => {
    const correlationId = req.correlationId;

    // 可以將關聯ID傳遞給其他服務
    logger.info('Processing request', {
      traceId: correlationId,
      action: 'custom-middleware',
    });

    next();
  });

  app.use(httpLogger(logger));

  app.get('/api/orders', (req, res) => {
    // 在業務邏輯中也可以使用關聯ID
    logger.info('Fetching orders', {
      traceId: req.correlationId,
      userId: 'user-123',
    });

    res.json({ orders: [] });
  });
}

// ============================================
// 示例 7: 生產環境配置
// ============================================
function example7() {
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(correlationId());

  app.use(httpLogger(logger, {
    logRequestBody: !isProd, // 生產環境不記錄請求體
    logRequestHeaders: true,
    logResponseBody: false, // 生產環境不記錄響應體
    logResponseHeaders: false,
    excludePaths: ['/health', '/metrics', '/favicon.ico'],
    onlyErrors: isProd, // 生產環境只記錄錯誤
  }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/data', (req, res) => {
    res.json({ data: [] });
  });
}

// ============================================
// 示例 8: 微服務架構 - 傳遞關聯ID
// ============================================
async function example8() {
  app.use(express.json());
  app.use(correlationId());
  app.use(httpLogger(logger));

  app.get('/api/aggregate', async (req, res) => {
    const correlationId = req.correlationId;

    // 調用其他服務時傳遞關聯ID
    const response = await fetch('http://other-service/api/data', {
      headers: {
        'X-Correlation-ID': correlationId!,
      },
    });

    const data = await response.json();
    res.json(data);
  });
}

// ============================================
// 示例 9: 與錯誤處理中間件集成
// ============================================
function example9() {
  app.use(express.json());
  app.use(correlationId());
  app.use(httpLogger(logger));

  app.get('/api/fail', (req, res) => {
    throw new Error('Something went wrong!');
  });

  // 錯誤處理中間件
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', err, {
      traceId: req.correlationId,
      method: req.method,
      path: req.path,
    });

    res.status(500).json({
      error: {
        message: err.message,
        correlationId: req.correlationId, // 返回關聯ID以便客戶端追蹤
      },
    });
  });
}

// ============================================
// 示例 10: 性能監控
// ============================================
function example10() {
  app.use(express.json());
  app.use(correlationId());

  // 自定義性能監控中間件
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - start) / 1_000_000; // 轉換為毫秒

      // 如果請求時間超過1秒，記錄警告
      if (duration > 1000) {
        logger.warn('Slow request detected', {
          traceId: req.correlationId,
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
        });
      }
    });

    next();
  });

  app.use(httpLogger(logger));

  app.get('/api/slow', async (req, res) => {
    // 模擬慢請求
    await new Promise(resolve => setTimeout(resolve, 2000));
    res.json({ message: 'done' });
  });
}

export {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  example7,
  example8,
  example9,
  example10,
};
