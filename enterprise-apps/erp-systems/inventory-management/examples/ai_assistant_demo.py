"""
庫存管理AI輔助功能示例

展示如何使用AI助手進行智能庫存管理
"""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# 導入時需要處理相對導入問題
import sqlite3
from datetime import datetime

# 直接在這裡實現簡化版的InventoryManager來演示
class SimpleInventoryManager:
    """簡化的庫存管理器（用於演示）"""

    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = None

    def initialize_db(self):
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        cursor = self.conn.cursor()

        # 創建表
        cursor.execute('''CREATE TABLE IF NOT EXISTS products (
            code TEXT PRIMARY KEY, name TEXT, unit TEXT, min_quantity INTEGER)''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS warehouses (
            code TEXT PRIMARY KEY, name TEXT, location TEXT)''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS stock (
            product_code TEXT, warehouse_code TEXT, quantity INTEGER,
            PRIMARY KEY (product_code, warehouse_code))''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_type TEXT, product_code TEXT, warehouse_code TEXT,
            quantity INTEGER, operator TEXT, timestamp TEXT DEFAULT CURRENT_TIMESTAMP)''')
        self.conn.commit()

    def add_product(self, code, name, unit, min_quantity):
        self.conn.execute('INSERT OR IGNORE INTO products VALUES (?, ?, ?, ?)',
                         (code, name, unit, min_quantity))
        self.conn.commit()

    def add_warehouse(self, code, name, location):
        self.conn.execute('INSERT OR IGNORE INTO warehouses VALUES (?, ?, ?)',
                         (code, name, location))
        self.conn.commit()

    def stock_in(self, product_code, quantity, warehouse_code, operator=None):
        # 更新庫存
        cursor = self.conn.execute(
            'SELECT quantity FROM stock WHERE product_code=? AND warehouse_code=?',
            (product_code, warehouse_code))
        row = cursor.fetchone()

        if row:
            new_qty = row[0] + quantity
            self.conn.execute('UPDATE stock SET quantity=? WHERE product_code=? AND warehouse_code=?',
                            (new_qty, product_code, warehouse_code))
        else:
            self.conn.execute('INSERT INTO stock VALUES (?, ?, ?)',
                            (product_code, warehouse_code, quantity))

        # 記錄交易
        self.conn.execute('INSERT INTO transactions (transaction_type, product_code, warehouse_code, quantity, operator) VALUES (?, ?, ?, ?, ?)',
                         ('IN', product_code, warehouse_code, quantity, operator))
        self.conn.commit()

    def stock_out(self, product_code, quantity, warehouse_code, operator=None):
        cursor = self.conn.execute(
            'SELECT quantity FROM stock WHERE product_code=? AND warehouse_code=?',
            (product_code, warehouse_code))
        row = cursor.fetchone()

        if row and row[0] >= quantity:
            new_qty = row[0] - quantity
            self.conn.execute('UPDATE stock SET quantity=? WHERE product_code=? AND warehouse_code=?',
                            (new_qty, product_code, warehouse_code))
            self.conn.execute('INSERT INTO transactions (transaction_type, product_code, warehouse_code, quantity, operator) VALUES (?, ?, ?, ?, ?)',
                             ('OUT', product_code, warehouse_code, quantity, operator))
            self.conn.commit()

    def get_all_products(self):
        cursor = self.conn.execute('SELECT * FROM products')
        return [dict(row) for row in cursor.fetchall()]

    def get_stock(self, product_code):
        cursor = self.conn.execute('''
            SELECT s.*, p.name as product_name, w.name as warehouse_name
            FROM stock s
            JOIN products p ON s.product_code = p.code
            JOIN warehouses w ON s.warehouse_code = w.code
            WHERE s.product_code = ?
        ''', (product_code,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows] if rows else []

    def get_all_stock(self):
        cursor = self.conn.execute('''
            SELECT s.*, p.name as product_name, p.min_quantity, w.name as warehouse_name
            FROM stock s
            JOIN products p ON s.product_code = p.code
            JOIN warehouses w ON s.warehouse_code = w.code
            WHERE s.quantity > 0
        ''')
        return [dict(row) for row in cursor.fetchall()]

    def get_transactions(self, product_code=None, warehouse_code=None, transaction_type=None, limit=100):
        query = 'SELECT * FROM transactions WHERE 1=1'
        params = []

        if product_code:
            query += ' AND product_code = ?'
            params.append(product_code)
        if warehouse_code:
            query += ' AND warehouse_code = ?'
            params.append(warehouse_code)
        if transaction_type:
            query += ' AND transaction_type = ?'
            params.append(transaction_type)

        query += ' ORDER BY timestamp DESC LIMIT ?'
        params.append(limit)

        cursor = self.conn.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]

    def get_low_stock_products(self):
        cursor = self.conn.execute('''
            SELECT p.code, p.name, p.min_quantity, COALESCE(SUM(s.quantity), 0) as total_quantity
            FROM products p
            LEFT JOIN stock s ON p.code = s.product_code
            GROUP BY p.code
            HAVING total_quantity < p.min_quantity AND p.min_quantity > 0
        ''')
        return [dict(row) for row in cursor.fetchall()]

    def get_stock_summary(self):
        return {
            'total_products': self.conn.execute('SELECT COUNT(*) FROM products').fetchone()[0],
            'total_warehouses': self.conn.execute('SELECT COUNT(*) FROM warehouses').fetchone()[0],
            'total_stock_items': self.conn.execute('SELECT COUNT(*) FROM stock WHERE quantity > 0').fetchone()[0],
            'total_transactions': self.conn.execute('SELECT COUNT(*) FROM transactions').fetchone()[0],
        }

