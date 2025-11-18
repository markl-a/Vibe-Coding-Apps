"""
生成预测分析演示数据
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_time_series():
    """生成时间序列数据"""
    np.random.seed(42)

    # 生成180天的历史数据
    days = 180
    start_date = datetime.now() - timedelta(days=days)

    dates = pd.date_range(start=start_date, periods=days, freq='D')

    # 趋势 + 季节性 + 噪声
    trend = np.linspace(100, 150, days)
    seasonality = 20 * np.sin(2 * np.pi * np.arange(days) / 7)
    noise = np.random.normal(0, 5, days)

    values = trend + seasonality + noise

    df = pd.DataFrame({
        'date': dates,
        'value': values
    })

    return df

def main():
    os.makedirs('data', exist_ok=True)

    print("🚀 生成预测分析数据...")

    # 时间序列数据
    print("📈 生成时间序列数据...")
    ts_data = generate_time_series()
    ts_data.to_csv('data/time_series.csv', index=False)
    print(f"   ✓ 保存到 data/time_series.csv ({len(ts_data)} 行)")

    print("\n✅ 数据生成完成！")
    print("💡 运行 streamlit run app.py 启动应用")

if __name__ == "__main__":
    main()
