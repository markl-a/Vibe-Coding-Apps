# 採購訂單管理系統 Purchase Order System

完整的採購訂單管理系統，支援供應商管理、採購申請、訂單追蹤、收貨管理等功能。

## 功能特點

- 📋 完整的採購流程管理
- 👥 供應商資料管理
- 🛒 採購申請與審批
- 📦 採購訂單管理
- ✅ 收貨驗收功能
- 📊 採購統計分析
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

# 新增供應商
python src/main.py add-supplier --code "S001" --name "ABC供應商" --contact "張經理"

# 創建採購訂單
python src/main.py create-order --supplier "S001" --product "P001" --quantity 100 --price 1500

# 審批訂單
python src/main.py approve-order --order-id 1 --approver "manager01"

# 記錄收貨
python src/main.py receive --order-id 1 --quantity 100

# 查詢訂單
python src/main.py list-orders --status APPROVED

# 查詢供應商訂單
python src/main.py supplier-orders --supplier "S001"
```

### Python API 使用

```python
from src.purchase_manager import PurchaseManager

# 初始化管理器
manager = PurchaseManager('purchase.db')

# 新增供應商
manager.add_supplier('S001', 'ABC供應商', '張經理', '02-12345678')

# 創建採購訂單
order_items = [
    {'product_code': 'P001', 'quantity': 100, 'unit_price': 1500},
    {'product_code': 'P002', 'quantity': 50, 'unit_price': 800}
]
order_id = manager.create_order('S001', order_items, requester='user01')

# 審批訂單
manager.approve_order(order_id, 'manager01', notes='批准採購')

# 記錄收貨
manager.receive_goods(order_id, [
    {'product_code': 'P001', 'quantity': 100},
    {'product_code': 'P002', 'quantity': 50}
])

# 查詢訂單狀態
order = manager.get_order(order_id)
print(f"訂單狀態: {order['status']}")

# 獲取供應商績效
performance = manager.get_supplier_performance('S001')
```

## 使用範例

查看 `examples/` 目錄獲取更多範例：

- `basic_usage.py` - 基本採購流程
- `approval_workflow.py` - 審批流程示範
- `api_server.py` - REST API 服務
- `reports.py` - 採購報表生成

## API 服務

啟動 FastAPI 服務：

```bash
python examples/api_server.py
```

訪問 http://localhost:8000/docs 查看 API 文檔

### API 端點

#### 供應商管理
- `POST /api/suppliers` - 新增供應商
- `GET /api/suppliers` - 獲取所有供應商
- `GET /api/suppliers/{code}` - 獲取供應商詳情
- `PUT /api/suppliers/{code}` - 更新供應商資訊

#### 採購訂單
- `POST /api/orders` - 創建採購訂單
- `GET /api/orders` - 獲取所有訂單
- `GET /api/orders/{id}` - 獲取訂單詳情
- `PUT /api/orders/{id}/approve` - 審批訂單
- `PUT /api/orders/{id}/reject` - 拒絕訂單
- `PUT /api/orders/{id}/cancel` - 取消訂單

#### 收貨管理
- `POST /api/orders/{id}/receive` - 記錄收貨
- `GET /api/orders/{id}/receipts` - 獲取收貨記錄

#### 統計報表
- `GET /api/reports/summary` - 採購統計摘要
- `GET /api/reports/supplier-performance` - 供應商績效

## 數據模型

### Supplier (供應商)
- code: 供應商編號
- name: 供應商名稱
- contact_person: 聯絡人
- phone: 電話
- email: 電子郵件
- address: 地址
- payment_terms: 付款條款
- rating: 評級

### PurchaseOrder (採購訂單)
- order_no: 訂單編號
- supplier_code: 供應商編號
- order_date: 訂單日期
- status: 狀態 (DRAFT/SUBMITTED/APPROVED/REJECTED/COMPLETED/CANCELLED)
- total_amount: 訂單總額
- requester: 申請人
- approver: 審批人
- notes: 備註

### OrderItem (訂單明細)
- order_id: 訂單ID
- product_code: 產品編號
- quantity: 數量
- unit_price: 單價
- received_quantity: 已收貨數量

### Receipt (收貨記錄)
- order_id: 訂單ID
- receipt_date: 收貨日期
- receiver: 收貨人
- notes: 備註

## 採購流程

1. **創建訂單** - 填寫採購需求，狀態為 DRAFT
2. **提交審批** - 提交訂單，狀態變更為 SUBMITTED
3. **審批** - 主管審批，狀態變更為 APPROVED 或 REJECTED
4. **下單** - 向供應商發送訂單
5. **收貨** - 記錄收貨，部分或全部收貨
6. **完成** - 全部收貨後，狀態變更為 COMPLETED

## 測試

```bash
pytest tests/
```

## 技術細節

- **數據庫**: SQLite3
- **狀態管理**: 有限狀態機 (FSM)
- **API 框架**: FastAPI
- **CLI 框架**: argparse
- **數據驗證**: Pydantic

## 應用場景

- 企業採購管理
- 供應鏈管理系統
- 進銷存系統
- 電商採購平台
- 製造業物料採購

## 功能擴展

可以輕鬆擴展以下功能：

- 🔐 多級審批流程
- 💰 價格歷史追蹤
- 📊 採購預算控制
- 🔄 定期採購自動化
- 📧 郵件通知
- 📄 PDF 訂單生成
- 🔍 高級搜尋篩選
- 📈 採購分析儀表板

## 性能優化建議

- 使用索引優化查詢
- 實現緩存層
- 批量操作優化
- 分頁處理大量訂單
- 非同步處理通知

## 注意事項

- 訂單提交後不可修改，只能取消重建
- 審批後的訂單才能進行收貨
- 支援部分收貨，自動追蹤收貨進度
- 所有狀態變更都有完整記錄

## 授權

MIT License
