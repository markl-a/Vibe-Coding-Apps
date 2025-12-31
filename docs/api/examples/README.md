# Swagger/OpenAPI 示例代码

本目录包含了 Swagger/OpenAPI 配置的完整示例代码，供参考和复用。

## 文件列表

### 1. express-swagger-example.ts

**说明**: Express 应用的完整 Swagger 配置示例

**适用于**:
- Attendance Tracker (考勤追踪)
- Employee Directory (员工目录)
- Leave Management (请假管理)
- Payroll Calculator (薪资计算)

**内容包含**:
- 服务器基本配置
- Swagger 配置
- 路由注解示例（JSDoc）
- Schema 定义
- 请求/响应示例

**使用方式**:
```typescript
// 导入配置函数
import { setupExpressSwagger } from '@vibe/shared-utils';

// 参考示例文件中的配置
setupExpressSwagger(app, {
  title: '你的 API 名称',
  description: 'API 描述',
  // ... 其他配置
});
```

---

### 2. nestjs-swagger-example.ts

**说明**: NestJS 应用的主文件 Swagger 配置示例

**适用于**:
- Team Chat (团队聊天)
- Video Conference (视频会议)
- Realtime Docs (实时文档)
- Knowledge Base (知识库)

**内容包含**:
- NestJS 应用启动配置
- Swagger 配置
- 环境变量使用

**使用方式**:
```typescript
// 在 main.ts 中
import { setupNestSwagger } from '@vibe/shared-utils';

setupNestSwagger(app, {
  title: '你的 API 名称',
  description: 'API 描述',
  // ... 其他配置
});
```

---

### 3. nestjs-controller-example.ts

**说明**: NestJS Controller 的详细注解示例

**内容包含**:
- Controller 装饰器使用
- 各种 HTTP 方法的注解
- 参数验证和文档
- 响应定义
- 认证配置

**示例接口**:
- GET /messages - 获取消息列表
- GET /messages/:id - 获取单条消息
- POST /messages - 发送消息
- PUT /messages/:id - 更新消息
- DELETE /messages/:id - 删除消息
- GET /messages/search - 搜索消息

**使用装饰器**:
- `@ApiTags()` - 接口分组
- `@ApiOperation()` - 接口说明
- `@ApiParam()` - 路径参数
- `@ApiQuery()` - 查询参数
- `@ApiBody()` - 请求体
- `@ApiResponse()` - 响应定义
- `@ApiBearerAuth()` - 认证要求

---

### 4. nestjs-dto-example.ts

**说明**: NestJS DTO 的 Swagger 注解示例

**内容包含**:
- DTO 类定义
- 属性装饰器
- 验证规则
- 示例数据
- 嵌套对象

**示例 DTO**:
- `MessageType` - 消息类型枚举
- `AttachmentDto` - 附件 DTO
- `CreateMessageDto` - 创建消息 DTO
- `UpdateMessageDto` - 更新消息 DTO
- `MessageResponseDto` - 消息响应 DTO
- `GetMessagesDto` - 查询消息 DTO
- `SearchMessagesDto` - 搜索消息 DTO

**使用装饰器**:
- `@ApiProperty()` - 必填属性
- `@ApiPropertyOptional()` - 可选属性
- 配合 class-validator 装饰器使用

---

### 5. swagger-config-template.ts

**说明**: 可复制的配置模板集合

**内容包含**:
- Express 配置模板
- NestJS 配置模板
- 常用标签定义
- 多环境配置
- 完整配置示例
- 按服务类型的推荐配置

**使用方式**:
```typescript
// 复制需要的配置模板
import { expressSwaggerConfig, nestSwaggerConfig } from './swagger-config-template';

// 修改后使用
const myConfig = {
  ...expressSwaggerConfig,
  title: '我的 API',
  // 修改其他配置...
};
```

---

## 快速使用指南

### Express 应用

1. 查看 `express-swagger-example.ts`
2. 复制主配置代码到你的 `src/index.ts`
3. 复制路由注解代码到你的路由文件
4. 根据实际情况修改配置

### NestJS 应用

1. 查看 `nestjs-swagger-example.ts` 配置主文件
2. 查看 `nestjs-controller-example.ts` 学习 Controller 注解
3. 查看 `nestjs-dto-example.ts` 学习 DTO 注解
4. 复制相关代码到你的项目

### 自定义配置

使用 `swagger-config-template.ts` 中的模板：

```typescript
// 选择基础模板
import { expressSwaggerConfig, hrServiceConfig } from './swagger-config-template';

// 合并配置
const myConfig = {
  ...expressSwaggerConfig,
  tags: hrServiceConfig.tags,
  title: '我的 HR 服务',
  // ... 其他自定义配置
};
```

## 注解语法参考

### Express (JSDoc)

```typescript
/**
 * @swagger
 * /api/resource:
 *   get:
 *     summary: 接口摘要
 *     description: 详细描述
 *     tags: [标签名]
 *     parameters:
 *       - in: query
 *         name: 参数名
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功响应
 */
```

### NestJS (装饰器)

```typescript
@ApiTags('标签名')
@Controller('resource')
export class ResourceController {
  @Get()
  @ApiOperation({ summary: '接口摘要' })
  @ApiQuery({ name: '参数名', type: String })
  @ApiResponse({ status: 200, description: '成功响应' })
  async getResources() {
    // ...
  }
}
```

## 最佳实践

### 1. 接口文档要完整

- 提供清晰的摘要和描述
- 说明所有参数的含义
- 提供成功和失败的响应示例

### 2. 使用示例数据

```typescript
@ApiProperty({
  description: '用户名',
  example: 'john_doe',  // 提供示例
  minLength: 3,
  maxLength: 20,
})
username: string;
```

### 3. 分组和标签

```typescript
// 使用有意义的标签
@ApiTags('Users')  // ✅ 好
@ApiTags('API')    // ❌ 不好
```

### 4. 错误处理

```typescript
@ApiResponse({ status: 400, description: '请求参数错误' })
@ApiResponse({ status: 401, description: '未授权访问' })
@ApiResponse({ status: 404, description: '资源未找到' })
```

## 常见场景示例

### 分页查询

```typescript
@ApiQuery({ name: 'page', type: Number, example: 1 })
@ApiQuery({ name: 'limit', type: Number, example: 10 })
```

### 文件上传

```typescript
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
```

### 认证接口

```typescript
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
```

### 枚举类型

```typescript
@ApiProperty({
  enum: MessageType,
  example: MessageType.TEXT,
})
type: MessageType;
```

## 相关资源

- [API 文档指南](../README.md)
- [快速开始](../QUICKSTART.md)
- [实施指南](../IMPLEMENTATION.md)
- [OpenAPI 规范](https://swagger.io/specification/)
- [NestJS Swagger 文档](https://docs.nestjs.com/openapi/introduction)

## 支持

如有问题，请查看主文档或联系开发团队。
