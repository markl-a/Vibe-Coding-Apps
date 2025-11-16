const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { createServer } = require('http');
const express = require('express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { initDatabase } = require('./utils/db');
const { getUserFromContext } = require('./utils/auth');
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./resolvers');
require('dotenv').config();

const PORT = process.env.PORT || 4003;

async function startServer() {
  try {
    // 初始化資料庫
    console.log('🔄 Initializing database...');
    await initDatabase();

    const app = express();
    const httpServer = createServer(app);

    // 創建 Schema
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // 創建 WebSocket 服務器用於訂閱
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
    });

    // 設置 WebSocket 服務器
    const serverCleanup = useServer(
      {
        schema,
        context: async (ctx) => {
          const userId = getUserFromContext({ connectionParams: ctx.connectionParams });
          return { userId, connectionParams: ctx.connectionParams };
        },
      },
      wsServer
    );

    // 創建 Apollo Server
    const server = new ApolloServer({
      schema,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
      ],
    });

    await server.start();

    app.use(
      '/graphql',
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => {
          const userId = getUserFromContext({ req });
          return { userId, req };
        },
      })
    );

    // 啟動 HTTP 服務器
    await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));

    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   💬 Real-time Chat GraphQL API is running!          ║
║                                                        ║
║   🌐 GraphQL Endpoint:                                ║
║      http://localhost:${PORT}/graphql                    ║
║                                                        ║
║   🔌 WebSocket Subscriptions:                         ║
║      ws://localhost:${PORT}/graphql                      ║
║                                                        ║
║   💡 Ready for real-time messaging!                   ║
║                                                        ║
╚════════════════════════════════════════════════════════╝

📝 Demo credentials:
   alice@example.com / demo123
   bob@example.com / demo123
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
