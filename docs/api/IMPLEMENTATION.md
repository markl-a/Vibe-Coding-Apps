# Swagger/OpenAPI 实施指南

本指南详细说明如何将 Swagger/OpenAPI 配置应用到现有服务中。

## 概述

本项目已创建了完整的 Swagger/OpenAPI 文档生成工具和配置，包括：

1. **共享工具包** (`@vibe/shared-utils`)
   - `setupExpressSwagger()` - Express 应用配置函数
   - `setupNestSwagger()` - NestJS 应用配置函数
   - 通用配置接口和类型定义

2. **文档和示例**
   - 完整的使用指南
   - Express 和 NestJS 示例代码
   - 配置模板

## 实施步骤

### 第一步：准备工作

#### 1.1 安装依赖

根据服务类型安装相应的依赖包。

**Express 服务**:
```bash
cd enterprise-apps/hr-management/attendance-tracker/backend
npm install swagger-ui-express swagger-jsdoc
npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc
```

**NestJS 服务**:
```bash
cd enterprise-apps/collaboration-tools/team-chat/backend
npm install @nestjs/swagger
```

#### 1.2 确保已安装共享工具包

```bash
# 检查 package.json 中是否有 @vibe/shared-utils
# 如果没有，添加依赖
npm install @vibe/shared-utils
```

### 第二步：配置 Swagger

#### 2.1 Express 服务配置

编辑服务的主文件（通常是 `src/index.ts`）：

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupExpressSwagger } from '@vibe/shared-utils';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 基本中间件
app.use(cors());
app.use(express.json());

// 配置路由
// ... 你的路由配置

// 配置 Swagger（在路由配置之后，服务器启动之前）
setupExpressSwagger(app, {
  title: 'Attendance Tracker API',
  description: '考勤追踪系统 API 文档',
  version: '1.0.0',
  tags: [
    {
      name: 'Attendance',
      description: '考勤管理接口',
    },
    {
      name: 'Reports',
      description: '报表接口',
    },
  ],
  security: {
    bearer: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT 认证令牌',
    },
  },
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Docs: http://localhost:${PORT}/api-docs`);
});
```

#### 2.2 NestJS 服务配置

编辑服务的主文件（通常是 `src/main.ts`）：

```typescript
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
    }),
  );

  // CORS 配置
  app.enableCors();

  // API 前缀
  app.setGlobalPrefix('api');

  // 配置 Swagger
  setupNestSwagger(app, {
    title: 'Team Chat API',
    description: '团队聊天系统 API 文档',
    version: '1.0.0',
    tags: [
      {
        name: 'Messages',
        description: '消息管理接口',
      },
      {
        name: 'Channels',
        description: '频道管理接口',
      },
    ],
    security: {
      bearer: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT 认证令牌',
      },
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`Server running on http://localhost:${port}/api`);
  console.log(`API Docs: http://localhost:${port}/api-docs`);
}

bootstrap();
```

### 第三步：添加 API 注解

#### 3.1 Express 路由注解

在路由文件中添加 JSDoc 注释：

```typescript
/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: 获取考勤记录列表
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: 成功获取考勤记录
 *       401:
 *         description: 未授权访问
 */
router.get('/attendance', attendanceController.getAttendance);
```

#### 3.2 NestJS Controller 注解

在 Controller 中使用装饰器：

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags('Messages')
@Controller('messages')
export class MessageController {
  @Get()
  @ApiOperation({ summary: '获取消息列表' })
  @ApiQuery({ name: 'channelId', required: true })
  @ApiResponse({ status: 200, description: '成功获取消息列表' })
  async getMessages(@Query('channelId') channelId: string) {
    // ...
  }
}
```

### 第四步：测试和验证

#### 4.1 启动服务

```bash
npm run dev
```

#### 4.2 访问 Swagger UI

打开浏览器访问：
```
http://localhost:<PORT>/api-docs
```

#### 4.3 测试 API

在 Swagger UI 中：
1. 点击接口展开
2. 点击 "Try it out"
3. 输入参数
4. 点击 "Execute"
5. 查看响应结果

### 第五步：生产环境配置

#### 5.1 环境变量配置

创建或编辑 `.env` 文件：

```bash
# 开发环境
NODE_ENV=development
PORT=3001
ENABLE_DOCS=true

# 生产环境（禁用文档）
# NODE_ENV=production
# ENABLE_DOCS=false
```

#### 5.2 条件启用 Swagger

```typescript
// NestJS 示例
setupNestSwagger(app, {
  // ... 其他配置
  enabled: process.env.NODE_ENV !== 'production' || process.env.ENABLE_DOCS === 'true',
});
```

## 具体服务实施计划

### HR Management 服务

#### 1. Attendance Tracker
- **路径**: `enterprise-apps/hr-management/attendance-tracker/backend`
- **类型**: Express
- **端口**: 3001
- **主要接口**: 考勤记录、统计报表

