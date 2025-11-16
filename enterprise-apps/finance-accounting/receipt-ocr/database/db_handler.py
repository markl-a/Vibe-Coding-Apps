"""
資料庫處理模組
"""

import json
import os
from datetime import datetime


class DatabaseHandler:
    """簡易 JSON 資料庫處理器"""

    def __init__(self, db_dir="database"):
        self.db_dir = db_dir
        if not os.path.exists(db_dir):
            os.makedirs(db_dir)

        self.receipts_file = os.path.join(db_dir, "receipts.json")
        self.images_dir = os.path.join(db_dir, "receipt_images")

        # 初始化
        self._init_file(self.receipts_file)

        if not os.path.exists(self.images_dir):
            os.makedirs(self.images_dir)

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

    def save_receipt(self, receipt_data):
        """保存發票記錄"""
        receipts = self._read_json(self.receipts_file)

        # 添加 ID 和時間戳
        receipt_data['id'] = len(receipts) + 1
        receipt_data['created_at'] = datetime.now().isoformat()

        receipts.append(receipt_data)
        return self._write_json(self.receipts_file, receipts)

    def get_receipt(self, receipt_id):
        """獲取單個發票記錄"""
        receipts = self._read_json(self.receipts_file)
        for receipt in receipts:
            if receipt.get('id') == receipt_id:
                return receipt
        return None

    def get_all_receipts(self):
        """獲取所有發票記錄"""
        return self._read_json(self.receipts_file)

    def update_receipt(self, receipt_id, receipt_data):
        """更新發票記錄"""
        receipts = self._read_json(self.receipts_file)

        for i, receipt in enumerate(receipts):
            if receipt.get('id') == receipt_id:
                receipt_data['id'] = receipt_id
                receipt_data['updated_at'] = datetime.now().isoformat()
                if 'created_at' in receipt:
                    receipt_data['created_at'] = receipt['created_at']
                receipts[i] = receipt_data
                break

        return self._write_json(self.receipts_file, receipts)

    def delete_receipt(self, receipt_id):
        """刪除發票記錄"""
        receipts = self._read_json(self.receipts_file)
        receipts = [r for r in receipts if r.get('id') != receipt_id]
        return self._write_json(self.receipts_file, receipts)

    def save_receipt_image(self, image, filename_prefix):
        """
        保存發票圖片

        Args:
            image: PIL Image 對象
            filename_prefix: 文件名前綴

        Returns:
            str: 保存的文件路徑
        """
        try:
            # 生成唯一文件名
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"{filename_prefix}_{timestamp}.jpg"
            filepath = os.path.join(self.images_dir, filename)

            # 保存圖片
            image.save(filepath, 'JPEG', quality=85)

            return filepath
        except Exception as e:
            print(f"Error saving image: {e}")
            return None

    def get_receipts_by_date_range(self, start_date, end_date):
        """根據日期範圍獲取發票"""
        receipts = self._read_json(self.receipts_file)
        filtered = []

        for receipt in receipts:
            receipt_date = receipt.get('date', '')
            if start_date <= receipt_date <= end_date:
                filtered.append(receipt)

        return filtered

    def get_receipts_by_category(self, category):
        """根據分類獲取發票"""
        receipts = self._read_json(self.receipts_file)
        return [r for r in receipts if r.get('category') == category]

    def get_statistics(self):
        """獲取統計資訊"""
        receipts = self._read_json(self.receipts_file)

        if not receipts:
            return {
                'total_receipts': 0,
                'total_amount': 0,
                'average_amount': 0
            }

        total_amount = sum(r.get('total', 0) for r in receipts)

        # 按分類統計
        category_stats = {}
        for receipt in receipts:
            category = receipt.get('category', '未分類')
            if category not in category_stats:
                category_stats[category] = {'count': 0, 'total': 0}

            category_stats[category]['count'] += 1
            category_stats[category]['total'] += receipt.get('total', 0)

        return {
            'total_receipts': len(receipts),
            'total_amount': total_amount,
            'average_amount': total_amount / len(receipts),
            'categories': category_stats
        }
