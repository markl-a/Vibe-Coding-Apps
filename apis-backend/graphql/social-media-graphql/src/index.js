const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { initDatabase } = require('./utils/db');
const { getUserFromContext } = require('./utils/auth');
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./resolvers');
require('dotenv').config();

const PORT = process.env.PORT || 4002;

async function startServer() {
  try {
    // 初始化資料庫
    console.log('🔄 Initializing database...');
    await initDatabase();

    // 創建 Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: true,
      formatError: (error) => {
        console.error('❌ GraphQL Error:', error);
        return error;
      }
    });

    // 啟動服務器
    const { url } = await startStandaloneServer(server, {
      listen: { port: PORT },
      context: async ({ req }) => {
        const userId = getUserFromContext({ req });
        return { userId, req };
      }
    });

    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 Social Media GraphQL API Server is running!     ║
║                                                        ║
║   🌐 GraphQL Endpoint:                                ║
║      ${url}                                           ║
║                                                        ║
║   🔌 WebSocket Subscriptions:                         ║
║      ws://localhost:${PORT}/graphql                      ║
║                                                        ║
║   💡 Ready to accept requests!                        ║
║                                                        ║
╚════════════════════════════════════════════════════════╝

📝 Demo credentials:
   demo@example.com / demo123
    `);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM signal received: closing server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT signal received: closing server');
  process.exit(0);
});

// 啟動服務器
startServer();
