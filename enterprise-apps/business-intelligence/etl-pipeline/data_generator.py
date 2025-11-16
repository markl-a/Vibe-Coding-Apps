"""
ETL 數據管道 - 示例數據生成器
生成模擬的源數據用於 ETL 演示
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_source_data():
    """生成多個源數據文件"""
    np.random.seed(42)

    # 1. 訂單數據（主表）
    print("📦 生成訂單數據...")
    num_orders = 5000
    end_date = datetime.now()
    start_date = end_date - timedelta(days=90)

    orders = []
    for i in range(num_orders):
        order_date = start_date + timedelta(days=np.random.randint(0, 91))
        orders.append({
            'order_id': f'ORD{i+1:06d}',
            'customer_id': f'C{np.random.randint(1, 501):04d}',
            'product_id': f'P{np.random.randint(1, 51):03d}',
            'quantity': np.random.randint(1, 11),
            'unit_price': round(np.random.uniform(10, 1000), 2),
            'order_date': order_date.strftime('%Y-%m-%d'),
            'status': np.random.choice(['completed', 'pending', 'cancelled'], p=[0.8, 0.15, 0.05]),
            'channel': np.random.choice(['online', 'store', 'mobile']),
            'updated_at': (order_date + timedelta(hours=np.random.randint(1, 48))).isoformat()
        })

    orders_df = pd.DataFrame(orders)
    # 添加一些缺失值來演示數據清洗
    orders_df.loc[orders_df.sample(frac=0.05).index, 'customer_id'] = None
    orders_df.to_csv('data/input/orders.csv', index=False)
    print(f"   ✓ 已生成 {len(orders_df)} 筆訂單")

    # 2. 客戶數據（維度表）
    print("👥 生成客戶數據...")
    customers = []
    for i in range(500):
        reg_date = start_date - timedelta(days=np.random.randint(0, 365))
        customers.append({
            'customer_id': f'C{i+1:04d}',
            'name': f'Customer {i+1}',
            'email': f'customer{i+1}@example.com',
            'region': np.random.choice(['North', 'South', 'East', 'West', 'Central']),
            'segment': np.random.choice(['VIP', 'Regular', 'New'], p=[0.1, 0.6, 0.3]),
            'registration_date': reg_date.strftime('%Y-%m-%d'),
            'status': 'active' if np.random.random() > 0.1 else 'inactive'
        })

    customers_df = pd.DataFrame(customers)
    customers_df.to_csv('data/input/customers.csv', index=False)
    print(f"   ✓ 已生成 {len(customers_df)} 筆客戶資料")

    # 3. 產品數據（維度表）
    print("📦 生成產品數據...")
    categories = ['Electronics', 'Clothing', 'Home', 'Books', 'Sports']
    products = []
    for i in range(50):
        category = np.random.choice(categories)
        products.append({
            'product_id': f'P{i+1:03d}',
            'name': f'{category} Product {i+1}',
            'category': category,
            'brand': f'Brand {np.random.randint(1, 11)}',
            'cost': round(np.random.uniform(5, 500), 2),
            'price': round(np.random.uniform(10, 1000), 2),
            'stock': np.random.randint(0, 1000)
        })

    products_df = pd.DataFrame(products)
    products_df.to_csv('data/input/products.csv', index=False)
    print(f"   ✓ 已生成 {len(products_df)} 筆產品資料")

    # 4. 生成 JSON 格式的 API 響應示例
    print("📡 生成 API 響應示例...")
    api_data = {
        'timestamp': datetime.now().isoformat(),
        'data': orders[:10],  # 前 10 筆訂單
        'total': len(orders),
        'page': 1,
        'per_page': 10
    }

    import json
    with open('data/input/api_response.json', 'w') as f:
        json.dump(api_data, f, indent=2)
    print("   ✓ 已生成 API 響應示例")

    return orders_df, customers_df, products_df

def generate_etl_results():
    """生成 ETL 處理後的示例結果"""
    print("\n🔄 生成 ETL 處理結果示例...")

    # 載入源數據
    orders_df = pd.read_csv('data/input/orders.csv')
    customers_df = pd.read_csv('data/input/customers.csv')
    products_df = pd.read_csv('data/input/products.csv')

    # 模擬 ETL 處理：清洗、關聯、聚合
    # 1. 清洗：移除缺失值
    clean_orders = orders_df.dropna()

    # 2. 關聯：訂單 + 客戶 + 產品
    merged = clean_orders.merge(customers_df, on='customer_id', how='left') \
                         .merge(products_df, on='product_id', how='left')

    # 3. 計算
    merged['amount'] = merged['quantity'] * merged['unit_price']
    merged['profit'] = merged['amount'] - (merged['quantity'] * merged['cost'])

    # 4. 聚合：按客戶、日期聚合
    fact_sales = merged.groupby(['customer_id', 'order_date']).agg({
        'order_id': 'count',
        'amount': 'sum',
        'profit': 'sum',
        'quantity': 'sum'
    }).reset_index()

    fact_sales.columns = ['customer_id', 'date', 'order_count', 'revenue', 'profit', 'quantity']

    # 保存結果
    fact_sales.to_csv('data/output/fact_sales.csv', index=False)
    print(f"   ✓ 已生成 {len(fact_sales)} 筆銷售事實表記錄")

    return fact_sales

def main():
    """主函數"""
    print("🚀 開始生成 ETL 示例數據...\n")

    # 創建目錄
    os.makedirs('data/input', exist_ok=True)
    os.makedirs('data/output', exist_ok=True)
    os.makedirs('data/failed', exist_ok=True)

    # 生成源數據
    orders_df, customers_df, products_df = generate_source_data()

    # 生成處理結果
    fact_sales = generate_etl_results()

    # 統計信息
    print("\n📋 數據摘要:")
    print(f"  - 訂單總數: {len(orders_df):,}")
    print(f"  - 客戶總數: {len(customers_df):,}")
    print(f"  - 產品總數: {len(products_df):,}")
    print(f"  - 處理後記錄: {len(fact_sales):,}")

    print("\n✅ 所有數據生成完成!")
    print("📁 數據已保存到 data/ 目錄")
    print("   - 源數據: data/input/")
    print("   - 處理結果: data/output/")

if __name__ == '__main__':
    main()
