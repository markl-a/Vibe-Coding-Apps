/**
 * NestJS Swagger 配置示例
 * 适用于 Team Chat, Video Conference, Realtime Docs 等 NestJS 应用
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { setupNestSwagger } from '@vibe/shared-utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS 配置
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // API 前缀
  app.setGlobalPrefix('api');

  // 配置 Swagger/OpenAPI 文档
  setupNestSwagger(app, {
    title: 'Team Chat API',
    description: `
# 团队聊天系统 API

实时团队协作聊天平台 API，支持消息发送、频道管理、实时通知等功能。

## 功能特性

- 💬 实时消息传递
- 🔔 实时通知推送
- 📁 文件分享
- 🔍 全文搜索
- 🤖 AI 智能助手
- 👥 多人频道

## 认证方式

所有受保护的接口需要在请求头中提供 JWT Token：

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## WebSocket 连接

实时功能使用 WebSocket 连接：

\`\`\`javascript
const socket = io('ws://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});
\`\`\`

## 速率限制

- 消息发送: 10 条/秒
- API 调用: 100 次/分钟
- 文件上传: 5 个/分钟

## 数据格式

所有请求和响应都使用 JSON 格式。
    `.trim(),
    version: '1.0.0',

    // API 标签分组
    tags: [
      {
        name: 'Messages',
        description: '消息管理接口',
      },
      {
        name: 'Channels',
        description: '频道管理接口',
      },
      {
        name: 'Users',
        description: '用户管理接口',
      },
      {
        name: 'AI',
        description: 'AI 智能助手接口',
      },
      {
        name: 'Notifications',
        description: '通知管理接口',
      },
      {
        name: 'Health',
        description: '健康检查接口',
      },
    ],

    // 服务器配置
    servers: [
      {
        url: 'http://localhost:3001',
        description: '本地开发环境',
      },
      {
        url: 'https://dev-api.vibe-apps.com',
        description: '开发环境',
      },
      {
        url: 'https://staging-api.vibe-apps.com',
        description: '测试环境',
      },
      {
        url: 'https://api.vibe-apps.com',
        description: '生产环境',
      },
    ],

    // 认证配置
    security: {
      bearer: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: `
JWT 认证令牌

### 获取 Token

通过登录接口获取：
\`\`\`
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
\`\`\`

响应：
\`\`\`json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
\`\`\`

### 使用 Token

在请求头中添加：
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`
        `.trim(),
      },
    },

    // 联系信息
    contact: {
      name: 'Vibe Apps API Support',
      email: 'api-support@vibe-apps.com',
      url: 'https://vibe-apps.com/support',
    },

    // 许可证
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },

    // 外部文档
    externalDocs: {
      description: '完整的 API 使用指南和教程',
      url: 'https://docs.vibe-apps.com/api/team-chat',
    },

    // Swagger UI 路径
    path: 'api-docs',
    enabled: process.env.NODE_ENV !== 'production' || process.env.ENABLE_DOCS === 'true',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Team Chat Backend is running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger UI available at http://localhost:${port}/api-docs`);
  console.log(`🔌 WebSocket server is running on: ws://localhost:${port}`);
}

bootstrap();
