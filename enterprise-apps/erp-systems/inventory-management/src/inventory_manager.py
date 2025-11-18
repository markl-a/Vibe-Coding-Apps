"""
庫存管理核心模組
"""
import sqlite3
from typing import List, Dict, Optional
from datetime import datetime
from .database import Database
from .models import Product, Warehouse, Stock, Transaction


class InventoryManager:
    """庫存管理器"""

    def __init__(self, db_path: str = 'inventory.db'):
        """初始化庫存管理器"""
        self.db = Database(db_path)

    def initialize_db(self):
        """初始化數據庫"""
        self.db.initialize()

    # ========== 產品管理 ==========

    def add_product(self, code: str, name: str, unit: str,
                    min_quantity: int = 0, description: str = None) -> bool:
        """新增產品"""
        with self.db as db:
            try:
                db.execute(
                    '''INSERT INTO products (code, name, unit, min_quantity, description)
                       VALUES (?, ?, ?, ?, ?)''',
                    (code, name, unit, min_quantity, description)
                )
                return True
            except sqlite3.IntegrityError:
                return False

    def get_product(self, code: str) -> Optional[Dict]:
        """獲取產品資訊"""
        with self.db as db:
            return db.fetchone('SELECT * FROM products WHERE code = ?', (code,))

    def get_all_products(self) -> List[Dict]:
        """獲取所有產品"""
        with self.db as db:
            return db.fetchall('SELECT * FROM products ORDER BY code')

    def update_product(self, code: str, **kwargs) -> bool:
        """更新產品資訊"""
        allowed_fields = ['name', 'unit', 'min_quantity', 'description']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}

        if not updates:
            return False

        set_clause = ', '.join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [code]

        with self.db as db:
            db.execute(f'UPDATE products SET {set_clause} WHERE code = ?', tuple(values))
            return True

    # ========== 倉庫管理 ==========

    def add_warehouse(self, code: str, name: str,
                      location: str = None, description: str = None) -> bool:
        """新增倉庫"""
        with self.db as db:
            try:
                db.execute(
                    '''INSERT INTO warehouses (code, name, location, description)
                       VALUES (?, ?, ?, ?)''',
                    (code, name, location, description)
                )
                return True
            except sqlite3.IntegrityError:
                return False

    def get_warehouse(self, code: str) -> Optional[Dict]:
        """獲取倉庫資訊"""
        with self.db as db:
            return db.fetchone('SELECT * FROM warehouses WHERE code = ?', (code,))

    def get_all_warehouses(self) -> List[Dict]:
        """獲取所有倉庫"""
        with self.db as db:
            return db.fetchall('SELECT * FROM warehouses ORDER BY code')

    # ========== 庫存操作 ==========

    def stock_in(self, product_code: str, quantity: int, warehouse_code: str,
                 batch_no: str = None, reference: str = None,
                 operator: str = None, notes: str = None) -> bool:
        """入庫操作"""
        if quantity <= 0:
            raise ValueError("入庫數量必須大於 0")

        with self.db as db:
            # 檢查產品和倉庫是否存在
            product = db.fetchone('SELECT code FROM products WHERE code = ?', (product_code,))
            warehouse = db.fetchone('SELECT code FROM warehouses WHERE code = ?', (warehouse_code,))

            if not product:
                raise ValueError(f"產品 {product_code} 不存在")
            if not warehouse:
                raise ValueError(f"倉庫 {warehouse_code} 不存在")

            # 更新庫存
            stock = db.fetchone(
                'SELECT quantity FROM stock WHERE product_code = ? AND warehouse_code = ?',
                (product_code, warehouse_code)
            )

            if stock:
                new_quantity = stock['quantity'] + quantity
                db.execute(
                    '''UPDATE stock SET quantity = ?, last_updated = CURRENT_TIMESTAMP
                       WHERE product_code = ? AND warehouse_code = ?''',
                    (new_quantity, product_code, warehouse_code)
                )
            else:
                db.execute(
                    '''INSERT INTO stock (product_code, warehouse_code, quantity)
                       VALUES (?, ?, ?)''',
                    (product_code, warehouse_code, quantity)
                )

            # 記錄異動
            db.execute(
                '''INSERT INTO transactions
                   (transaction_type, product_code, warehouse_code, quantity,
                    batch_no, reference, operator, notes)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                ('IN', product_code, warehouse_code, quantity,
                 batch_no, reference, operator, notes)
            )

            return True

    def stock_out(self, product_code: str, quantity: int, warehouse_code: str,
                  reference: str = None, operator: str = None, notes: str = None) -> bool:
        """出庫操作"""
        if quantity <= 0:
            raise ValueError("出庫數量必須大於 0")

        with self.db as db:
            # 檢查庫存是否足夠
            stock = db.fetchone(
                'SELECT quantity FROM stock WHERE product_code = ? AND warehouse_code = ?',
                (product_code, warehouse_code)
            )

            if not stock:
                raise ValueError(f"產品 {product_code} 在倉庫 {warehouse_code} 無庫存")

            if stock['quantity'] < quantity:
                raise ValueError(
                    f"庫存不足！當前庫存: {stock['quantity']}, 需要出庫: {quantity}"
                )

            # 更新庫存
            new_quantity = stock['quantity'] - quantity
            db.execute(
                '''UPDATE stock SET quantity = ?, last_updated = CURRENT_TIMESTAMP
                   WHERE product_code = ? AND warehouse_code = ?''',
                (new_quantity, product_code, warehouse_code)
            )

            # 記錄異動
            db.execute(
                '''INSERT INTO transactions
                   (transaction_type, product_code, warehouse_code, quantity,
                    reference, operator, notes)
                   VALUES (?, ?, ?, ?, ?, ?, ?)''',
                ('OUT', product_code, warehouse_code, quantity,
                 reference, operator, notes)
            )

            return True

    # ========== 庫存查詢 ==========

    def get_stock(self, product_code: str, warehouse_code: str = None) -> Dict | List[Dict]:
        """查詢庫存"""
        with self.db as db:
            if warehouse_code:
                stock = db.fetchone(
                    '''SELECT s.*, p.name as product_name, p.unit, w.name as warehouse_name
                       FROM stock s
                       JOIN products p ON s.product_code = p.code
                       JOIN warehouses w ON s.warehouse_code = w.code
                       WHERE s.product_code = ? AND s.warehouse_code = ?''',
                    (product_code, warehouse_code)
                )
                return stock if stock else {'quantity': 0}
            else:
                return db.fetchall(
                    '''SELECT s.*, p.name as product_name, p.unit, w.name as warehouse_name
                       FROM stock s
                       JOIN products p ON s.product_code = p.code
                       JOIN warehouses w ON s.warehouse_code = w.code
                       WHERE s.product_code = ?''',
                    (product_code,)
                )

    def get_all_stock(self) -> List[Dict]:
        """獲取所有庫存"""
        with self.db as db:
            return db.fetchall(
                '''SELECT s.*, p.name as product_name, p.unit,
                          w.name as warehouse_name, p.min_quantity
                   FROM stock s
                   JOIN products p ON s.product_code = p.code
                   JOIN warehouses w ON s.warehouse_code = w.code
                   WHERE s.quantity > 0
                   ORDER BY s.product_code, s.warehouse_code'''
            )

    def get_low_stock_products(self) -> List[Dict]:
        """獲取低庫存產品（庫存低於最低庫存量）"""
        with self.db as db:
            return db.fetchall(
                '''SELECT p.code, p.name, p.unit, p.min_quantity,
                          COALESCE(SUM(s.quantity), 0) as total_quantity,
                          w.code as warehouse_code, w.name as warehouse_name,
                          s.quantity as warehouse_quantity
                   FROM products p
                   LEFT JOIN stock s ON p.code = s.product_code
                   LEFT JOIN warehouses w ON s.warehouse_code = w.code
                   WHERE p.min_quantity > 0
                   GROUP BY p.code, w.code
                   HAVING COALESCE(s.quantity, 0) < p.min_quantity
                   ORDER BY p.code'''
            )

    # ========== 異動記錄 ==========

    def get_transactions(self, product_code: str = None, warehouse_code: str = None,
                        transaction_type: str = None, limit: int = 100) -> List[Dict]:
        """查詢異動記錄"""
        query = '''SELECT t.*, p.name as product_name, w.name as warehouse_name
                   FROM transactions t
                   JOIN products p ON t.product_code = p.code
                   JOIN warehouses w ON t.warehouse_code = w.code
                   WHERE 1=1'''
        params = []

        if product_code:
            query += ' AND t.product_code = ?'
            params.append(product_code)

        if warehouse_code:
            query += ' AND t.warehouse_code = ?'
            params.append(warehouse_code)

        if transaction_type:
            query += ' AND t.transaction_type = ?'
            params.append(transaction_type.upper())

        query += ' ORDER BY t.timestamp DESC LIMIT ?'
        params.append(limit)

        with self.db as db:
            return db.fetchall(query, tuple(params))

    def get_stock_summary(self) -> Dict:
        """獲取庫存摘要統計"""
        with self.db as db:
            summary = {
                'total_products': db.fetchone('SELECT COUNT(*) as count FROM products')['count'],
                'total_warehouses': db.fetchone('SELECT COUNT(*) as count FROM warehouses')['count'],
                'total_stock_items': db.fetchone('SELECT COUNT(*) as count FROM stock WHERE quantity > 0')['count'],
                'low_stock_count': len(self.get_low_stock_products()),
                'total_transactions': db.fetchone('SELECT COUNT(*) as count FROM transactions')['count'],
            }
            return summary


import sqlite3
