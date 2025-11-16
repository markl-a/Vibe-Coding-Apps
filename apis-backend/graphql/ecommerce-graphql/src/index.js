const { createYoga } = require('graphql-yoga');
const { createServer } = require('http');
const { initDatabase } = require('./utils/db');
const { getUserFromRequest } = require('./utils/auth');
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./resolvers');
require('dotenv').config();

const PORT = process.env.PORT || 4001;

// 創建 GraphQL Yoga 服務器
const yoga = createYoga({
  schema: {
    typeDefs,
    resolvers
  },
  context: async ({ request }) => {
    // 從請求中獲取用戶 ID
    const userId = getUserFromRequest(request);
    return { userId };
  },
  graphiql: {
    title: 'E-commerce GraphQL API',
    defaultQuery: `# 🛒 電商平台 GraphQL API
#
# 歡迎使用電商平台 GraphQL API！
#
# 📝 快速開始範例：

# 1️⃣ 用戶註冊
mutation Register {
  register(
    name: "John Doe"
    email: "john@example.com"
    password: "securepassword123"
  ) {
    token
    user {
      id
      name
      email
    }
  }
}

# 2️⃣ 查詢商品
query GetProducts {
  products(limit: 10) {
    id
    name
    description
    price
    stock
    category {
      name
    }
  }
}

# 3️⃣ 添加到購物車（需要先登入並設定 Authorization header）
# mutation AddToCart {
#   addToCart(productId: "YOUR_PRODUCT_ID", quantity: 2) {
#     id
#     product {
#       name
#       price
#     }
#     quantity
#     subtotal
#   }
# }

# 4️⃣ 創建訂單
# mutation CreateOrder {
#   createOrder {
#     id
#     totalAmount
#     status
#     items {
#       product {
#         name
#       }
#       quantity
#       price
#       subtotal
#     }
#   }
# }

# 💡 提示：
# - 註冊後，複製返回的 token
# - 在下方 HTTP HEADERS 區域添加：
#   {
#     "Authorization": "Bearer YOUR_TOKEN_HERE"
#   }
# - 然後就可以使用需要認證的操作了！
`
  }
});

// 創建 HTTP 服務器
const server = createServer(yoga);

// 啟動服務器
async function startServer() {
  try {
    // 初始化資料庫
    console.log('🔄 Initializing database...');
    await initDatabase();

    // 啟動 HTTP 服務器
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 E-commerce GraphQL API Server is running!       ║
║                                                        ║
║   🌐 GraphQL Endpoint:                                ║
║      http://localhost:${PORT}/graphql                    ║
║                                                        ║
║   📊 GraphiQL Playground:                             ║
║      http://localhost:${PORT}/graphql                    ║
║                                                        ║
║   🔌 WebSocket (Subscriptions):                       ║
║      ws://localhost:${PORT}/graphql                      ║
║                                                        ║
║   💡 Ready to accept requests!                        ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

// 啟動服務器
startServer();
