/**
 * Swagger/OpenAPI 文档配置工具
 * 支持 Express 和 NestJS 应用的 API 文档自动生成
 */

// OpenAPI 3.0 Schema Types
interface OpenAPISchema {
  type: string;
  properties?: Record<string, OpenAPISchema | { type: string; example?: unknown }>;
  items?: OpenAPISchema | { type: string; properties?: Record<string, unknown> };
  example?: unknown;
}

interface OpenAPISecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  description?: string;
  in?: string;
  name?: string;
  flows?: Record<string, unknown>;
}

interface OpenAPIDocument {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact?: { name?: string; email?: string; url?: string };
    license?: { name: string; url?: string };
  };
  externalDocs?: { description: string; url: string };
  servers: Array<{ url: string; description: string; variables?: Record<string, unknown> }>;
  tags: SwaggerTag[];
  components: {
    securitySchemes: Record<string, OpenAPISecurityScheme>;
    schemas: Record<string, OpenAPISchema>;
  };
}

// Express-compatible types
interface HttpRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface HttpResponse {
  setHeader(name: string, value: string): void;
  send(body: unknown): void;
}

interface ExpressApp {
  get(path: string, handler: (req: HttpRequest, res: HttpResponse) => void): void;
  use(path: string, ...handlers: unknown[]): void;
}

interface NestApp {
  // NestJS application interface - minimal for our needs
  getHttpAdapter?(): unknown;
}

/**
 * Swagger 基础配置选项
 */
export interface SwaggerConfig {
  /** API 标题 */
  title: string;
  /** API 描述 */
  description: string;
  /** API 版本 */
  version: string;
  /** API 标签 */
  tags?: SwaggerTag[];
  /** 服务器配置 */
  servers?: SwaggerServer[];
  /** 认证配置 */
  security?: SwaggerSecurity;
  /** 联系人信息 */
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  /** 许可证信息 */
  license?: {
    name: string;
    url?: string;
  };
  /** 外部文档链接 */
  externalDocs?: {
    description: string;
    url: string;
  };
}

/**
 * Swagger 标签配置
 */
export interface SwaggerTag {
  name: string;
  description: string;
  externalDocs?: {
    description: string;
    url: string;
  };
}

/**
 * 服务器配置
 */
export interface SwaggerServer {
  url: string;
  description: string;
  variables?: Record<string, {
    default: string;
    description?: string;
    enum?: string[];
  }>;
}

/**
 * 认证配置
 */
export interface SwaggerSecurity {
  /** Bearer Token 认证 */
  bearer?: {
    type: 'http';
    scheme: 'bearer';
    bearerFormat: 'JWT';
    description?: string;
  };
  /** API Key 认证 */
  apiKey?: {
    type: 'apiKey';
    in: 'header' | 'query' | 'cookie';
    name: string;
    description?: string;
  };
  /** OAuth2 认证 */
  oauth2?: {
    type: 'oauth2';
    flows: {
      implicit?: {
        authorizationUrl: string;
        scopes: Record<string, string>;
      };
      password?: {
        tokenUrl: string;
        scopes: Record<string, string>;
      };
      clientCredentials?: {
        tokenUrl: string;
        scopes: Record<string, string>;
      };
      authorizationCode?: {
        authorizationUrl: string;
        tokenUrl: string;
        scopes: Record<string, string>;
      };
    };
  };
}

/**
 * 常见的 HTTP 错误响应定义
 */
export const CommonErrorResponses = {
  BadRequest: {
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
  },
  Unauthorized: {
    status: 401,
    description: '未授权访问',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '未提供有效的认证凭据' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  },
  Forbidden: {
    status: 403,
    description: '禁止访问',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: '您没有权限访问此资源' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  },
  NotFound: {
    status: 404,
    description: '资源未找到',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '请求的资源不存在' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  },
  InternalServerError: {
    status: 500,
    description: '服务器内部错误',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: '服务器处理请求时发生错误' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  },
};

/**
 * 生成通用的 OpenAPI 配置对象
 */
export function createOpenAPIConfig(config: SwaggerConfig) {
  const openApiConfig: any = {
    openapi: '3.0.0',
    info: {
      title: config.title,
      description: config.description,
      version: config.version,
      contact: config.contact,
      license: config.license,
    },
    externalDocs: config.externalDocs,
    servers: config.servers || [
      {
        url: 'http://localhost:3001',
        description: '本地开发环境',
      },
      {
        url: 'https://api.example.com',
        description: '生产环境',
      },
    ],
    tags: config.tags || [],
    components: {
      securitySchemes: {},
      schemas: {
        Error: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string' },
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
      },
    },
  };

  // 添加认证配置
  if (config.security) {
    if (config.security.bearer) {
      openApiConfig.components.securitySchemes.BearerAuth = {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: config.security.bearer.description || 'JWT 认证令牌',
      };
    }

    if (config.security.apiKey) {
      openApiConfig.components.securitySchemes.ApiKeyAuth = {
        type: 'apiKey',
        in: config.security.apiKey.in,
        name: config.security.apiKey.name,
        description: config.security.apiKey.description || 'API Key 认证',
      };
    }

    if (config.security.oauth2) {
      openApiConfig.components.securitySchemes.OAuth2 = {
        type: 'oauth2',
        flows: config.security.oauth2.flows,
      };
    }
  }

  return openApiConfig;
}

/**
 * Express Swagger 配置选项
 */
export interface ExpressSwaggerOptions extends SwaggerConfig {
  /** API 路由前缀 */
  routePrefix?: string;
  /** Swagger UI 路径 */
  swaggerUiPath?: string;
  /** Swagger JSON 路径 */
  swaggerJsonPath?: string;
  /** 是否启用 Swagger UI */
  enableSwaggerUI?: boolean;
}

