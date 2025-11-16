"""
KPI 監控系統 - 數據生成器
生成模擬的 KPI 數據用於監控演示
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_kpi_data(days=90):
    """生成 KPI 歷史數據"""
    np.random.seed(42)

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')

    data = []

    for date in dates:
        day_index = (date - start_date).days

        # 添加整體增長趨勢
        trend_factor = 1 + (day_index / days) * 0.3

        # 週末因素
        is_weekend = date.dayofweek >= 5
        weekend_factor = 0.7 if is_weekend else 1.0

        # 每日收入
        base_revenue = 100000
        revenue = base_revenue * trend_factor * weekend_factor * np.random.uniform(0.8, 1.2)

        # 訂單數
        base_orders = 500
        orders = int(base_orders * trend_factor * weekend_factor * np.random.uniform(0.8, 1.2))

        # 活躍用戶
        base_users = 5000
        active_users = int(base_users * trend_factor * np.random.uniform(0.9, 1.1))

        # 轉化率
        conversion_rate = (orders / max(active_users, 1)) * np.random.uniform(0.95, 1.05)

        # 客單價
        avg_order_value = revenue / max(orders, 1)

        # 錯誤率（偶爾出現異常）
        error_rate = np.random.uniform(0.001, 0.005)
        if np.random.random() < 0.05:  # 5% 機率異常
            error_rate = np.random.uniform(0.01, 0.03)

        # 響應時間
        response_time = np.random.uniform(100, 300)  # ms
        if np.random.random() < 0.05:
            response_time = np.random.uniform(500, 1000)

        data.append({
            'date': date.strftime('%Y-%m-%d'),
            'revenue': round(revenue, 2),
            'orders': orders,
            'active_users': active_users,
            'conversion_rate': round(conversion_rate, 4),
            'avg_order_value': round(avg_order_value, 2),
            'error_rate': round(error_rate, 4),
            'response_time': round(response_time, 2)
        })

    return pd.DataFrame(data)

def main():
    """主函數：生成所有數據"""
    print("🚀 開始生成 KPI 數據...")

    # 創建數據目錄
    os.makedirs('data', exist_ok=True)

    # 生成 KPI 歷史數據
    print("📊 生成 KPI 歷史數據...")
    kpi_df = generate_kpi_data(days=90)
    kpi_df.to_csv('data/kpi_history.csv', index=False)
    print(f"   ✓ 已生成 {len(kpi_df)} 天的 KPI 數據")

    # 數據統計
    print("\n📋 數據摘要:")
    print(f"  - 時間範圍: {kpi_df['date'].min()} 至 {kpi_df['date'].max()}")
    print(f"  - 平均每日收入: ${kpi_df['revenue'].mean():,.2f}")
    print(f"  - 平均訂單數: {kpi_df['orders'].mean():.0f}")
    print(f"  - 平均活躍用戶: {kpi_df['active_users'].mean():.0f}")
    print(f"  - 平均轉化率: {kpi_df['conversion_rate'].mean():.2%}")

    print("\n✅ 數據生成完成!")
    print("📁 數據已保存到 data/ 目錄")

if __name__ == '__main__':
    main()
