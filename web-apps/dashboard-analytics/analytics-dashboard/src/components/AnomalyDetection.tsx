import { useEffect, useState } from 'react';
import { FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import { detectAnomalies, Anomaly } from '../services/aiService';
import './AnomalyDetection.css';

interface AnomalyDetectionProps {
  data: number[];
  labels: string[];
  metricName: string;
}

const AnomalyDetection = ({ data, labels, metricName }: AnomalyDetectionProps) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const detected = detectAnomalies(data, 2);
      setAnomalies(detected);
      setIsAnalyzing(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [data]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未知';
    }
  };

  if (isAnalyzing) {
    return (
      <div className="anomaly-container">
        <div className="anomaly-header">
          <h3>🔍 异常检测分析</h3>
          <span className="analyzing-badge">分析中...</span>
        </div>
        <div className="anomaly-loading">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anomaly-container">
      <div className="anomaly-header">
        <h3>🔍 异常检测分析 - {metricName}</h3>
        <span className={`status-badge ${anomalies.length > 0 ? 'has-anomalies' : 'no-anomalies'}`}>
          {anomalies.length > 0 ? `发现 ${anomalies.length} 个异常` : '未发现异常'}
        </span>
      </div>

      {anomalies.length === 0 ? (
        <div className="no-anomalies">
          <FaCheckCircle size={48} color="#10b981" />
          <p>数据正常，未检测到异常波动</p>
          <span className="info-text">
            所有数据点都在预期范围内 (±2σ)
          </span>
        </div>
      ) : (
        <div className="anomalies-list">
          {anomalies.map((anomaly, index) => (
            <div key={index} className="anomaly-item">
              <div
                className="anomaly-indicator"
                style={{ backgroundColor: getSeverityColor(anomaly.severity) }}
              >
                <FaExclamationCircle size={20} color="white" />
              </div>
              <div className="anomaly-content">
                <div className="anomaly-title">
                  <span className="anomaly-period">{labels[anomaly.index]}</span>
                  <span
                    className="severity-badge"
                    style={{ backgroundColor: getSeverityColor(anomaly.severity) }}
                  >
                    严重度: {getSeverityLabel(anomaly.severity)}
                  </span>
                </div>
                <div className="anomaly-details">
                  <div className="detail-item">
                    <span className="detail-label">实际值:</span>
                    <span className="detail-value actual">
                      ${Math.round(anomaly.value).toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">预期值:</span>
                    <span className="detail-value expected">
                      ${Math.round(anomaly.expected).toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">偏差:</span>
                    <span
                      className={`detail-value deviation ${
                        anomaly.deviation > 0 ? 'positive' : 'negative'
                      }`}
                    >
                      {anomaly.deviation > 0 ? '+' : ''}
                      {Math.round(anomaly.deviation)}%
                    </span>
                  </div>
                </div>
                <div className="anomaly-explanation">
                  {anomaly.deviation > 0 ? (
                    <p>
                      📈 该期数据显著高于平均水平，可能是促销活动、季节性因素或突发事件导致
                    </p>
                  ) : (
                    <p>
                      📉 该期数据显著低于平均水平，建议调查是否存在系统问题或市场变化
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="anomaly-footer">
        <p>
          💡 使用 Z-score 统计方法检测异常值 • 阈值: ±2σ (标准差)
        </p>
      </div>
    </div>
  );
};

export default AnomalyDetection;