/**
 * 为 Express 应用配置 Swagger
 * 需要安装: npm install swagger-ui-express swagger-jsdoc
 */
export function setupExpressSwagger(
  app: ExpressApp,
  options: ExpressSwaggerOptions
): void {
  try {
    // 动态导入 swagger-ui-express 和 swagger-jsdoc
    const swaggerUi = require('swagger-ui-express');
    const swaggerJsdoc = require('swagger-jsdoc');

    const swaggerUiPath = options.swaggerUiPath || '/api-docs';
    const swaggerJsonPath = options.swaggerJsonPath || '/api-docs.json';

    // 生成 OpenAPI 配置
    const openApiConfig = createOpenAPIConfig(options);

    // swagger-jsdoc 配置
    const swaggerSpec = swaggerJsdoc({
      definition: openApiConfig,
      apis: [
        './src/routes/*.ts',
        './src/routes/*.js',
        './src/controllers/*.ts',
        './src/controllers/*.js',
        './src/models/*.ts',
        './src/models/*.js',
      ],
    });

    // 提供 JSON 格式的 API 文档
    app.get(swaggerJsonPath, (_req: HttpRequest, res: HttpResponse) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // 提供 Swagger UI 界面
    if (options.enableSwaggerUI !== false) {
      app.use(
        swaggerUiPath,
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
          explorer: true,
          customSiteTitle: options.title,
          customCss: '.swagger-ui .topbar { display: none }',
        })
      );
    }

    console.log(`📚 Swagger UI: http://localhost:${process.env.PORT || 3001}${swaggerUiPath}`);
    console.log(`📄 Swagger JSON: http://localhost:${process.env.PORT || 3001}${swaggerJsonPath}`);
  } catch (error) {
    console.error('❌ Failed to setup Swagger:', error);
    console.error('Please install required packages: npm install swagger-ui-express swagger-jsdoc');
  }
}

/**
 * NestJS Swagger 配置选项
 */
export interface NestSwaggerOptions extends SwaggerConfig {
  /** Swagger UI 路径 */
  path?: string;
  /** 是否启用 Swagger */
  enabled?: boolean;
}

/**
 * 为 NestJS 应用配置 Swagger
 * 需要安装: npm install @nestjs/swagger
 */
export function setupNestSwagger(app: NestApp, options: NestSwaggerOptions): void {
  try {
    // 动态导入 @nestjs/swagger
    const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');

    if (options.enabled === false) {
      return;
    }

    const path = options.path || 'api-docs';

    // 创建 Swagger 文档构建器
    const configBuilder = new DocumentBuilder()
      .setTitle(options.title)
      .setDescription(options.description)
      .setVersion(options.version);

    // 添加标签
    if (options.tags) {
      options.tags.forEach((tag) => {
        configBuilder.addTag(tag.name, tag.description);
      });
    }

    // 添加服务器
    if (options.servers) {
      options.servers.forEach((server) => {
        configBuilder.addServer(server.url, server.description);
      });
    }

    // 添加认证
    if (options.security) {
      if (options.security.bearer) {
        configBuilder.addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: options.security.bearer.description,
          },
          'bearer'
        );
      }

      if (options.security.apiKey) {
        configBuilder.addApiKey(
          {
            type: 'apiKey',
            in: options.security.apiKey.in,
            name: options.security.apiKey.name,
            description: options.security.apiKey.description,
          },
          'api-key'
        );
      }
    }

    // 添加联系人
    if (options.contact) {
      configBuilder.setContact(
        options.contact.name || '',
        options.contact.url || '',
        options.contact.email || ''
      );
    }

    // 添加许可证
    if (options.license) {
      configBuilder.setLicense(options.license.name, options.license.url || '');
    }

    // 添加外部文档
    if (options.externalDocs) {
      configBuilder.setExternalDoc(
        options.externalDocs.description,
        options.externalDocs.url
      );
    }

    const config = configBuilder.build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(path, app, document, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
      customSiteTitle: options.title,
      customCss: '.swagger-ui .topbar { display: none }',
    });

    const port = process.env.PORT || 3001;
    console.log(`📚 Swagger UI: http://localhost:${port}/${path}`);
  } catch (error) {
    console.error('❌ Failed to setup Swagger:', error);
    console.error('Please install required package: npm install @nestjs/swagger');
  }
}

/**
 * API 文档注解辅助工具（用于 JSDoc 注释）
 */
export const SwaggerDecorators = {
  /**
   * 生成路由的 Swagger 注释
   */
  operation: (summary: string, description?: string) => {
    return `
/**
 * @swagger
 * ${summary}
 * @description ${description || summary}
 */`;
  },

  /**
   * 生成请求体注释
   */
  requestBody: (schemaName: string, description?: string) => {
    return `
/**
 * @swagger
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: '#/components/schemas/${schemaName}'
 *   description: ${description || ''}
 */`;
  },

  /**
   * 生成响应注释
   */
  response: (status: number, description: string, schemaName?: string) => {
    const schemaRef = schemaName
      ? `
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/${schemaName}'`
      : '';

    return `
/**
 * @swagger
 * responses:
 *   ${status}:
 *     description: ${description}${schemaRef}
 */`;
  },
};

/**
 * 预定义的常见 API 标签
 */
export const CommonTags = {
  Authentication: {
    name: 'Authentication',
    description: '认证相关接口',
  },
  Users: {
    name: 'Users',
    description: '用户管理接口',
  },
  Health: {
    name: 'Health',
    description: '健康检查接口',
  },
  AI: {
    name: 'AI',
    description: 'AI 功能接口',
  },
};

export default {
  createOpenAPIConfig,
  setupExpressSwagger,
  setupNestSwagger,
  CommonErrorResponses,
  SwaggerDecorators,
  CommonTags,
};
