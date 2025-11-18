const { GraphQLError } = require('graphql');
const {
  getComplexity,
  simpleEstimator,
  fieldExtensionsEstimator,
} = require('graphql-query-complexity');
const depthLimit = require('graphql-depth-limit');

/**
 * 查詢複雜度限制插件
 * 防止過於複雜的查詢消耗過多資源
 *
 * 複雜度計算範例：
 * - 簡單字段：1
 * - 列表字段：每個項目 1
 * - 嵌套字段：累加
 *
 * 範例查詢複雜度：
 * query {
 *   posts(limit: 10) {    # 10 (列表)
 *     title               # 10 (每個 post 的字段)
 *     author {            # 10
 *       name              # 10
 *     }
 *   }
 * }
 * 總複雜度：40
 */
function createComplexityPlugin(maxComplexity = 1000) {
  return {
    async requestDidStart() {
      return {
        async didResolveOperation({ request, document, schema }) {
          const complexity = getComplexity({
            schema,
            operationName: request.operationName,
            query: document,
            variables: request.variables,
            estimators: [
              // 使用字段擴展估算器（可以在 schema 中自定義複雜度）
              fieldExtensionsEstimator(),
              // 使用簡單估算器作為後備
              simpleEstimator({ defaultComplexity: 1 }),
            ],
          });

          if (complexity > maxComplexity) {
            throw new GraphQLError(
              `Query is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`,
              {
                extensions: {
                  code: 'QUERY_TOO_COMPLEX',
                  complexity,
                  maxComplexity,
                },
              }
            );
          }

          // 在開發環境中記錄查詢複雜度
          if (process.env.NODE_ENV === 'development') {
            console.log(`📊 Query complexity: ${complexity}/${maxComplexity}`);
          }
        },
      };
    },
  };
}

/**
 * 查詢深度限制
 * 防止過深的嵌套查詢
 *
 * 範例（深度 4）：
 * query {
 *   post {           # 深度 1
 *     author {       # 深度 2
 *       posts {      # 深度 3
 *         comments { # 深度 4
 *           author   # 深度 5 - 超過限制！
 *         }
 *       }
 *     }
 *   }
 * }
 */
function createDepthLimitRule(maxDepth = 10) {
  return depthLimit(maxDepth, {
    ignore: [
      // 忽略某些字段（例如 __typename, __schema）
      /__.*?/,
    ],
  });
}

/**
 * 查詢成本分析
 * 提供更詳細的查詢成本分析
 */
class QueryCostAnalyzer {
  constructor() {
    this.costs = new Map();
  }

  /**
   * 分析查詢成本
   */
  analyze(query, variables = {}) {
    const cost = {
      complexity: 0,
      depth: 0,
      fields: 0,
      lists: 0,
      resolvers: [],
    };

    // 這裡可以實現更詳細的分析邏輯
    return cost;
  }

  /**
   * 記錄查詢成本
   */
  recordCost(queryName, cost) {
    if (!this.costs.has(queryName)) {
      this.costs.set(queryName, []);
    }
    this.costs.get(queryName).push({
      ...cost,
      timestamp: new Date(),
    });
  }

  /**
   * 獲取成本統計
   */
  getStats(queryName) {
    const costs = this.costs.get(queryName);
    if (!costs || costs.length === 0) {
      return null;
    }

    const avgComplexity =
      costs.reduce((sum, c) => sum + c.complexity, 0) / costs.length;
    const maxComplexity = Math.max(...costs.map((c) => c.complexity));
    const minComplexity = Math.min(...costs.map((c) => c.complexity));

    return {
      queryName,
      count: costs.length,
      avgComplexity: Math.round(avgComplexity),
      maxComplexity,
      minComplexity,
      recentCosts: costs.slice(-10),
    };
  }

  /**
   * 獲取所有統計
   */
  getAllStats() {
    const stats = [];
    for (const queryName of this.costs.keys()) {
      stats.push(this.getStats(queryName));
    }
    return stats.sort((a, b) => b.avgComplexity - a.avgComplexity);
  }
}

/**
 * 查詢計時插件
 * 記錄查詢執行時間
 */
function createQueryTimingPlugin() {
  return {
    async requestDidStart() {
      const startTime = Date.now();

      return {
        async willSendResponse({ response, operationName }) {
          const duration = Date.now() - startTime;

          // 添加執行時間到響應 extensions
          if (response.extensions) {
            response.extensions.timing = { duration };
          } else {
            response.extensions = { timing: { duration } };
          }

          // 在開發環境中記錄慢查詢
          if (process.env.NODE_ENV === 'development' && duration > 1000) {
            console.warn(
              `⚠️  Slow query detected: ${operationName || 'anonymous'} took ${duration}ms`
            );
          }
        },
      };
    },
  };
}

/**
 * 批次查詢限制
 * 防止批次查詢濫用
 */
function createBatchingLimitPlugin(maxBatchSize = 10) {
  return {
    async requestDidStart({ request }) {
      // 檢查是否為批次請求
      if (Array.isArray(request)) {
        if (request.length > maxBatchSize) {
          throw new GraphQLError(
            `Batch query too large: ${request.length}. Maximum allowed: ${maxBatchSize}`,
            {
              extensions: {
                code: 'BATCH_TOO_LARGE',
                batchSize: request.length,
                maxBatchSize,
              },
            }
          );
        }
      }

      return {};
    },
  };
}

/**
 * 創建所有性能監控插件
 */
function createPerformancePlugins(options = {}) {
  const {
    maxComplexity = 1000,
    maxDepth = 10,
    maxBatchSize = 10,
    enableTiming = true,
  } = options;

  const plugins = [createComplexityPlugin(maxComplexity)];

  if (enableTiming) {
    plugins.push(createQueryTimingPlugin());
  }

  if (maxBatchSize > 0) {
    plugins.push(createBatchingLimitPlugin(maxBatchSize));
  }

  return plugins;
}

module.exports = {
  createComplexityPlugin,
  createDepthLimitRule,
  createQueryTimingPlugin,
  createBatchingLimitPlugin,
  createPerformancePlugins,
  QueryCostAnalyzer,
};
