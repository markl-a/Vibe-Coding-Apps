'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, Target, CheckCircle2 } from 'lucide-react';
import { analyzeProductPerformance, generateSalesInsights, ProductRecommendation, SalesInsight } from '@/lib/aiSalesService';
import type { TopProduct, RegionSales } from '@/types';

interface SmartRecommendationsProps {
  revenueData: { date: string; revenue: number; orders: number }[];
  products: TopProduct[];
  regions: RegionSales[];
}

const SmartRecommendations = ({ revenueData, products, regions }: SmartRecommendationsProps) => {
  const [productRecommendations, setProductRecommendations] = useState<ProductRecommendation[]>([]);
  const [salesInsights, setSalesInsights] = useState<SalesInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'products'>('insights');

  useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const prodRecs = analyzeProductPerformance(products);
      const insights = generateSalesInsights(revenueData, products, regions);

      setProductRecommendations(prodRecs);
      setSalesInsights(insights);
      setIsAnalyzing(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [revenueData, products, regions]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'trend':
        return <Target className="w-5 h-5 text-blue-600" />;
      case 'optimization':
        return <Lightbulb className="w-5 h-5 text-purple-600" />;
      default:
        return <Lightbulb className="w-5 h-5 text-gray-600" />;
    }
  };

  const getInsightBgColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'trend':
        return 'bg-blue-50 border-blue-200';
      case 'optimization':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-indigo-600" />
            AI 智能推荐
          </h2>
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold animate-pulse">
            分析中...
          </span>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
              <Lightbulb className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-600 text-center">
              AI 正在分析您的业务数据<br />生成个性化推荐...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-indigo-600" />
          AI 智能推荐
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'insights'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            业务洞察 ({salesInsights.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'products'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            产品建议 ({productRecommendations.length})
          </button>
        </div>
      </div>

      {/* 业务洞察标签页 */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {salesInsights.map((insight, index) => (
            <div
              key={index}
              className={`border rounded-lg p-5 transition-all hover:shadow-md ${getInsightBgColor(insight.type)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        insight.impact === 'high'
                          ? 'bg-red-100 text-red-800'
                          : insight.impact === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {insight.impact === 'high' ? '高影响' : insight.impact === 'medium' ? '中影响' : '低影响'}
                      </span>
                      <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
                        {(insight.confidence * 100).toFixed(0)}% 可信
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{insight.description}</p>

                  {insight.metrics && (
                    <div className="grid grid-cols-3 gap-4 bg-white rounded-lg p-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">当前值</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${insight.metrics.current.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">潜力值</p>
                        <p className="text-lg font-bold text-green-600">
                          ${insight.metrics.potential.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">提升空间</p>
                        <p className="text-lg font-bold text-indigo-600">
                          +{insight.metrics.improvement.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 产品建议标签页 */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {productRecommendations.map((rec, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-5 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{rec.productName}</h3>
                  <p className="text-sm text-gray-600">{rec.productId}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(rec.priority)}`}>
                  {rec.priority === 'high' ? '高优先级' : rec.priority === 'medium' ? '中优先级' : '低优先级'}
                </span>
              </div>

              <p className="text-gray-700 mb-4">{rec.reason}</p>

              <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-1">预期影响</p>
                <p className="text-2xl font-bold text-indigo-600">
                  ${Math.abs(rec.expectedImpact).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    {rec.expectedImpact > 0 ? '增长潜力' : '潜在损失'}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">🎯 建议行动：</p>
                <ul className="space-y-2">
                  {rec.actionItems.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">🤖 AI 分析基于：</span>
          历史销售趋势、产品表现、区域分布和市场模式。
          建议每周更新以获取最新洞察。
        </p>
      </div>
    </div>
  );
};

export default SmartRecommendations;
