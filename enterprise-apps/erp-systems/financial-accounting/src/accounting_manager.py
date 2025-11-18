"""
財務會計管理核心模組
"""
import sqlite3
from typing import List, Dict, Optional
from datetime import datetime
from decimal import Decimal


class AccountingManager:
    """財務會計管理器"""

    def __init__(self, db_path: str = 'accounting.db'):
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

        # 會計科目表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS accounts (
                code TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                parent_code TEXT,
                level INTEGER DEFAULT 1,
                description TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # 會計憑證表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vouchers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                voucher_no TEXT UNIQUE NOT NULL,
                voucher_date DATE NOT NULL,
                description TEXT,
                created_by TEXT,
                approved_by TEXT,
                status TEXT DEFAULT 'DRAFT',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # 憑證分錄表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS voucher_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                voucher_id INTEGER NOT NULL,
                account_code TEXT NOT NULL,
                debit REAL DEFAULT 0,
                credit REAL DEFAULT 0,
                description TEXT,
                FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
                FOREIGN KEY (account_code) REFERENCES accounts(code)
            )
        ''')

        # 科目餘額表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS account_balances (
                account_code TEXT,
                period TEXT,
                debit_total REAL DEFAULT 0,
                credit_total REAL DEFAULT 0,
                balance REAL DEFAULT 0,
                PRIMARY KEY (account_code, period),
                FOREIGN KEY (account_code) REFERENCES accounts(code)
            )
        ''')

        # 創建索引
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(voucher_date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_entries_account ON voucher_entries(account_code)')

        conn.commit()
        conn.close()

        # 初始化基本會計科目
        self._initialize_default_accounts()

    def _initialize_default_accounts(self):
        """初始化默認會計科目"""
        default_accounts = [
            # 資產類
            ('1001', '現金', 'ASSET', None),
            ('1002', '銀行存款', 'ASSET', None),
            ('1101', '應收帳款', 'ASSET', None),
            ('1201', '存貨', 'ASSET', None),
            ('1501', '固定資產', 'ASSET', None),
            # 負債類
            ('2101', '應付帳款', 'LIABILITY', None),
            ('2201', '短期借款', 'LIABILITY', None),
            ('2301', '應付薪資', 'LIABILITY', None),
            # 權益類
            ('3001', '股本', 'EQUITY', None),
            ('3101', '保留盈餘', 'EQUITY', None),
            # 收入類
            ('4001', '銷售收入', 'REVENUE', None),
            ('4101', '其他收入', 'REVENUE', None),
            # 費用類
            ('5001', '銷售成本', 'EXPENSE', None),
            ('5101', '管理費用', 'EXPENSE', None),
            ('5201', '財務費用', 'EXPENSE', None),
        ]

        for code, name, acc_type, parent in default_accounts:
            try:
                self.add_account(code, name, acc_type, parent)
            except:
                pass  # 如果已存在則跳過

    # ========== 會計科目管理 ==========

    def add_account(self, code: str, name: str, account_type: str,
                   parent_code: str = None, description: str = None) -> bool:
        """新增會計科目"""
        conn = self._get_connection()
        try:
            level = 1
            if parent_code:
                parent = conn.execute('SELECT level FROM accounts WHERE code = ?',
                                    (parent_code,)).fetchone()
                if parent:
                    level = parent['level'] + 1

            conn.execute(
                '''INSERT INTO accounts (code, name, type, parent_code, level, description)
                   VALUES (?, ?, ?, ?, ?, ?)''',
                (code, name, account_type, parent_code, level, description)
            )
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
        finally:
            conn.close()

    def get_account(self, code: str) -> Optional[Dict]:
        """獲取科目資訊"""
        conn = self._get_connection()
        row = conn.execute('SELECT * FROM accounts WHERE code = ?', (code,)).fetchone()
        conn.close()
        return dict(row) if row else None

    def get_all_accounts(self, account_type: str = None) -> List[Dict]:
        """獲取所有科目"""
        conn = self._get_connection()

        if account_type:
            rows = conn.execute(
                'SELECT * FROM accounts WHERE type = ? ORDER BY code',
                (account_type,)
            ).fetchall()
        else:
            rows = conn.execute('SELECT * FROM accounts ORDER BY code').fetchall()

        conn.close()
        return [dict(row) for row in rows]

    # ========== 會計憑證管理 ==========

    def create_voucher(self, voucher_date: str, description: str,
                      entries: List[Dict], created_by: str = None) -> int:
        """創建會計憑證"""
        conn = self._get_connection()

        # 驗證借貸平衡
        total_debit = sum(entry['debit'] for entry in entries)
        total_credit = sum(entry['credit'] for entry in entries)

        if abs(total_debit - total_credit) > 0.01:
            conn.close()
            raise ValueError(f"借貸不平衡！借方: {total_debit}, 貸方: {total_credit}")

        # 生成唯一憑證編號（加入微秒避免重複）
        import time
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        microsecond = int(time.time() * 1000000) % 1000000
        voucher_no = f"V{timestamp}{microsecond:06d}"

        # 創建憑證
        cursor = conn.execute(
            '''INSERT INTO vouchers (voucher_no, voucher_date, description, created_by)
               VALUES (?, ?, ?, ?)''',
            (voucher_no, voucher_date, description, created_by)
        )
        voucher_id = cursor.lastrowid

        # 新增分錄
        for entry in entries:
            # 驗證科目是否存在
            account = conn.execute('SELECT code FROM accounts WHERE code = ?',
                                 (entry['account_code'],)).fetchone()
            if not account:
                conn.rollback()
                conn.close()
                raise ValueError(f"科目 {entry['account_code']} 不存在")

            conn.execute(
                '''INSERT INTO voucher_entries
                   (voucher_id, account_code, debit, credit, description)
                   VALUES (?, ?, ?, ?, ?)''',
                (voucher_id, entry['account_code'], entry['debit'],
                 entry['credit'], entry.get('description'))
            )

        conn.commit()
        conn.close()
        return voucher_id

    def approve_voucher(self, voucher_id: int, approver: str) -> bool:
        """審核憑證"""
        conn = self._get_connection()

        voucher = conn.execute('SELECT status FROM vouchers WHERE id = ?',
                             (voucher_id,)).fetchone()

        if not voucher:
            conn.close()
            raise ValueError(f"憑證 {voucher_id} 不存在")

        if voucher['status'] != 'DRAFT':
            conn.close()
            raise ValueError(f"憑證狀態 {voucher['status']} 不允許審核")

        conn.execute(
            '''UPDATE vouchers SET status = 'APPROVED', approved_by = ?
               WHERE id = ?''',
            (approver, voucher_id)
        )

        conn.commit()
        conn.close()
        return True

    def post_voucher(self, voucher_id: int) -> bool:
        """過帳憑證"""
        conn = self._get_connection()

        voucher = conn.execute(
            'SELECT voucher_date, status FROM vouchers WHERE id = ?',
            (voucher_id,)
        ).fetchone()

        if not voucher:
            conn.close()
            raise ValueError(f"憑證 {voucher_id} 不存在")

        if voucher['status'] != 'APPROVED':
            conn.close()
            raise ValueError("只有已審核的憑證才能過帳")

        # 獲取分錄
        entries = conn.execute(
            'SELECT * FROM voucher_entries WHERE voucher_id = ?',
            (voucher_id,)
        ).fetchall()

        # 更新科目餘額
        period = voucher['voucher_date'][:7]  # YYYY-MM

        for entry in entries:
            self._update_account_balance(
                conn, entry['account_code'], period,
                entry['debit'], entry['credit']
            )

        # 更新憑證狀態
        conn.execute(
            'UPDATE vouchers SET status = "POSTED" WHERE id = ?',
            (voucher_id,)
        )

        conn.commit()
        conn.close()
        return True

    def _update_account_balance(self, conn, account_code: str, period: str,
                               debit: float, credit: float):
        """更新科目餘額"""
        # 檢查是否存在餘額記錄
        balance = conn.execute(
            'SELECT * FROM account_balances WHERE account_code = ? AND period = ?',
            (account_code, period)
        ).fetchone()

        if balance:
            new_debit = balance['debit_total'] + debit
            new_credit = balance['credit_total'] + credit
            new_balance = new_debit - new_credit

            conn.execute(
                '''UPDATE account_balances
                   SET debit_total = ?, credit_total = ?, balance = ?
                   WHERE account_code = ? AND period = ?''',
                (new_debit, new_credit, new_balance, account_code, period)
            )
        else:
            new_balance = debit - credit
            conn.execute(
                '''INSERT INTO account_balances
                   (account_code, period, debit_total, credit_total, balance)
                   VALUES (?, ?, ?, ?, ?)''',
                (account_code, period, debit, credit, new_balance)
            )

    def get_voucher(self, voucher_id: int) -> Optional[Dict]:
        """獲取憑證詳情"""
        conn = self._get_connection()

        voucher = conn.execute('SELECT * FROM vouchers WHERE id = ?',
                             (voucher_id,)).fetchone()

        if not voucher:
            conn.close()
            return None

        voucher_dict = dict(voucher)

        # 獲取分錄
        entries = conn.execute(
            '''SELECT e.*, a.name as account_name
               FROM voucher_entries e
               JOIN accounts a ON e.account_code = a.code
               WHERE e.voucher_id = ?''',
            (voucher_id,)
        ).fetchall()
        voucher_dict['entries'] = [dict(entry) for entry in entries]

        conn.close()
        return voucher_dict

    # ========== 查詢與報表 ==========

    def get_account_balance(self, account_code: str, period: str = None) -> float:
        """獲取科目餘額"""
        conn = self._get_connection()

        if period:
            row = conn.execute(
                'SELECT balance FROM account_balances WHERE account_code = ? AND period = ?',
                (account_code, period)
            ).fetchone()
        else:
            # 獲取最新期間餘額
            row = conn.execute(
                '''SELECT balance FROM account_balances
                   WHERE account_code = ?
                   ORDER BY period DESC LIMIT 1''',
                (account_code,)
            ).fetchone()

        conn.close()
        return row['balance'] if row else 0

    def generate_balance_sheet(self, as_of_date: str) -> Dict:
        """生成資產負債表"""
        period = as_of_date[:7]  # YYYY-MM

        balance_sheet = {
            'as_of_date': as_of_date,
            'assets': self._get_account_type_balances('ASSET', period),
            'liabilities': self._get_account_type_balances('LIABILITY', period),
            'equity': self._get_account_type_balances('EQUITY', period)
        }

        balance_sheet['total_assets'] = sum(a['balance'] for a in balance_sheet['assets'])
        balance_sheet['total_liabilities'] = sum(l['balance'] for l in balance_sheet['liabilities'])
        balance_sheet['total_equity'] = sum(e['balance'] for e in balance_sheet['equity'])

        return balance_sheet

    def generate_income_statement(self, start_date: str, end_date: str) -> Dict:
        """生成損益表"""
        start_period = start_date[:7]
        end_period = end_date[:7]

        income_statement = {
            'period': f"{start_date} to {end_date}",
            'revenues': self._get_account_type_balances_range('REVENUE', start_period, end_period),
            'expenses': self._get_account_type_balances_range('EXPENSE', start_period, end_period)
        }

        income_statement['total_revenue'] = sum(r['balance'] for r in income_statement['revenues'])
        income_statement['total_expense'] = sum(e['balance'] for e in income_statement['expenses'])
        income_statement['net_income'] = income_statement['total_revenue'] - income_statement['total_expense']

        return income_statement

    def _get_account_type_balances(self, account_type: str, period: str) -> List[Dict]:
        """獲取特定類型科目的餘額"""
        conn = self._get_connection()

        rows = conn.execute(
            '''SELECT a.code, a.name, COALESCE(b.balance, 0) as balance
               FROM accounts a
               LEFT JOIN account_balances b ON a.code = b.account_code AND b.period = ?
               WHERE a.type = ?
               ORDER BY a.code''',
            (period, account_type)
        ).fetchall()

        conn.close()
        return [dict(row) for row in rows]

    def _get_account_type_balances_range(self, account_type: str,
                                        start_period: str, end_period: str) -> List[Dict]:
        """獲取期間範圍內的科目餘額合計"""
        conn = self._get_connection()

        # 收入科目使用貸方-借方，費用科目使用借方-貸方
        if account_type == 'EXPENSE':
            balance_formula = 'SUM(COALESCE(b.debit_total, 0) - COALESCE(b.credit_total, 0))'
        else:  # REVENUE and others
            balance_formula = 'SUM(COALESCE(b.credit_total, 0) - COALESCE(b.debit_total, 0))'

        query = f'''SELECT a.code, a.name,
                      {balance_formula} as balance
               FROM accounts a
               LEFT JOIN account_balances b ON a.code = b.account_code
                  AND b.period >= ? AND b.period <= ?
               WHERE a.type = ?
               GROUP BY a.code, a.name
               ORDER BY a.code'''

        rows = conn.execute(query, (start_period, end_period, account_type)).fetchall()

        conn.close()
        return [dict(row) for row in rows]