# 使用簡化版管理器
InventoryManager = SimpleInventoryManager

# 導入AI助手
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from ai_assistant import InventoryAIAssistant
from datetime import datetime, timedelta
import random


def setup_demo_data(manager):
    """建立演示數據"""
    print("=" * 60)
    print("正在建立演示數據...")
    print("=" * 60)

    # 新增產品
    products = [
        ('P001', '筆記型電腦', '台', 10),
        ('P002', '無線滑鼠', '個', 50),
        ('P003', '機械鍵盤', '個', 30),
        ('P004', '顯示器', '台', 15),
        ('P005', '滯銷商品-舊款耳機', '個', 20),
    ]

    for code, name, unit, min_qty in products:
        manager.add_product(code, name, unit, min_qty)
        print(f"✓ 新增產品: {code} - {name}")

    # 新增倉庫
    manager.add_warehouse('WH01', '台北倉', '台北市信義區')
    manager.add_warehouse('WH02', '台中倉', '台中市西屯區')
    print("✓ 新增倉庫: 台北倉、台中倉")

    # 模擬歷史入庫和出庫記錄
    print("\n正在模擬歷史交易記錄...")

    # 筆記型電腦 - 正常銷售
    manager.stock_in('P001', 100, 'WH01', operator='系統')
    for _ in range(30):  # 30天的出庫記錄
        qty = random.randint(1, 3)
        manager.stock_out('P001', qty, 'WH01', operator='系統')

    # 無線滑鼠 - 熱銷商品
    manager.stock_in('P002', 200, 'WH01', operator='系統')
    for _ in range(30):  # 頻繁出庫
        qty = random.randint(3, 8)
        manager.stock_out('P002', qty, 'WH01', operator='系統')

    # 機械鍵盤 - 中等銷售
    manager.stock_in('P003', 150, 'WH01', operator='系統')
    for _ in range(20):
        qty = random.randint(2, 5)
        manager.stock_out('P003', qty, 'WH01', operator='系統')

    # 顯示器 - 需要補貨
    manager.stock_in('P004', 50, 'WH01', operator='系統')
    for _ in range(30):
        qty = random.randint(1, 2)
        manager.stock_out('P004', qty, 'WH01', operator='系統')

    # 滯銷商品 - 長時間無出庫
    manager.stock_in('P005', 100, 'WH01', operator='系統')
    # 只有少量出庫
    manager.stock_out('P005', 5, 'WH01', operator='系統')

    print("✓ 已建立30天的模擬交易記錄")
    print()


def demo_reorder_suggestions(ai_assistant):
    """示例1: 智能補貨建議"""
    print("=" * 60)
    print("【示例1】智能補貨建議")
    print("=" * 60)

    suggestions = ai_assistant.suggest_reorder(days_to_analyze=30)

    if not suggestions:
        print("目前所有產品庫存充足，無需補貨\n")
        return

    print(f"分析了過去30天的數據，發現 {len(suggestions)} 個產品需要補貨：\n")

    for i, suggestion in enumerate(suggestions, 1):
        urgency_icon = {
            'high': '🔴',
            'medium': '🟡',
            'low': '🟢'
        }[suggestion['urgency']]

        print(f"{i}. {urgency_icon} {suggestion['product_name']} ({suggestion['product_code']})")
        print(f"   當前庫存: {suggestion['current_stock']:.0f} 個")
        print(f"   平均每日消耗: {suggestion['avg_daily_consumption']:.1f} 個")
        print(f"   建議補貨: {suggestion['reorder_quantity']:.0f} 個")
        print(f"   預計用完: {suggestion['days_until_stockout']:.1f} 天")
        print(f"   建議: {suggestion['reason']}")
        print()


def demo_slow_moving_analysis(ai_assistant):
    """示例2: 滯銷品分析"""
    print("=" * 60)
    print("【示例2】滯銷品分析")
    print("=" * 60)

    slow_moving = ai_assistant.analyze_slow_moving_stock(days_threshold=15)

    if not slow_moving:
        print("沒有發現滯銷商品\n")
        return

    print(f"發現 {len(slow_moving)} 個滯銷商品（超過15天無出庫）：\n")

    for i, item in enumerate(slow_moving, 1):
        print(f"{i}. {item['product_name']} ({item['product_code']})")
        print(f"   倉庫: {item['warehouse']}")
        print(f"   庫存數量: {item['quantity']} 個")
        print(f"   最後出庫: {item['last_outbound_date']}")
        print(f"   滯銷天數: {item['days_since_last_outbound']} 天")
        print(f"   建議: {item['suggestion']}")
        print()


