/**
 * 文档生成工具模块
 * 提供 API 文档、Swagger/OpenAPI 配置等功能
 */

export * from './swagger';

export {
  createOpenAPIConfig,
  setupExpressSwagger,
  setupNestSwagger,
  CommonErrorResponses,
  SwaggerDecorators,
  CommonTags,
} from './swagger';

export type {
  SwaggerConfig,
  SwaggerTag,
  SwaggerServer,
  SwaggerSecurity,
  ExpressSwaggerOptions,
  NestSwaggerOptions,
} from './swagger';
