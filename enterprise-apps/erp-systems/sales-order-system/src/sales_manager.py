"""
銷售訂單管理核心模組
"""
import sqlite3
from typing import List, Dict, Optional
from datetime import datetime


class SalesManager:
    """銷售訂單管理器"""

    def __init__(self, db_path: str = 'sales.db'):
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

        # 客戶表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customers (
                code TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                contact_person TEXT,
                phone TEXT,
                email TEXT,
                address TEXT,
                credit_limit REAL DEFAULT 0,
                payment_terms TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # 銷售訂單表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sales_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_no TEXT UNIQUE NOT NULL,
                customer_code TEXT NOT NULL,
                order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'DRAFT',
                total_amount REAL DEFAULT 0,
                paid_amount REAL DEFAULT 0,
                sales_person TEXT,
                delivery_address TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_code) REFERENCES customers(code)
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
                shipped_quantity INTEGER DEFAULT 0,
                FOREIGN KEY (order_id) REFERENCES sales_orders(id)
            )
        ''')

        # 出貨記錄表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS shipments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                shipment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tracking_no TEXT,
                shipper TEXT,
                notes TEXT,
                FOREIGN KEY (order_id) REFERENCES sales_orders(id)
            )
        ''')

        # 出貨明細表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS shipment_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shipment_id INTEGER NOT NULL,
                product_code TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                FOREIGN KEY (shipment_id) REFERENCES shipments(id)
            )
        ''')

        # 收款記錄表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                amount REAL NOT NULL,
                payment_method TEXT,
                reference_no TEXT,
                notes TEXT,
                FOREIGN KEY (order_id) REFERENCES sales_orders(id)
            )
        ''')

        conn.commit()
        conn.close()

    # ========== 客戶管理 ==========

    def add_customer(self, code: str, name: str, contact_person: str = None,
                    phone: str = None, email: str = None, address: str = None,
                    credit_limit: float = 0, payment_terms: str = None) -> bool:
        """新增客戶"""
        conn = self._get_connection()
        try:
            conn.execute(
                '''INSERT INTO customers
                   (code, name, contact_person, phone, email, address, credit_limit, payment_terms)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                (code, name, contact_person, phone, email, address, credit_limit, payment_terms)
            )
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
        finally:
            conn.close()

    def get_customer(self, code: str) -> Optional[Dict]:
        """獲取客戶資訊"""
        conn = self._get_connection()
        row = conn.execute('SELECT * FROM customers WHERE code = ?', (code,)).fetchone()
        conn.close()
        return dict(row) if row else None

    def get_all_customers(self) -> List[Dict]:
        """獲取所有客戶"""
        conn = self._get_connection()
        rows = conn.execute('SELECT * FROM customers ORDER BY code').fetchall()
        conn.close()
        return [dict(row) for row in rows]

    # ========== 銷售訂單管理 ==========

    def create_order(self, customer_code: str, items: List[Dict],
                    sales_person: str = None, delivery_address: str = None,
                    notes: str = None) -> int:
        """創建銷售訂單"""
        conn = self._get_connection()

        # 檢查客戶是否存在
        customer = conn.execute('SELECT code FROM customers WHERE code = ?',
                               (customer_code,)).fetchone()
        if not customer:
            conn.close()
            raise ValueError(f"客戶 {customer_code} 不存在")

        # 生成訂單編號
        order_no = f"SO{datetime.now().strftime('%Y%m%d%H%M%S')}"

        # 計算訂單總額
        total_amount = sum(item['quantity'] * item['unit_price'] for item in items)

        # 創建訂單
        cursor = conn.execute(
            '''INSERT INTO sales_orders
               (order_no, customer_code, total_amount, sales_person, delivery_address, notes)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (order_no, customer_code, total_amount, sales_person, delivery_address, notes)
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

    def confirm_order(self, order_id: int) -> bool:
        """確認訂單"""
        conn = self._get_connection()

        order = conn.execute('SELECT status FROM sales_orders WHERE id = ?',
                           (order_id,)).fetchone()

        if not order:
            conn.close()
            raise ValueError(f"訂單 {order_id} 不存在")

        if order['status'] != 'DRAFT':
            conn.close()
            raise ValueError(f"訂單狀態 {order['status']} 不允許確認")

        conn.execute(
            'UPDATE sales_orders SET status = "CONFIRMED" WHERE id = ?',
            (order_id,)
        )

        conn.commit()
        conn.close()
        return True

    def cancel_order(self, order_id: int) -> bool:
        """取消訂單"""
        conn = self._get_connection()
        conn.execute(
            'UPDATE sales_orders SET status = "CANCELLED" WHERE id = ?',
            (order_id,)
        )
        conn.commit()
        conn.close()
        return True

    def get_order(self, order_id: int) -> Optional[Dict]:
        """獲取訂單詳情"""
        conn = self._get_connection()

        # 獲取訂單基本資訊
        order = conn.execute(
            '''SELECT o.*, c.name as customer_name
               FROM sales_orders o
               JOIN customers c ON o.customer_code = c.code
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

    # ========== 出貨管理 ==========

    def ship_goods(self, order_id: int, items: List[Dict],
                   tracking_no: str = None, shipper: str = None, notes: str = None) -> int:
        """記錄出貨"""
        conn = self._get_connection()

        # 檢查訂單狀態
        order = conn.execute('SELECT status FROM sales_orders WHERE id = ?',
                           (order_id,)).fetchone()

        if not order:
            conn.close()
            raise ValueError(f"訂單 {order_id} 不存在")

        if order['status'] not in ['CONFIRMED', 'SHIPPED']:
            conn.close()
            raise ValueError(f"訂單狀態必須為 CONFIRMED 才能出貨")

        # 創建出貨記錄
        cursor = conn.execute(
            'INSERT INTO shipments (order_id, tracking_no, shipper, notes) VALUES (?, ?, ?, ?)',
            (order_id, tracking_no, shipper, notes)
        )
        shipment_id = cursor.lastrowid

        # 記錄出貨明細並更新訂單明細
        for item in items:
            conn.execute(
                'INSERT INTO shipment_items (shipment_id, product_code, quantity) VALUES (?, ?, ?)',
                (shipment_id, item['product_code'], item['quantity'])
            )

            conn.execute(
                '''UPDATE order_items
                   SET shipped_quantity = shipped_quantity + ?
                   WHERE order_id = ? AND product_code = ?''',
                (item['quantity'], order_id, item['product_code'])
            )

        # 更新訂單狀態為已出貨
        conn.execute(
            'UPDATE sales_orders SET status = "SHIPPED" WHERE id = ?',
            (order_id,)
        )

        # 檢查是否全部出貨完成
        incomplete = conn.execute(
            '''SELECT COUNT(*) as count FROM order_items
               WHERE order_id = ? AND shipped_quantity < quantity''',
            (order_id,)
        ).fetchone()

        # 檢查是否全額收款
        order_info = conn.execute(
            'SELECT total_amount, paid_amount FROM sales_orders WHERE id = ?',
            (order_id,)
        ).fetchone()

        if incomplete['count'] == 0 and order_info['paid_amount'] >= order_info['total_amount']:
            conn.execute(
                'UPDATE sales_orders SET status = "COMPLETED" WHERE id = ?',
                (order_id,)
            )

        conn.commit()
        conn.close()
        return shipment_id

    # ========== 收款管理 ==========

    def record_payment(self, order_id: int, amount: float,
                      payment_method: str = None, reference_no: str = None,
                      notes: str = None) -> int:
        """記錄收款"""
        conn = self._get_connection()

        # 創建收款記錄
        cursor = conn.execute(
            '''INSERT INTO payments (order_id, amount, payment_method, reference_no, notes)
               VALUES (?, ?, ?, ?, ?)''',
            (order_id, amount, payment_method, reference_no, notes)
        )
        payment_id = cursor.lastrowid

        # 更新訂單已收款金額
        conn.execute(
            'UPDATE sales_orders SET paid_amount = paid_amount + ? WHERE id = ?',
            (amount, order_id)
        )

        # 檢查是否全額收款且全部出貨
        order = conn.execute(
            '''SELECT status, total_amount, paid_amount FROM sales_orders WHERE id = ?''',
            (order_id,)
        ).fetchone()

        if order['paid_amount'] >= order['total_amount'] and order['status'] == 'SHIPPED':
            conn.execute(
                'UPDATE sales_orders SET status = "COMPLETED" WHERE id = ?',
                (order_id,)
            )

        conn.commit()
        conn.close()
        return payment_id

    # ========== 統計查詢 ==========

    def get_all_orders(self, status: str = None, customer_code: str = None) -> List[Dict]:
        """獲取所有訂單"""
        conn = self._get_connection()

        query = '''SELECT o.*, c.name as customer_name
                   FROM sales_orders o
                   JOIN customers c ON o.customer_code = c.code
                   WHERE 1=1'''
        params = []

        if status:
            query += ' AND o.status = ?'
            params.append(status)

        if customer_code:
            query += ' AND o.customer_code = ?'
            params.append(customer_code)

        query += ' ORDER BY o.created_at DESC'

        rows = conn.execute(query, params).fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_customer_stats(self, customer_code: str) -> Dict:
        """獲取客戶統計"""
        conn = self._get_connection()

        stats = {
            'total_orders': 0,
            'completed_orders': 0,
            'total_amount': 0,
            'paid_amount': 0,
            'outstanding_amount': 0
        }

        result = conn.execute(
            '''SELECT COUNT(*) as total,
                      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
                      SUM(total_amount) as total_amt,
                      SUM(paid_amount) as paid_amt
               FROM sales_orders
               WHERE customer_code = ?''',
            (customer_code,)
        ).fetchone()

        if result:
            stats['total_orders'] = result['total'] or 0
            stats['completed_orders'] = result['completed'] or 0
            stats['total_amount'] = result['total_amt'] or 0
            stats['paid_amount'] = result['paid_amt'] or 0
            stats['outstanding_amount'] = stats['total_amount'] - stats['paid_amount']

        conn.close()
        return stats
