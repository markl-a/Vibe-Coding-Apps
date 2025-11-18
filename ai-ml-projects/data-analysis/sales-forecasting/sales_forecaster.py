"""
Sales Forecasting with Multiple Models
支持 ARIMA, Prophet, LSTM, XGBoost 等多种时间序列预测方法
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Optional, Tuple, Any, Union
import warnings
warnings.filterwarnings('ignore')

# 导入时间序列相关库
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, mean_absolute_percentage_error

# 尝试导入 ARIMA
try:
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.tsa.stattools import adfuller
    from statsmodels.tsa.seasonal import seasonal_decompose
    ARIMA_AVAILABLE = True
except ImportError:
    ARIMA_AVAILABLE = False

# 尝试导入 Prophet
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False

# 尝试导入 XGBoost
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False


class SalesForecaster:
    """销售预测系统"""

    def __init__(self, model_type: str = 'arima'):
        """
        初始化销售预测器

        Args:
            model_type: 模型类型 ('arima', 'prophet', 'xgboost', 'lstm')
        """
        self.model_type = model_type
        self.model = None
        self.scaler = MinMaxScaler()
        self.data = None
        self.ts = None
        self.date_column = None
        self.value_column = None
        self.is_fitted = False

    def load_data(
        self,
        data: Union[str, pd.DataFrame],
        date_col: str = 'date',
        value_col: str = 'sales'
    ):
        """
        载入数据

        Args:
            data: CSV文件路径或DataFrame
            date_col: 日期列名
            value_col: 数值列名
        """
        if isinstance(data, str):
            self.data = pd.read_csv(data)
        else:
            self.data = data.copy()

        self.date_column = date_col
        self.value_column = value_col

        # 确保日期列是datetime类型
        self.data[date_col] = pd.to_datetime(self.data[date_col])
        self.data = self.data.sort_values(date_col).reset_index(drop=True)

        # 创建时间序列
        self.ts = self.data.set_index(date_col)[value_col]

        print(f"数据已载入:")
        print(f"  时间跨度: {self.ts.index.min().date()} 到 {self.ts.index.max().date()}")
        print(f"  数据点数: {len(self.ts)}")
        print(f"  平均销售: {self.ts.mean():.2f}")

    def check_stationarity(self) -> Dict[str, Any]:
        """检查时间序列的平稳性"""
        if self.ts is None:
            raise ValueError("请先载入数据")

        if not ARIMA_AVAILABLE:
            print("需要安装 statsmodels 库")
            return {}

        result = adfuller(self.ts.dropna())

        is_stationary = result[1] < 0.05

        print("\nADF 平稳性检定:")
        print(f"  ADF 统计量: {result[0]:.6f}")
        print(f"  p-value: {result[1]:.6f}")
        print(f"  结论: {'平稳' if is_stationary else '非平稳'}")

        return {
            'is_stationary': is_stationary,
            'adf_statistic': result[0],
            'p_value': result[1],
            'critical_values': result[4]
        }

    def decompose_series(self, period: int = 7, model: str = 'additive'):
        """
        分解时间序列

        Args:
            period: 季节性周期
            model: 'additive' 或 'multiplicative'
        """
        if self.ts is None:
            raise ValueError("请先载入数据")

        if not ARIMA_AVAILABLE:
            print("需要安装 statsmodels 库")
            return None

        decomposition = seasonal_decompose(
            self.ts.dropna(),
            model=model,
            period=period,
            extrapolate_trend='freq'
        )

        # 可视化
        fig, axes = plt.subplots(4, 1, figsize=(12, 10))

        decomposition.observed.plot(ax=axes[0], title='原始序列')
        axes[0].set_ylabel('观测值')

        decomposition.trend.plot(ax=axes[1], title='趋势')
        axes[1].set_ylabel('趋势')

        decomposition.seasonal.plot(ax=axes[2], title='季节性')
        axes[2].set_ylabel('季节性')

        decomposition.resid.plot(ax=axes[3], title='残差')
        axes[3].set_ylabel('残差')

        plt.tight_layout()
        plt.show()

        return decomposition

    def train(
        self,
        train_size: float = 0.8,
        **model_params
    ) -> Dict[str, Any]:
        """
        训练模型

        Args:
            train_size: 训练集比例
            **model_params: 模型特定参数

        Returns:
            训练结果
        """
        if self.ts is None:
            raise ValueError("请先载入数据")

        # 分割数据
        train_len = int(len(self.ts) * train_size)
        train_ts = self.ts[:train_len]
        test_ts = self.ts[train_len:]

        print(f"\n训练 {self.model_type.upper()} 模型...")
        print(f"  训练集: {len(train_ts)} 样本")
        print(f"  测试集: {len(test_ts)} 样本")

        # 根据模型类型训练
        if self.model_type == 'arima':
            return self._train_arima(train_ts, test_ts, **model_params)
        elif self.model_type == 'prophet':
            return self._train_prophet(train_ts, test_ts, **model_params)
        elif self.model_type == 'xgboost':
            return self._train_xgboost(train_ts, test_ts, **model_params)
        else:
            raise ValueError(f"不支持的模型类型: {self.model_type}")

    def _train_arima(
        self,
        train_ts: pd.Series,
        test_ts: pd.Series,
        order: Tuple[int, int, int] = (1, 1, 1)
    ) -> Dict[str, Any]:
        """训练ARIMA模型"""
        if not ARIMA_AVAILABLE:
            raise ImportError("需要安装 statsmodels 库")

        self.model = ARIMA(train_ts, order=order)
        fitted_model = self.model.fit()

        # 预测
        forecast = fitted_model.forecast(steps=len(test_ts))

        # 评估
        metrics = self._calculate_metrics(test_ts.values, forecast.values)

        self.is_fitted = True

        print(f"\nARIMA{order} 性能:")
        print(f"  MAE: {metrics['mae']:.2f}")
        print(f"  RMSE: {metrics['rmse']:.2f}")
        print(f"  MAPE: {metrics['mape']:.2f}%")

        return {
            'model': fitted_model,
            'forecast': forecast,
            'metrics': metrics
        }

    def _train_prophet(
        self,
        train_ts: pd.Series,
        test_ts: pd.Series,
        **prophet_params
    ) -> Dict[str, Any]:
        """训练Prophet模型"""
        if not PROPHET_AVAILABLE:
            raise ImportError("需要安装 prophet 库")

        # 准备数据
        train_df = pd.DataFrame({
            'ds': train_ts.index,
            'y': train_ts.values
        })

        # 训练模型
        self.model = Prophet(**prophet_params)
        self.model.fit(train_df)

        # 预测
        future = pd.DataFrame({'ds': test_ts.index})
        forecast = self.model.predict(future)

        # 评估
        metrics = self._calculate_metrics(test_ts.values, forecast['yhat'].values)

        self.is_fitted = True

        print(f"\nProphet 性能:")
        print(f"  MAE: {metrics['mae']:.2f}")
        print(f"  RMSE: {metrics['rmse']:.2f}")
        print(f"  MAPE: {metrics['mape']:.2f}%")

        return {
            'model': self.model,
            'forecast': forecast,
            'metrics': metrics
        }

    def _train_xgboost(
        self,
        train_ts: pd.Series,
        test_ts: pd.Series,
        lookback: int = 7,
        **xgb_params
    ) -> Dict[str, Any]:
        """训练XGBoost模型"""
        if not XGBOOST_AVAILABLE:
            raise ImportError("需要安装 xgboost 库")

        # 创建时间序列特征
        X_train, y_train = self._create_features(train_ts, lookback)
        X_test, y_test = self._create_features(test_ts, lookback)

        # 训练模型
        params = {
            'objective': 'reg:squarederror',
            'n_estimators': 100,
            'max_depth': 6,
            'learning_rate': 0.1,
            **xgb_params
        }

        self.model = xgb.XGBRegressor(**params)
        self.model.fit(X_train, y_train, verbose=False)

        # 预测
        forecast = self.model.predict(X_test)

        # 评估
        metrics = self._calculate_metrics(y_test, forecast)

        self.is_fitted = True

        print(f"\nXGBoost 性能:")
        print(f"  MAE: {metrics['mae']:.2f}")
        print(f"  RMSE: {metrics['rmse']:.2f}")
        print(f"  MAPE: {metrics['mape']:.2f}%")

        return {
            'model': self.model,
            'forecast': forecast,
            'metrics': metrics
        }

    def _create_features(
        self,
        ts: pd.Series,
        lookback: int
    ) -> Tuple[np.ndarray, np.ndarray]:
        """创建时间序列特征"""
        X, y = [], []

        for i in range(lookback, len(ts)):
            X.append(ts.iloc[i-lookback:i].values)
            y.append(ts.iloc[i])

        return np.array(X), np.array(y)

    def predict(self, periods: int = 30) -> pd.Series:
        """
        预测未来值

        Args:
            periods: 预测期数

        Returns:
            预测结果
        """
        if not self.is_fitted:
            raise ValueError("模型未训练，请先调用 train()")

        if self.model_type == 'prophet':
            future = self.model.make_future_dataframe(periods=periods)
            forecast = self.model.predict(future)
            return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
        else:
            # 简化预测（实际应该递归预测）
            print("简化预测模式")
            return pd.Series([self.ts.mean()] * periods)

    def _calculate_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, float]:
        """计算评估指标"""
        mae = mean_absolute_error(y_true, y_pred)
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        mape = mean_absolute_percentage_error(y_true, y_pred) * 100

        return {
            'mae': mae,
            'mse': mse,
            'rmse': rmse,
            'mape': mape
        }

    def plot_forecast(
        self,
        forecast_result: Dict[str, Any],
        figsize: Tuple[int, int] = (12, 6)
    ):
        """绘制预测结果"""
        plt.figure(figsize=figsize)

        # 绘制历史数据
        plt.plot(self.ts.index, self.ts.values, label='历史数据', color='blue')

        # 绘制预测
        if self.model_type == 'prophet':
            forecast_df = forecast_result['forecast']
            plt.plot(forecast_df['ds'], forecast_df['yhat'], label='预测', color='red')
            plt.fill_between(
                forecast_df['ds'],
                forecast_df['yhat_lower'],
                forecast_df['yhat_upper'],
                alpha=0.3,
                color='red',
                label='预测区间'
            )
        else:
            forecast = forecast_result['forecast']
            if hasattr(forecast, 'index'):
                plt.plot(forecast.index, forecast.values, label='预测', color='red')
            else:
                # 简单绘制
                last_date = self.ts.index[-1]
                forecast_dates = pd.date_range(start=last_date, periods=len(forecast)+1, freq='D')[1:]
                plt.plot(forecast_dates, forecast, label='预测', color='red')

        plt.title('销售预测')
        plt.xlabel('日期')
        plt.ylabel('销售额')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()

    def plot_trend(self):
        """绘制趋势图"""
        if self.ts is None:
            raise ValueError("请先载入数据")

        plt.figure(figsize=(12, 6))
        plt.plot(self.ts.index, self.ts.values, linewidth=2)
        plt.title('销售趋势')
        plt.xlabel('日期')
        plt.ylabel('销售额')
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()

    def analyze_seasonality(self) -> pd.DataFrame:
        """分析季节性模式"""
        if self.data is None:
            raise ValueError("请先载入数据")

        # 添加时间特征
        df = self.data.copy()
        df['year'] = df[self.date_column].dt.year
        df['month'] = df[self.date_column].dt.month
        df['day_of_week'] = df[self.date_column].dt.dayofweek
        df['day_name'] = df[self.date_column].dt.day_name()

        # 按星期几统计
        weekly_pattern = df.groupby('day_name')[self.value_column].mean()

        print("\n按星期几的平均销售:")
        print(weekly_pattern)

        # 按月份统计
        monthly_pattern = df.groupby('month')[self.value_column].mean()

        print("\n按月份的平均销售:")
        print(monthly_pattern)

        return df

    def detect_anomalies(
        self,
        method: str = 'zscore',
        threshold: float = 3.0
    ) -> pd.DataFrame:
        """
        检测异常值

        Args:
            method: 检测方法 ('zscore', 'iqr')
            threshold: 阈值

        Returns:
            异常值DataFrame
        """
        if self.ts is None:
            raise ValueError("请先载入数据")

        if method == 'zscore':
            z_scores = np.abs((self.ts - self.ts.mean()) / self.ts.std())
            anomalies = self.ts[z_scores > threshold]
        elif method == 'iqr':
            Q1 = self.ts.quantile(0.25)
            Q3 = self.ts.quantile(0.75)
            IQR = Q3 - Q1
            anomalies = self.ts[(self.ts < Q1 - 1.5 * IQR) | (self.ts > Q3 + 1.5 * IQR)]
        else:
            raise ValueError(f"不支持的方法: {method}")

        print(f"\n检测到 {len(anomalies)} 个异常值:")
        for date, value in anomalies.items():
            print(f"  {date.date()}: {value:.2f}")

        return anomalies


def main():
    """示例用法"""
    print("=" * 80)
    print("销售预测示例")
    print("=" * 80)

    # 生成示例数据
    dates = pd.date_range(start='2023-01-01', periods=365, freq='D')
    values = 1000 + np.cumsum(np.random.randn(365)) + 100 * np.sin(np.arange(365) * 2 * np.pi / 7)
    df = pd.DataFrame({
        'date': dates,
        'sales': values.astype(int)
    })

    # 初始化预测器
    forecaster = SalesForecaster(model_type='arima')
    forecaster.load_data(df, date_col='date', value_col='sales')

    # 平稳性检查
    forecaster.check_stationarity()

    # 季节性分析
    forecaster.analyze_seasonality()

    # 异常值检测
    forecaster.detect_anomalies()

    # 训练模型
    result = forecaster.train(train_size=0.8, order=(1, 1, 1))

    # 绘制预测结果
    forecaster.plot_forecast(result)


if __name__ == '__main__':
    main()
