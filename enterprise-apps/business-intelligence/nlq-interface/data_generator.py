"""
数据生成器 - 创建示例数据库供 NLQ 查询
"""

import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os


def create_database():
    """创建示例数据库"""
    os.makedirs('data', exist_ok=True)
    db_path = 'data/database.db'

    # 删除旧数据库
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("🚀 创建示例数据库...")

    # ============ 1. 产品表 ============
    print("📦 创建产品表...")
    cursor.execute('''
    CREATE TABLE products (
        product_id INTEGER PRIMARY KEY,
        product_name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        cost REAL NOT NULL
    )
    ''')

    products_data = [
        (1, 'Laptop Pro', 'Electronics', 1200.00, 800.00),
        (2, 'Smartphone X', 'Electronics', 800.00, 500.00),
        (3, 'Tablet Plus', 'Electronics', 500.00, 300.00),
        (4, 'Headphones', 'Electronics', 150.00, 80.00),
        (5, 'T-Shirt', 'Clothing', 25.00, 10.00),
        (6, 'Jeans', 'Clothing', 60.00, 30.00),
        (7, 'Sneakers', 'Clothing', 80.00, 40.00),
        (8, 'Coffee Maker', 'Home', 120.00, 60.00),
        (9, 'Blender', 'Home', 80.00, 40.00),
        (10, 'Vacuum Cleaner', 'Home', 200.00, 120.00),
    ]

    cursor.executemany('INSERT INTO products VALUES (?,?,?,?,?)', products_data)
    print(f"   ✓ 插入 {len(products_data)} 个产品")

    # ============ 2. 客户表 ============
    print("👥 创建客户表...")
    cursor.execute('''
    CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY,
        customer_name TEXT NOT NULL,
        email TEXT NOT NULL,
        city TEXT NOT NULL,
        region TEXT NOT NULL,
        registration_date TEXT NOT NULL
    )
    ''')

    np.random.seed(42)
    cities = {
        'North': ['Beijing', 'Tianjin', 'Harbin'],
        'South': ['Guangzhou', 'Shenzhen', 'Nanning'],
        'East': ['Shanghai', 'Hangzhou', 'Nanjing'],
        'West': ['Chengdu', 'Chongqing', 'Xi\'an'],
        'Central': ['Wuhan', 'Changsha', 'Zhengzhou']
    }

    customers_data = []
    customer_id = 1
    for region, city_list in cities.items():
        for city in city_list:
            # 每个城市10-20个客户
            n_customers = np.random.randint(10, 21)
            for i in range(n_customers):
                reg_date = datetime.now() - timedelta(days=np.random.randint(30, 365))
                customers_data.append((
                    customer_id,
                    f'Customer_{customer_id}',
                    f'customer{customer_id}@example.com',
                    city,
                    region,
                    reg_date.strftime('%Y-%m-%d')
                ))
                customer_id += 1

    cursor.executemany('INSERT INTO customers VALUES (?,?,?,?,?,?)', customers_data)
    print(f"   ✓ 插入 {len(customers_data)} 个客户")

    # ============ 3. 订单表 ============
    print("📋 创建订单表...")
    cursor.execute('''
    CREATE TABLE orders (
        order_id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        order_date TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    )
    ''')

    # 生成过去180天的订单
    orders_data = []
    order_id = 1
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)

    for day in range(180):
        date = start_date + timedelta(days=day)
        # 每天10-50个订单
        n_orders = np.random.randint(10, 51)

        for _ in range(n_orders):
            customer_id = np.random.randint(1, len(customers_data) + 1)
            status = np.random.choice(
                ['completed', 'pending', 'cancelled'],
                p=[0.85, 0.10, 0.05]
            )

            orders_data.append((
                order_id,
                customer_id,
                date.strftime('%Y-%m-%d'),
                status
            ))
            order_id += 1

    cursor.executemany('INSERT INTO orders VALUES (?,?,?,?)', orders_data)
    print(f"   ✓ 插入 {len(orders_data)} 个订单")

    # ============ 4. 订单明细表 ============
    print("📊 创建订单明细表...")
    cursor.execute('''
    CREATE TABLE order_items (
        order_item_id INTEGER PRIMARY KEY,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    )
    ''')

    order_items_data = []
    order_item_id = 1

    for order_id in range(1, len(orders_data) + 1):
        # 每个订单1-5个产品
        n_items = np.random.randint(1, 6)

        for _ in range(n_items):
            product = products_data[np.random.randint(0, len(products_data))]
            product_id = product[0]
            base_price = product[3]

            # 价格有小幅波动
            unit_price = base_price * (1 + np.random.uniform(-0.1, 0.1))
            quantity = np.random.randint(1, 5)
            amount = unit_price * quantity

            order_items_data.append((
                order_item_id,
                order_id,
                product_id,
                quantity,
                round(unit_price, 2),
                round(amount, 2)
            ))
            order_item_id += 1

    cursor.executemany('INSERT INTO order_items VALUES (?,?,?,?,?,?)', order_items_data)
    print(f"   ✓ 插入 {len(order_items_data)} 个订单明细")

    # ============ 5. 销售汇总视图（便于查询）============
    print("📈 创建销售汇总表...")
    cursor.execute('''
    CREATE TABLE sales AS
    SELECT
        oi.order_item_id,
        o.order_id,
        o.order_date as date,
        c.customer_id,
        c.customer_name,
        c.city,
        c.region,
        p.product_id,
        p.product_name,
        p.category,
        oi.quantity,
        oi.unit_price,
        oi.amount,
        p.cost * oi.quantity as cost,
        oi.amount - (p.cost * oi.quantity) as profit
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    JOIN customers c ON o.customer_id = c.customer_id
    JOIN products p ON oi.product_id = p.product_id
    WHERE o.status = 'completed'
    ''')

    # 获取销售记录数
    cursor.execute('SELECT COUNT(*) FROM sales')
    sales_count = cursor.fetchone()[0]
    print(f"   ✓ 生成 {sales_count} 条销售记录")

    conn.commit()
    conn.close()

    print(f"\n✅ 数据库创建完成！")
    print(f"📁 文件位置: {db_path}")
    print_database_summary(db_path)


def print_database_summary(db_path):
    """打印数据库摘要"""
    conn = sqlite3.connect(db_path)

    print(f"\n📊 数据库摘要:")
    print("=" * 60)

    tables = ['products', 'customers', 'orders', 'order_items', 'sales']

    for table in tables:
        cursor = conn.cursor()
        cursor.execute(f'SELECT COUNT(*) FROM {table}')
        count = cursor.fetchone()[0]
        print(f"  {table.ljust(15)}: {count:>6} 行")

    print("=" * 60)

    # 一些示例统计
    print(f"\n💡 示例查询:")

    queries = [
        ("总销售额", "SELECT SUM(amount) as total FROM sales"),
        ("总订单数", "SELECT COUNT(DISTINCT order_id) FROM sales"),
        ("产品类别数", "SELECT COUNT(DISTINCT category) FROM products"),
        ("客户数", "SELECT COUNT(*) FROM customers"),
        ("地区数", "SELECT COUNT(DISTINCT region) FROM customers"),
    ]

    for name, query in queries:
        cursor = conn.cursor()
        cursor.execute(query)
        result = cursor.fetchone()[0]
        if isinstance(result, float):
            print(f"  {name}: ${result:,.2f}")
        else:
            print(f"  {name}: {result:,}")

    conn.close()

    print(f"\n🚀 现在可以运行应用:")
    print("   streamlit run app.py")


def main():
    create_database()


if __name__ == "__main__":
    main()
