const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const mongoose = require('mongoose');
require('dotenv').config();

const typeDefs = require('./schema/typeDefs');
const resolvers = require('./resolvers');
const { authenticateUser } = require('./utils/auth');
const { createLoaders } = require('./utils/dataLoaders');

async function startServer() {
  // 連接 MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }

  // 創建 Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (error) => {
      console.error(error);
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      };
    }
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
        loaders
      };
    }
  });

  console.log(`
╔═══════════════════════════════════════╗
║   Blog GraphQL API Server Started    ║
╠═══════════════════════════════════════╣
║  URL: ${url.padEnd(33)}║
║  Apollo Sandbox: ${(url).padEnd(22)}║
║  AI-Driven & AI-Native 🚀            ║
╚═══════════════════════════════════════╝
  `);
}

startServer().catch(console.error);
