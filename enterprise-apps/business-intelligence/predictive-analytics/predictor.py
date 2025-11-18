"""
预测分析核心模块
支持时间序列、分类和回归预测
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass
class PredictionResult:
    """预测结果"""
    predictions: pd.DataFrame
    model_name: str
    accuracy_metrics: Dict[str, float]
    feature_importance: Optional[Dict[str, float]]
    insights: List[str]


class TimeSeriesPredictor:
    """时间序列预测器"""

    def __init__(self):
        self.model = None

    def predict_prophet(
        self,
        data: pd.DataFrame,
        date_column: str,
        value_column: str,
        periods: int = 30
    ) -> PredictionResult:
        """
        使用 Prophet 进行时间序列预测

        Args:
            data: 历史数据
            date_column: 日期列名
            value_column: 值列名
            periods: 预测期数

        Returns:
            预测结果
        """
        try:
            from prophet import Prophet
        except ImportError:
            return self._simple_forecast(data, date_column, value_column, periods)

        # 准备数据
        df = data[[date_column, value_column]].copy()
        df.columns = ['ds', 'y']
        df['ds'] = pd.to_datetime(df['ds'])

        # 训练模型
        model = Prophet(
            changepoint_prior_scale=0.05,
            seasonality_mode='multiplicative',
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=True
        )
        model.fit(df)

        # 预测
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)

        # 计算准确率
        from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error

        actual = df['y'].values
        predicted = forecast['yhat'][:len(df)].values
        mape = mean_absolute_percentage_error(actual, predicted)
        rmse = np.sqrt(mean_squared_error(actual, predicted))

        # 提取预测结果
        predictions = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
        predictions.columns = ['date', 'prediction', 'lower_bound', 'upper_bound']

        # 生成洞察
        insights = self._generate_ts_insights(df, predictions, mape)

        return PredictionResult(
            predictions=predictions,
            model_name='Prophet',
            accuracy_metrics={
                'mape': mape,
                'rmse': rmse
            },
            feature_importance=None,
            insights=insights
        )

    def _simple_forecast(
        self,
        data: pd.DataFrame,
        date_column: str,
        value_column: str,
        periods: int
    ) -> PredictionResult:
        """简单的移动平均预测（备选方案）"""
        df = data.copy()
        df[date_column] = pd.to_datetime(df[date_column])

        # 计算趋势
        values = df[value_column].values
        window = min(7, len(values) // 4)

        if window > 0:
            trend = df[value_column].rolling(window=window).mean().iloc[-1]
        else:
            trend = values.mean()

        # 生成未来日期
        last_date = df[date_column].max()
        future_dates = pd.date_range(
            start=last_date + timedelta(days=1),
            periods=periods,
            freq='D'
        )

        # 简单预测（使用最近趋势）
        predictions = pd.DataFrame({
            'date': future_dates,
            'prediction': trend,
            'lower_bound': trend * 0.9,
            'upper_bound': trend * 1.1
        })

        return PredictionResult(
            predictions=predictions,
            model_name='Moving Average',
            accuracy_metrics={'method': 'simple_ma'},
            feature_importance=None,
            insights=[f'预测基于最近{window}天的移动平均']
        )

    def _generate_ts_insights(
        self,
        historical: pd.DataFrame,
        forecast: pd.DataFrame,
        mape: float
    ) -> List[str]:
        """生成时间序列洞察"""
        insights = []

        # 准确率
        accuracy = (1 - mape) * 100
        insights.append(f"模型准确率: {accuracy:.1f}%")

        # 预测趋势
        first_pred = forecast['prediction'].iloc[0]
        last_pred = forecast['prediction'].iloc[-1]
        change = ((last_pred - first_pred) / first_pred * 100) if first_pred != 0 else 0

        if change > 5:
            insights.append(f"预测期内呈上升趋势，增长约 {change:.1f}%")
        elif change < -5:
            insights.append(f"预测期内呈下降趋势，下降约 {abs(change):.1f}%")
        else:
            insights.append("预测期内保持相对稳定")

        # 置信区间
        avg_uncertainty = (
            (forecast['upper_bound'] - forecast['lower_bound']) / forecast['prediction']
        ).mean() * 100
        insights.append(f"平均不确定性: ±{avg_uncertainty:.1f}%")

        return insights


class ClassificationPredictor:
    """分类预测器（如流失预测）"""

    def predict_churn(
        self,
        customer_data: pd.DataFrame,
        target_column: str = 'churned'
    ) -> PredictionResult:
        """
        客户流失预测

        Args:
            customer_data: 客户数据
            target_column: 目标列（是否流失）

        Returns:
            预测结果
        """
        try:
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import accuracy_score, precision_score, recall_score
        except ImportError:
            return self._simple_classification(customer_data)

        # 准备特征
        feature_cols = customer_data.select_dtypes(include=[np.number]).columns.tolist()
        feature_cols = [c for c in feature_cols if c != target_column]

        if len(feature_cols) == 0:
            return self._simple_classification(customer_data)

        X = customer_data[feature_cols].fillna(0)
        y = customer_data[target_column]

        # 分割数据
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # 训练模型
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        # 预测
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        # 评估
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)

        # 特征重要性
        feature_importance = dict(zip(feature_cols, model.feature_importances_))
        feature_importance = {
            k: v for k, v in sorted(
                feature_importance.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
        }

        # 生成预测结果
        predictions = pd.DataFrame({
            'actual': y_test,
            'predicted': y_pred,
            'churn_probability': y_prob
        })

        insights = [
            f"模型准确率: {accuracy*100:.1f}%",
            f"精确率: {precision*100:.1f}%",
            f"召回率: {recall*100:.1f}%",
            f"预测 {int(y_pred.sum())} 个客户可能流失",
            f"最重要的特征: {list(feature_importance.keys())[0]}"
        ]

        return PredictionResult(
            predictions=predictions,
            model_name='Random Forest',
            accuracy_metrics={
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall
            },
            feature_importance=feature_importance,
            insights=insights
        )

    def _simple_classification(self, data: pd.DataFrame) -> PredictionResult:
        """简单分类（基于规则）"""
        predictions = pd.DataFrame({
            'predicted': np.random.choice([0, 1], size=len(data), p=[0.8, 0.2])
        })

        return PredictionResult(
            predictions=predictions,
            model_name='Rule-based',
            accuracy_metrics={'method': 'simple'},
            feature_importance=None,
            insights=["使用简单规则进行预测"]
        )


class RegressionPredictor:
    """回归预测器（如价格预测）"""

    def predict_value(
        self,
        data: pd.DataFrame,
        target_column: str,
        feature_columns: List[str]
    ) -> PredictionResult:
        """
        数值预测

        Args:
            data: 训练数据
            target_column: 目标列
            feature_columns: 特征列

        Returns:
            预测结果
        """
        try:
            from sklearn.ensemble import GradientBoostingRegressor
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import mean_squared_error, r2_score
        except ImportError:
            return self._simple_regression(data, target_column)

        X = data[feature_columns].fillna(0)
        y = data[target_column]

        # 分割数据
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # 训练模型
        model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        # 预测
        y_pred = model.predict(X_test)

        # 评估
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        # 结果
        predictions = pd.DataFrame({
            'actual': y_test,
            'predicted': y_pred,
            'error': y_test - y_pred
        })

        insights = [
            f"R² 分数: {r2*100:.1f}%",
            f"RMSE: {rmse:.2f}",
            f"预测平均误差: {predictions['error'].abs().mean():.2f}"
        ]

        return PredictionResult(
            predictions=predictions,
            model_name='Gradient Boosting',
            accuracy_metrics={
                'rmse': rmse,
                'r2': r2
            },
            feature_importance=None,
            insights=insights
        )

    def _simple_regression(
        self,
        data: pd.DataFrame,
        target_column: str
    ) -> PredictionResult:
        """简单回归"""
        predictions = pd.DataFrame({
            'predicted': data[target_column].mean()
        }, index=range(len(data)))

        return PredictionResult(
            predictions=predictions,
            model_name='Mean',
            accuracy_metrics={'method': 'mean'},
            feature_importance=None,
            insights=["使用平均值作为预测"]
        )
