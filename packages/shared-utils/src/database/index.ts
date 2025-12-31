/**
 * 數據庫連接優化模塊
 */

/**
 * MongoDB 連接選項優化
 */
export const mongodbOptions = {
  // 連接池配置
  maxPoolSize: 50,
  minPoolSize: 10,

  // 超時配置
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,

  // 重試配置
  retryWrites: true,
  retryReads: true,

  // 心跳配置
  heartbeatFrequencyMS: 10000,

  // 壓縮
  compressors: ['snappy', 'zlib'],
};

/**
 * PostgreSQL 連接池配置
 */
export const postgresPoolConfig = {
  max: 20,                    // 最大連接數
  min: 5,                     // 最小連接數
  idleTimeoutMillis: 30000,   // 空閒超時
  connectionTimeoutMillis: 5000,  // 連接超時
  acquireTimeoutMillis: 30000,    // 獲取連接超時
  createTimeoutMillis: 30000,     // 創建連接超時
  destroyTimeoutMillis: 5000,     // 銷毀連接超時
  reapIntervalMillis: 1000,       // 檢查間隔
  createRetryIntervalMillis: 200, // 重試間隔
};

/**
 * Redis 連接配置
 */
export const redisConfig = {
  // 重連策略
  retryStrategy: (times: number) => {
    if (times > 10) return null; // 停止重試
    return Math.min(times * 50, 2000); // 指數退避
  },

  // 連接選項
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectTimeout: 10000,

  // 命令超時
  commandTimeout: 5000,
};

/**
 * 創建 MongoDB 連接字符串
 */
export function buildMongoUri(config: {
  host: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
  replicaSet?: string;
  authSource?: string;
}): string {
  const { host, port = 27017, database, user, password, replicaSet, authSource } = config;

  let uri = 'mongodb://';

  if (user && password) {
    uri += `${encodeURIComponent(user)}:${encodeURIComponent(password)}@`;
  }

  uri += `${host}:${port}/${database}`;

  const params: string[] = [];
  if (replicaSet) params.push(`replicaSet=${replicaSet}`);
  if (authSource) params.push(`authSource=${authSource}`);

  if (params.length > 0) {
    uri += `?${params.join('&')}`;
  }

  return uri;
}

/**
 * 創建 PostgreSQL 連接字符串
 */
export function buildPostgresUri(config: {
  host: string;
  port?: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}): string {
  const { host, port = 5432, database, user, password, ssl } = config;

  let uri = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  uri += `@${host}:${port}/${database}`;

  if (ssl) {
    uri += '?sslmode=require';
  }

  return uri;
}

/**
 * 數據庫健康檢查器
 */
export async function checkDatabaseHealth(connection: {
  readyState?: number;
  isConnected?: boolean;
  ping?: () => Promise<void>;
}): Promise<{ healthy: boolean; message: string }> {
  try {
    // Mongoose 風格
    if ('readyState' in connection) {
      if (connection.readyState === 1) {
        return { healthy: true, message: 'Database connected' };
      }
      return { healthy: false, message: 'Database disconnected' };
    }

    // 通用 ping 檢查
    if (connection.ping) {
      await connection.ping();
      return { healthy: true, message: 'Database responding' };
    }

    return { healthy: false, message: 'Unknown connection state' };
  } catch (error: unknown) {
    return { healthy: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}
