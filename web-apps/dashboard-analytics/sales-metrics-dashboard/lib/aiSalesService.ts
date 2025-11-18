/**
 * AI Sales Service - 专为销售数据分析设计的 AI 服务
 * 包括销售预测、智能推荐、产品分析、区域优化等功能
 */

export interface SalesForecast {
  date: string;
  predictedRevenue: number;
  confidence: number;
  range: {
    low: number;
    high: number;
  };
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  reason: string;
  expectedImpact: number;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

export interface SalesInsight {
  type: 'opportunity' | 'warning' | 'trend' | 'optimization';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  metrics?: {
    current: number;
    potential: number;
    improvement: number;
  };
}

export interface SeasonalPattern {
  season: string;
  avgRevenue: number;
  pattern: 'increasing' | 'decreasing' | 'stable';
  peakDays: number[];
}

/**
 * 销售预测 - 使用时间序列分析和线性回归
 */
export const forecastSales = (
  historicalData: { date: string; revenue: number }[],
  periodsAhead: number = 7
): SalesForecast[] => {
  if (historicalData.length < 3) {
    return [];
  }

  const revenues = historicalData.map(d => d.revenue);
  const n = revenues.length;

  // 计算线性回归
  const xValues = Array.from({ length: n }, (_, i) => i);
  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = revenues.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (revenues[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }

  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  // 计算 R² 和标准误差
  const predictions = xValues.map(x => slope * x + intercept);
  const totalVariance = revenues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const residualVariance = revenues.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0);
  const rSquared = 1 - (residualVariance / totalVariance);
  const standardError = Math.sqrt(residualVariance / (n - 2));

  // 生成预测
  const forecasts: SalesForecast[] = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);

  for (let i = 1; i <= periodsAhead; i++) {
    const x = n + i - 1;
    const predicted = slope * x + intercept;
    const confidenceInterval = 1.96 * standardError * Math.sqrt(1 + 1 / n + Math.pow(x - xMean, 2) / denominator);

    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);

    forecasts.push({
      date: forecastDate.toISOString().split('T')[0],
      predictedRevenue: Math.max(0, predicted),
      confidence: Math.min(0.95, Math.max(0.5, rSquared)),
      range: {
        low: Math.max(0, predicted - confidenceInterval),
        high: predicted + confidenceInterval,
      },
    });
  }

  return forecasts;
};

/**
 * 识别季节性模式
 */
export const detectSeasonalPatterns = (
  data: { date: string; revenue: number }[]
): SeasonalPattern | null => {
  if (data.length < 7) return null;

  // 按星期几分组
  const dayGroups: { [key: number]: number[] } = {};

  data.forEach(item => {
    const date = new Date(item.date);
    const dayOfWeek = date.getDay();

    if (!dayGroups[dayOfWeek]) {
      dayGroups[dayOfWeek] = [];
    }
    dayGroups[dayOfWeek].push(item.revenue);
  });

  // 计算每天的平均值
  const dayAverages: { day: number; avg: number }[] = Object.keys(dayGroups).map(day => ({
    day: parseInt(day),
    avg: dayGroups[parseInt(day)].reduce((a, b) => a + b, 0) / dayGroups[parseInt(day)].length,
  }));

  const overallAvg = dayAverages.reduce((sum, d) => sum + d.avg, 0) / dayAverages.length;

  // 找出高峰日
  const peakDays = dayAverages
    .filter(d => d.avg > overallAvg * 1.1)
    .map(d => d.day)
    .sort((a, b) => b - a);

  // 确定趋势
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));

  const firstAvg = firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length;

  const change = (secondAvg - firstAvg) / firstAvg;

  return {
    season: '当前周期',
    avgRevenue: overallAvg,
    pattern: change > 0.05 ? 'increasing' : change < -0.05 ? 'decreasing' : 'stable',
    peakDays,
  };
};

/**
 * 产品表现分析
 */
