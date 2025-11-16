# 銷售訂單管理系統 Sales Order System

完整的銷售訂單管理系統，支援客戶管理、報價、訂單處理、出貨管理等功能。

## 功能特點

- 👥 客戶資料管理
- 💰 銷售報價管理
- 📋 銷售訂單處理
- 📦 出貨管理
- 💳 收款記錄
- 📊 銷售統計分析
- 🔔 訂單狀態追蹤
- 🗄️ SQLite 本地數據庫
- 🔌 RESTful API 介面
- 📱 命令行工具 (CLI)

## 安裝

```bash
pip install -r requirements.txt
```

## 快速開始

### 命令行使用

```bash
# 初始化數據庫
python src/main.py init

# 新增客戶
python src/main.py add-customer --code "C001" --name "優質客戶公司" --contact "陳經理"

# 創建銷售訂單
python src/main.py create-order --customer "C001" --product "P001" --quantity 50 --price 2000

# 確認訂單
python src/main.py confirm-order --order-id 1

# 記錄出貨
python src/main.py ship --order-id 1 --quantity 50

# 記錄收款
python src/main.py payment --order-id 1 --amount 100000

# 查詢訂單
python src/main.py list-orders --status CONFIRMED
```

### Python API 使用

```python
from src.sales_manager import SalesManager

# 初始化管理器
manager = SalesManager('sales.db')

# 新增客戶
manager.add_customer('C001', '優質客戶公司', '陳經理', '02-12345678')

# 創建銷售訂單
order_items = [
    {'product_code': 'P001', 'quantity': 50, 'unit_price': 2000},
    {'product_code': 'P002', 'quantity': 100, 'unit_price': 600}
]
order_id = manager.create_order('C001', order_items, sales_person='sales01')

# 確認訂單
manager.confirm_order(order_id)

# 記錄出貨
manager.ship_goods(order_id, [
    {'product_code': 'P001', 'quantity': 50},
    {'product_code': 'P002', 'quantity': 100}
])

# 記錄收款
manager.record_payment(order_id, 160000, 'BANK_TRANSFER')

# 查詢訂單狀態
order = manager.get_order(order_id)
print(f"訂單狀態: {order['status']}")

# 獲取客戶銷售統計
stats = manager.get_customer_stats('C001')
```

## 數據模型

### Customer (客戶)
- code: 客戶編號
- name: 客戶名稱
- contact_person: 聯絡人
- phone: 電話
- email: 電子郵件
- address: 地址
- credit_limit: 信用額度
- payment_terms: 付款條款

### SalesOrder (銷售訂單)
- order_no: 訂單編號
- customer_code: 客戶編號
- order_date: 訂單日期
- status: 狀態 (DRAFT/CONFIRMED/SHIPPED/COMPLETED/CANCELLED)
- total_amount: 訂單總額
- paid_amount: 已收款金額
- sales_person: 銷售人員

### OrderItem (訂單明細)
- order_id: 訂單ID
- product_code: 產品編號
- quantity: 數量
- unit_price: 單價
- shipped_quantity: 已出貨數量

### Shipment (出貨記錄)
- order_id: 訂單ID
- shipment_date: 出貨日期
- tracking_no: 物流追蹤號
- shipper: 出貨人

### Payment (收款記錄)
- order_id: 訂單ID
- payment_date: 收款日期
- amount: 金額
- payment_method: 付款方式

## 銷售流程

1. **創建訂單** - 客戶下單，狀態為 DRAFT
2. **確認訂單** - 確認訂單，檢查庫存，狀態變更為 CONFIRMED
3. **出貨** - 安排出貨，狀態變更為 SHIPPED
4. **收款** - 記錄收款
5. **完成** - 全部出貨且全額收款後，狀態變更為 COMPLETED

## 測試

```bash
pytest tests/
```

## 應用場景

- 企業銷售管理
- B2B 訂單管理
- 電商訂單系統
- 批發零售管理
- 外貿訂單管理

## 功能擴展

- 🔐 多級價格體系
- 📊 銷售預測分析
- 🎁 促銷優惠管理
- 📧 訂單郵件通知
- 📄 發票生成
- 🔄 退貨退款處理
- 📱 客戶自助查詢
- 📈 銷售儀表板

## 授權

MIT License
