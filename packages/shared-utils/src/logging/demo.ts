/**
 * HTTP日誌中間件演示
 * 展示最常用的三種配置方式
 */

import express from 'express';
import { createLogger, LogLevel } from '../logger';
import { correlationId, httpLogger } from './index';

const app = express();

// ============================================
// 方式1: 最簡單的配置（推薦用於快速開始）
// ============================================
function setupBasicLogging() {
  const logger = createLogger('demo-service');

  app.use(express.json());
  app.use(correlationId());
  app.use(httpLogger(logger));

  console.log('✓ 基本日誌配置完成');
}

// ============================================
// 方式2: 開發環境配置（詳細日誌）
// ============================================
function setupDevelopmentLogging() {
  const logger = createLogger('demo-service', {
    minLevel: LogLevel.DEBUG
  });

  app.use(express.json());
  app.use(correlationId({
    headerName: 'X-Request-ID',
    includeInResponse: true
  }));

  app.use(httpLogger(logger, {
    logRequestBody: true,
    logRequestHeaders: true,
    logResponseBody: true,
    logResponseHeaders: true,
    maxBodyLength: 5000
  }));

  console.log('✓ 開發環境日誌配置完成');
}

// ============================================
// 方式3: 生產環境配置（只記錄錯誤）
// ============================================
function setupProductionLogging() {
  const logger = createLogger('demo-service', {
    minLevel: LogLevel.INFO
  });

  app.use(express.json());
  app.use(correlationId());

  app.use(httpLogger(logger, {
    logRequestBody: false,
    logResponseBody: false,
    onlyErrors: true,
    excludePaths: ['/health', '/metrics']
  }));

  console.log('✓ 生產環境日誌配置完成');
}

// ============================================
// 示例路由
// ============================================
function setupRoutes() {
  // 健康檢查端點（不會被記錄日誌）
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // 成功的請求
  app.get('/api/users', (req, res) => {
    res.json({
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ]
    });
  });

  // 帶有敏感信息的POST請求
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // password會被自動過濾為 [REDACTED]
    if (username === 'admin' && password === 'secret') {
      res.json({
        success: true,
        token: 'jwt-token-here' // token也會被過濾
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  });

  // 錯誤請求
  app.get('/api/error', (req, res) => {
    res.status(500).json({
      error: 'Internal server error',
      correlationId: req.correlationId
    });
  });

  // 在業務邏輯中使用關聯ID
  app.get('/api/orders/:id', (req, res) => {
    const logger = createLogger('demo-service');

    logger.info('Fetching order', {
      traceId: req.correlationId,
      orderId: req.params.id,
      userId: req.query.userId
    });

    res.json({
      orderId: req.params.id,
      status: 'completed'
    });
  });
}

// ============================================
// 錯誤處理
// ============================================
function setupErrorHandling() {
  const logger = createLogger('demo-service');

  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', err, {
      traceId: req.correlationId,
      method: req.method,
      path: req.path
    });

    res.status(500).json({
      error: {
        message: process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message,
        correlationId: req.correlationId
      }
    });
  });
}

// ============================================
// 啟動服務器
// ============================================
function startServer() {
  const PORT = process.env.PORT || 3000;
  const ENV = process.env.NODE_ENV || 'development';

  // 根據環境選擇配置
  if (ENV === 'production') {
    setupProductionLogging();
  } else {
    setupDevelopmentLogging();
  }

  setupRoutes();
  setupErrorHandling();

  app.listen(PORT, () => {
    console.log(`\n📊 Demo server running on port ${PORT}`);
    console.log(`🌍 Environment: ${ENV}`);
    console.log(`\n測試端點:`);
    console.log(`  GET  http://localhost:${PORT}/health`);
    console.log(`  GET  http://localhost:${PORT}/api/users`);
    console.log(`  POST http://localhost:${PORT}/api/login`);
    console.log(`  GET  http://localhost:${PORT}/api/error`);
    console.log(`  GET  http://localhost:${PORT}/api/orders/123?userId=456`);
    console.log(`\n使用 curl 測試:`);
    console.log(`  curl http://localhost:${PORT}/api/users`);
    console.log(`  curl -X POST http://localhost:${PORT}/api/login -H "Content-Type: application/json" -d '{"username":"admin","password":"secret"}'`);
    console.log(`\n查看日誌輸出以了解中間件的工作方式\n`);
  });
}

// 如果直接運行此文件
if (require.main === module) {
  startServer();
}

export {
  setupBasicLogging,
  setupDevelopmentLogging,
  setupProductionLogging,
  setupRoutes,
  setupErrorHandling,
  startServer
};
