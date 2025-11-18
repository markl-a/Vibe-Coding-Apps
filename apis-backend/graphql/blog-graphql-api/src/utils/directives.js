const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const { defaultFieldResolver, GraphQLError } = require('graphql');

/**
 * @auth Directive
 * 要求用戶必須已認證才能訪問字段
 *
 * 使用範例：
 * type Query {
 *   me: User @auth
 * }
 */
function authDirective(directiveName = 'auth') {
  return {
    authDirectiveTypeDefs: `directive @${directiveName}(requires: Role = USER) on OBJECT | FIELD_DEFINITION

    enum Role {
      ADMIN
      USER
      GUEST
    }`,

    authDirectiveTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0];

          if (authDirective) {
            const { resolve = defaultFieldResolver } = fieldConfig;
            const requiredRole = authDirective.requires;

            fieldConfig.resolve = async function (source, args, context, info) {
              // 檢查用戶是否已認證
              if (!context.user) {
                throw new GraphQLError('You must be logged in to access this field', {
                  extensions: { code: 'UNAUTHENTICATED' }
                });
              }

              // 檢查角色（如果指定）
              if (requiredRole && context.user.role !== requiredRole && context.user.role !== 'ADMIN') {
                throw new GraphQLError(`You need ${requiredRole} role to access this field`, {
                  extensions: { code: 'FORBIDDEN' }
                });
              }

              return resolve(source, args, context, info);
            };
          }

          return fieldConfig;
        },
      }),
  };
}

/**
 * @rateLimit Directive
 * 限制字段的訪問速率
 *
 * 使用範例：
 * type Mutation {
 *   sendEmail: Boolean @rateLimit(limit: 5, duration: 60)
 * }
 */
