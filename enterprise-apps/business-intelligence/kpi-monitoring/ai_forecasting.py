"""
KPI 监控 AI 预测模块
提供智能KPI预测和异常预警
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta


class KPIForecaster:
    """KPI 智能预测器"""

    def __init__(self):
        self.models = {}

    def forecast_kpi(
        self,
        historical_data: pd.DataFrame,
        kpi_name: str,
        days_ahead: int = 7
    ) -> Dict[str, Any]:
        """
        预测 KPI 未来值

        Args:
            historical_data: 历史数据（需包含 date 和 kpi 值列）
            kpi_name: KPI 名称
            days_ahead: 预测天数

        Returns:
            预测结果
        """
        # 数据准备
        df = historical_data.copy()

        if kpi_name not in df.columns:
            return {'error': f'KPI {kpi_name} not found'}

        df = df.sort_values('date')
        values = df[kpi_name].values

        # 简单指数平滑
        alpha = 0.3  # 平滑系数
        forecast_values = []
        last_value = values[-1]

        # 计算趋势
        recent_trend = 0
        if len(values) >= 7:
            recent_trend = (values[-1] - values[-7]) / 7

        for i in range(days_ahead):
            # 指数平滑 + 趋势
            forecast = last_value + recent_trend * (i + 1)
            forecast_values.append(forecast)

        # 生成日期
        last_date = df['date'].max()
        forecast_dates = pd.date_range(
            start=last_date + timedelta(days=1),
            periods=days_ahead,
            freq='D'
        )

        # 计算置信区间（基于历史波动）
        std = np.std(values)
        lower_bounds = [v - 1.96 * std for v in forecast_values]
        upper_bounds = [v + 1.96 * std for v in forecast_values]

        forecast_df = pd.DataFrame({
            'date': forecast_dates,
            'forecast': forecast_values,
            'lower_bound': lower_bounds,
            'upper_bound': upper_bounds
        })

        return {
            'forecast': forecast_df,
            'trend': 'increasing' if recent_trend > 0 else 'decreasing' if recent_trend < 0 else 'stable',
            'trend_strength': abs(recent_trend),
            'confidence': 0.95,
            'method': 'Exponential Smoothing'
        }

    def detect_kpi_anomalies(
        self,
        data: pd.DataFrame,
        kpi_name: str,
        threshold: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """
        检测 KPI 异常

        Args:
            data: KPI 数据
            kpi_name: KPI 名称
            threshold: 阈值配置 {'warning': x, 'critical': y}

        Returns:
            异常列表
        """
        anomalies = []

        if kpi_name not in data.columns:
            return anomalies

        for idx, row in data.iterrows():
            value = row[kpi_name]

            # 检查是否低于临界值
            if 'critical' in threshold and value < threshold['critical']:
                anomalies.append({
                    'date': row.get('date', idx),
                    'kpi': kpi_name,
                    'value': value,
                    'threshold': threshold['critical'],
                    'severity': 'critical',
                    'message': f'{kpi_name} 严重低于预期 ({value:.2f} < {threshold["critical"]:.2f})'
                })

            # 检查是否低于警告值
            elif 'warning' in threshold and value < threshold['warning']:
                anomalies.append({
                    'date': row.get('date', idx),
                    'kpi': kpi_name,
                    'value': value,
                    'threshold': threshold['warning'],
                    'severity': 'warning',
                    'message': f'{kpi_name} 低于预期 ({value:.2f} < {threshold["warning"]:.2f})'
                })

        return anomalies

    def generate_kpi_insights(
        self,
        data: pd.DataFrame,
        kpi_configs: Dict[str, Dict]
    ) -> List[str]:
        """
        生成 KPI 洞察

        Args:
            data: KPI 数据
            kpi_configs: KPI 配置字典

        Returns:
            洞察列表
        """
        insights = []

        for kpi_name, config in kpi_configs.items():
            if kpi_name not in data.columns:
                continue

            current_value = data[kpi_name].iloc[-1]
            target = config.get('target', 0)

            # 与目标对比
            if target > 0:
                achievement = (current_value / target * 100)
                if achievement >= 100:
                    insights.append(f"✅ {kpi_name} 已达成目标 ({achievement:.1f}%)")
                elif achievement >= 80:
                    insights.append(f"⚠️ {kpi_name} 接近目标 ({achievement:.1f}%)")
                else:
                    insights.append(f"❌ {kpi_name} 距离目标较远 ({achievement:.1f}%)")

            # 趋势分析
            if len(data) >= 7:
                week_ago = data[kpi_name].iloc[-7]
                change = ((current_value - week_ago) / week_ago * 100) if week_ago != 0 else 0

                if abs(change) > 10:
                    direction = "上升" if change > 0 else "下降"
                    insights.append(f"📊 {kpi_name} 周环比{direction} {abs(change):.1f}%")

        return insights

    def predict_threshold_breach(
        self,
        forecast_data: pd.DataFrame,
        kpi_name: str,
        threshold: float,
        direction: str = 'below'
    ) -> Optional[Dict[str, Any]]:
        """
        预测何时会突破阈值

        Args:
            forecast_data: 预测数据
            kpi_name: KPI 名称
            threshold: 阈值
            direction: 方向 ('below' 或 'above')

        Returns:
            预警信息
        """
        if 'forecast' not in forecast_data.columns:
            return None

        for idx, row in forecast_data.iterrows():
            value = row['forecast']

            if direction == 'below' and value < threshold:
                return {
                    'date': row['date'],
                    'predicted_value': value,
                    'threshold': threshold,
                    'days_until': (row['date'] - datetime.now()).days,
                    'message': f'预计 {row["date"].strftime("%Y-%m-%d")} {kpi_name} 将低于阈值'
                }
            elif direction == 'above' and value > threshold:
                return {
                    'date': row['date'],
                    'predicted_value': value,
                    'threshold': threshold,
                    'days_until': (row['date'] - datetime.now()).days,
                    'message': f'预计 {row["date"].strftime("%Y-%m-%d")} {kpi_name} 将高于阈值'
                }

        return None


class SmartAlertSystem:
    """智能预警系统"""

    def __init__(self, kpi_configs: Dict[str, Dict]):
        self.kpi_configs = kpi_configs
        self.alert_history = []

    def evaluate_kpi(
        self,
        kpi_name: str,
        current_value: float,
        historical_values: List[float]
    ) -> Dict[str, Any]:
        """
        评估 KPI 状态

        Args:
            kpi_name: KPI 名称
            current_value: 当前值
            historical_values: 历史值列表

        Returns:
            评估结果
        """
        if kpi_name not in self.kpi_configs:
            return {'status': 'unknown'}

        config = self.kpi_configs[kpi_name]
        target = config.get('target', 0)
        warning = config.get('warning', target * 0.8)
        critical = config.get('critical', target * 0.6)

        # 确定状态
        if current_value >= target:
            status = 'excellent'
            color = 'green'
        elif current_value >= warning:
            status = 'good'
            color = 'lightgreen'
        elif current_value >= critical:
            status = 'warning'
            color = 'orange'
        else:
            status = 'critical'
            color = 'red'

        # 计算趋势
        if len(historical_values) >= 2:
            recent_trend = current_value - historical_values[-2]
            trend_direction = 'up' if recent_trend > 0 else 'down' if recent_trend < 0 else 'stable'
        else:
            trend_direction = 'stable'

        return {
            'kpi': kpi_name,
            'value': current_value,
            'target': target,
            'status': status,
            'color': color,
            'trend': trend_direction,
            'achievement': (current_value / target * 100) if target > 0 else 0
        }

    def should_alert(
        self,
        evaluation: Dict[str, Any],
        previous_status: Optional[str] = None
    ) -> bool:
        """
        判断是否应该发送警报

        Args:
            evaluation: 评估结果
            previous_status: 之前的状态

        Returns:
            是否应该警报
        """
        current_status = evaluation['status']

        # 状态恶化时警报
        status_priority = {
            'excellent': 4,
            'good': 3,
            'warning': 2,
            'critical': 1
        }

        if previous_status:
            if status_priority.get(current_status, 0) < status_priority.get(previous_status, 0):
                return True

        # 严重状态时警报
        if current_status == 'critical':
            return True

        return False
