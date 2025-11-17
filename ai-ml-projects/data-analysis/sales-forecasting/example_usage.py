"""
銷售預測 - 完整使用範例
演示如何使用時間序列分析和預測系統進行銷售預測
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
from sklearn.metrics import mean_squared_error, mean_absolute_error, mean_absolute_percentage_error
from sklearn.preprocessing import MinMaxScaler
import warnings
warnings.filterwarnings('ignore')

# 設置中文字體
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# ============================================================================
# 1. 生成示例銷售數據
# ============================================================================
def generate_sample_sales_data(n_days=365, random_state=42):
    """
    生成示例銷售時間序列數據
    """
    np.random.seed(random_state)

    # 日期序列
    start_date = datetime(2023, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(n_days)]

    # 生成銷售數據（包含趨勢和季節性）
    t = np.arange(n_days)

    # 趨勢：緩慢增長
    trend = 1000 + 0.5 * t

    # 季節性：週和月度模式
    weekly_pattern = 200 * np.sin(2 * np.pi * t / 7)
    monthly_pattern = 150 * np.sin(2 * np.pi * t / 30)

    # 假日效應
    holidays = np.zeros(n_days)
    for i, date in enumerate(dates):
        if date.month == 12 and date.day >= 20:  # 聖誕節
            holidays[i] = 300
        elif date.month == 11 and 20 <= date.day <= 27:  # 感恩節
            holidays[i] = 250

    # 噪音
    noise = np.random.normal(0, 100, n_days)

    # 組合
    sales = trend + weekly_pattern + monthly_pattern + holidays + noise
    sales = np.maximum(sales, 0)  # 確保非負

    df = pd.DataFrame({
        'date': dates,
        'sales': sales.astype(int),
        'day_of_week': [d.weekday() for d in dates],
        'month': [d.month for d in dates],
        'is_holiday': holidays.astype(int)
    })

    return df


# ============================================================================
# 2. 數據分析
# ============================================================================
def analyze_sales_data(df):
    """
    分析銷售數據的特性
    """
    print("=" * 80)
    print("1. 時間序列數據分析")
    print("=" * 80)

    print("\n數據集概況:")
    print(f"  時間跨度: {df['date'].min().date()} 到 {df['date'].max().date()}")
    print(f"  數據點: {len(df)}")
    print(f"  缺失值: {df.isnull().sum().sum()}")

    print("\n銷售統計:")
    print(f"  平均銷售: ${df['sales'].mean():.2f}")
    print(f"  中位數: ${df['sales'].median():.2f}")
    print(f"  標準差: ${df['sales'].std():.2f}")
    print(f"  最小值: ${df['sales'].min():.2f}")
    print(f"  最大值: ${df['sales'].max():.2f}")

    # 按星期幾的平均銷售
    day_names = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']
    print("\n按星期幾的平均銷售:")
    for i, day_name in enumerate(day_names):
        avg = df[df['day_of_week'] == i]['sales'].mean()
        print(f"  {day_name}: ${avg:.2f}")

    # 按月份的平均銷售
    print("\n按月份的平均銷售:")
    for month in range(1, 13):
        month_data = df[df['month'] == month]
        if len(month_data) > 0:
            avg = month_data['sales'].mean()
            print(f"  {month}月: ${avg:.2f}")

    # 假日效應
    print("\n假日效應:")
    holiday_avg = df[df['is_holiday'] == 1]['sales'].mean()
    no_holiday_avg = df[df['is_holiday'] == 0]['sales'].mean()
    print(f"  假日平均銷售: ${holiday_avg:.2f}")
    print(f"  非假日平均銷售: ${no_holiday_avg:.2f}")
    print(f"  提升幅度: {(holiday_avg / no_holiday_avg - 1) * 100:.1f}%")

    return df


# ============================================================================
# 3. 時間序列分解
# ============================================================================
def decompose_time_series(df):
    """
    分解時間序列為趨勢、季節性和殘差
    """
    print("\n" + "=" * 80)
    print("2. 時間序列分解")
    print("=" * 80)

    sales = df['sales'].values

    # 簡單的移動平均（趨勢）
    window = 7
    trend = pd.Series(sales).rolling(window=window, center=True).mean()

    # 去趨勢
    detrended = sales - trend

    # 季節性（週期為7）
    seasonal = np.zeros_like(detrended)
    for i in range(7):
        indices = np.arange(i, len(detrended), 7)
        if len(indices) > 0:
            seasonal[indices] = np.nanmean(detrended[indices])

    # 殘差
    residual = sales - trend - seasonal

    print(f"\n趨勢分量:")
    print(f"  增長率: {(trend.iloc[-1] - trend.iloc[window]) / window:.2f} (每週增長)")

    print(f"\n季節性分量:")
    seasonal_std = np.nanstd(seasonal)
    print(f"  標準差: ${seasonal_std:.2f}")

    print(f"\n殘差分量:")
    residual_std = np.nanstd(residual[~np.isnan(residual)])
    print(f"  標準差: ${residual_std:.2f}")

    return {
        'trend': trend,
        'seasonal': seasonal,
        'residual': residual
    }


# ============================================================================
# 4. 簡單的移動平均預測
# ============================================================================
def moving_average_forecast(df, window=7, forecast_periods=30):
    """
    使用移動平均進行預測
    """
    print("\n" + "=" * 80)
    print("3. 移動平均預測")
    print("=" * 80)

    sales = df['sales'].values

    # 計算移動平均
    ma = pd.Series(sales).rolling(window=window).mean()

    # 預測（使用最後的移動平均值）
    last_ma = ma.iloc[-1]
    forecast = [last_ma] * forecast_periods

    # 評估（在訓練集上）
    ma_values = ma.dropna().values
    train_sales = sales[window-1:]
    ma_valid = ma_values[:len(train_sales)]

    if len(ma_valid) > 0:
        mae = mean_absolute_error(train_sales[:len(ma_valid)], ma_valid)
        mape = mean_absolute_percentage_error(train_sales[:len(ma_valid)], ma_valid)

        print(f"\n{window}日移動平均性能:")
        print(f"  MAE: ${mae:.2f}")
        print(f"  MAPE: {mape:.2%}")

    # 生成預測日期
    last_date = df['date'].iloc[-1]
    forecast_dates = [last_date + timedelta(days=i+1) for i in range(forecast_periods)]

    return {
        'dates': forecast_dates,
        'forecast': forecast,
        'ma': ma
    }


# ============================================================================
# 5. 指數平滑預測
# ============================================================================
def exponential_smoothing_forecast(df, alpha=0.3, forecast_periods=30):
    """
    使用指數平滑進行預測
    """
    print("\n" + "=" * 80)
    print("4. 指數平滑預測")
    print("=" * 80)

    sales = df['sales'].values

    # 指數平滑
    smoothed = np.zeros_like(sales, dtype=float)
    smoothed[0] = sales[0]

    for i in range(1, len(sales)):
        smoothed[i] = alpha * sales[i] + (1 - alpha) * smoothed[i-1]

    # 預測
    forecast = [smoothed[-1]] * forecast_periods

    # 評估
    mae = mean_absolute_error(sales[1:], smoothed[1:])
    mape = mean_absolute_percentage_error(sales[1:], smoothed[1:])

    print(f"\n指數平滑 (α={alpha}) 性能:")
    print(f"  MAE: ${mae:.2f}")
    print(f"  MAPE: {mape:.2%}")

    # 生成預測日期
    last_date = df['date'].iloc[-1]
    forecast_dates = [last_date + timedelta(days=i+1) for i in range(forecast_periods)]

    return {
        'dates': forecast_dates,
        'forecast': forecast,
        'smoothed': smoothed
    }


# ============================================================================
# 6. 線性趨勢預測
# ============================================================================
def linear_trend_forecast(df, forecast_periods=30):
    """
    使用線性趨勢進行預測
    """
    print("\n" + "=" * 80)
    print("5. 線性趨勢預測")
    print("=" * 80)

    X = np.arange(len(df)).reshape(-1, 1)
    y = df['sales'].values

    # 線性回歸
    from sklearn.linear_model import LinearRegression
    model = LinearRegression()
    model.fit(X, y)

    # 預測
    future_X = np.arange(len(df), len(df) + forecast_periods).reshape(-1, 1)
    forecast = model.predict(future_X)
    forecast = np.maximum(forecast, 0)  # 確保非負

    # 評估
    train_pred = model.predict(X)
    mae = mean_absolute_error(y, train_pred)
    mape = mean_absolute_percentage_error(y, train_pred)

    print(f"\n線性趨勢性能:")
    print(f"  斜率: {model.coef_[0]:.2f} (每天增長)")
    print(f"  截距: ${model.intercept_:.2f}")
    print(f"  MAE: ${mae:.2f}")
    print(f"  MAPE: {mape:.2%}")

    # 生成預測日期
    last_date = df['date'].iloc[-1]
    forecast_dates = [last_date + timedelta(days=i+1) for i in range(forecast_periods)]

    return {
        'dates': forecast_dates,
        'forecast': forecast,
        'model': model
    }


# ============================================================================
# 7. 多模型比較
# ============================================================================
def compare_forecasting_models(df, forecast_periods=30):
    """
    比較不同的預測模型
    """
    print("\n" + "=" * 80)
    print("6. 多模型預測比較")
    print("=" * 80)

    # 執行各種預測
    ma_result = moving_average_forecast(df, window=7, forecast_periods=forecast_periods)
    es_result = exponential_smoothing_forecast(df, alpha=0.3, forecast_periods=forecast_periods)
    lt_result = linear_trend_forecast(df, forecast_periods=forecast_periods)

    # 比較結果
    print("\n預測結果比較 (前14天):")
    print(f"{'日期':<12} {'MA(7)':<10} {'ES(0.3)':<10} {'線性趨勢':<10}")
    print("-" * 45)

    for i in range(min(14, forecast_periods)):
        date_str = ma_result['dates'][i].strftime('%Y-%m-%d')
        ma_val = ma_result['forecast'][i]
        es_val = es_result['forecast'][i]
        lt_val = lt_result['forecast'][i]
        print(f"{date_str:<12} ${ma_val:<9.0f} ${es_val:<9.0f} ${lt_val:<9.0f}")

    # 平均預測
    avg_forecast = (
        np.array(ma_result['forecast']) +
        np.array(es_result['forecast']) +
        np.array(lt_result['forecast'])
    ) / 3

    print("\n平均預測:")
    print(f"  30天平均銷售預測: ${np.mean(avg_forecast):.2f}")
    print(f"  30天總銷售預測: ${np.sum(avg_forecast):.0f}")

    return {
        'ma': ma_result,
        'es': es_result,
        'lt': lt_result,
        'ensemble': {
            'dates': ma_result['dates'],
            'forecast': avg_forecast
        }
    }


# ============================================================================
# 8. 異常值檢測
# ============================================================================
def detect_anomalies(df, threshold=2.5):
    """
    檢測銷售數據中的異常值
    """
    print("\n" + "=" * 80)
    print("7. 異常值檢測")
    print("=" * 80)

    sales = df['sales'].values
    mean = np.mean(sales)
    std = np.std(sales)

    # Z-score 異常值檢測
    z_scores = np.abs((sales - mean) / std)
    anomalies = z_scores > threshold

    anomaly_indices = np.where(anomalies)[0]
    anomaly_dates = df.loc[anomaly_indices, 'date'].values
    anomaly_values = sales[anomalies]

    print(f"\n檢測到 {len(anomaly_indices)} 個異常值 (Z-score > {threshold}):")
    for idx in anomaly_indices[:10]:  # 顯示前10個
        date = df.loc[idx, 'date']
        value = sales[idx]
        z_score = z_scores[idx]
        print(f"  {date.date()}: ${value:.0f} (Z-score: {z_score:.2f})")

    if len(anomaly_indices) > 10:
        print(f"  ... 以及其他 {len(anomaly_indices) - 10} 個異常值")

    return {
        'anomaly_indices': anomaly_indices,
        'anomaly_dates': anomaly_dates,
        'anomaly_values': anomaly_values
    }


# ============================================================================
# 9. 可視化預測結果
# ============================================================================
def visualize_forecasts(df, forecast_results, anomalies):
    """
    可視化預測結果
    """
    print("\n" + "=" * 80)
    print("8. 結果可視化")
    print("=" * 80)

    fig, axes = plt.subplots(2, 2, figsize=(15, 10))

    # 1. 歷史銷售數據
    axes[0, 0].plot(df['date'], df['sales'], label='實際銷售', linewidth=2)
    axes[0, 0].scatter(
        df.loc[anomalies['anomaly_indices'], 'date'],
        anomalies['anomaly_values'],
        color='red', label='異常值', s=50
    )
    axes[0, 0].set_title('歷史銷售數據')
    axes[0, 0].set_ylabel('銷售額 ($)')
    axes[0, 0].legend()
    axes[0, 0].grid(True, alpha=0.3)

    # 2. 多模型預測對比
    axes[0, 1].plot(forecast_results['ma']['dates'], forecast_results['ma']['forecast'],
                    label='MA(7)', marker='o', markersize=4)
    axes[0, 1].plot(forecast_results['es']['dates'], forecast_results['es']['forecast'],
                    label='ES(0.3)', marker='s', markersize=4)
    axes[0, 1].plot(forecast_results['lt']['dates'], forecast_results['lt']['forecast'],
                    label='線性趨勢', marker='^', markersize=4)
    axes[0, 1].plot(forecast_results['ensemble']['dates'], forecast_results['ensemble']['forecast'],
                    label='集成預測', marker='d', markersize=4, linewidth=2)
    axes[0, 1].set_title('不同模型的預測結果')
    axes[0, 1].set_ylabel('銷售額 ($)')
    axes[0, 1].legend()
    axes[0, 1].grid(True, alpha=0.3)

    # 3. 時間序列分解
    decomposition = decompose_time_series(df)
    axes[1, 0].plot(range(len(decomposition['trend'])), decomposition['trend'], label='趨勢')
    axes[1, 0].plot(range(len(decomposition['seasonal'])), decomposition['seasonal'], label='季節性', alpha=0.7)
    axes[1, 0].set_title('時間序列分解')
    axes[1, 0].set_ylabel('成分')
    axes[1, 0].legend()
    axes[1, 0].grid(True, alpha=0.3)

    # 4. 週期性分析
    day_names = ['一', '二', '三', '四', '五', '六', '日']
    daily_avg = df.groupby('day_of_week')['sales'].mean()
    axes[1, 1].bar(range(7), daily_avg.values)
    axes[1, 1].set_title('星期幾的平均銷售')
    axes[1, 1].set_ylabel('平均銷售額 ($)')
    axes[1, 1].set_xticks(range(7))
    axes[1, 1].set_xticklabels([f'星期{day}' for day in day_names])

    plt.tight_layout()
    plt.savefig('sales_forecast_analysis.png', dpi=300, bbox_inches='tight')
    print("\n✅ 圖表已保存為: sales_forecast_analysis.png")
    plt.show()


# ============================================================================
# 主程序
# ============================================================================
def main():
    """
    完整的銷售預測示例
    """
    print("\n" + "=" * 80)
    print("銷售預測 - 完整使用範例")
    print("=" * 80)

    # 1. 生成數據
    print("\n準備數據...")
    df = generate_sample_sales_data(n_days=365)

    # 2. 數據分析
    df = analyze_sales_data(df)

    # 3. 時間序列分解
    decomposition = decompose_time_series(df)

    # 4. 異常值檢測
    anomalies = detect_anomalies(df, threshold=2.5)

    # 5. 多模型預測
    forecast_results = compare_forecasting_models(df, forecast_periods=30)

    # 6. 可視化
    visualize_forecasts(df, forecast_results, anomalies)

    # 7. 業務建議
    print("\n" + "=" * 80)
    print("9. 業務建議")
    print("=" * 80)

    ensemble_forecast = forecast_results['ensemble']['forecast']
    print(f"\n庫存管理建議:")
    print(f"  未來30天預期銷售: ${np.sum(ensemble_forecast):.0f}")
    print(f"  日均銷售: ${np.mean(ensemble_forecast):.0f}")
    print(f"  推薦安全庫存 (±1周): ${np.std(ensemble_forecast) * 7:.0f}")

    # 識別銷售高峰期
    peak_indices = np.argsort(ensemble_forecast)[-5:]
    print(f"\n預期銷售高峰期 (未來30天):")
    for idx in sorted(peak_indices):
        date = forecast_results['ensemble']['dates'][idx]
        value = ensemble_forecast[idx]
        print(f"  {date.date()}: ${value:.0f}")

    print("\n" + "=" * 80)
    print("✅ 分析完成！")
    print("=" * 80 + "\n")


if __name__ == '__main__':
    main()