export const analyzeProductPerformance = (
  products: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    growth: number;
    category: string;
  }>
): ProductRecommendation[] => {
  const recommendations: ProductRecommendation[] = [];

  // 找出高增长产品
  const highGrowthProducts = products.filter(p => p.growth > 20);
  highGrowthProducts.forEach(product => {
    recommendations.push({
      productId: product.id,
      productName: product.name,
      reason: `产品增长率达 ${product.growth.toFixed(1)}%，表现优异`,
      expectedImpact: product.revenue * 0.3,
      priority: 'high',
      actionItems: [
        '增加库存以满足需求',
        '加大营销推广力度',
        '考虑推出类似产品线',
      ],
    });
  });

  // 找出低增长但高收入的产品
  const stableHighRevenue = products.filter(p => p.growth < 5 && p.growth > -5 && p.revenue > 300000);
  stableHighRevenue.forEach(product => {
    recommendations.push({
      productId: product.id,
      productName: product.name,
      reason: '高收入产品但增长停滞',
      expectedImpact: product.revenue * 0.15,
      priority: 'medium',
      actionItems: [
        '推出促销活动刺激销量',
        '更新产品描述和图片',
        '收集用户反馈改进产品',
      ],
    });
  });

  // 找出下降趋势的产品
  const decliningProducts = products.filter(p => p.growth < -10);
  decliningProducts.forEach(product => {
    recommendations.push({
      productId: product.id,
      productName: product.name,
      reason: `销售下降 ${Math.abs(product.growth).toFixed(1)}%，需要关注`,
      expectedImpact: -product.revenue * 0.2,
      priority: 'high',
      actionItems: [
        '分析竞品和市场变化',
        '考虑价格调整或促销',
        '评估是否需要产品升级',
      ],
    });
  });

  return recommendations.sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  }).slice(0, 5);
};

/**
 * 区域销售优化建议
 */
export const analyzeRegionalPerformance = (
  regions: Array<{
    region: string;
    sales: number;
    percentage: number;
  }>
): SalesInsight[] => {
  const insights: SalesInsight[] = [];

  const totalSales = regions.reduce((sum, r) => sum + r.sales, 0);
  const avgSales = totalSales / regions.length;

  // 找出表现最好的区域
  const topRegion = regions.reduce((max, r) => (r.sales > max.sales ? r : max), regions[0]);
  insights.push({
    type: 'opportunity',
    title: `${topRegion.region} 表现优异`,
    description: `该区域贡献了 ${topRegion.percentage}% 的总销售额，可作为其他区域的参考标准`,
    impact: 'high',
    confidence: 0.9,
    metrics: {
      current: topRegion.sales,
      potential: topRegion.sales * 1.2,
      improvement: 20,
    },
  });

  // 找出低于平均的区域
  const underperformingRegions = regions.filter(r => r.sales < avgSales * 0.7);
  if (underperformingRegions.length > 0) {
    const region = underperformingRegions[0];
    insights.push({
      type: 'optimization',
      title: `${region.region} 有增长空间`,
      description: `该区域销售额低于平均水平 ${((1 - region.sales / avgSales) * 100).toFixed(1)}%`,
      impact: 'medium',
      confidence: 0.8,
      metrics: {
        current: region.sales,
        potential: avgSales,
        improvement: ((avgSales - region.sales) / region.sales) * 100,
      },
    });
  }

  // 市场集中度分析
  const topTwoPercentage = regions
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 2)
    .reduce((sum, r) => sum + r.percentage, 0);

  if (topTwoPercentage > 60) {
    insights.push({
      type: 'warning',
      title: '市场过度集中',
      description: `前两大区域占 ${topTwoPercentage.toFixed(1)}% 的销售额，存在风险`,
      impact: 'medium',
      confidence: 0.85,
    });
  }

  return insights;
};

/**
 * 综合销售洞察生成
 */
