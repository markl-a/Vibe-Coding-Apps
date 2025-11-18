/**
 * AI Service - 提供各种 AI 辅助分析功能
 * 包括趋势分析、异常检测、预测和智能建议
 */

export interface DataPoint {
  label: string;
  value: number;
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  strength: 'strong' | 'moderate' | 'weak';
  prediction: number;
  confidence: number;
}

export interface Anomaly {
  index: number;
  value: number;
  expected: number;
  severity: 'high' | 'medium' | 'low';
  deviation: number;
}

export interface AIInsight {
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  data?: any;
}

/**
 * 分析数据趋势
 */
export const analyzeTrend = (data: number[]): TrendAnalysis => {
  if (data.length < 2) {
    return {
      direction: 'stable',
      strength: 'weak',
      prediction: data[0] || 0,
      confidence: 0.5
    };
  }

  // 计算线性回归
  const n = data.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = data.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (data[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }

  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  // 计算 R²（决定系数）
  const predictions = xValues.map(x => slope * x + intercept);
  const totalVariance = data.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const residualVariance = data.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0);
  const rSquared = 1 - (residualVariance / totalVariance);

  // 预测下一个值
  const nextPrediction = slope * n + intercept;

  // 确定趋势方向和强度
  const direction = Math.abs(slope) < 0.1 ? 'stable' : slope > 0 ? 'up' : 'down';
  const strength = rSquared > 0.7 ? 'strong' : rSquared > 0.4 ? 'moderate' : 'weak';

  return {
    direction,
    strength,
    prediction: Math.max(0, nextPrediction),
    confidence: Math.min(0.99, Math.max(0.5, rSquared))
  };
};

/**
 * 检测异常值（使用 Z-score 方法）
 */
export const detectAnomalies = (data: number[], threshold: number = 2): Anomaly[] => {
  if (data.length < 3) return [];

  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  const anomalies: Anomaly[] = [];

  data.forEach((value, index) => {
    const zScore = Math.abs((value - mean) / stdDev);

    if (zScore > threshold) {
      const deviation = ((value - mean) / mean) * 100;
      anomalies.push({
        index,
        value,
        expected: mean,
        severity: zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low',
        deviation
      });
    }
  });

  return anomalies;
};

/**
 * 生成预测值（使用简单移动平均和趋势）
 */
export const generateForecast = (data: number[], periods: number = 5): number[] => {
  if (data.length < 2) return Array(periods).fill(data[0] || 0);

  const trend = analyzeTrend(data);
  const lastValue = data[data.length - 1];
  const changeRate = trend.direction === 'stable' ? 0 :
                     (trend.prediction - lastValue) / lastValue;

  const forecast: number[] = [];
  let currentValue = lastValue;

  for (let i = 0; i < periods; i++) {
    currentValue = currentValue * (1 + changeRate * 0.8); // 衰减因子
    forecast.push(Math.max(0, currentValue));
  }

  return forecast;
};

/**
 * 生成 AI 洞察
 */
