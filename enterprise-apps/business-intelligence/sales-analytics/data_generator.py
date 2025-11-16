"""
銷售分析平台 - 數據生成器
生成模擬的銷售數據用於分析演示
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_sales_data(days=365, num_customers=500):
    """生成詳細銷售數據"""
    np.random.seed(42)

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # 產品目錄
    products = [
        {'id': 'P001', 'name': 'Laptop Pro', 'category': 'Electronics', 'price': 1299.99},
        {'id': 'P002', 'name': 'Smartphone X', 'category': 'Electronics', 'price': 899.99},
        {'id': 'P003', 'name': 'Tablet Plus', 'category': 'Electronics', 'price': 599.99},
        {'id': 'P004', 'name': 'Wireless Headphones', 'category': 'Electronics', 'price': 199.99},
        {'id': 'P005', 'name': 'Smart Watch', 'category': 'Electronics', 'price': 399.99},
        {'id': 'P006', 'name': 'T-Shirt', 'category': 'Clothing', 'price': 29.99},
        {'id': 'P007', 'name': 'Jeans', 'category': 'Clothing', 'price': 79.99},
        {'id': 'P008', 'name': 'Sneakers', 'category': 'Clothing', 'price': 119.99},
        {'id': 'P009', 'name': 'Coffee Maker', 'category': 'Home', 'price': 89.99},
        {'id': 'P010', 'name': 'Blender', 'category': 'Home', 'price': 59.99},
    ]

    channels = ['Online', 'Store', 'Mobile App', 'Phone']
    regions = ['North', 'South', 'East', 'West', 'Central']

    sales_data = []
    order_id = 1

    for day in range(days):
        current_date = start_date + timedelta(days=day)

        # 每日訂單數（週末較多）
        is_weekend = current_date.dayofweek >= 5
        base_orders = 50
        daily_orders = int(base_orders * (1.5 if is_weekend else 1.0))

        # 添加季節性（年底銷售旺季）
        month = current_date.month
        seasonal_factor = 1.5 if month in [11, 12] else 1.0
        daily_orders = int(daily_orders * seasonal_factor)

        for _ in range(daily_orders):
            customer_id = f"C{np.random.randint(1, num_customers+1):04d}"
            channel = np.random.choice(channels, p=[0.4, 0.3, 0.25, 0.05])
            region = np.random.choice(regions)

            # 每個訂單可能包含多個商品
            num_items = np.random.choice([1, 2, 3], p=[0.6, 0.3, 0.1])

            for _ in range(num_items):
                product = np.random.choice(products)
                quantity = np.random.choice([1, 2, 3], p=[0.7, 0.2, 0.1])

                # 添加價格波動
                price = product['price'] * np.random.uniform(0.9, 1.1)
                revenue = price * quantity

                sales_data.append({
                    'date': current_date.strftime('%Y-%m-%d'),
                    'order_id': f'ORD{order_id:06d}',
                    'customer_id': customer_id,
                    'product_id': product['id'],
                    'product_name': product['name'],
                    'category': product['category'],
                    'quantity': quantity,
                    'price': round(price, 2),
                    'revenue': round(revenue, 2),
                    'channel': channel,
                    'region': region
                })

            order_id += 1

    return pd.DataFrame(sales_data)

def generate_customer_transactions(sales_df):
    """從銷售數據生成客戶交易彙總"""
    transactions = sales_df.groupby(['customer_id', 'date', 'order_id']).agg({
        'revenue': 'sum',
        'product_id': 'count'
    }).reset_index()

    transactions.columns = ['customer_id', 'purchase_date', 'order_id', 'amount', 'product_count']

    return transactions

def generate_funnel_data(num_visitors=10000):
    """生成漏斗數據"""
    np.random.seed(42)

    data = []

    for i in range(num_visitors):
        visitor_id = f'V{i+1:06d}'
        date = datetime.now() - timedelta(days=np.random.randint(0, 30))

        # 漏斗轉化率
        visitor = {'visitor_id': visitor_id, 'date': date.strftime('%Y-%m-%d')}

        # 階段 1: 訪問 (100%)
        visitor['visited'] = 1

        # 階段 2: 查看商品 (70%)
        if np.random.random() < 0.7:
            visitor['viewed_product'] = 1

            # 階段 3: 加入購物車 (40%)
            if np.random.random() < 0.4:
                visitor['added_to_cart'] = 1

                # 階段 4: 開始結帳 (60%)
                if np.random.random() < 0.6:
                    visitor['started_checkout'] = 1

                    # 階段 5: 完成購買 (75%)
                    if np.random.random() < 0.75:
                        visitor['completed_purchase'] = 1
                    else:
                        visitor['completed_purchase'] = 0
                else:
                    visitor['started_checkout'] = 0
                    visitor['completed_purchase'] = 0
            else:
                visitor['added_to_cart'] = 0
                visitor['started_checkout'] = 0
                visitor['completed_purchase'] = 0
        else:
            visitor['viewed_product'] = 0
            visitor['added_to_cart'] = 0
            visitor['started_checkout'] = 0
            visitor['completed_purchase'] = 0

        data.append(visitor)

    return pd.DataFrame(data)

def main():
    """主函數：生成所有數據"""
    print("🚀 開始生成銷售分析數據...")

    # 創建數據目錄
    os.makedirs('data', exist_ok=True)

    # 1. 生成銷售數據
    print("📊 生成銷售數據...")
    sales_df = generate_sales_data(days=365, num_customers=500)
    sales_df.to_csv('data/sales_data.csv', index=False)
    print(f"   ✓ 已生成 {len(sales_df)} 筆銷售記錄")

    # 2. 生成客戶交易數據
    print("👥 生成客戶交易數據...")
    transactions_df = generate_customer_transactions(sales_df)
    transactions_df.to_csv('data/customer_transactions.csv', index=False)
    print(f"   ✓ 已生成 {len(transactions_df)} 筆交易記錄")

    # 3. 生成漏斗數據
    print("🔽 生成漏斗數據...")
    funnel_df = generate_funnel_data(num_visitors=10000)
    funnel_df.to_csv('data/funnel_data.csv', index=False)
    print(f"   ✓ 已生成 {len(funnel_df)} 筆訪客記錄")

    # 數據統計
    print("\n📋 數據摘要:")
    print(f"\n銷售數據:")
    print(f"  - 時間範圍: {sales_df['date'].min()} 至 {sales_df['date'].max()}")
    print(f"  - 總收入: ${sales_df['revenue'].sum():,.2f}")
    print(f"  - 訂單數: {sales_df['order_id'].nunique():,}")
    print(f"  - 客戶數: {sales_df['customer_id'].nunique():,}")

    print(f"\n漏斗轉化:")
    print(f"  - 訪客數: {funnel_df['visited'].sum():,}")
    print(f"  - 查看商品: {funnel_df['viewed_product'].sum():,} ({funnel_df['viewed_product'].mean():.1%})")
    print(f"  - 加購物車: {funnel_df['added_to_cart'].sum():,} ({funnel_df['added_to_cart'].mean():.1%})")
    print(f"  - 開始結帳: {funnel_df['started_checkout'].sum():,} ({funnel_df['started_checkout'].mean():.1%})")
    print(f"  - 完成購買: {funnel_df['completed_purchase'].sum():,} ({funnel_df['completed_purchase'].mean():.1%})")

    print("\n✅ 所有數據生成完成!")
    print("📁 數據已保存到 data/ 目錄")

if __name__ == '__main__':
    main()
