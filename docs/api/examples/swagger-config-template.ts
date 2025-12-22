/**
 * Swagger 配置模板
 * 复制此文件并根据你的服务进行修改
 */

// ============================================================================
// Express 应用配置模板
// ============================================================================

export const expressSwaggerConfig = {
  title: '你的 API 名称',
  description: `
# API 描述

在这里添加你的 API 描述。支持 Markdown 格式。

## 功能特性

- 功能 1
- 功能 2
- 功能 3

## 认证方式

说明如何获取和使用认证令牌。
  `.trim(),
  version: '1.0.0',

  // API 标签分组
  tags: [
    {
      name: '标签1',
      description: '标签1的描述',
    },
    {
      name: '标签2',
      description: '标签2的描述',
    },
  ],

  // 服务器配置
  servers: [
    {
      url: 'http://localhost:3001',
      description: '本地开发环境',
    },
    {
      url: 'https://dev-api.example.com',
      description: '开发环境',
    },
    {
      url: 'https://api.example.com',
      description: '生产环境',
    },
  ],

  // 认证配置
  security: {
    bearer: {
      type: 'http' as const,
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT 认证令牌',
    },
    // 如果需要 API Key 认证，取消注释以下代码
    // apiKey: {
    //   type: 'apiKey' as const,
    //   in: 'header' as const,
    //   name: 'X-API-Key',
    //   description: 'API 密钥',
    // },
  },

  // 联系信息
  contact: {
    name: 'API Support',
    email: 'api-support@example.com',
    url: 'https://example.com/support',
  },

  // 许可证
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },

  // 外部文档
  externalDocs: {
    description: 'API 使用指南',
    url: 'https://docs.example.com/api',
  },
};

// ============================================================================
// NestJS 应用配置模板
// ============================================================================

export const nestSwaggerConfig = {
  title: '你的 API 名称',
  description: `
# API 描述

在这里添加你的 API 描述。支持 Markdown 格式。

## 功能特性

- 功能 1
- 功能 2
- 功能 3

## 认证方式

说明如何获取和使用认证令牌。
  `.trim(),
  version: '1.0.0',

  // API 标签分组
  tags: [
    {
      name: '标签1',
      description: '标签1的描述',
    },
    {
      name: '标签2',
      description: '标签2的描述',
    },
  ],

  // 服务器配置
  servers: [
    {
      url: 'http://localhost:3001',
      description: '本地开发环境',
    },
    {
      url: 'https://dev-api.example.com',
      description: '开发环境',
    },
    {
      url: 'https://api.example.com',
      description: '生产环境',
    },
  ],

  // 认证配置
  security: {
    bearer: {
      type: 'http' as const,
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT 认证令牌',
    },
  },

  // 联系信息
  contact: {
    name: 'API Support',
    email: 'api-support@example.com',
    url: 'https://example.com/support',
  },

  // 许可证
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },

  // 外部文档
  externalDocs: {
    description: 'API 使用指南',
    url: 'https://docs.example.com/api',
  },

  // Swagger UI 配置
  path: 'api-docs',
  enabled: process.env.NODE_ENV !== 'production' || process.env.ENABLE_DOCS === 'true',
};

// ============================================================================
// 使用示例
// ============================================================================

/*
// Express 应用使用示例
import express from 'express';
import { setupExpressSwagger } from '@vibe/shared-utils';
import { expressSwaggerConfig } from './swagger-config-template';

const app = express();

// ... 其他中间件

setupExpressSwagger(app, expressSwaggerConfig);

app.listen(3001);
*/

/*
// NestJS 应用使用示例
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupNestSwagger } from '@vibe/shared-utils';
import { nestSwaggerConfig } from './swagger-config-template';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupNestSwagger(app, nestSwaggerConfig);

  await app.listen(3001);
}

bootstrap();
*/

// ============================================================================
// 常用 API 标签
// ============================================================================