export const generateInsights = (
  revenueData: number[],
  usersData: number[],
  ordersData: number[]
): AIInsight[] => {
  const insights: AIInsight[] = [];

  // 分析收入趋势
  const revenueTrend = analyzeTrend(revenueData);
  if (revenueTrend.strength !== 'weak') {
    insights.push({
      type: 'trend',
      title: revenueTrend.direction === 'up' ? '收入呈上升趋势' : '收入呈下降趋势',
      description: `根据数据分析，收入${revenueTrend.direction === 'up' ? '增长' : '下降'}趋势${
        revenueTrend.strength === 'strong' ? '明显' : '适中'
      }。预测下期收入约为 $${Math.round(revenueTrend.prediction).toLocaleString()}`,
      impact: revenueTrend.direction === 'up' ? 'positive' : 'negative',
      confidence: revenueTrend.confidence,
      data: { prediction: revenueTrend.prediction }
    });
  }

  // 检测收入异常
  const revenueAnomalies = detectAnomalies(revenueData);
  if (revenueAnomalies.length > 0) {
    const latestAnomaly = revenueAnomalies[revenueAnomalies.length - 1];
    insights.push({
      type: 'anomaly',
      title: '检测到收入异常',
      description: `第 ${latestAnomaly.index + 1} 期的收入异常，偏差 ${Math.abs(Math.round(latestAnomaly.deviation))}%。${
        latestAnomaly.deviation > 0 ? '高于' : '低于'
      }预期值`,
      impact: latestAnomaly.deviation > 0 ? 'positive' : 'negative',
      confidence: 0.85,
      data: latestAnomaly
    });
  }

  // 分析用户增长
  const usersTrend = analyzeTrend(usersData);
  if (usersTrend.direction === 'up' && usersTrend.strength !== 'weak') {
    insights.push({
      type: 'trend',
      title: '用户增长强劲',
      description: `用户数量持续增长，预计下期将达到 ${Math.round(usersTrend.prediction).toLocaleString()} 人`,
      impact: 'positive',
      confidence: usersTrend.confidence,
      data: { prediction: usersTrend.prediction }
    });
  }

  // 分析订单转化
  const avgUsers = usersData.reduce((a, b) => a + b, 0) / usersData.length;
  const avgOrders = ordersData.reduce((a, b) => a + b, 0) / ordersData.length;
  const conversionRate = (avgOrders / avgUsers) * 100;

  if (conversionRate < 5) {
    insights.push({
      type: 'recommendation',
      title: '转化率偏低',
      description: `当前转化率约 ${conversionRate.toFixed(1)}%，建议优化用户体验和营销策略以提升转化`,
      impact: 'negative',
      confidence: 0.75,
      data: { conversionRate }
    });
  }

  // 生成收入预测
  const forecast = generateForecast(revenueData, 3);
  insights.push({
    type: 'prediction',
    title: '未来收入预测',
    description: `基于历史数据，预计未来三期的收入将${revenueTrend.direction === 'up' ? '持续增长' : '保持稳定'}`,
    impact: 'neutral',
    confidence: revenueTrend.confidence * 0.9,
    data: { forecast }
  });

  // 智能建议
  if (revenueTrend.direction === 'down') {
    insights.push({
      type: 'recommendation',
      title: '营收改进建议',
      description: '收入下降可能与季节性因素或市场变化有关。建议：1) 分析用户流失原因 2) 推出促销活动 3) 优化产品组合',
      impact: 'neutral',
      confidence: 0.7
    });
  }

  return insights.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
};

/**
 * 计算相关性（皮尔逊相关系数）
 */
export const calculateCorrelation = (data1: number[], data2: number[]): number => {
  if (data1.length !== data2.length || data1.length < 2) return 0;

  const n = data1.length;
  const mean1 = data1.reduce((a, b) => a + b, 0) / n;
  const mean2 = data2.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let sum1 = 0;
  let sum2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = data1[i] - mean1;
    const diff2 = data2[i] - mean2;
    numerator += diff1 * diff2;
    sum1 += diff1 * diff1;
    sum2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(sum1 * sum2);
  return denominator === 0 ? 0 : numerator / denominator;
};

/**
 * 智能推荐：基于数据模式给出行动建议
 */
export const getSmartRecommendations = (
  metrics: {
    revenue: number[];
    users: number[];
    orders: number[];
    conversion: number[];
  }
): string[] => {
  const recommendations: string[] = [];

  // 分析收入和用户的相关性
  const revenueUserCorr = calculateCorrelation(metrics.revenue, metrics.users);
  if (revenueUserCorr < 0.5) {
    recommendations.push('收入与用户增长相关性较低，建议提升客单价或推出高价值产品');
  }

  // 分析转化率趋势
  const conversionTrend = analyzeTrend(metrics.conversion);
  if (conversionTrend.direction === 'down') {
    recommendations.push('转化率下降，建议优化购买流程、改善产品描述或提供更多支付选项');
  }

  // 检查订单波动
  const orderAnomalies = detectAnomalies(metrics.orders);
  if (orderAnomalies.length > 0) {
    recommendations.push('订单量波动较大，建议分析峰值期的成功因素并复制到其他时段');
  }

  // 收入增长建议
  const revenueTrend = analyzeTrend(metrics.revenue);
  if (revenueTrend.direction === 'stable' || revenueTrend.strength === 'weak') {
    recommendations.push('收入增长缓慢，考虑开拓新市场、推出新产品线或实施交叉销售策略');
  }

  return recommendations.slice(0, 4);
};
