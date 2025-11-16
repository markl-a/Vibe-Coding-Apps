"""
數據庫操作模組
"""
import sqlite3
from typing import List, Dict, Optional
from datetime import datetime


class Database:
    """數據庫管理類"""

    def __init__(self, db_path: str = 'inventory.db'):
        """初始化數據庫連接"""
        self.db_path = db_path
        self.conn = None

    def connect(self):
        """連接數據庫"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        return self.conn

    def close(self):
        """關閉數據庫連接"""
        if self.conn:
            self.conn.close()

    def __enter__(self):
        """上下文管理器入口"""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器出口"""
        if exc_type is None:
            self.conn.commit()
        else:
            self.conn.rollback()
        self.close()

    def initialize(self):
        """初始化數據庫表結構"""
        with self.connect() as conn:
            cursor = conn.cursor()

            # 產品表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS products (
                    code TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    unit TEXT NOT NULL,
                    min_quantity INTEGER DEFAULT 0,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 倉庫表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS warehouses (
                    code TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    location TEXT,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # 庫存表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS stock (
                    product_code TEXT,
                    warehouse_code TEXT,
                    quantity INTEGER DEFAULT 0,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (product_code, warehouse_code),
                    FOREIGN KEY (product_code) REFERENCES products(code),
                    FOREIGN KEY (warehouse_code) REFERENCES warehouses(code)
                )
            ''')

            # 庫存異動表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_type TEXT NOT NULL,
                    product_code TEXT NOT NULL,
                    warehouse_code TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    batch_no TEXT,
                    reference TEXT,
                    operator TEXT,
                    notes TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_code) REFERENCES products(code),
                    FOREIGN KEY (warehouse_code) REFERENCES warehouses(code)
                )
            ''')

            # 創建索引
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_transactions_product
                ON transactions(product_code)
            ''')

            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_transactions_warehouse
                ON transactions(warehouse_code)
            ''')

            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_transactions_timestamp
                ON transactions(timestamp)
            ''')

            conn.commit()

    def execute(self, query: str, params: tuple = ()):
        """執行 SQL 查詢"""
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        return cursor

    def fetchone(self, query: str, params: tuple = ()) -> Optional[Dict]:
        """查詢單筆記錄"""
        cursor = self.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None

    def fetchall(self, query: str, params: tuple = ()) -> List[Dict]:
        """查詢多筆記錄"""
        cursor = self.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]
