# API 文档指南

本指南介绍如何为 Vibe Coding Apps 项目中的各个服务配置和生成 Swagger/OpenAPI 文档。

## 目录

- [快速开始](#快速开始)
- [Express 应用配置](#express-应用配置)
- [NestJS 应用配置](#nestjs-应用配置)
- [API 文档注解规范](#api-文档注解规范)
- [错误码说明](#错误码说明)
- [认证配置](#认证配置)
- [最佳实践](#最佳实践)

## 快速开始

### 安装依赖

根据你的应用类型安装相应的依赖：

#### Express 应用

```bash
npm install swagger-ui-express swagger-jsdoc
npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc
```

#### NestJS 应用

```bash
npm install @nestjs/swagger
```

### 导入配置工具

```typescript
import { setupExpressSwagger, setupNestSwagger } from '@vibe/shared-utils';
```

## Express 应用配置

### 基本配置

在 Express 应用的入口文件（如 `src/index.ts`）中添加 Swagger 配置：

```typescript
import express from 'express';
import { setupExpressSwagger } from '@vibe/shared-utils';

const app = express();

// ... 其他中间件配置

// 配置 Swagger
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
  servers: [
    {
      url: 'http://localhost:3001',
      description: '开发环境',
    },
    {
      url: 'https://api.example.com',
      description: '生产环境',
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
  contact: {
    name: 'API Support',
    email: 'support@example.com',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
});

// 启动服务器
app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
  console.log('API Docs available at http://localhost:3001/api-docs');
});
```

### 路由注解

使用 JSDoc 注释为路由添加 Swagger 文档：

```typescript
/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: 获取考勤记录列表
 *     description: 返回所有考勤记录
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功获取考勤记录
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AttendanceRecord'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/attendance', attendanceController.getAttendance);

/**
 * @swagger
 * /api/attendance:
 *   post:
 *     summary: 创建考勤记录
 *     description: 创建新的考勤记录
 *     tags: [Attendance]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAttendanceDto'
 *           examples:
 *             checkIn:
 *               summary: 签到示例
 *               value:
 *                 employeeId: "emp001"
 *                 type: "check-in"
 *                 timestamp: "2025-12-21T09:00:00Z"
 *                 location:
 *                   latitude: 22.3193
 *                   longitude: 114.1694
 *             checkOut:
 *               summary: 签退示例
 *               value:
 *                 employeeId: "emp001"
 *                 type: "check-out"
 *                 timestamp: "2025-12-21T18:00:00Z"
 *     responses:
 *       201:
 *         description: 考勤记录创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AttendanceRecord'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/attendance', attendanceController.createAttendance);
```

### Schema 定义

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     AttendanceRecord:
 *       type: object
 *       required:
 *         - id
 *         - employeeId
 *         - type
 *         - timestamp
 *       properties:
 *         id:
 *           type: string
 *           description: 记录ID
 *           example: "att_123456"
 *         employeeId:
 *           type: string
 *           description: 员工ID
 *           example: "emp001"
 *         type:
 *           type: string
 *           enum: [check-in, check-out]
 *           description: 考勤类型
 *           example: "check-in"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: 时间戳
 *           example: "2025-12-21T09:00:00Z"
 *         location:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               format: double
 *               example: 22.3193
 *             longitude:
 *               type: number
 *               format: double
 *               example: 114.1694
 *         status:
 *           type: string
 *           enum: [normal, late, early, absent]
 *           description: 考勤状态
 *           example: "normal"
 *         notes:
 *           type: string
 *           description: 备注
 *           example: "正常签到"
 *
 *     CreateAttendanceDto:
 *       type: object
 *       required:
 *         - employeeId
 *         - type
 *         - timestamp
 *       properties:
 *         employeeId:
 *           type: string
 *           description: 员工ID
 *         type:
 *           type: string
 *           enum: [check-in, check-out]
 *           description: 考勤类型
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: 时间戳
 *         location:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               format: double
 *             longitude:
 *               type: number
 *               format: double
 *         notes:
 *           type: string
 *           description: 备注
 */
```

## NestJS 应用配置

### 基本配置

在 NestJS 应用的入口文件（如 `src/main.ts`）中添加 Swagger 配置：

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupNestSwagger } from '@vibe/shared-utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
      {
        name: 'AI',
        description: 'AI 功能接口',
      },
    ],
    servers: [
      {
        url: 'http://localhost:3001',
        description: '开发环境',
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
  console.log('API Docs available at http://localhost:3001/api-docs');
}

bootstrap();
```

### Controller 装饰器

使用 NestJS 的 Swagger 装饰器为接口添加文档：

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Messages')
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  @ApiOperation({
    summary: '获取消息列表',
    description: '返回频道内的所有消息',
  })
  @ApiQuery({
    name: 'channelId',
    required: true,
    description: '频道ID',
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '消息数量限制',
    type: Number,
    example: 50,
  })
  @ApiQuery({
    name: 'before',
    required: false,
    description: '获取此消息ID之前的消息',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '成功获取消息列表',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'msg_123' },
              content: { type: 'string', example: 'Hello, team!' },
              userId: { type: 'string', example: 'user_456' },
              channelId: { type: 'string', example: 'ch_789' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  async getMessages(
    @Query('channelId') channelId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.messageService.getMessages(channelId, limit, before);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '发送消息',
    description: '在指定频道发送新消息',
  })
  @ApiBody({
    type: CreateMessageDto,
    description: '消息内容',
    examples: {
      textMessage: {
        summary: '文本消息',
        value: {
          channelId: 'ch_789',
          content: 'Hello, team!',
          type: 'text',
        },
      },
      imageMessage: {
        summary: '图片消息',
        value: {
          channelId: 'ch_789',
          content: 'Check out this screenshot',
          type: 'image',
          attachments: [
            {
              url: 'https://example.com/image.png',
              type: 'image/png',
              size: 12345,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '消息发送成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'msg_123' },
            content: { type: 'string', example: 'Hello, team!' },
            userId: { type: 'string', example: 'user_456' },
            channelId: { type: 'string', example: 'ch_789' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  async createMessage(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.createMessage(createMessageDto);
  }
}
```

### DTO 装饰器

在 DTO 类中使用装饰器定义数据结构：

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
}

export class CreateMessageDto {
  @ApiProperty({
    description: '频道ID',
    example: 'ch_789',
  })
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ApiProperty({
    description: '消息内容',
    example: 'Hello, team!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: '消息类型',
    enum: MessageType,
    example: MessageType.TEXT,
    default: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @ApiPropertyOptional({
    description: '附件列表',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        type: { type: 'string' },
        size: { type: 'number' },
        name: { type: 'string' },
      },
    },
  })
  @IsArray()
  @IsOptional()
  attachments?: Array<{
    url: string;
    type: string;
    size: number;
    name?: string;
  }>;

  @ApiPropertyOptional({
    description: '回复的消息ID',
    example: 'msg_123',
  })
  @IsString()
  @IsOptional()
  replyTo?: string;
}
```

## 错误码说明

### 标准错误响应格式

所有 API 都应遵循统一的错误响应格式：

```json
{
  "statusCode": 400,
  "message": "请求参数验证失败",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "邮箱格式不正确"
    }
  ]
}
```

### 常见错误码

| 状态码 | 错误类型 | 说明 | 示例场景 |
|--------|----------|------|----------|
| 400 | Bad Request | 请求参数错误 | 缺少必填字段、格式不正确 |
| 401 | Unauthorized | 未授权访问 | 未提供认证令牌、令牌过期 |
| 403 | Forbidden | 禁止访问 | 权限不足 |
| 404 | Not Found | 资源未找到 | 请求的数据不存在 |
| 409 | Conflict | 资源冲突 | 重复创建、数据冲突 |
| 422 | Unprocessable Entity | 无法处理的实体 | 业务逻辑验证失败 |
| 429 | Too Many Requests | 请求过多 | 超出速率限制 |
| 500 | Internal Server Error | 服务器内部错误 | 未预期的服务器异常 |
| 503 | Service Unavailable | 服务不可用 | 服务维护、过载 |

### 在 Swagger 中定义错误响应

#### Express (JSDoc)

```typescript
/**
 * @swagger
 * components:
 *   responses:
 *     BadRequest:
 *       description: 请求参数错误
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               statusCode:
 *                 type: number
 *                 example: 400
 *               message:
 *                 type: string
 *                 example: "请求参数验证失败"
 *               error:
 *                 type: string
 *                 example: "Bad Request"
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     message:
 *                       type: string
 */
```

#### NestJS (装饰器)

```typescript
@ApiResponse({
  status: 400,
  description: '请求参数错误',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 400 },
      message: { type: 'string', example: '请求参数验证失败' },
      error: { type: 'string', example: 'Bad Request' },
      details: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
})
```

## 认证配置

### JWT Bearer Token

大多数 API 使用 JWT Bearer Token 进行认证。

#### 配置认证方案

在 Swagger 配置中启用 Bearer 认证：

```typescript
security: {
  bearer: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT 认证令牌\n\n请在请求头中添加: Authorization: Bearer <token>',
  },
}
```

#### 在接口中使用认证

**Express:**
```typescript
/**
 * @swagger
 * /api/protected:
 *   get:
 *     summary: 受保护的接口
 *     security:
 *       - BearerAuth: []
 */
```

**NestJS:**
```typescript
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute() {
  // ...
}
```

### API Key 认证

某些服务可能使用 API Key 认证：

```typescript
security: {
  apiKey: {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
    description: 'API 密钥',
  },
}
```

## 最佳实践

### 1. 完整的接口描述

- 提供清晰的 `summary` 和 `description`
- 说明接口的用途、业务场景
- 注明特殊限制或要求

### 2. 详细的参数说明

- 标注每个参数的类型、格式、示例
- 说明必填/可选
- 提供有效值范围或枚举
- 添加默认值说明

### 3. 完整的响应示例

- 提供成功和失败的响应示例
- 包含实际的数据结构
- 说明各字段的含义

### 4. 使用 Schema 组件

将复杂的数据结构定义为可复用的 Schema：

```typescript
// 定义一次
$ref: '#/components/schemas/User'

// 多处使用
```

### 5. 分组和标签

使用标签（tags）对接口进行合理分组：

```typescript
tags: [
  { name: 'Users', description: '用户管理' },
  { name: 'Products', description: '商品管理' },
  { name: 'Orders', description: '订单管理' },
]
```

### 6. 版本管理

- 在接口路径中包含版本号：`/api/v1/users`
- 在文档中明确标注 API 版本
- 维护历史版本的文档

### 7. 环境配置

为不同环境配置不同的服务器地址：

```typescript
servers: [
  { url: 'http://localhost:3001', description: '本地开发' },
  { url: 'https://dev-api.example.com', description: '开发环境' },
  { url: 'https://staging-api.example.com', description: '测试环境' },
  { url: 'https://api.example.com', description: '生产环境' },
]
```

### 8. 示例数据

提供真实、有意义的示例数据：

```typescript
examples: {
  success: {
    summary: '成功示例',
    value: {
      id: 'user_123',
      name: 'John Doe',
      email: 'john@example.com',
    },
  },
  error: {
    summary: '错误示例',
    value: {
      statusCode: 400,
      message: '邮箱已被使用',
    },
  },
}
```

## 配置的服务列表

以下是已配置或可以配置 Swagger 的服务：

### HR Management

1. **Attendance Tracker** - 考勤追踪系统
   - URL: http://localhost:3001/api-docs
   - Type: Express

2. **Employee Directory** - 员工目录
   - URL: http://localhost:3002/api-docs
   - Type: Express

3. **Leave Management** - 请假管理
   - URL: http://localhost:3003/api-docs
   - Type: Express

4. **Payroll Calculator** - 薪资计算
   - URL: http://localhost:3004/api-docs
   - Type: Express

### Collaboration Tools

1. **Team Chat** - 团队聊天
   - URL: http://localhost:3001/api-docs
   - Type: NestJS

2. **Video Conference** - 视频会议
   - URL: http://localhost:3002/api-docs
   - Type: NestJS

3. **Realtime Docs** - 实时文档
   - URL: http://localhost:3003/api-docs
   - Type: NestJS

4. **Knowledge Base** - 知识库
   - URL: http://localhost:3004/api-docs
   - Type: NestJS

### CRM Systems

1. **Customer Portal** - 客户门户
   - URL: http://localhost:3005/api-docs
   - Type: Express/NestJS

## 参考资源

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)

## 支持

如有问题或建议，请联系开发团队或提交 Issue。
