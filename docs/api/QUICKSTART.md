# Swagger/OpenAPI 快速开始指南

本指南将帮助你快速为项目中的 API 服务配置 Swagger/OpenAPI 文档。

## 前置要求

- Node.js 14+
- 已安装 `@vibe/shared-utils` 包

## 快速开始

### 步骤 1: 安装依赖

根据你的应用类型安装相应的依赖：

#### Express 应用

```bash
cd your-express-app
npm install swagger-ui-express swagger-jsdoc
npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc
```

#### NestJS 应用

```bash
cd your-nestjs-app
npm install @nestjs/swagger
```

### 步骤 2: 配置 Swagger

#### Express 应用配置

在你的主文件（如 `src/index.ts`）中添加以下代码：

```typescript
import express from 'express';
import { setupExpressSwagger } from '@vibe/shared-utils';

const app = express();

// ... 其他中间件配置

// 配置 Swagger
setupExpressSwagger(app, {
  title: '你的 API 名称',
  description: 'API 描述',
  version: '1.0.0',
  tags: [
    {
      name: 'Users',
      description: '用户管理接口',
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

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
  console.log('API Docs: http://localhost:3001/api-docs');
});
```

#### NestJS 应用配置

在你的主文件（如 `src/main.ts`）中添加以下代码：

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupNestSwagger } from '@vibe/shared-utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 配置 Swagger
  setupNestSwagger(app, {
    title: '你的 API 名称',
    description: 'API 描述',
    version: '1.0.0',
    tags: [
      {
        name: 'Users',
        description: '用户管理接口',
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

  await app.listen(3001);
  console.log('Server running on http://localhost:3001');
  console.log('API Docs: http://localhost:3001/api-docs');
}

bootstrap();
```

### 步骤 3: 添加 API 注解

#### Express (使用 JSDoc 注释)

```typescript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 */
router.get('/users', async (req, res) => {
  // 你的逻辑...
});
```

#### NestJS (使用装饰器)

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UserController {
  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({ status: 200, description: '成功获取用户列表' })
  async getUsers() {
    // 你的逻辑...
  }
}
```

### 步骤 4: 启动服务器并查看文档

启动你的服务器：

```bash
npm run dev
```

访问 Swagger UI：

```
http://localhost:3001/api-docs
```

## 下一步

- 查看 [完整的 API 文档指南](./README.md)
- 查看 [Express 示例](./examples/express-swagger-example.ts)
- 查看 [NestJS 示例](./examples/nestjs-swagger-example.ts)
- 了解 [最佳实践](./README.md#最佳实践)

## 常见问题

### Q: Swagger UI 无法访问？

确保：
1. 服务器已启动
2. 端口号正确
3. 在 setupExpressSwagger 或 setupNestSwagger 之后启动服务器

### Q: API 接口没有显示在文档中？

**Express:**
- 确保路由文件包含了正确的 JSDoc 注释
- 检查 swagger-jsdoc 的 `apis` 配置是否包含了你的路由文件路径

**NestJS:**
- 确保 Controller 使用了 `@ApiTags` 装饰器
- 确保方法使用了 `@ApiOperation` 等装饰器

### Q: 认证功能无法使用？

确保：
1. 在配置中启用了 `security` 选项
2. 在接口上添加了认证装饰器（Express: `security` in JSDoc, NestJS: `@ApiBearerAuth()`）
3. 在 Swagger UI 中点击 "Authorize" 按钮输入 Token

## 支持

如有问题，请查看：
- [OpenAPI 规范文档](https://swagger.io/specification/)
- [Swagger UI 文档](https://swagger.io/tools/swagger-ui/)
- [NestJS OpenAPI 文档](https://docs.nestjs.com/openapi/introduction)