export const generateSalesInsights = (
  revenueData: { date: string; revenue: number; orders: number }[],
  products: any[],
  regions: any[]
): SalesInsight[] => {
  const insights: SalesInsight[] = [];

  // 收入趋势分析
  if (revenueData.length >= 7) {
    const recent7 = revenueData.slice(-7);
    const previous7 = revenueData.slice(-14, -7);

    if (previous7.length === 7) {
      const recentAvg = recent7.reduce((sum, d) => sum + d.revenue, 0) / 7;
      const previousAvg = previous7.reduce((sum, d) => sum + d.revenue, 0) / 7;
      const change = ((recentAvg - previousAvg) / previousAvg) * 100;

      if (Math.abs(change) > 5) {
        insights.push({
          type: change > 0 ? 'trend' : 'warning',
          title: change > 0 ? '收入增长加速' : '收入增长放缓',
          description: `最近7天平均收入${change > 0 ? '增长' : '下降'} ${Math.abs(change).toFixed(1)}%`,
          impact: Math.abs(change) > 15 ? 'high' : 'medium',
          confidence: 0.85,
          metrics: {
            current: recentAvg,
            potential: change > 0 ? recentAvg * 1.1 : previousAvg,
            improvement: Math.abs(change),
          },
        });
      }
    }
  }

  // 订单转化分析
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = revenueData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  if (avgOrderValue < 800) {
    insights.push({
      type: 'optimization',
      title: '客单价提升机会',
      description: `当前平均订单价值 $${avgOrderValue.toFixed(0)}，可通过捆绑销售或推荐高价值产品提升`,
      impact: 'high',
      confidence: 0.8,
      metrics: {
        current: avgOrderValue,
        potential: avgOrderValue * 1.25,
        improvement: 25,
      },
    });
  }

  // 产品组合分析
  if (products.length > 0) {
    const highGrowthCount = products.filter(p => p.growth > 20).length;
    const totalProducts = products.length;

    if (highGrowthCount / totalProducts > 0.3) {
      insights.push({
        type: 'opportunity',
        title: '产品组合表现强劲',
        description: `${highGrowthCount} 个产品（${((highGrowthCount / totalProducts) * 100).toFixed(0)}%）呈现高增长趋势`,
        impact: 'high',
        confidence: 0.9,
      });
    }
  }

  // 区域洞察
  const regionalInsights = analyzeRegionalPerformance(regions);
  insights.push(...regionalInsights);

  return insights.sort((a, b) => {
    const impactWeight = { high: 3, medium: 2, low: 1 };
    return impactWeight[b.impact] - impactWeight[a.impact];
  }).slice(0, 6);
};

/**
 * 智能营销时机推荐
 */
export const recommendMarketingTiming = (
  revenueData: { date: string; revenue: number }[]
): {
  bestDays: string[];
  bestTime: string;
  reason: string;
} => {
  if (revenueData.length < 7) {
    return {
      bestDays: [],
      bestTime: 'N/A',
      reason: '数据不足',
    };
  }

  // 分析一周中的最佳日期
  const dayOfWeekRevenue: { [key: number]: number[] } = {};

  revenueData.forEach(item => {
    const date = new Date(item.date);
    const day = date.getDay();

    if (!dayOfWeekRevenue[day]) {
      dayOfWeekRevenue[day] = [];
    }
    dayOfWeekRevenue[day].push(item.revenue);
  });

  const dayAverages = Object.entries(dayOfWeekRevenue).map(([day, revenues]) => ({
    day: parseInt(day),
    avg: revenues.reduce((a, b) => a + b, 0) / revenues.length,
  }));

  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const topDays = dayAverages
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 2)
    .map(d => dayNames[d.day]);

  return {
    bestDays: topDays,
    bestTime: '根据数据，建议在 10:00-12:00 或 19:00-21:00 推送营销内容',
    reason: `${topDays.join('和')} 的销售表现最佳，用户活跃度高`,
  };
};
