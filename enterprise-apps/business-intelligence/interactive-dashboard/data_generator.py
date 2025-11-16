"""
互動式儀表板 - 示例數據生成器
生成模擬的業務數據用於儀表板展示
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_sales_data(days=90):
    """生成銷售數據"""
    np.random.seed(42)

    # 日期範圍
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')

    # 產品類別
    categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Home & Garden']
    regions = ['North', 'South', 'East', 'West', 'Central']
    products = {
        'Electronics': ['Laptop', 'Phone', 'Tablet', 'Headphones', 'Camera'],
        'Clothing': ['Shirt', 'Pants', 'Dress', 'Jacket', 'Shoes'],
        'Food': ['Snacks', 'Beverages', 'Fresh Produce', 'Dairy', 'Bakery'],
        'Books': ['Fiction', 'Non-Fiction', 'Educational', 'Comics', 'Magazines'],
        'Home & Garden': ['Furniture', 'Tools', 'Decor', 'Plants', 'Kitchenware']
    }

    data = []

    for date in dates:
        # 週末銷售額增加
        is_weekend = date.dayofweek >= 5
        weekend_factor = 1.3 if is_weekend else 1.0

        # 月末促銷
        is_month_end = date.day >= 25
        promo_factor = 1.5 if is_month_end else 1.0

        for category in categories:
            for region in regions:
                # 每個地區每天隨機生成 3-8 筆交易
                num_transactions = np.random.randint(3, 9)

                for _ in range(num_transactions):
                    product = np.random.choice(products[category])

                    # 基礎銷售額（根據類別不同）
                    base_price = {
                        'Electronics': np.random.uniform(300, 2000),
                        'Clothing': np.random.uniform(30, 200),
                        'Food': np.random.uniform(5, 50),
                        'Books': np.random.uniform(10, 100),
                        'Home & Garden': np.random.uniform(50, 500)
                    }[category]

                    # 數量
                    quantity = np.random.randint(1, 11)

                    # 計算總額（加入趨勢、週末、促銷因素）
                    # 添加整體增長趨勢
                    day_index = (date - start_date).days
                    trend_factor = 1 + (day_index / days) * 0.3  # 30% 增長

                    sales = base_price * quantity * weekend_factor * promo_factor * trend_factor

                    # 添加隨機波動
                    sales *= np.random.uniform(0.8, 1.2)

                    # 計算收入（假設有毛利率）
                    margin = np.random.uniform(0.2, 0.4)
                    revenue = sales * margin

                    data.append({
                        'date': date.strftime('%Y-%m-%d'),
                        'category': category,
                        'region': region,
                        'product': product,
                        'quantity': quantity,
                        'sales': round(sales, 2),
                        'revenue': round(revenue, 2),
                        'is_weekend': is_weekend,
                        'is_promo': is_month_end
                    })

    return pd.DataFrame(data)

def generate_customer_data(num_customers=1000):
    """生成客戶數據"""
    np.random.seed(42)

    data = []

    for i in range(num_customers):
        # 註冊日期（過去一年內）
        days_ago = np.random.randint(0, 365)
        registration_date = datetime.now() - timedelta(days=days_ago)

        # 客戶屬性
        age = np.random.randint(18, 70)
        gender = np.random.choice(['Male', 'Female'])
        region = np.random.choice(['North', 'South', 'East', 'West', 'Central'])

        # 購買行為
        total_orders = np.random.randint(1, 50)
        total_spent = np.random.uniform(100, 10000)
        avg_order_value = total_spent / total_orders if total_orders > 0 else 0

        # 最後購買日期
        last_purchase_days = np.random.randint(0, min(days_ago, 90))
        last_purchase = datetime.now() - timedelta(days=last_purchase_days)

        # 客戶狀態
        is_active = last_purchase_days <= 30
        segment = 'VIP' if total_spent > 5000 else 'Regular' if total_spent > 1000 else 'New'

        data.append({
            'customer_id': f'C{i+1:04d}',
            'registration_date': registration_date.strftime('%Y-%m-%d'),
            'age': age,
            'gender': gender,
            'region': region,
            'total_orders': total_orders,
            'total_spent': round(total_spent, 2),
            'avg_order_value': round(avg_order_value, 2),
            'last_purchase_date': last_purchase.strftime('%Y-%m-%d'),
            'is_active': is_active,
            'segment': segment
        })

    return pd.DataFrame(data)

def generate_kpi_data():
    """生成 KPI 數據"""
    np.random.seed(42)

    # 當月 KPI
    current_month = {
        'total_revenue': np.random.uniform(1000000, 1500000),
        'total_orders': np.random.randint(3000, 5000),
        'active_customers': np.random.randint(10000, 15000),
        'avg_order_value': np.random.uniform(300, 400),
        'conversion_rate': np.random.uniform(0.02, 0.05),
        'customer_satisfaction': np.random.uniform(4.0, 4.8),
    }

    # 上月 KPI（用於計算變化）
    last_month = {
        'total_revenue': current_month['total_revenue'] / np.random.uniform(1.05, 1.25),
        'total_orders': int(current_month['total_orders'] / np.random.uniform(1.05, 1.20)),
        'active_customers': int(current_month['active_customers'] / np.random.uniform(1.10, 1.30)),
        'avg_order_value': current_month['avg_order_value'] / np.random.uniform(0.95, 1.05),
        'conversion_rate': current_month['conversion_rate'] / np.random.uniform(0.95, 1.05),
        'customer_satisfaction': current_month['customer_satisfaction'] / np.random.uniform(0.98, 1.02),
    }

    # 計算變化百分比
    kpis = []
    for key in current_month:
        change = ((current_month[key] - last_month[key]) / last_month[key]) * 100
        kpis.append({
            'metric': key,
            'current_value': round(current_month[key], 2),
            'previous_value': round(last_month[key], 2),
            'change_percent': round(change, 2)
        })

    return pd.DataFrame(kpis)

def main():
    """主函數：生成所有數據"""
    print("🚀 開始生成示例數據...")

    # 創建數據目錄
    os.makedirs('data', exist_ok=True)

    # 生成銷售數據
    print("📊 生成銷售數據...")
    sales_df = generate_sales_data(days=90)
    sales_df.to_csv('data/sales_data.csv', index=False)
    print(f"   ✓ 已生成 {len(sales_df)} 筆銷售記錄")

    # 生成客戶數據
    print("👥 生成客戶數據...")
    customer_df = generate_customer_data(num_customers=1000)
    customer_df.to_csv('data/customer_data.csv', index=False)
    print(f"   ✓ 已生成 {len(customer_df)} 筆客戶記錄")

    # 生成 KPI 數據
    print("📈 生成 KPI 數據...")
    kpi_df = generate_kpi_data()
    kpi_df.to_csv('data/kpi_data.csv', index=False)
    print(f"   ✓ 已生成 {len(kpi_df)} 個 KPI 指標")

    # 顯示數據統計
    print("\n📋 數據摘要:")
    print(f"\n銷售數據:")
    print(f"  - 日期範圍: {sales_df['date'].min()} 至 {sales_df['date'].max()}")
    print(f"  - 總銷售額: ${sales_df['sales'].sum():,.2f}")
    print(f"  - 平均每日銷售: ${sales_df.groupby('date')['sales'].sum().mean():,.2f}")

    print(f"\n客戶數據:")
    print(f"  - 總客戶數: {len(customer_df)}")
    print(f"  - 活躍客戶: {customer_df['is_active'].sum()}")
    print(f"  - VIP 客戶: {(customer_df['segment'] == 'VIP').sum()}")

    print("\n✅ 所有數據生成完成!")
    print("📁 數據已保存到 data/ 目錄")

if __name__ == '__main__':
    main()
