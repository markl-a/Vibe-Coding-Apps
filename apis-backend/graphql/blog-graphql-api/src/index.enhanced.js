const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const mongoose = require('mongoose');
require('dotenv').config();

const typeDefsEnhanced = require('./schema/typeDefsEnhanced');
const enhancedResolvers = require('./resolvers/enhancedResolvers');
const { authenticateUser } = require('./utils/auth');
const { createLoaders } = require('./utils/dataLoaders');

// 引入 Directives
const {
  authDirective,
  rateLimitDirective,
  cacheControlDirective,
  validateDirective,
} = require('./utils/directives');

// 引入查詢複雜度和性能插件
const {
  createPerformancePlugins,
  createDepthLimitRule,
} = require('./utils/queryComplexity');

async function startServer() {
  // 連接 MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-graphql');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }

  // 創建 Schema（應用 Directives）
  let schema = makeExecutableSchema({
    typeDefs: [
      // Directive 類型定義
      authDirective().authDirectiveTypeDefs,
      rateLimitDirective().rateLimitDirectiveTypeDefs,
      cacheControlDirective().cacheControlDirectiveTypeDefs,
      validateDirective().validateDirectiveTypeDefs,
      // 主 Schema
      typeDefsEnhanced,
    ],
    resolvers: enhancedResolvers,
  });

  // 應用 Directive transformers
  schema = authDirective().authDirectiveTransformer(schema);
  schema = rateLimitDirective().rateLimitDirectiveTransformer(schema);
  schema = cacheControlDirective().cacheControlDirectiveTransformer(schema);
  schema = validateDirective().validateDirectiveTransformer(schema);

  // 獲取配置
  const maxComplexity = parseInt(process.env.MAX_QUERY_COMPLEXITY) || 1000;
  const maxDepth = parseInt(process.env.MAX_QUERY_DEPTH) || 10;
  const maxBatchSize = parseInt(process.env.MAX_BATCH_SIZE) || 10;

  // 創建 Apollo Server
  const server = new ApolloServer({
    schema,
    introspection: true, // 啟用 introspection（生產環境可以關閉）
    plugins: createPerformancePlugins({
      maxComplexity,
      maxBatchSize,
      enableTiming: true,
    }),
    validationRules: [createDepthLimitRule(maxDepth)],
    formatError: (error) => {
      // 記錄錯誤
      console.error('GraphQL Error:', {
        message: error.message,
        code: error.extensions?.code,
        path: error.path,
      });

      // 在生產環境隱藏內部錯誤詳情
      if (process.env.NODE_ENV === 'production') {
        if (error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
          return {
            message: 'An internal server error occurred',
            extensions: {
              code: error.extensions.code,
            },
          };
        }
      }

      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          locations: error.locations,
          path: error.path,
        }),
      };
    },
  });

  // 啟動伺服器
  const { url } = await startStandaloneServer(server, {
    listen: { port: parseInt(process.env.PORT) || 4000 },
    context: async ({ req }) => {
      // 從 header 取得 token 並驗證用戶
      const user = await authenticateUser(req.headers.authorization);

      // 為每個請求創建新的 DataLoaders
      const loaders = createLoaders();

      return {
        user,
        loaders,
        req,
      };
    },
  });

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Enhanced Blog GraphQL API Server Started            ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  📍 URL: ${url.padEnd(51)}║
║                                                           ║
║  🎯 Apollo Sandbox: ${(url).padEnd(38)}║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║  ✨ Features Enabled:                                    ║
║  • Custom Scalars (DateTime, Email, URL)                 ║
║  • Custom Directives (@auth, @rateLimit, @cacheControl)  ║
║  • Query Complexity Limit: ${maxComplexity.toString().padEnd(34)}║
║  • Query Depth Limit: ${maxDepth.toString().padEnd(39)}║
║  • AI Services: ${(process.env.AI_MOCK_MODE === 'true' ? 'Mock Mode' : 'Live').padEnd(43)}║
║  • DataLoader N+1 Prevention                             ║
║  • Performance Monitoring                                ║
╠═══════════════════════════════════════════════════════════╣
║  🤖 AI Features:                                         ║
║  • Content Generation                                    ║
║  • SEO Optimization                                      ║
║  • Smart Tags Generation                                 ║
║  • Sentiment Analysis                                    ║
║  • Content Recommendations                               ║
╠═══════════════════════════════════════════════════════════╣
║  📚 Documentation:                                       ║
║  • See examples/advanced-queries.md                      ║
║  • API Docs: ${(url + 'graphql').padEnd(42)}║
║                                                           ║
║  💡 AI-Driven & AI-Native GraphQL API 🚀                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // 在開發模式下顯示一些有用的查詢示例
  if (process.env.NODE_ENV === 'development') {
    console.log(`
📖 Quick Start Queries:

1️⃣  Register a new user:
   mutation {
     register(name: "John Doe", email: "john@example.com", password: "password123") {
       token
       user { id name email }
     }
   }

2️⃣  Create a post with AI enhancements:
   mutation {
     createPost(input: {
       title: "My First Post"
       content: "This is my first post content..."
       generateSummary: true
       generateSEO: true
     }) {
       id title excerpt
     }
   }

3️⃣  Get recommended posts:
   query {
     recommendedPosts(limit: 5) {
       id title excerpt
     }
   }

📝 For more examples, see: examples/advanced-queries.md
    `);
  }
}

// 優雅關閉
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM signal received: closing server');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT signal received: closing server');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

// 未捕獲的異常處理
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

// 啟動服務器
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
