"""
時間序列分析工具
提供時間序列分析、預測和視覺化功能
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller, acf, pacf
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
import warnings
warnings.filterwarnings('ignore')

try:
    from statsmodels.tsa.arima.model import ARIMA
    ARIMA_AVAILABLE = True
except ImportError:
    ARIMA_AVAILABLE = False

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False


class TimeSeriesAnalyzer:
    """時間序列分析器"""

    def __init__(self, data=None, date_column=None, value_column=None):
        """
        初始化時間序列分析器

        Args:
            data: DataFrame 或 Series
            date_column: 日期欄位名稱
            value_column: 數值欄位名稱
        """
        self.data = None
        self.ts = None

        if data is not None:
            self.load_data(data, date_column, value_column)

    def load_data(self, data, date_column=None, value_column=None):
        """
        載入時間序列資料

        Args:
            data: DataFrame 或 Series
            date_column: 日期欄位名稱
            value_column: 數值欄位名稱
        """
        if isinstance(data, pd.DataFrame):
            if date_column and value_column:
                self.data = data.copy()
                self.data[date_column] = pd.to_datetime(self.data[date_column])
                self.data = self.data.set_index(date_column)
                self.ts = self.data[value_column]
            else:
                raise ValueError("需要指定 date_column 和 value_column")
        elif isinstance(data, pd.Series):
            self.ts = data.copy()
            self.ts.index = pd.to_datetime(self.ts.index)
        else:
            raise ValueError("data 必須是 DataFrame 或 Series")

    def check_stationarity(self, significance=0.05):
        """
        檢查時間序列的平穩性（使用 ADF 檢定）

        Args:
            significance: 顯著水準

        Returns:
            是否平穩的布林值和詳細結果
        """
        if self.ts is None:
            raise ValueError("請先載入資料")

        result = adfuller(self.ts.dropna())

        is_stationary = result[1] < significance

        print("ADF 平穩性檢定結果:")
        print(f"  ADF 統計量: {result[0]:.6f}")
        print(f"  p-value: {result[1]:.6f}")
        print(f"  臨界值:")
        for key, value in result[4].items():
            print(f"    {key}: {value:.6f}")

        if is_stationary:
            print(f"\n✅ 時間序列是平穩的 (p-value < {significance})")
        else:
            print(f"\n❌ 時間序列不是平穩的 (p-value >= {significance})")
            print("建議進行差分處理")

        return is_stationary, result

    def decompose_series(self, period=None, model='additive'):
        """
        分解時間序列（趨勢、季節性、殘差）

        Args:
            period: 季節性週期（None 則自動檢測）
            model: 'additive' 或 'multiplicative'

        Returns:
            分解結果
        """
        if self.ts is None:
            raise ValueError("請先載入資料")

        # 如果沒有指定週期，嘗試自動檢測
        if period is None:
            # 根據資料頻率推測
            freq = pd.infer_freq(self.ts.index)
            if freq:
                if 'D' in freq:
                    period = 7  # 週
                elif 'M' in freq:
                    period = 12  # 月
                elif 'Q' in freq:
                    period = 4  # 季
                else:
                    period = 12  # 預設
            else:
                period = 12

        decomposition = seasonal_decompose(
            self.ts.dropna(),
            model=model,
            period=period,
            extrapolate_trend='freq'
        )

        return decomposition

    def plot_decomposition(self, decomposition, figsize=(12, 10)):
        """視覺化時間序列分解結果"""
        fig, axes = plt.subplots(4, 1, figsize=figsize)

        # 原始序列
        decomposition.observed.plot(ax=axes[0], title='原始序列')
        axes[0].set_ylabel('觀測值')

        # 趨勢
        decomposition.trend.plot(ax=axes[1], title='趨勢')
        axes[1].set_ylabel('趨勢')

        # 季節性
        decomposition.seasonal.plot(ax=axes[2], title='季節性')
        axes[2].set_ylabel('季節性')

        # 殘差
        decomposition.resid.plot(ax=axes[3], title='殘差')
        axes[3].set_ylabel('殘差')

        plt.tight_layout()
        return fig

    def plot_acf_pacf(self, lags=40, figsize=(12, 6)):
        """繪製自相關和偏自相關圖"""
        if self.ts is None:
            raise ValueError("請先載入資料")

        fig, axes = plt.subplots(1, 2, figsize=figsize)

        # ACF
        plot_acf(self.ts.dropna(), lags=lags, ax=axes[0])
        axes[0].set_title('自相關函數 (ACF)')

        # PACF
        plot_pacf(self.ts.dropna(), lags=lags, ax=axes[1])
        axes[1].set_title('偏自相關函數 (PACF)')

        plt.tight_layout()
        return fig

    def detect_outliers(self, method='zscore', threshold=3):
        """
        檢測異常值

        Args:
            method: 'zscore' 或 'iqr'
            threshold: Z-score 閾值（當 method='zscore'）

        Returns:
            異常值的索引
        """
        if self.ts is None:
            raise ValueError("請先載入資料")

        if method == 'zscore':
            z_scores = np.abs((self.ts - self.ts.mean()) / self.ts.std())
            outliers = self.ts[z_scores > threshold]
        elif method == 'iqr':
            Q1 = self.ts.quantile(0.25)
            Q3 = self.ts.quantile(0.75)
            IQR = Q3 - Q1
            outliers = self.ts[(self.ts < Q1 - 1.5 * IQR) | (self.ts > Q3 + 1.5 * IQR)]
        else:
            raise ValueError("method 必須是 'zscore' 或 'iqr'")

        return outliers

    def moving_average(self, window=7):
        """
        計算移動平均

        Args:
            window: 窗口大小

        Returns:
            移動平均序列
        """
        if self.ts is None:
            raise ValueError("請先載入資料")

        return self.ts.rolling(window=window).mean()

    def exponential_smoothing(self, alpha=0.3):
        """
        指數平滑

        Args:
            alpha: 平滑參數 (0-1)

        Returns:
            平滑後的序列
        """
        if self.ts is None:
            raise ValueError("請先載入資料")

        return self.ts.ewm(alpha=alpha, adjust=False).mean()

    def forecast_arima(self, order=(1, 1, 1), periods=30):
        """
        使用 ARIMA 模型進行預測

        Args:
            order: (p, d, q) ARIMA 參數
            periods: 預測期數

        Returns:
            預測結果
        """
        if not ARIMA_AVAILABLE:
            raise ImportError("需要安裝 statsmodels")

        if self.ts is None:
            raise ValueError("請先載入資料")

        # 訓練模型
        model = ARIMA(self.ts.dropna(), order=order)
        fitted_model = model.fit()

        # 預測
        forecast = fitted_model.forecast(steps=periods)

        print(f"\nARIMA{order} 模型摘要:")
        print(f"  AIC: {fitted_model.aic:.2f}")
        print(f"  BIC: {fitted_model.bic:.2f}")

        return forecast, fitted_model

    def forecast_prophet(self, periods=30, freq='D'):
        """
        使用 Prophet 模型進行預測

        Args:
            periods: 預測期數
            freq: 頻率 ('D', 'W', 'M')

        Returns:
            預測結果
        """
        if not PROPHET_AVAILABLE:
            raise ImportError("需要安裝 prophet: pip install prophet")

        if self.ts is None:
            raise ValueError("請先載入資料")

        # 準備資料
        df = pd.DataFrame({
            'ds': self.ts.index,
            'y': self.ts.values
        })

        # 訓練模型
        model = Prophet()
        model.fit(df)

        # 創建未來日期
        future = model.make_future_dataframe(periods=periods, freq=freq)

        # 預測
        forecast = model.predict(future)

        return forecast, model

    def plot_forecast(self, forecast, title='時間序列預測', figsize=(12, 6)):
        """視覺化預測結果"""
        plt.figure(figsize=figsize)

        # 繪製歷史資料
        plt.plot(self.ts.index, self.ts.values, label='歷史資料', color='blue')

        # 繪製預測
        if isinstance(forecast, pd.DataFrame) and 'yhat' in forecast.columns:
            # Prophet 格式
            plt.plot(forecast['ds'], forecast['yhat'], label='預測', color='red')
            plt.fill_between(
                forecast['ds'],
                forecast['yhat_lower'],
                forecast['yhat_upper'],
                alpha=0.3,
                color='red',
                label='預測區間'
            )
        else:
            # ARIMA 格式
            plt.plot(forecast.index, forecast.values, label='預測', color='red')

        plt.title(title, fontsize=14, fontweight='bold')
        plt.xlabel('日期')
        plt.ylabel('數值')
        plt.legend()
        plt.grid(alpha=0.3)
        plt.tight_layout()

    def calculate_metrics(self, actual, predicted):
        """
        計算預測指標

        Args:
            actual: 實際值
            predicted: 預測值

        Returns:
            評估指標字典
        """
        mae = np.mean(np.abs(actual - predicted))
        mse = np.mean((actual - predicted) ** 2)
        rmse = np.sqrt(mse)
        mape = np.mean(np.abs((actual - predicted) / actual)) * 100

        metrics = {
            'MAE': mae,
            'MSE': mse,
            'RMSE': rmse,
            'MAPE': mape
        }

        return metrics


def main():
    """示例用法"""
    # 生成示例資料
    dates = pd.date_range(start='2022-01-01', periods=365, freq='D')
    values = 100 + np.cumsum(np.random.randn(365)) + 10 * np.sin(np.arange(365) * 2 * np.pi / 7)
    ts = pd.Series(values, index=dates)

    # 初始化分析器
    analyzer = TimeSeriesAnalyzer(ts)

    # 平穩性檢定
    is_stationary, _ = analyzer.check_stationarity()

    # 分解時間序列
    decomposition = analyzer.decompose_series(period=7)
    analyzer.plot_decomposition(decomposition)
    plt.show()

    # ACF/PACF
    analyzer.plot_acf_pacf()
    plt.show()

    # ARIMA 預測
    if ARIMA_AVAILABLE:
        forecast, model = analyzer.forecast_arima(order=(1, 1, 1), periods=30)
        analyzer.plot_forecast(forecast)
        plt.show()


if __name__ == '__main__':
    main()
