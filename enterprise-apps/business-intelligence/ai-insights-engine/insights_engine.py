"""
AI 洞察引擎核心模块
提供自动异常检测、趋势分析、相关性发现和智能洞察生成
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from scipy import stats
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.cluster import DBSCAN, KMeans
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')


class InsightsEngine:
    """AI 洞察引擎"""

    def __init__(self, config: Optional[Dict] = None):
        """初始化洞察引擎"""
        self.config = config or self._default_config()
        self.scaler = StandardScaler()

    def _default_config(self) -> Dict:
        """默认配置"""
        return {
            'anomaly_detection': {
                'zscore_threshold': 3.0,
                'iqr_multiplier': 1.5,
                'isolation_forest_contamination': 0.1,
                'lof_neighbors': 20
            },
            'trend_detection': {
                'min_r_squared': 0.5,
                'min_p_value': 0.05,
                'min_duration': 7
            },
            'correlation': {
                'min_correlation': 0.5,
                'method': 'pearson'
            },
            'clustering': {
                'n_clusters': 3,
                'min_cluster_size': 5
            }
        }

    # ==================== 异常检测 ====================

    def detect_anomalies(
        self,
        data: pd.DataFrame,
        column: str,
        method: str = 'zscore',
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        检测异常值

        Args:
            data: 输入数据
            column: 要检测的列名
            method: 检测方法 ('zscore', 'iqr', 'isolation_forest', 'lof')
            **kwargs: 额外参数

        Returns:
            异常点列表
        """
        if column not in data.columns:
            raise ValueError(f"列 '{column}' 不存在")

        if method == 'zscore':
            return self._detect_anomalies_zscore(data, column, **kwargs)
        elif method == 'iqr':
            return self._detect_anomalies_iqr(data, column, **kwargs)
        elif method == 'isolation_forest':
            return self._detect_anomalies_isolation_forest(data, column, **kwargs)
        elif method == 'lof':
            return self._detect_anomalies_lof(data, column, **kwargs)
        else:
            raise ValueError(f"未知的检测方法: {method}")

    def _detect_anomalies_zscore(
        self,
        data: pd.DataFrame,
        column: str,
        threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """Z-Score 异常检测"""
        threshold = threshold or self.config['anomaly_detection']['zscore_threshold']

        values = data[column].values
        mean = np.mean(values)
        std = np.std(values)

        if std == 0:
            return []

        z_scores = np.abs((values - mean) / std)
        anomaly_mask = z_scores > threshold

        anomalies = []
        for idx in np.where(anomaly_mask)[0]:
            anomalies.append({
                'index': int(idx),
                'value': float(values[idx]),
                'z_score': float(z_scores[idx]),
                'deviation': float((values[idx] - mean) / mean * 100),
                'method': 'zscore',
                'severity': self._calculate_severity(z_scores[idx], threshold)
            })

        return anomalies

    def _detect_anomalies_iqr(
        self,
        data: pd.DataFrame,
        column: str,
        multiplier: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """IQR (四分位距) 异常检测"""
        multiplier = multiplier or self.config['anomaly_detection']['iqr_multiplier']

        values = data[column].values
        q1 = np.percentile(values, 25)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1

        lower_bound = q1 - multiplier * iqr
        upper_bound = q3 + multiplier * iqr

        anomaly_mask = (values < lower_bound) | (values > upper_bound)

        anomalies = []
        for idx in np.where(anomaly_mask)[0]:
            value = values[idx]
            if value < lower_bound:
                distance = (lower_bound - value) / iqr
            else:
                distance = (value - upper_bound) / iqr

            anomalies.append({
                'index': int(idx),
                'value': float(value),
                'iqr_distance': float(distance),
                'lower_bound': float(lower_bound),
                'upper_bound': float(upper_bound),
                'method': 'iqr',
                'severity': self._calculate_severity(distance, multiplier)
            })

        return anomalies

    def _detect_anomalies_isolation_forest(
        self,
        data: pd.DataFrame,
        column: str,
        contamination: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """Isolation Forest 异常检测"""
        contamination = contamination or self.config['anomaly_detection']['isolation_forest_contamination']

        values = data[[column]].values

        # 训练 Isolation Forest
        iso_forest = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        predictions = iso_forest.fit_predict(values)
        scores = iso_forest.score_samples(values)

        anomalies = []
        for idx, (pred, score) in enumerate(zip(predictions, scores)):
            if pred == -1:  # 异常点
                anomalies.append({
                    'index': int(idx),
                    'value': float(values[idx][0]),
                    'anomaly_score': float(-score),  # 负分数，越大越异常
                    'method': 'isolation_forest',
                    'severity': self._calculate_severity(-score, 0.5)
                })

        return anomalies

    def _detect_anomalies_lof(
        self,
        data: pd.DataFrame,
        column: str,
        n_neighbors: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Local Outlier Factor 异常检测"""
        n_neighbors = n_neighbors or self.config['anomaly_detection']['lof_neighbors']

        values = data[[column]].values

        # 训练 LOF
        lof = LocalOutlierFactor(
            n_neighbors=min(n_neighbors, len(values) - 1),
            contamination='auto'
        )
        predictions = lof.fit_predict(values)
        scores = -lof.negative_outlier_factor_

        anomalies = []
        for idx, (pred, score) in enumerate(zip(predictions, scores)):
            if pred == -1:  # 异常点
                anomalies.append({
                    'index': int(idx),
                    'value': float(values[idx][0]),
                    'lof_score': float(score),
                    'method': 'lof',
                    'severity': self._calculate_severity(score, 1.5)
                })

        return anomalies

    def _calculate_severity(self, score: float, threshold: float) -> str:
        """计算异常严重程度"""
        ratio = score / threshold
        if ratio > 2:
            return 'critical'
        elif ratio > 1.5:
            return 'high'
        elif ratio > 1:
            return 'medium'
        else:
            return 'low'

    # ==================== 趋势检测 ====================

    def detect_trends(
        self,
        data: pd.DataFrame,
        column: str,
        min_r_squared: Optional[float] = None,
        min_p_value: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        检测数据趋势

        Args:
            data: 输入数据
            column: 要分析的列名
            min_r_squared: 最小 R² 值
            min_p_value: 最大 p 值

        Returns:
            趋势信息列表
        """
        min_r_squared = min_r_squared or self.config['trend_detection']['min_r_squared']
        min_p_value = min_p_value or self.config['trend_detection']['min_p_value']

        if column not in data.columns:
            raise ValueError(f"列 '{column}' 不存在")

        values = data[column].values
        x = np.arange(len(values))

        # 线性回归
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, values)
        r_squared = r_value ** 2

        trends = []

        # 检查是否显著
        if r_squared >= min_r_squared and p_value <= min_p_value:
            # 计算变化率
            start_value = values[0]
            end_value = values[-1]
            change_percent = ((end_value - start_value) / start_value * 100) if start_value != 0 else 0

            # 确定方向
            if slope > 0:
                direction = 'increasing'
                emoji = '📈'
            elif slope < 0:
                direction = 'decreasing'
                emoji = '📉'
            else:
                direction = 'stable'
                emoji = '➡️'

            trends.append({
                'column': column,
                'direction': direction,
                'emoji': emoji,
                'slope': float(slope),
                'intercept': float(intercept),
                'r_squared': float(r_squared),
                'p_value': float(p_value),
                'change_percent': float(change_percent),
                'strength': 'strong' if r_squared > 0.8 else 'moderate' if r_squared > 0.6 else 'weak',
                'confidence': float(1 - p_value)
            })

        return trends

    def detect_seasonality(
        self,
        data: pd.DataFrame,
        column: str,
        period: int = 7
    ) -> Dict[str, Any]:
        """
        检测季节性模式

        Args:
            data: 输入数据
            column: 要分析的列名
            period: 周期长度（默认7天）

        Returns:
            季节性信息
        """
        values = data[column].values

        if len(values) < period * 2:
            return {'has_seasonality': False, 'reason': '数据长度不足'}

        # 简单的季节性检测：计算周期性相关
        n_periods = len(values) // period
        reshaped = values[:n_periods * period].reshape(n_periods, period)

        # 计算每个周期位置的平均值和标准差
        period_means = np.mean(reshaped, axis=0)
        period_stds = np.std(reshaped, axis=0)
        overall_std = np.std(values)

        # 如果周期内的变异显著大于周期间的变异，则存在季节性
        seasonality_strength = np.std(period_means) / overall_std if overall_std > 0 else 0

        has_seasonality = seasonality_strength > 0.3

        return {
            'has_seasonality': bool(has_seasonality),
            'period': int(period),
            'strength': float(seasonality_strength),
            'pattern': period_means.tolist(),
            'interpretation': self._interpret_seasonality(period, period_means)
        }

    def _interpret_seasonality(self, period: int, pattern: np.ndarray) -> str:
        """解释季节性模式"""
        max_idx = np.argmax(pattern)
        min_idx = np.argmin(pattern)

        if period == 7:
            days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
            return f"最高: {days[max_idx]}, 最低: {days[min_idx]}"
        elif period == 30 or period == 31:
            return f"最高: 第{max_idx+1}天, 最低: 第{min_idx+1}天"
        else:
            return f"周期{period}: 最高位置{max_idx}, 最低位置{min_idx}"

    # ==================== 相关性分析 ====================

    def find_correlations(
        self,
        data: pd.DataFrame,
        threshold: Optional[float] = None,
        method: str = 'pearson'
    ) -> List[Dict[str, Any]]:
        """
        发现变量间的相关性

        Args:
            data: 输入数据
            threshold: 最小相关系数阈值
            method: 相关性方法 ('pearson', 'spearman', 'kendall')

        Returns:
            相关性列表
        """
        threshold = threshold or self.config['correlation']['min_correlation']

        # 只选择数值列
        numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()

        if len(numeric_cols) < 2:
            return []

        # 计算相关性矩阵
        corr_matrix = data[numeric_cols].corr(method=method)

        correlations = []

        # 提取显著相关性
        for i, col1 in enumerate(numeric_cols):
            for j, col2 in enumerate(numeric_cols):
                if i < j:  # 避免重复和自相关
                    corr = corr_matrix.loc[col1, col2]
                    if abs(corr) >= threshold:
                        correlations.append({
                            'variable1': col1,
                            'variable2': col2,
                            'correlation': float(corr),
                            'strength': self._correlation_strength(abs(corr)),
                            'direction': 'positive' if corr > 0 else 'negative',
                            'interpretation': self._interpret_correlation(col1, col2, corr)
                        })

        # 按相关性强度排序
        correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)

        return correlations

    def _correlation_strength(self, corr: float) -> str:
        """相关性强度分类"""
        if corr >= 0.8:
            return 'very_strong'
        elif corr >= 0.6:
            return 'strong'
        elif corr >= 0.4:
            return 'moderate'
        else:
            return 'weak'

    def _interpret_correlation(self, var1: str, var2: str, corr: float) -> str:
        """解释相关性"""
        direction = "正相关" if corr > 0 else "负相关"
        strength = self._correlation_strength(abs(corr))

        strength_cn = {
            'very_strong': '非常强',
            'strong': '强',
            'moderate': '中等',
            'weak': '弱'
        }

        return f"{var1} 与 {var2} 呈现{strength_cn[strength]}{direction} (r={corr:.2f})"

    # ==================== 模式发现 ====================

    def discover_patterns(
        self,
        data: pd.DataFrame,
        method: str = 'kmeans',
        **kwargs
    ) -> Dict[str, Any]:
        """
        发现数据模式

        Args:
            data: 输入数据
            method: 聚类方法 ('kmeans', 'dbscan')
            **kwargs: 额外参数

        Returns:
            模式信息
        """
        # 只使用数值列
        numeric_data = data.select_dtypes(include=[np.number])

        if numeric_data.empty:
            return {'patterns': [], 'error': '没有数值列可供分析'}

        # 标准化数据
        scaled_data = self.scaler.fit_transform(numeric_data)

        if method == 'kmeans':
            return self._kmeans_clustering(scaled_data, numeric_data.columns, **kwargs)
        elif method == 'dbscan':
            return self._dbscan_clustering(scaled_data, numeric_data.columns, **kwargs)
        else:
            raise ValueError(f"未知的聚类方法: {method}")

    def _kmeans_clustering(
        self,
        scaled_data: np.ndarray,
        columns: List[str],
        n_clusters: Optional[int] = None
    ) -> Dict[str, Any]:
        """K-Means 聚类"""
        n_clusters = n_clusters or self.config['clustering']['n_clusters']
        n_clusters = min(n_clusters, len(scaled_data))  # 确保不超过数据点数

        if n_clusters < 2:
            return {'patterns': [], 'error': '数据点太少，无法聚类'}

        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(scaled_data)

        # 分析每个簇
        patterns = []
        for cluster_id in range(n_clusters):
            mask = labels == cluster_id
            cluster_size = np.sum(mask)

            if cluster_size > 0:
                # 计算簇中心在原始尺度的值
                cluster_center = kmeans.cluster_centers_[cluster_id]

                patterns.append({
                    'cluster_id': int(cluster_id),
                    'size': int(cluster_size),
                    'percentage': float(cluster_size / len(labels) * 100),
                    'center': cluster_center.tolist(),
                    'description': self._describe_cluster(cluster_id, cluster_center, columns)
                })

        return {
            'method': 'kmeans',
            'n_clusters': n_clusters,
            'patterns': patterns,
            'labels': labels.tolist()
        }

    def _dbscan_clustering(
        self,
        scaled_data: np.ndarray,
        columns: List[str],
        eps: float = 0.5,
        min_samples: int = 5
    ) -> Dict[str, Any]:
        """DBSCAN 聚类"""
        dbscan = DBSCAN(eps=eps, min_samples=min_samples)
        labels = dbscan.fit_predict(scaled_data)

        unique_labels = set(labels)
        patterns = []

        for cluster_id in unique_labels:
            if cluster_id == -1:  # 噪声点
                continue

            mask = labels == cluster_id
            cluster_size = np.sum(mask)
            cluster_data = scaled_data[mask]
            cluster_center = np.mean(cluster_data, axis=0)

            patterns.append({
                'cluster_id': int(cluster_id),
                'size': int(cluster_size),
                'percentage': float(cluster_size / len(labels) * 100),
                'center': cluster_center.tolist(),
                'description': self._describe_cluster(cluster_id, cluster_center, columns)
            })

        noise_count = np.sum(labels == -1)

        return {
            'method': 'dbscan',
            'n_clusters': len(patterns),
            'patterns': patterns,
            'noise_points': int(noise_count),
            'labels': labels.tolist()
        }

    def _describe_cluster(
        self,
        cluster_id: int,
        center: np.ndarray,
        columns: List[str]
    ) -> str:
        """描述簇的特征"""
        # 找出最显著的特征（距离0最远的）
        abs_center = np.abs(center)
        top_features_idx = np.argsort(abs_center)[-2:]  # 取前2个最显著特征

        features = []
        for idx in top_features_idx:
            value = center[idx]
            col = columns[idx]
            level = "高" if value > 0.5 else "低" if value < -0.5 else "中"
            features.append(f"{level}{col}")

        return f"簇 {cluster_id}: {', '.join(features)}"

    # ==================== 综合洞察生成 ====================

    def generate_insights(
        self,
        data: pd.DataFrame,
        min_importance: int = 1,
        max_insights: int = 20
    ) -> List[Dict[str, Any]]:
        """
        生成综合洞察

        Args:
            data: 输入数据
            min_importance: 最小重要性（1-5）
            max_insights: 最大洞察数量

        Returns:
            洞察列表
        """
        insights = []

        # 获取所有数值列
        numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()

        if not numeric_cols:
            return insights

        # 1. 异常洞察
        for col in numeric_cols:
            try:
                anomalies = self.detect_anomalies(data, col, method='isolation_forest')
                if anomalies:
                    # 只报告最严重的异常
                    critical_anomalies = [a for a in anomalies if a['severity'] in ['critical', 'high']]
                    if critical_anomalies:
                        importance = 5 if len(critical_anomalies) > 3 else 4
                        insights.append({
                            'type': 'anomaly',
                            'title': f'{col} 发现异常值',
                            'description': f'在 {col} 中检测到 {len(anomalies)} 个异常数据点，其中 {len(critical_anomalies)} 个为高严重度异常',
                            'importance': importance,
                            'details': critical_anomalies[:3],  # 只显示前3个
                            'recommendation': f'建议检查 {col} 的数据来源和处理流程，调查异常原因'
                        })
            except Exception:
                pass

        # 2. 趋势洞察
        for col in numeric_cols:
            try:
                trends = self.detect_trends(data, col)
                if trends:
                    trend = trends[0]
                    importance = 4 if trend['strength'] == 'strong' else 3

                    insights.append({
                        'type': 'trend',
                        'title': f'{col} 呈现{trend["direction"]}趋势',
                        'description': f'{col} 显示出{trend["strength"]}的{trend["direction"]}趋势，变化幅度为 {trend["change_percent"]:.1f}%',
                        'importance': importance,
                        'details': trend,
                        'recommendation': self._trend_recommendation(col, trend)
                    })
            except Exception:
                pass

        # 3. 相关性洞察
        try:
            correlations = self.find_correlations(data, threshold=0.6)
            for corr in correlations[:3]:  # 只取前3个最强相关性
                importance = 4 if corr['strength'] == 'very_strong' else 3

                insights.append({
                    'type': 'correlation',
                    'title': f'{corr["variable1"]} 与 {corr["variable2"]} 高度相关',
                    'description': corr['interpretation'],
                    'importance': importance,
                    'details': corr,
                    'recommendation': f'考虑利用 {corr["variable1"]} 和 {corr["variable2"]} 的关系进行预测或优化'
                })
        except Exception:
            pass

        # 4. 模式洞察
        try:
            patterns = self.discover_patterns(data, method='kmeans')
            if patterns.get('patterns'):
                insights.append({
                    'type': 'pattern',
                    'title': f'识别出 {len(patterns["patterns"])} 个数据群组',
                    'description': f'数据可以分为 {len(patterns["patterns"])} 个不同的群组，每个群组具有独特的特征',
                    'importance': 3,
                    'details': patterns,
                    'recommendation': '针对不同群组制定差异化策略'
                })
        except Exception:
            pass

        # 按重要性排序并过滤
        insights = [i for i in insights if i['importance'] >= min_importance]
        insights.sort(key=lambda x: x['importance'], reverse=True)

        return insights[:max_insights]

    def _trend_recommendation(self, column: str, trend: Dict) -> str:
        """生成趋势建议"""
        if trend['direction'] == 'increasing':
            if 'revenue' in column.lower() or 'sales' in column.lower():
                return f'继续保持当前策略，{column} 增长态势良好'
            elif 'cost' in column.lower() or 'expense' in column.lower():
                return f'关注 {column} 的上升趋势，考虑成本控制措施'
            else:
                return f'监控 {column} 的增长，确保可持续性'
        elif trend['direction'] == 'decreasing':
            if 'revenue' in column.lower() or 'sales' in column.lower():
                return f'警告：{column} 呈下降趋势，需要及时采取措施'
            elif 'cost' in column.lower() or 'expense' in column.lower():
                return f'{column} 下降是积极信号，继续优化'
            else:
                return f'分析 {column} 下降的原因，评估影响'
        else:
            return f'{column} 保持稳定'
