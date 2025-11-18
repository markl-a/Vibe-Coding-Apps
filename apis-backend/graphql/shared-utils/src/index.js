/**
 * @vibe-graphql/shared-utils
 *
 * 所有 Vibe GraphQL 專案的共享工具
 *
 * 包含：
 * - 自定義 Scalars
 * - 自定義 Directives
 * - AI 服務整合
 * - 查詢複雜度工具
 * - 通用 helpers
 */

// 注意：這個套件設計為可以被複製到各個專案中使用
// 或者通過符號連結 (symlink) 共享

module.exports = {
  // 提示：從 blog-graphql-api 複製這些文件到你的專案
  // 或者使用符號連結：
  // ln -s ../../shared-utils/src ./shared-utils

  info: {
    name: '@vibe-graphql/shared-utils',
    version: '1.0.0',
    description: 'Shared utilities for all Vibe GraphQL projects',

    files: [
      'customScalars.js',
      'directives.js',
      'queryComplexity.js',
      'aiService.js',
    ],

    usage: `
      複製使用方式：
      1. 複製 blog-graphql-api/src/utils/* 到你的專案
      2. 複製 blog-graphql-api/src/services/aiService.js 到你的專案
      3. 在你的 schema 和 resolvers 中導入使用

      或使用符號連結：
      1. cd your-project/src
      2. ln -s ../../shared-utils/src ./shared
      3. 然後 require('./shared/customScalars')
    `,
  },
};