export const commonTags = {
  authentication: {
    name: 'Authentication',
    description: '认证相关接口',
  },
  users: {
    name: 'Users',
    description: '用户管理接口',
  },
  health: {
    name: 'Health',
    description: '健康检查接口',
  },
  ai: {
    name: 'AI',
    description: 'AI 功能接口',
  },
  search: {
    name: 'Search',
    description: '搜索接口',
  },
  notifications: {
    name: 'Notifications',
    description: '通知管理接口',
  },
  analytics: {
    name: 'Analytics',
    description: '数据分析接口',
  },
  settings: {
    name: 'Settings',
    description: '设置管理接口',
  },
};

// ============================================================================
// 多环境配置示例
// ============================================================================

export const createServerConfig = (env: 'development' | 'staging' | 'production') => {
  const configs = {
    development: {
      url: 'http://localhost:3001',
      description: '本地开发环境',
    },
    staging: {
      url: 'https://staging-api.example.com',
      description: '测试环境',
    },
    production: {
      url: 'https://api.example.com',
      description: '生产环境',
    },
  };

  return [
    configs.development,
    configs.staging,
    configs.production,
  ];
};

// ============================================================================
// 完整配置示例（包含所有选项）
// ============================================================================

export const fullSwaggerConfig = {
  // 基本信息
  title: 'Complete API',
  description: '完整的 API 配置示例',
  version: '1.0.0',

  // 标签
  tags: [
    {
      name: 'Users',
      description: '用户管理接口',
      externalDocs: {
        description: '用户管理文档',
        url: 'https://docs.example.com/users',
      },
    },
    {
      name: 'Products',
      description: '商品管理接口',
    },
  ],

  // 服务器配置（带变量）
  servers: [
    {
      url: 'https://{environment}.example.com/api/{version}',
      description: '多环境服务器',
      variables: {
        environment: {
          default: 'api',
          description: '环境名称',
          enum: ['api', 'dev-api', 'staging-api'],
        },
        version: {
          default: 'v1',
          description: 'API 版本',
          enum: ['v1', 'v2'],
        },
      },
    },
  ],

  // 多种认证方式
  security: {
    bearer: {
      type: 'http' as const,
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT Bearer Token',
    },
    apiKey: {
      type: 'apiKey' as const,
      in: 'header' as const,
      name: 'X-API-Key',
      description: 'API Key 认证',
    },
    oauth2: {
      type: 'oauth2' as const,
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'read:users': '读取用户信息',
            'write:users': '写入用户信息',
            'admin': '管理员权限',
          },
        },
      },
    },
  },

  // 联系信息
  contact: {
    name: 'API Support Team',
    email: 'api@example.com',
    url: 'https://example.com/support',
  },

  // 许可证
  license: {
    name: 'Apache 2.0',
    url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
  },

  // 外部文档
  externalDocs: {
    description: '查看完整的 API 文档和教程',
    url: 'https://docs.example.com',
  },
};

// ============================================================================
// 按服务类型的推荐配置
// ============================================================================

// HR 服务配置
export const hrServiceConfig = {
  tags: [
    { name: 'Employees', description: '员工管理' },
    { name: 'Attendance', description: '考勤管理' },
    { name: 'Leave', description: '请假管理' },
    { name: 'Payroll', description: '薪资管理' },
    { name: 'Reports', description: '报表' },
  ],
};

// 协作工具配置
export const collaborationConfig = {
  tags: [
    { name: 'Messages', description: '消息管理' },
    { name: 'Channels', description: '频道管理' },
    { name: 'Users', description: '用户管理' },
    { name: 'Notifications', description: '通知' },
    { name: 'AI', description: 'AI 助手' },
  ],
};

// CRM 配置
export const crmConfig = {
  tags: [
    { name: 'Customers', description: '客户管理' },
    { name: 'Contacts', description: '联系人管理' },
    { name: 'Opportunities', description: '销售机会' },
    { name: 'Tickets', description: '工单系统' },
    { name: 'Reports', description: '报表分析' },
  ],
};
