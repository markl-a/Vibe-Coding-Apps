# 數據庫集成示例 (Database Integration) 🗄️
🤖 **AI-Enhanced Database Integration** 🚀

展示如何在 Serverless 函數中集成各種數據庫系統。

## 📋 支援的數據庫

### 1️⃣ Amazon DynamoDB
**NoSQL 數據庫 - AWS 原生**

**特點**:
- 完全托管的 NoSQL 數據庫
- 毫秒級延遲
- 自動擴展
- 按需付費
- 與 Lambda 完美集成

**使用場景**:
- 用戶配置文件
- 會話管理
- 實時排行榜
- IoT 數據存儲

### 2️⃣ MongoDB
**文檔型 NoSQL 數據庫**

**特點**:
- 靈活的文檔模型
- 強大的查詢能力
- 水平擴展
- Atlas 雲服務

**使用場景**:
- 內容管理系統
- 產品目錄
- 用戶數據
- 日誌和分析

### 3️⃣ Redis
**內存數據存儲**

**特點**:
- 極快的讀寫速度
- 多種數據結構
- 發布訂閱
- 過期機制

**使用場景**:
- 緩存
- 會話存儲
- 實時排行榜
- 速率限制

### 4️⃣ PostgreSQL
**關係型數據庫**

**特點**:
- ACID 事務支援
- 複雜查詢能力
- JSON 支援
- Supabase/Neon serverless 選項

**使用場景**:
- 複雜的業務邏輯
- 數據一致性要求高
- 多表關聯查詢
- 報表生成

## 🚀 快速開始

### DynamoDB 集成

```bash
# 安裝依賴
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

# 配置 AWS 憑證
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

**基本用法**:

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// 創建項目
await docClient.send(new PutCommand({
  TableName: 'Users',
  Item: {
    userId: '123',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date().toISOString()
  }
}));

// 獲取項目
const result = await docClient.send(new GetCommand({
  TableName: 'Users',
  Key: { userId: '123' }
}));
```

### MongoDB 集成

```bash
# 安裝依賴
npm install mongodb
```

**基本用法**:

```javascript
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedClient = client;
  return client;
}

// 使用
const client = await connectToDatabase();
const db = client.db('myapp');
const users = db.collection('users');

// 插入
await users.insertOne({
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date()
});

// 查詢
const user = await users.findOne({ email: 'john@example.com' });
```

### Redis 集成

```bash
# 安裝依賴
npm install redis
```

**基本用法**:

```javascript
const { createClient } = require('redis');

let cachedRedis = null;

async function getRedisClient() {
  if (cachedRedis) {
    return cachedRedis;
  }

  const client = createClient({
    url: process.env.REDIS_URL
  });

  await client.connect();
  cachedRedis = client;
  return client;
}

// 使用
const redis = await getRedisClient();

// 設定值
await redis.set('user:123', JSON.stringify({ name: 'John' }));

// 獲取值
const userData = await redis.get('user:123');
const user = JSON.parse(userData);

// 設定過期時間（60 秒）
await redis.setEx('session:abc', 60, 'session-data');
```

### PostgreSQL 集成

```bash
# 安裝依賴
npm install pg
```

**基本用法**:

```javascript
const { Pool } = require('pg');

let cachedPool = null;

async function getPool() {
  if (cachedPool) {
    return cachedPool;
  }

  cachedPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1, // Serverless 環境建議使用連接池限制
  });

  return cachedPool;
}

// 使用
const pool = await getPool();

// 查詢
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  ['john@example.com']
);

// 插入
await pool.query(
  'INSERT INTO users (name, email, created_at) VALUES ($1, $2, $3)',
  ['John Doe', 'john@example.com', new Date()]
);
```

## 📦 示例函數

### DynamoDB 用戶管理

完整的 CRUD 操作示例：

```javascript
// handlers/dynamodb-users.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'Users';

module.exports.handler = async (event) => {
  const { httpMethod, pathParameters, body } = event;

  try {
    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          return await getUser(pathParameters.id);
        }
        return await listUsers();

      case 'POST':
        return await createUser(JSON.parse(body));

      case 'PUT':
        return await updateUser(pathParameters.id, JSON.parse(body));

      case 'DELETE':
        return await deleteUser(pathParameters.id);

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function createUser(data) {
  const user = {
    id: uuidv4(),
    ...data,
    createdAt: new Date().toISOString()
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: user
  }));

  return {
    statusCode: 201,
    body: JSON.stringify(user)
  };
}

async function getUser(id) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { id }
  }));

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'User not found' })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(result.Item)
  };
}

async function listUsers() {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    Limit: 100
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      users: result.Items,
      count: result.Count
    })
  };
}

async function updateUser(id, updates) {
  const updateExpression = Object.keys(updates)
    .map((key, index) => `#${key} = :val${index}`)
    .join(', ');

  const expressionAttributeNames = Object.keys(updates)
    .reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {});

  const expressionAttributeValues = Object.values(updates)
    .reduce((acc, val, index) => ({ ...acc, [`:val${index}`]: val }), {});

  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: `SET ${updateExpression}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'User updated successfully' })
  };
}

async function deleteUser(id) {
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { id }
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'User deleted successfully' })
  };
}
```

