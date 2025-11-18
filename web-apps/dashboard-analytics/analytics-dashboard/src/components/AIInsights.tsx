import { useEffect, useState } from 'react';
import { FaLightbulb, FaExclamationTriangle, FaArrowUp, FaChartLine } from 'react-icons/fa';
import { AIInsight, generateInsights } from '../services/aiService';
import './AIInsights.css';

interface AIInsightsProps {
  revenueData: number[];
  usersData: number[];
  ordersData: number[];
}

const AIInsights = ({ revenueData, usersData, ordersData }: AIInsightsProps) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟 AI 分析延迟
    setIsLoading(true);
    const timer = setTimeout(() => {
      const newInsights = generateInsights(revenueData, usersData, ordersData);
      setInsights(newInsights);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [revenueData, usersData, ordersData]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <FaArrowUp />;
      case 'anomaly':
        return <FaExclamationTriangle />;
      case 'prediction':
        return <FaChartLine />;
      case 'recommendation':
        return <FaLightbulb />;
      default:
        return <FaLightbulb />;
    }
  };

  const getImpactClass = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'insight-positive';
      case 'negative':
        return 'insight-negative';
      default:
        return 'insight-neutral';
    }
  };

  if (isLoading) {
    return (
      <div className="ai-insights-container">
        <div className="ai-insights-header">
          <h2>🤖 AI 智能洞察</h2>
          <span className="ai-badge">分析中...</span>
        </div>
        <div className="insights-loading">
          <div className="loading-spinner"></div>
          <p>AI 正在分析您的数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-insights-container">
      <div className="ai-insights-header">
        <h2>🤖 AI 智能洞察</h2>
        <span className="ai-badge">
          AI 驱动 • {insights.length} 条洞察
        </span>
      </div>

      <div className="insights-grid">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`insight-card ${getImpactClass(insight.impact)}`}
          >
            <div className="insight-icon">
              {getIcon(insight.type)}
            </div>
            <div className="insight-content">
              <div className="insight-header">
                <h3>{insight.title}</h3>
                <div className="confidence-badge">
                  {Math.round(insight.confidence * 100)}% 可信度
                </div>
              </div>
              <p className="insight-description">{insight.description}</p>
              {insight.data && insight.type === 'prediction' && (
                <div className="insight-data">
                  <span className="data-label">预测值:</span>
                  {insight.data.forecast?.map((value: number, i: number) => (
                    <span key={i} className="forecast-value">
                      ${Math.round(value).toLocaleString()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="insights-footer">
        <p className="footer-text">
          💡 这些洞察由 AI 算法基于历史数据生成，包括趋势分析、异常检测和预测模型
        </p>
      </div>
    </div>
  );
};

export default AIInsights;
