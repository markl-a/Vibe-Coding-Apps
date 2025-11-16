"""
資料庫處理模組
"""

import json
import os
import shutil
from datetime import datetime


class DatabaseHandler:
    """簡易 JSON 資料庫處理器"""

    def __init__(self, db_dir="database"):
        self.db_dir = db_dir
        if not os.path.exists(db_dir):
            os.makedirs(db_dir)

        self.expenses_file = os.path.join(db_dir, "expenses.json")
        self.categories_file = os.path.join(db_dir, "categories.json")
        self.receipts_dir = os.path.join(db_dir, "receipts")

        # 初始化文件和目錄
        self._init_file(self.expenses_file)
        self._init_file(self.categories_file)

        if not os.path.exists(self.receipts_dir):
            os.makedirs(self.receipts_dir)

    def _init_file(self, filepath):
        """初始化 JSON 文件"""
        if not os.path.exists(filepath):
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump([], f)

    def _read_json(self, filepath):
        """讀取 JSON 文件"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
            return []

    def _write_json(self, filepath, data):
        """寫入 JSON 文件"""
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Error writing {filepath}: {e}")
            return False

    # 費用相關方法
    def save_expense(self, expense_data):
        """保存費用記錄"""
        expenses = self._read_json(self.expenses_file)

        # 添加 ID 和時間戳
        expense_data['id'] = len(expenses) + 1
        expense_data['created_at'] = datetime.now().isoformat()

        expenses.append(expense_data)
        return self._write_json(self.expenses_file, expenses)

    def get_expense(self, expense_id):
        """獲取單個費用記錄"""
        expenses = self._read_json(self.expenses_file)
        for expense in expenses:
            if expense.get('id') == expense_id:
                return expense
        return None

    def get_all_expenses(self):
        """獲取所有費用記錄"""
        return self._read_json(self.expenses_file)

    def get_expenses_by_date_range(self, start_date, end_date):
        """
        根據日期範圍獲取費用

        Args:
            start_date: 開始日期 (YYYY-MM-DD)
            end_date: 結束日期 (YYYY-MM-DD)

        Returns:
            list: 費用列表
        """
        expenses = self._read_json(self.expenses_file)
        filtered = []

        for expense in expenses:
            expense_date = expense.get('date', '')
            if start_date <= expense_date <= end_date:
                filtered.append(expense)

        return filtered

    def get_expenses_by_category(self, category):
        """根據分類獲取費用"""
        expenses = self._read_json(self.expenses_file)
        return [e for e in expenses if e.get('category') == category]

    def update_expense(self, expense_id, expense_data):
        """更新費用記錄"""
        expenses = self._read_json(self.expenses_file)

        for i, expense in enumerate(expenses):
            if expense.get('id') == expense_id:
                expense_data['id'] = expense_id
                expense_data['updated_at'] = datetime.now().isoformat()
                # 保留創建時間
                if 'created_at' in expense:
                    expense_data['created_at'] = expense['created_at']
                expenses[i] = expense_data
                break

        return self._write_json(self.expenses_file, expenses)

    def delete_expense(self, expense_id):
        """刪除費用記錄"""
        expenses = self._read_json(self.expenses_file)
        expenses = [e for e in expenses if e.get('id') != expense_id]
        return self._write_json(self.expenses_file, expenses)

    # 分類相關方法
    def add_category(self, category_data):
        """添加分類"""
        categories = self._read_json(self.categories_file)

        # 檢查是否已存在
        for cat in categories:
            if cat.get('name') == category_data.get('name'):
                return False  # 分類已存在

        # 添加 ID 和時間戳
        category_data['id'] = len(categories) + 1
        category_data['created_at'] = datetime.now().isoformat()

        categories.append(category_data)
        return self._write_json(self.categories_file, categories)

    def get_category(self, category_id):
        """獲取單個分類"""
        categories = self._read_json(self.categories_file)
        for category in categories:
            if category.get('id') == category_id:
                return category
        return None

    def get_all_categories(self):
        """獲取所有分類"""
        return self._read_json(self.categories_file)

    def update_category(self, category_id, category_data):
        """更新分類"""
        categories = self._read_json(self.categories_file)

        for i, category in enumerate(categories):
            if category.get('id') == category_id:
                category_data['id'] = category_id
                category_data['updated_at'] = datetime.now().isoformat()
                if 'created_at' in category:
                    category_data['created_at'] = category['created_at']
                categories[i] = category_data
                break

        return self._write_json(self.categories_file, categories)

    def delete_category(self, category_id):
        """刪除分類"""
        categories = self._read_json(self.categories_file)
        categories = [c for c in categories if c.get('id') != category_id]
        return self._write_json(self.categories_file, categories)

    # 收據相關方法
    def save_receipt(self, uploaded_file, filename_prefix):
        """
        保存收據文件

        Args:
            uploaded_file: Streamlit 上傳的文件對象
            filename_prefix: 文件名前綴

        Returns:
            str: 保存的文件路徑
        """
        try:
            # 生成唯一文件名
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            file_extension = uploaded_file.name.split('.')[-1]
            filename = f"{filename_prefix}_{timestamp}.{file_extension}"
            filepath = os.path.join(self.receipts_dir, filename)

            # 保存文件
            with open(filepath, 'wb') as f:
                f.write(uploaded_file.getbuffer())

            return filepath
        except Exception as e:
            print(f"Error saving receipt: {e}")
            return None

    def get_receipt(self, receipt_path):
        """獲取收據文件"""
        if os.path.exists(receipt_path):
            return receipt_path
        return None

    def delete_receipt(self, receipt_path):
        """刪除收據文件"""
        try:
            if os.path.exists(receipt_path):
                os.remove(receipt_path)
            return True
        except Exception as e:
            print(f"Error deleting receipt: {e}")
            return False

    # 統計相關方法
    def get_statistics(self, start_date=None, end_date=None):
        """
        獲取統計資訊

        Args:
            start_date: 開始日期（可選）
            end_date: 結束日期（可選）

        Returns:
            dict: 統計資訊
        """
        if start_date and end_date:
            expenses = self.get_expenses_by_date_range(start_date, end_date)
        else:
            expenses = self.get_all_expenses()

        categories = self.get_all_categories()

        # 計算總額
        total_amount = sum(e.get('amount', 0) for e in expenses)

        # 按分類統計
        category_stats = {}
        for category in categories:
            cat_name = category['name']
            cat_expenses = [e for e in expenses if e.get('category') == cat_name]
            cat_amount = sum(e.get('amount', 0) for e in cat_expenses)

            category_stats[cat_name] = {
                'count': len(cat_expenses),
                'total': cat_amount,
                'budget': category.get('budget', 0),
                'percentage': (cat_amount / total_amount * 100) if total_amount > 0 else 0
            }

        # 按付款方式統計
        payment_stats = {}
        for expense in expenses:
            payment_method = expense.get('payment_method', '未知')
            if payment_method not in payment_stats:
                payment_stats[payment_method] = {'count': 0, 'total': 0}

            payment_stats[payment_method]['count'] += 1
            payment_stats[payment_method]['total'] += expense.get('amount', 0)

        return {
            'total_expenses': len(expenses),
            'total_amount': total_amount,
            'average_amount': total_amount / len(expenses) if expenses else 0,
            'categories': category_stats,
            'payment_methods': payment_stats
        }

    def export_to_csv(self, start_date=None, end_date=None, output_file='expenses_export.csv'):
        """
        匯出為 CSV

        Args:
            start_date: 開始日期（可選）
            end_date: 結束日期（可選）
            output_file: 輸出文件名

        Returns:
            str: CSV 文件路徑
        """
        import csv

        if start_date and end_date:
            expenses = self.get_expenses_by_date_range(start_date, end_date)
        else:
            expenses = self.get_all_expenses()

        if not expenses:
            return None

        # 寫入 CSV
        try:
            filepath = os.path.join(self.db_dir, output_file)
            with open(filepath, 'w', newline='', encoding='utf-8-sig') as csvfile:
                fieldnames = ['date', 'category', 'description', 'amount', 'payment_method', 'vendor', 'notes']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

                writer.writeheader()
                for expense in expenses:
                    writer.writerow({
                        'date': expense.get('date', ''),
                        'category': expense.get('category', ''),
                        'description': expense.get('description', ''),
                        'amount': expense.get('amount', 0),
                        'payment_method': expense.get('payment_method', ''),
                        'vendor': expense.get('vendor', ''),
                        'notes': expense.get('notes', '')
                    })

            return filepath
        except Exception as e:
            print(f"Error exporting to CSV: {e}")
            return None