**实施步骤**:
```bash
cd enterprise-apps/hr-management/attendance-tracker/backend
npm install swagger-ui-express swagger-jsdoc
# 编辑 src/index.ts 添加 Swagger 配置
# 编辑 src/routes/attendance.routes.ts 添加 JSDoc 注释
npm run dev
# 访问 http://localhost:3001/api-docs
```

#### 2. Employee Directory
- **路径**: `enterprise-apps/hr-management/employee-directory/backend`
- **类型**: Express
- **端口**: 3002

#### 3. Leave Management
- **路径**: `enterprise-apps/hr-management/leave-management/backend`
- **类型**: Express
- **端口**: 3003

#### 4. Payroll Calculator
- **路径**: `enterprise-apps/hr-management/payroll-calculator/backend`
- **类型**: Express
- **端口**: 3004

### Collaboration Tools 服务

#### 1. Team Chat
- **路径**: `enterprise-apps/collaboration-tools/team-chat/backend`
- **类型**: NestJS
- **端口**: 3001

**实施步骤**:
```bash
cd enterprise-apps/collaboration-tools/team-chat/backend
npm install @nestjs/swagger
# 编辑 src/main.ts 添加 Swagger 配置
# 编辑 Controller 添加装饰器
npm run dev
# 访问 http://localhost:3001/api-docs
```

#### 2. Video Conference
- **路径**: `enterprise-apps/collaboration-tools/video-conference/backend`
- **类型**: NestJS
- **端口**: 3002

#### 3. Realtime Docs
- **路径**: `enterprise-apps/collaboration-tools/realtime-docs/backend`
- **类型**: NestJS
- **端口**: 3003

#### 4. Knowledge Base
- **路径**: `enterprise-apps/collaboration-tools/knowledge-base/backend`
- **类型**: NestJS
- **端口**: 3004

## 批量实施脚本

### 为所有 Express 服务安装依赖

创建 `scripts/install-swagger-express.sh`:

```bash
#!/bin/bash

services=(
  "enterprise-apps/hr-management/attendance-tracker/backend"
  "enterprise-apps/hr-management/employee-directory/backend"
  "enterprise-apps/hr-management/leave-management/backend"
  "enterprise-apps/hr-management/payroll-calculator/backend"
)

for service in "${services[@]}"; do
  echo "Installing Swagger for $service..."
  cd "$service"
  npm install swagger-ui-express swagger-jsdoc
  npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc
  cd -
done
```

### 为所有 NestJS 服务安装依赖

创建 `scripts/install-swagger-nest.sh`:

```bash
#!/bin/bash

services=(
  "enterprise-apps/collaboration-tools/team-chat/backend"
  "enterprise-apps/collaboration-tools/video-conference/backend"
  "enterprise-apps/collaboration-tools/realtime-docs/backend"
  "enterprise-apps/collaboration-tools/knowledge-base/backend"
)

for service in "${services[@]}"; do
  echo "Installing Swagger for $service..."
  cd "$service"
  npm install @nestjs/swagger
  cd -
done
```

## 常见问题和解决方案

### 问题 1: Swagger UI 无法访问

**可能原因**:
- Swagger 配置在路由之前
- 端口被占用
- 依赖包未安装

**解决方案**:
```typescript
// 确保顺序正确
app.use('/api/routes', routes);  // 先配置路由
setupExpressSwagger(app, config);  // 后配置 Swagger
app.listen(PORT);  // 最后启动服务器
```

### 问题 2: API 接口未显示

**Express**:
- 检查 JSDoc 注释格式
- 确保 swagger-jsdoc 的 `apis` 配置包含了路由文件

**NestJS**:
- 确保使用了 `@ApiTags()` 装饰器
- 检查模块是否正确导入

### 问题 3: 认证功能无法使用

**解决方案**:
1. 确保配置了 `security` 选项
2. 在接口上添加认证装饰器
3. 在 Swagger UI 中点击 "Authorize" 输入 Token

## 验收标准

完成实施后，每个服务应该满足：

- [ ] Swagger UI 可以正常访问
- [ ] 所有公共接口都有文档
- [ ] 每个接口都有正确的参数说明
- [ ] 每个接口都有响应示例
- [ ] 错误响应有清晰的说明
- [ ] 认证接口正确标注了安全要求
- [ ] 可以在 Swagger UI 中测试 API

## 下一步

1. **为每个服务配置 Swagger**
   - 按照本指南逐个服务配置
   - 测试每个服务的文档

2. **完善 API 文档**
   - 添加详细的接口描述
   - 提供真实的请求/响应示例
   - 说明所有可能的错误情况

3. **集成到 CI/CD**
   - 在构建流程中生成文档
   - 部署文档到在线平台

4. **培训团队**
   - 教导团队如何使用 Swagger
   - 制定文档编写规范

## 资源链接

- [API 文档指南](./README.md)
- [快速开始](./QUICKSTART.md)
- [服务列表](./SERVICES.md)
- [Express 示例](./examples/express-swagger-example.ts)
- [NestJS 示例](./examples/nestjs-swagger-example.ts)
- [配置模板](./examples/swagger-config-template.ts)
