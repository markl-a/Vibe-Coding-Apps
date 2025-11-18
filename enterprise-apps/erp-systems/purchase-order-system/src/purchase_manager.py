"""
採購訂單管理核心模組
"""
import sqlite3
from typing import List, Dict, Optional
from datetime import datetime


class PurchaseManager:
    """採購訂單管理器"""

    def __init__(self, db_path: str = 'purchase.db'):
        """初始化管理器"""
        self.db_path = db_path

    def _get_connection(self):
        """獲取數據庫連接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def initialize_db(self):
        """初始化數據庫"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # 供應商表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS suppliers (
                code TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                contact_person TEXT,
                phone TEXT,
                email TEXT,
                address TEXT,
                payment_terms TEXT,
                rating INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # 採購訂單表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_no TEXT UNIQUE NOT NULL,
                supplier_code TEXT NOT NULL,
                order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'DRAFT',
                total_amount REAL DEFAULT 0,
                requester TEXT,
                approver TEXT,
                approved_at TIMESTAMP,
                delivery_date TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_code) REFERENCES suppliers(code)
            )
        ''')

        # 訂單明細表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_code TEXT NOT NULL,
                product_name TEXT,
                quantity INTEGER NOT NULL,
                unit_price REAL NOT NULL,
                received_quantity INTEGER DEFAULT 0,
                FOREIGN KEY (order_id) REFERENCES purchase_orders(id)
            )
        ''')

        # 收貨記錄表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS receipts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                receipt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                receiver TEXT,
                notes TEXT,
                FOREIGN KEY (order_id) REFERENCES purchase_orders(id)
            )
        ''')

        # 收貨明細表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS receipt_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                receipt_id INTEGER NOT NULL,
                product_code TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                FOREIGN KEY (receipt_id) REFERENCES receipts(id)
            )
        ''')

        conn.commit()
        conn.close()

    # ========== 供應商管理 ==========

    def add_supplier(self, code: str, name: str, contact_person: str = None,
                    phone: str = None, email: str = None, address: str = None,
                    payment_terms: str = None, rating: int = None) -> bool:
        """新增供應商"""
        conn = self._get_connection()
        try:
            conn.execute(
                '''INSERT INTO suppliers
                   (code, name, contact_person, phone, email, address, payment_terms, rating)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                (code, name, contact_person, phone, email, address, payment_terms, rating)
            )
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
        finally:
            conn.close()

    def get_supplier(self, code: str) -> Optional[Dict]:
        """獲取供應商資訊"""
        conn = self._get_connection()
        row = conn.execute('SELECT * FROM suppliers WHERE code = ?', (code,)).fetchone()
        conn.close()
        return dict(row) if row else None

    def get_all_suppliers(self) -> List[Dict]:
        """獲取所有供應商"""
        conn = self._get_connection()
        rows = conn.execute('SELECT * FROM suppliers ORDER BY code').fetchall()
        conn.close()
        return [dict(row) for row in rows]

    # ========== 採購訂單管理 ==========

    def create_order(self, supplier_code: str, items: List[Dict],
                    requester: str = None, delivery_date: str = None,
                    notes: str = None) -> int:
        """創建採購訂單"""
        conn = self._get_connection()

        # 檢查供應商是否存在
        supplier = conn.execute('SELECT code FROM suppliers WHERE code = ?',
                               (supplier_code,)).fetchone()
        if not supplier:
            conn.close()
            raise ValueError(f"供應商 {supplier_code} 不存在")

        # 生成唯一訂單編號（加入微秒避免重複）
        import time
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        microsecond = int(time.time() * 1000000) % 1000000
        order_no = f"PO{timestamp}{microsecond:06d}"

        # 計算訂單總額
        total_amount = sum(item['quantity'] * item['unit_price'] for item in items)

        # 創建訂單
        cursor = conn.execute(
            '''INSERT INTO purchase_orders
               (order_no, supplier_code, total_amount, requester, delivery_date, notes)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (order_no, supplier_code, total_amount, requester, delivery_date, notes)
        )
        order_id = cursor.lastrowid

        # 新增訂單明細
        for item in items:
            conn.execute(
                '''INSERT INTO order_items
                   (order_id, product_code, product_name, quantity, unit_price)
                   VALUES (?, ?, ?, ?, ?)''',
                (order_id, item['product_code'], item.get('product_name'),
                 item['quantity'], item['unit_price'])
            )

        conn.commit()
        conn.close()
        return order_id

    def get_order(self, order_id: int) -> Optional[Dict]:
        """獲取訂單詳情"""
        conn = self._get_connection()

        # 獲取訂單基本資訊
        order = conn.execute(
            '''SELECT o.*, s.name as supplier_name
               FROM purchase_orders o
               JOIN suppliers s ON o.supplier_code = s.code
               WHERE o.id = ?''',
            (order_id,)
        ).fetchone()

        if not order:
            conn.close()
            return None

        order_dict = dict(order)

        # 獲取訂單明細
        items = conn.execute(
            'SELECT * FROM order_items WHERE order_id = ?',
            (order_id,)
        ).fetchall()
        order_dict['items'] = [dict(item) for item in items]

        conn.close()
        return order_dict

    def approve_order(self, order_id: int, approver: str, notes: str = None) -> bool:
        """審批訂單"""
        conn = self._get_connection()

        order = conn.execute('SELECT status FROM purchase_orders WHERE id = ?',
                           (order_id,)).fetchone()

        if not order:
            conn.close()
            raise ValueError(f"訂單 {order_id} 不存在")

        if order['status'] not in ['DRAFT', 'SUBMITTED']:
            conn.close()
            raise ValueError(f"訂單狀態 {order['status']} 不允許審批")

        conn.execute(
            '''UPDATE purchase_orders
               SET status = 'APPROVED', approver = ?, approved_at = CURRENT_TIMESTAMP
               WHERE id = ?''',
            (approver, order_id)
        )

        if notes:
            conn.execute(
                'UPDATE purchase_orders SET notes = ? WHERE id = ?',
                (notes, order_id)
            )

        conn.commit()
        conn.close()
        return True

    def reject_order(self, order_id: int, approver: str, reason: str) -> bool:
        """拒絕訂單"""
        conn = self._get_connection()

        conn.execute(
            '''UPDATE purchase_orders
               SET status = 'REJECTED', approver = ?, notes = ?
               WHERE id = ?''',
            (approver, reason, order_id)
        )

        conn.commit()
        conn.close()
        return True

    def cancel_order(self, order_id: int) -> bool:
        """取消訂單"""
        conn = self._get_connection()

        conn.execute(
            'UPDATE purchase_orders SET status = "CANCELLED" WHERE id = ?',
            (order_id,)
        )

        conn.commit()
        conn.close()
        return True

    # ========== 收貨管理 ==========

    def receive_goods(self, order_id: int, items: List[Dict],
                     receiver: str = None, notes: str = None) -> int:
        """記錄收貨"""
        conn = self._get_connection()

        # 檢查訂單狀態
        order = conn.execute('SELECT status FROM purchase_orders WHERE id = ?',
                           (order_id,)).fetchone()

        if not order:
            conn.close()
            raise ValueError(f"訂單 {order_id} 不存在")

        if order['status'] != 'APPROVED':
            conn.close()
            raise ValueError(f"訂單狀態必須為 APPROVED 才能收貨")

        # 創建收貨記錄
        cursor = conn.execute(
            'INSERT INTO receipts (order_id, receiver, notes) VALUES (?, ?, ?)',
            (order_id, receiver, notes)
        )
        receipt_id = cursor.lastrowid

        # 記錄收貨明細並更新訂單明細
        for item in items:
            # 新增收貨明細
            conn.execute(
                'INSERT INTO receipt_items (receipt_id, product_code, quantity) VALUES (?, ?, ?)',
                (receipt_id, item['product_code'], item['quantity'])
            )

            # 更新訂單明細的收貨數量
            conn.execute(
                '''UPDATE order_items
                   SET received_quantity = received_quantity + ?
                   WHERE order_id = ? AND product_code = ?''',
                (item['quantity'], order_id, item['product_code'])
            )

        # 檢查是否全部收貨完成
        incomplete = conn.execute(
            '''SELECT COUNT(*) as count FROM order_items
               WHERE order_id = ? AND received_quantity < quantity''',
            (order_id,)
        ).fetchone()

        if incomplete['count'] == 0:
            conn.execute(
                'UPDATE purchase_orders SET status = "COMPLETED" WHERE id = ?',
                (order_id,)
            )

        conn.commit()
        conn.close()
        return receipt_id

    def get_all_orders(self, status: str = None, supplier_code: str = None) -> List[Dict]:
        """獲取所有訂單"""
        conn = self._get_connection()

        query = '''SELECT o.*, s.name as supplier_name
                   FROM purchase_orders o
                   JOIN suppliers s ON o.supplier_code = s.code
                   WHERE 1=1'''
        params = []

        if status:
            query += ' AND o.status = ?'
            params.append(status)

        if supplier_code:
            query += ' AND o.supplier_code = ?'
            params.append(supplier_code)

        query += ' ORDER BY o.created_at DESC'

        rows = conn.execute(query, params).fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_supplier_performance(self, supplier_code: str) -> Dict:
        """獲取供應商績效"""
        conn = self._get_connection()

        stats = {
            'total_orders': 0,
            'completed_orders': 0,
            'cancelled_orders': 0,
            'total_amount': 0,
            'completion_rate': 0
        }

        result = conn.execute(
            '''SELECT COUNT(*) as total,
                      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
                      SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
                      SUM(total_amount) as total_amt
               FROM purchase_orders
               WHERE supplier_code = ?''',
            (supplier_code,)
        ).fetchone()

        if result:
            stats['total_orders'] = result['total'] or 0
            stats['completed_orders'] = result['completed'] or 0
            stats['cancelled_orders'] = result['cancelled'] or 0
            stats['total_amount'] = result['total_amt'] or 0

            if stats['total_orders'] > 0:
                stats['completion_rate'] = round(
                    stats['completed_orders'] / stats['total_orders'] * 100, 2
                )

        conn.close()
        return stats
