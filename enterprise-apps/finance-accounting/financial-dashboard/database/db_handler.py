"""
資料庫處理模組
"""

import json
import os
from datetime import datetime, timedelta
import random


class DatabaseHandler:
    """簡易 JSON 資料庫處理器"""

    def __init__(self, db_dir="database"):
        self.db_dir = db_dir
        if not os.path.exists(db_dir):
            os.makedirs(db_dir)

        self.data_file = os.path.join(db_dir, "financial_data.json")
        self._init_file(self.data_file)

        # 初始化示範數據
        if not self._has_data():
            self._create_sample_data()

    def _init_file(self, filepath):
        """初始化 JSON 文件"""
        if not os.path.exists(filepath):
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump({}, f)

    def _has_data(self):
        """檢查是否有數據"""
        data = self._read_json(self.data_file)
        return bool(data.get('transactions'))

    def _read_json(self, filepath):
        """讀取 JSON 文件"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
            return {}

    def _write_json(self, filepath, data):
        """寫入 JSON 文件"""
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Error writing {filepath}: {e}")
            return False

    def _create_sample_data(self):
        """創建示範數據"""
        transactions = []
        start_date = datetime.now() - timedelta(days=90)

        # 生成 90 天的示範交易
        for i in range(90):
            date = (start_date + timedelta(days=i)).isoformat()

            # 收入交易
            revenue = random.uniform(1000, 5000)
            transactions.append({
                'id': len(transactions) + 1,
                'date': date,
                'type': 'revenue',
                'category': random.choice(['產品銷售', '服務收入', '其他收入']),
                'amount': round(revenue, 2),
                'description': f'收入 - {date}'
            })

            # 支出交易
            expense = random.uniform(500, 3000)
            transactions.append({
                'id': len(transactions) + 1,
                'date': date,
                'type': 'expense',
                'category': random.choice(['營運成本', '人事費用', '行銷費用', '管理費用']),
                'amount': round(expense, 2),
                'description': f'支出 - {date}'
            })

        data = {
            'transactions': transactions,
            'last_updated': datetime.now().isoformat()
        }

        self._write_json(self.data_file, data)

    def get_financial_data(self, start_date, end_date):
        """獲取財務數據"""
        data = self._read_json(self.data_file)
        transactions = data.get('transactions', [])

        # 篩選日期範圍內的交易
        filtered = [
            t for t in transactions
            if start_date <= t['date'] <= end_date
        ]

        # 計算收入和支出
        total_revenue = sum(t['amount'] for t in filtered if t['type'] == 'revenue')
        total_expense = sum(t['amount'] for t in filtered if t['type'] == 'expense')

        return {
            'total_revenue': total_revenue,
            'total_expense': total_expense,
            'gross_profit': total_revenue - total_expense,
            'net_profit': total_revenue - total_expense,
            'cash_flow': total_revenue - total_expense,
            'operating_cash_flow': total_revenue - total_expense * 0.8,
            'investing_cash_flow': -total_expense * 0.1,
            'financing_cash_flow': -total_expense * 0.1,
            'revenue_growth': random.uniform(-10, 20),
            'expense_growth': random.uniform(-5, 15),
            'current_ratio': 1.5,
            'quick_ratio': 1.2,
            'roe': random.uniform(10, 25),
            'roa': random.uniform(8, 20),
            'debt_ratio': random.uniform(30, 60),
            'debt_to_equity': random.uniform(0.5, 1.5),
            'operating_expense': total_expense * 0.7
        }

    def get_trend_data(self, start_date, end_date):
        """獲取趨勢數據"""
        data = self._read_json(self.data_file)
        transactions = data.get('transactions', [])

        # 按日期聚合
        daily_data = {}
        for t in transactions:
            if start_date <= t['date'] <= end_date:
                date = t['date']
                if date not in daily_data:
                    daily_data[date] = {'revenue': 0, 'expense': 0}

                if t['type'] == 'revenue':
                    daily_data[date]['revenue'] += t['amount']
                else:
                    daily_data[date]['expense'] += t['amount']

        # 轉換為列表
        trend = [
            {'date': date, 'revenue': values['revenue'], 'expense': values['expense']}
            for date, values in sorted(daily_data.items())
        ]

        return trend

    def get_revenue_by_category(self, start_date, end_date):
        """按分類獲取收入"""
        data = self._read_json(self.data_file)
        transactions = data.get('transactions', [])

        category_revenue = {}
        for t in transactions:
            if start_date <= t['date'] <= end_date and t['type'] == 'revenue':
                category = t['category']
                category_revenue[category] = category_revenue.get(category, 0) + t['amount']

        return category_revenue

    def get_expense_by_category(self, start_date, end_date):
        """按分類獲取支出"""
        data = self._read_json(self.data_file)
        transactions = data.get('transactions', [])

        category_expense = {}
        for t in transactions:
            if start_date <= t['date'] <= end_date and t['type'] == 'expense':
                category = t['category']
                category_expense[category] = category_expense.get(category, 0) + t['amount']

        return category_expense

    def get_cash_flow_trend(self, start_date, end_date):
        """獲取現金流趨勢"""
        data = self._read_json(self.data_file)
        transactions = data.get('transactions', [])

        daily_cash_flow = {}
        for t in transactions:
            if start_date <= t['date'] <= end_date:
                date = t['date']
                if date not in daily_cash_flow:
                    daily_cash_flow[date] = 0

                if t['type'] == 'revenue':
                    daily_cash_flow[date] += t['amount']
                else:
                    daily_cash_flow[date] -= t['amount']

        trend = [
            {'date': date, 'cash_flow': cf}
            for date, cf in sorted(daily_cash_flow.items())
        ]

        return trend

    def get_all_transactions(self, start_date, end_date):
        """獲取所有交易記錄"""
        data = self._read_json(self.data_file)
        transactions = data.get('transactions', [])

        return [
            t for t in transactions
            if start_date <= t['date'] <= end_date
        ]