def demo_demand_prediction(ai_assistant):
    """示例3: 需求預測"""
    print("=" * 60)
    print("【示例3】需求預測")
    print("=" * 60)

    products_to_predict = ['P001', 'P002', 'P003']

    print("預測未來30天的產品需求：\n")

    for product_code in products_to_predict:
        prediction = ai_assistant.predict_stock_demand(product_code, days_ahead=30)

        confidence_icon = {
            'high': '✅',
            'medium': '⚠️',
            'low': '❌'
        }[prediction['confidence']]

        print(f"產品: {product_code}")
        print(f"預測總需求: {prediction.get('predicted_total_demand', 0):.0f} 個")
        print(f"平均每日需求: {prediction.get('avg_daily_demand', 0):.1f} 個")
        print(f"置信度: {confidence_icon} {prediction['confidence']}")
        print(f"建議: {prediction.get('recommendation', prediction.get('message', ''))}")
        print()


def demo_warehouse_optimization(ai_assistant):
    """示例4: 倉庫庫存優化"""
    print("=" * 60)
    print("【示例4】倉庫庫存優化建議")
    print("=" * 60)

    # 先建立一些跨倉庫的測試數據
    manager = ai_assistant.inventory_manager

    # 在兩個倉庫都有庫存的產品
    manager.stock_in('P001', 50, 'WH02', operator='系統')
    for _ in range(5):  # WH02少量出庫
        manager.stock_out('P001', 1, 'WH02', operator='系統')

    recommendations = ai_assistant.optimize_warehouse_allocation()

    if not recommendations:
        print("當前倉庫庫存分布合理，無需調整\n")
        return

    print(f"發現 {len(recommendations)} 個庫存分布優化建議：\n")

    for i, rec in enumerate(recommendations, 1):
        action_icon = '📥' if rec['action'] == '調入' else '📤'

        print(f"{i}. {action_icon} {rec['product_name']} @ {rec['warehouse']}")
        print(f"   當前庫存: {rec['current_stock']:.0f} 個")
        print(f"   理想庫存: {rec['ideal_stock']:.0f} 個")
        print(f"   建議{rec['action']}: {abs(rec['adjustment']):.0f} 個")
        print(f"   原因: {rec['reason']}")
        print()


def demo_health_report(ai_assistant):
    """示例5: 庫存健康度報告"""
    print("=" * 60)
    print("【示例5】庫存健康度報告")
    print("=" * 60)

    report = ai_assistant.get_inventory_health_report()

    # 健康度評級圖標
    grade_icons = {
        'excellent': '🌟',
        'good': '👍',
        'fair': '⚠️',
        'poor': '❌'
    }

    print(f"健康度評分: {report['health_score']}/100 {grade_icons[report['health_grade']]}")
    print(f"評級: {report['health_grade'].upper()}")
    print(f"評語: {report['health_message']}\n")

    print("庫存概況:")
    print(f"  總產品數: {report['summary']['total_products']}")
    print(f"  總倉庫數: {report['summary']['total_warehouses']}")
    print(f"  庫存項目數: {report['summary']['total_stock_items']}")
    print(f"  異動記錄數: {report['summary']['total_transactions']}\n")

    print("發現的問題:")
    print(f"  🔴 低庫存產品: {report['issues']['low_stock_count']} 個")
    print(f"  🟡 緊急補貨需求: {report['issues']['urgent_reorder_count']} 個")
    print(f"  🟠 滯銷商品: {report['issues']['slow_moving_count']} 個\n")

    print("AI建議:")
    print(f"  需要立即處理: {report['recommendations']['immediate_actions']} 項")
    print(f"  補貨建議: {report['recommendations']['reorder_suggestions']} 項")
    print(f"  滯銷處理: {report['recommendations']['slow_moving_items']} 項")
    print()


def main():
    """主程序"""
    print("\n")
    print("╔════════════════════════════════════════════════════════╗")
    print("║     庫存管理系統 - AI輔助功能演示                      ║")
    print("║     Inventory Management System - AI Demo            ║")
    print("╚════════════════════════════════════════════════════════╝")
    print("\n")

    # 初始化管理器
    db_path = 'demo_inventory_ai.db'
    if os.path.exists(db_path):
        os.remove(db_path)

    manager = InventoryManager(db_path)
    manager.initialize_db()

    # 建立演示數據
    setup_demo_data(manager)

    # 初始化AI助手
    ai_assistant = InventoryAIAssistant(manager)

    # 運行各個示例
    demo_reorder_suggestions(ai_assistant)
    demo_slow_moving_analysis(ai_assistant)
    demo_demand_prediction(ai_assistant)
    demo_warehouse_optimization(ai_assistant)
    demo_health_report(ai_assistant)

    print("=" * 60)
    print("演示完成！")
    print("=" * 60)
    print(f"數據庫文件: {db_path}")
    print("您可以使用 SQLite 工具查看數據庫內容")
    print()

    # 清理
    if os.path.exists(db_path):
        os.remove(db_path)
        print("已清理演示數據庫")


if __name__ == '__main__':
    main()