### MongoDB 產品目錄

```javascript
// handlers/mongodb-products.js
const { MongoClient, ObjectId } = require('mongodb');

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI);
  cachedClient = client;
  return client;
}

module.exports.handler = async (event) => {
  const client = await connectToDatabase();
  const db = client.db('shop');
  const products = db.collection('products');

  const { httpMethod, pathParameters, body, queryStringParameters } = event;

  try {
    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          const product = await products.findOne({
            _id: new ObjectId(pathParameters.id)
          });
          return {
            statusCode: 200,
            body: JSON.stringify(product)
          };
        }

        // 支援搜索和過濾
        const { search, category, minPrice, maxPrice } = queryStringParameters || {};
        const query = {};

        if (search) {
          query.$text = { $search: search };
        }
        if (category) {
          query.category = category;
        }
        if (minPrice || maxPrice) {
          query.price = {};
          if (minPrice) query.price.$gte = parseFloat(minPrice);
          if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        const productList = await products.find(query).limit(100).toArray();

        return {
          statusCode: 200,
          body: JSON.stringify({
            products: productList,
            count: productList.length
          })
        };

      case 'POST':
        const newProduct = JSON.parse(body);
        const result = await products.insertOne({
          ...newProduct,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        return {
          statusCode: 201,
          body: JSON.stringify({
            id: result.insertedId,
            ...newProduct
          })
        };

      case 'PUT':
        const updates = JSON.parse(body);
        await products.updateOne(
          { _id: new ObjectId(pathParameters.id) },
          {
            $set: {
              ...updates,
              updatedAt: new Date()
            }
          }
        );

        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Product updated successfully' })
        };

      case 'DELETE':
        await products.deleteOne({
          _id: new ObjectId(pathParameters.id)
        });

        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Product deleted successfully' })
        };

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### Redis 緩存服務

```javascript
// handlers/redis-cache.js
const { createClient } = require('redis');

let cachedRedis = null;

async function getRedisClient() {
  if (cachedRedis && cachedRedis.isOpen) {
    return cachedRedis;
  }

  const client = createClient({
    url: process.env.REDIS_URL
  });

  await client.connect();
  cachedRedis = client;
  return client;
}

module.exports.handler = async (event) => {
  const redis = await getRedisClient();
  const { httpMethod, pathParameters, body, queryStringParameters } = event;

  try {
    switch (httpMethod) {
      case 'GET':
        const key = pathParameters.key;
        const value = await redis.get(key);

        if (!value) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Key not found' })
          };
        }

        return {
          statusCode: 200,
          body: JSON.stringify({
            key,
            value: JSON.parse(value)
          })
        };

      case 'POST':
        const { key: setKey, value: setValue, ttl } = JSON.parse(body);

        if (ttl) {
          await redis.setEx(setKey, parseInt(ttl), JSON.stringify(setValue));
        } else {
          await redis.set(setKey, JSON.stringify(setValue));
        }

        return {
          statusCode: 201,
          body: JSON.stringify({
            message: 'Key set successfully',
            key: setKey
          })
        };

      case 'DELETE':
        await redis.del(pathParameters.key);

        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Key deleted successfully' })
        };

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

## 💡 最佳實踐

### 連接池管理

在 Serverless 環境中，重用連接非常重要：

```javascript
// ✅ 好的做法 - 重用連接
let cachedConnection = null;

async function getConnection() {
  if (cachedConnection) {
    return cachedConnection;
  }
  cachedConnection = await createConnection();
  return cachedConnection;
}

// ❌ 壞的做法 - 每次創建新連接
async function getConnection() {
  return await createConnection(); // 每次都創建新連接！
}
```

### 錯誤處理

```javascript
try {
  await database.operation();
} catch (error) {
  if (error.code === 'ConditionalCheckFailedException') {
    // 處理條件檢查失敗
  } else if (error.code === 'ResourceNotFoundException') {
    // 處理資源不存在
  } else {
    // 記錄未知錯誤
    console.error('Database error:', error);
    throw error;
  }
}
```

### 性能優化

1. **使用緩存** - Redis 快取常用數據
2. **批次操作** - 減少數據庫調用次數
3. **索引優化** - 確保查詢使用索引
4. **連接限制** - Serverless 環境限制連接池大小
5. **數據分頁** - 避免返回大量數據

### 安全建議

1. **使用環境變數** - 存儲數據庫憑證
2. **最小權限原則** - IAM 角色僅授予必要權限
3. **加密傳輸** - 使用 SSL/TLS
4. **輸入驗證** - 防止注入攻擊
5. **速率限制** - 防止濫用

## 📚 相關資源

- [AWS DynamoDB 文檔](https://docs.aws.amazon.com/dynamodb/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Redis 文檔](https://redis.io/docs/)
- [PostgreSQL on Serverless](https://neon.tech/)

---

**使用正確的數據庫打造高性能 Serverless 應用！** 🚀