function rateLimitDirective(directiveName = 'rateLimit') {
  // 簡單的內存存儲（生產環境應使用 Redis）
  const rateLimitStore = new Map();

  return {
    rateLimitDirectiveTypeDefs: `directive @${directiveName}(
      limit: Int = 10
      duration: Int = 60
    ) on FIELD_DEFINITION`,

    rateLimitDirectiveTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const rateLimitDirective = getDirective(schema, fieldConfig, directiveName)?.[0];

          if (rateLimitDirective) {
            const { resolve = defaultFieldResolver } = fieldConfig;
            const { limit = 10, duration = 60 } = rateLimitDirective;

            fieldConfig.resolve = async function (source, args, context, info) {
              // 使用 IP 或用戶 ID 作為鍵
              const key = context.user?.id || context.req?.ip || 'anonymous';
              const fieldKey = `${key}:${info.fieldName}`;
              const now = Date.now();

              // 獲取或初始化速率限制數據
              let rateData = rateLimitStore.get(fieldKey);
              if (!rateData) {
                rateData = { count: 0, resetTime: now + duration * 1000 };
                rateLimitStore.set(fieldKey, rateData);
              }

              // 檢查是否需要重置
              if (now > rateData.resetTime) {
                rateData.count = 0;
                rateData.resetTime = now + duration * 1000;
              }

              // 檢查是否超過限制
              if (rateData.count >= limit) {
                const retryAfter = Math.ceil((rateData.resetTime - now) / 1000);
                throw new GraphQLError(
                  `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
                  {
                    extensions: {
                      code: 'RATE_LIMIT_EXCEEDED',
                      retryAfter,
                    },
                  }
                );
              }

              // 增加計數
              rateData.count++;

              return resolve(source, args, context, info);
            };
          }

          return fieldConfig;
        },
      }),
  };
}

/**
 * @deprecated Directive (GraphQL 內建，但可以自定義行為)
 * 標記字段為已棄用
 *
 * 使用範例：
 * type User {
 *   oldField: String @deprecated(reason: "Use newField instead")
 *   newField: String
 * }
 */
function deprecatedDirective(directiveName = 'deprecated') {
  return {
    deprecatedDirectiveTypeDefs: `directive @${directiveName}(
      reason: String = "No longer supported"
    ) on FIELD_DEFINITION | ENUM_VALUE`,

    deprecatedDirectiveTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const deprecatedDirective = getDirective(schema, fieldConfig, directiveName)?.[0];

          if (deprecatedDirective) {
            const { resolve = defaultFieldResolver } = fieldConfig;
            const { reason } = deprecatedDirective;

            fieldConfig.resolve = async function (source, args, context, info) {
              // 在開發環境中記錄警告
              if (process.env.NODE_ENV === 'development') {
                console.warn(
                  `⚠️  Deprecated field accessed: ${info.parentType}.${info.fieldName}`,
                  reason ? `Reason: ${reason}` : ''
                );
              }

              return resolve(source, args, context, info);
            };
          }

          return fieldConfig;
        },
      }),
  };
}

/**
 * @cacheControl Directive
 * 控制字段的快取行為
 *
 * 使用範例：
 * type Query {
 *   posts: [Post] @cacheControl(maxAge: 60, scope: PUBLIC)
 * }
 */
function cacheControlDirective(directiveName = 'cacheControl') {
  return {
    cacheControlDirectiveTypeDefs: `directive @${directiveName}(
      maxAge: Int
      scope: CacheControlScope
    ) on FIELD_DEFINITION | OBJECT

    enum CacheControlScope {
      PUBLIC
      PRIVATE
    }`,

    cacheControlDirectiveTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const cacheDirective = getDirective(schema, fieldConfig, directiveName)?.[0];

          if (cacheDirective) {
            const { resolve = defaultFieldResolver } = fieldConfig;
            const { maxAge, scope } = cacheDirective;

            fieldConfig.resolve = async function (source, args, context, info) {
              // 設置快取提示（可以在 context 中使用）
              if (!context.cacheControl) {
                context.cacheControl = {};
              }

              context.cacheControl[info.fieldName] = {
                maxAge: maxAge || 0,
                scope: scope || 'PUBLIC',
              };

              return resolve(source, args, context, info);
            };
          }

          return fieldConfig;
        },
      }),
  };
}

/**
 * @validate Directive
 * 驗證字段輸入
 *
 * 使用範例：
 * type Mutation {
 *   createPost(title: String @validate(minLength: 5, maxLength: 100)): Post
 * }
 */
function validateDirective(directiveName = 'validate') {
  return {
    validateDirectiveTypeDefs: `directive @${directiveName}(
      minLength: Int
      maxLength: Int
      pattern: String
      min: Int
      max: Int
    ) on INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION`,

    validateDirectiveTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const { resolve = defaultFieldResolver } = fieldConfig;

          // 檢查參數上的驗證指令
          if (fieldConfig.args) {
            Object.entries(fieldConfig.args).forEach(([argName, argConfig]) => {
              const validateDirective = getDirective(schema, argConfig, directiveName)?.[0];

              if (validateDirective) {
                const originalResolve = resolve;

                fieldConfig.resolve = async function (source, args, context, info) {
                  const value = args[argName];
                  const { minLength, maxLength, pattern, min, max } = validateDirective;

                  // 驗證字串長度
                  if (typeof value === 'string') {
                    if (minLength && value.length < minLength) {
                      throw new GraphQLError(
                        `${argName} must be at least ${minLength} characters long`,
                        { extensions: { code: 'VALIDATION_ERROR', field: argName } }
                      );
                    }
                    if (maxLength && value.length > maxLength) {
                      throw new GraphQLError(
                        `${argName} must be at most ${maxLength} characters long`,
                        { extensions: { code: 'VALIDATION_ERROR', field: argName } }
                      );
                    }
                    if (pattern && !new RegExp(pattern).test(value)) {
                      throw new GraphQLError(
                        `${argName} does not match the required pattern`,
                        { extensions: { code: 'VALIDATION_ERROR', field: argName } }
                      );
                    }
                  }

                  // 驗證數字範圍
                  if (typeof value === 'number') {
                    if (min !== undefined && value < min) {
                      throw new GraphQLError(
                        `${argName} must be at least ${min}`,
                        { extensions: { code: 'VALIDATION_ERROR', field: argName } }
                      );
                    }
                    if (max !== undefined && value > max) {
                      throw new GraphQLError(
                        `${argName} must be at most ${max}`,
                        { extensions: { code: 'VALIDATION_ERROR', field: argName } }
                      );
                    }
                  }

                  return originalResolve(source, args, context, info);
                };
              }
            });
          }

          return fieldConfig;
        },
      }),
  };
}

module.exports = {
  authDirective,
  rateLimitDirective,
  deprecatedDirective,
  cacheControlDirective,
  validateDirective,
};
