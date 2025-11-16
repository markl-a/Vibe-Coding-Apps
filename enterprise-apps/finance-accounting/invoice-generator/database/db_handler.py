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

        self.invoices_file = os.path.join(db_dir, "invoices.json")
        self.customers_file = os.path.join(db_dir, "customers.json")
        self.products_file = os.path.join(db_dir, "products.json")

        # 初始化文件
        self._init_file(self.invoices_file)
        self._init_file(self.customers_file)
        self._init_file(self.products_file)

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

    # 發票相關方法
    def save_invoice(self, invoice_data):
        """保存發票"""
        invoices = self._read_json(self.invoices_file)

        # 添加時間戳
        invoice_data['created_at'] = datetime.now().isoformat()

        # 檢查是否已存在
        existing_index = None
        for i, inv in enumerate(invoices):
            if inv['invoice_number'] == invoice_data['invoice_number']:
                existing_index = i
                break

        if existing_index is not None:
            # 更新現有發票
            invoice_data['updated_at'] = datetime.now().isoformat()
            invoices[existing_index] = invoice_data
        else:
            # 添加新發票
            invoices.append(invoice_data)

        return self._write_json(self.invoices_file, invoices)

    def get_invoice(self, invoice_number):
        """獲取單個發票"""
        invoices = self._read_json(self.invoices_file)
        for invoice in invoices:
            if invoice['invoice_number'] == invoice_number:
                return invoice
        return None

    def get_all_invoices(self):
        """獲取所有發票"""
        return self._read_json(self.invoices_file)

    def delete_invoice(self, invoice_number):
        """刪除發票"""
        invoices = self._read_json(self.invoices_file)
        invoices = [inv for inv in invoices if inv['invoice_number'] != invoice_number]
        return self._write_json(self.invoices_file, invoices)

    def update_invoice_status(self, invoice_number, status):
        """更新發票狀態"""
        invoices = self._read_json(self.invoices_file)
        for invoice in invoices:
            if invoice['invoice_number'] == invoice_number:
                invoice['status'] = status
                invoice['updated_at'] = datetime.now().isoformat()
                break
        return self._write_json(self.invoices_file, invoices)

    # 客戶相關方法
    def add_customer(self, customer_data):
        """添加客戶"""
        customers = self._read_json(self.customers_file)

        # 添加時間戳和 ID
        customer_data['id'] = len(customers) + 1
        customer_data['created_at'] = datetime.now().isoformat()

        customers.append(customer_data)
        return self._write_json(self.customers_file, customers)

    def get_customer(self, customer_id):
        """獲取單個客戶"""
        customers = self._read_json(self.customers_file)
        for customer in customers:
            if customer.get('id') == customer_id:
                return customer
        return None

    def get_all_customers(self):
        """獲取所有客戶"""
        return self._read_json(self.customers_file)

    def update_customer(self, customer_id, customer_data):
        """更新客戶"""
        customers = self._read_json(self.customers_file)
        for i, customer in enumerate(customers):
            if customer.get('id') == customer_id:
                customer_data['id'] = customer_id
                customer_data['updated_at'] = datetime.now().isoformat()
                customers[i] = customer_data
                break
        return self._write_json(self.customers_file, customers)

    def delete_customer(self, customer_id):
        """刪除客戶"""
        customers = self._read_json(self.customers_file)
        customers = [c for c in customers if c.get('id') != customer_id]
        return self._write_json(self.customers_file, customers)

    # 產品相關方法
    def add_product(self, product_data):
        """添加產品"""
        products = self._read_json(self.products_file)

        # 添加時間戳和 ID
        product_data['id'] = len(products) + 1
        product_data['created_at'] = datetime.now().isoformat()

        products.append(product_data)
        return self._write_json(self.products_file, products)

    def get_product(self, product_id):
        """獲取單個產品"""
        products = self._read_json(self.products_file)
        for product in products:
            if product.get('id') == product_id:
                return product
        return None

    def get_all_products(self):
        """獲取所有產品"""
        return self._read_json(self.products_file)

    def update_product(self, product_id, product_data):
        """更新產品"""
        products = self._read_json(self.products_file)
        for i, product in enumerate(products):
            if product.get('id') == product_id:
                product_data['id'] = product_id
                product_data['updated_at'] = datetime.now().isoformat()
                products[i] = product_data
                break
        return self._write_json(self.products_file, products)

    def delete_product(self, product_id):
        """刪除產品"""
        products = self._read_json(self.products_file)
        products = [p for p in products if p.get('id') != product_id]
        return self._write_json(self.products_file, products)

    # 統計相關方法
    def get_statistics(self):
        """獲取統計資訊"""
        invoices = self.get_all_invoices()
        customers = self.get_all_customers()
        products = self.get_all_products()

        total_amount = 0
        status_counts = {}

        for invoice in invoices:
            # 計算總額
            for item in invoice.get('items', []):
                amount = item['quantity'] * item['unit_price']
                tax = amount * (item.get('tax_rate', 0) / 100)
                total_amount += amount + tax

            # 統計狀態
            status = invoice.get('status', 'draft')
            status_counts[status] = status_counts.get(status, 0) + 1

        return {
            'total_invoices': len(invoices),
            'total_customers': len(customers),
            'total_products': len(products),
            'total_amount': total_amount,
            'status_counts': status_counts
        }
