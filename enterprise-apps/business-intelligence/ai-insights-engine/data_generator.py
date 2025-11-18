"""
数据生成器 - 为 AI 洞察引擎生成测试数据
包含趋势、季节性、异常值和多种模式
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os


def generate_business_data(days=180, seed=42):
    """
    生成包含多种模式的业务数据

    Args:
        days: 生成天数
        seed: 随机种子
    """
    np.random.seed(seed)

    # 生成日期范围
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days-1)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')

    # 基础数据
    data = {
        'date': dates,
    }

    # 1. 收入 (revenue) - 上升趋势 + 季节性 + 异常
    base_revenue = 50000
    trend = np.linspace(0, 20000, days)  # 线性增长
    seasonal = 5000 * np.sin(2 * np.pi * np.arange(days) / 7)  # 周季节性
    noise = np.random.normal(0, 2000, days)  # 随机噪声
    revenue = base_revenue + trend + seasonal + noise

    # 注入异常
    anomaly_indices = [30, 60, 90, 120]  # 异常日期
    for idx in anomaly_indices:
        if idx < len(revenue):
            revenue[idx] = revenue[idx] * 0.5  # 下降50%

    data['revenue'] = np.maximum(revenue, 0)  # 确保非负

    # 2. 订单数 (orders) - 稳定上升
    base_orders = 500
    orders_trend = np.linspace(0, 200, days)
    orders_noise = np.random.normal(0, 30, days)
    data['orders'] = np.maximum(base_orders + orders_trend + orders_noise, 0).astype(int)

    # 3. 活跃用户 (active_users) - 与收入高度相关
    data['active_users'] = (data['revenue'] / 100 + np.random.normal(0, 50, days)).astype(int)
    data['active_users'] = np.maximum(data['active_users'], 100)

    # 4. 转化率 (conversion_rate) - 轻微下降趋势
    base_conv = 0.12
    conv_trend = -np.linspace(0, 0.03, days)
    conv_noise = np.random.normal(0, 0.01, days)
    data['conversion_rate'] = np.clip(base_conv + conv_trend + conv_noise, 0.01, 0.5)

    # 5. 客单价 (avg_order_value) - 稳定
    base_aov = 200
    aov_noise = np.random.normal(0, 20, days)
    data['avg_order_value'] = np.maximum(base_aov + aov_noise, 50)

    # 6. 营销支出 (marketing_spend) - 与新用户相关
    base_marketing = 10000
    marketing_noise = np.random.normal(0, 1000, days)
    data['marketing_spend'] = np.maximum(base_marketing + marketing_noise, 0)

    # 7. 新用户 (new_users) - 与营销支出相关
    data['new_users'] = (data['marketing_spend'] / 100 + np.random.normal(0, 20, days)).astype(int)
    data['new_users'] = np.maximum(data['new_users'], 10)

    # 8. 成本 (cost) - 与收入相关但增长更快
    data['cost'] = data['revenue'] * 0.6 + np.random.normal(0, 2000, days)

    # 9. 利润 (profit)
    data['profit'] = data['revenue'] - data['cost']

    # 10. 网站流量 (website_traffic) - 周季节性
    base_traffic = 10000
    traffic_seasonal = 3000 * np.sin(2 * np.pi * np.arange(days) / 7)
    traffic_noise = np.random.normal(0, 500, days)
    data['website_traffic'] = (base_traffic + traffic_seasonal + traffic_noise).astype(int)
    data['website_traffic'] = np.maximum(data['website_traffic'], 1000)

    # 11. 退货率 (return_rate) - 异常检测目标
    base_return = 0.05
    return_noise = np.random.normal(0, 0.01, days)
    return_rate = base_return + return_noise

    # 注入退货率异常
    spike_indices = [45, 75, 105]
    for idx in spike_indices:
        if idx < len(return_rate):
            return_rate[idx] = 0.25  # 异常高退货率

    data['return_rate'] = np.clip(return_rate, 0, 0.5)

    # 12. 客户满意度 (customer_satisfaction) - 下降趋势
    base_satisfaction = 4.5
    satisfaction_trend = -np.linspace(0, 0.5, days)
    satisfaction_noise = np.random.normal(0, 0.2, days)
    data['customer_satisfaction'] = np.clip(
        base_satisfaction + satisfaction_trend + satisfaction_noise,
        1, 5
    )

    # 13. 响应时间 (response_time_ms) - 偶尔异常
    base_response = 200
    response_noise = np.random.normal(0, 30, days)
    response_time = base_response + response_noise

    # 注入响应时间异常
    slow_indices = [20, 55, 85, 115, 145]
    for idx in slow_indices:
        if idx < len(response_time):
            response_time[idx] = response_time[idx] * 5  # 慢5倍

    data['response_time_ms'] = np.maximum(response_time, 50)

    # 14. 库存周转率 (inventory_turnover)
    base_turnover = 6.0
    turnover_noise = np.random.normal(0, 0.5, days)
    data['inventory_turnover'] = np.maximum(base_turnover + turnover_noise, 1)

    # 15. 员工人数 (employee_count) - 阶梯式增长
    employee_count = np.ones(days) * 100
    for i in range(0, days, 60):
        employee_count[i:] += 10  # 每60天增加10人
    data['employee_count'] = employee_count.astype(int)

    # 转换为 DataFrame
    df = pd.DataFrame(data)

    return df


def generate_categorical_data(df):
    """为数据添加类别维度"""
    n = len(df)

    # 产品类别
    categories = ['Electronics', 'Clothing', 'Home', 'Books', 'Sports']
    df['product_category'] = np.random.choice(categories, n, p=[0.3, 0.25, 0.2, 0.15, 0.1])

    # 地区
    regions = ['North', 'South', 'East', 'West', 'Central']
    df['region'] = np.random.choice(regions, n, p=[0.25, 0.2, 0.2, 0.2, 0.15])

    # 渠道
    channels = ['Online', 'Mobile', 'Store', 'Partner']
    df['channel'] = np.random.choice(channels, n, p=[0.35, 0.3, 0.25, 0.1])

    return df


def add_customer_segments(df):
    """添加客户分群数据（用于聚类分析）"""
    n = len(df)

    # 根据收入和活跃用户创建3个客户群
    # 高价值低频、中价值中频、低价值高频

    segments = []
    for _ in range(n):
        seg_type = np.random.choice(['high_low', 'mid_mid', 'low_high'], p=[0.2, 0.5, 0.3])

        if seg_type == 'high_low':
            # 高价值低频
            segment_revenue = np.random.normal(80000, 5000)
            segment_frequency = np.random.randint(5, 15)
        elif seg_type == 'mid_mid':
            # 中价值中频
            segment_revenue = np.random.normal(50000, 5000)
            segment_frequency = np.random.randint(20, 40)
        else:
            # 低价值高频
            segment_revenue = np.random.normal(30000, 3000)
            segment_frequency = np.random.randint(50, 100)

        segments.append({
            'segment_revenue': max(segment_revenue, 0),
            'segment_frequency': segment_frequency,
            'segment_type': seg_type
        })

    segment_df = pd.DataFrame(segments)
    df = pd.concat([df, segment_df], axis=1)

    return df


def main():
    """主函数"""
    print("🚀 生成 AI 洞察引擎测试数据...")

    # 创建数据目录
    os.makedirs('data', exist_ok=True)

    # 生成主数据
    print("📊 生成业务数据...")
    df = generate_business_data(days=180)

    # 添加类别数据
    print("🏷️  添加类别维度...")
    df = generate_categorical_data(df)

    # 添加客户分群数据
    print("👥 添加客户分群数据...")
    df = add_customer_segments(df)

    # 保存数据
    output_file = 'data/business_data.csv'
    df.to_csv(output_file, index=False)

    print(f"\n✅ 数据生成完成！")
    print(f"📁 文件位置: {output_file}")
    print(f"📊 数据形状: {df.shape}")
    print(f"\n📈 数据概览:")
    print(df.head())

    print(f"\n📊 数据统计:")
    print(df.describe())

    print(f"\n🎯 数据特点:")
    print("- ✅ 包含上升趋势 (revenue, orders)")
    print("- ✅ 包含下降趋势 (conversion_rate, customer_satisfaction)")
    print("- ✅ 包含季节性模式 (revenue, website_traffic)")
    print("- ✅ 包含异常值 (revenue, return_rate, response_time)")
    print("- ✅ 包含相关性 (revenue-active_users, marketing_spend-new_users)")
    print("- ✅ 包含聚类模式 (3个客户群体)")

    print(f"\n💡 现在可以运行应用:")
    print("   streamlit run app.py")


if __name__ == "__main__":
    main()
