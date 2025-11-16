# 庫存管理系統 Inventory Management System

完整的庫存管理系統，支援多倉庫管理、批次追蹤、庫存預警等功能。

## 功能特點

- 📦 多倉庫管理
- 📥 入庫/出庫操作
- 📊 實時庫存查詢
- ⚠️ 庫存預警（低庫存提醒）
- 🔍 批次/序列號追蹤
- 📈 庫存報表統計
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

# 新增產品
python src/main.py add-product --code "P001" --name "筆記本電腦" --unit "台"

# 入庫
python src/main.py stock-in --product-code "P001" --quantity 100 --warehouse "WH001"

# 出庫
python src/main.py stock-out --product-code "P001" --quantity 50 --warehouse "WH001"

# 查詢庫存
python src/main.py check-stock --product-code "P001"

# 查詢所有庫存
python src/main.py list-stock

# 設置庫存預警
python src/main.py set-alert --product-code "P001" --min-quantity 20
```

### Python API 使用

```python
from src.inventory_manager import InventoryManager

# 初始化管理器
manager = InventoryManager('inventory.db')

# 新增產品
manager.add_product('P001', '筆記本電腦', '台', min_quantity=10)

# 新增倉庫
manager.add_warehouse('WH001', '主倉庫', '台北市信義區')

# 入庫
manager.stock_in('P001', 100, 'WH001', batch_no='B20240101')

# 出庫
manager.stock_out('P001', 50, 'WH001', reference='SO-001')

# 查詢庫存
stock = manager.get_stock('P001', 'WH001')
print(f"當前庫存: {stock['quantity']}")

# 獲取所有庫存
all_stock = manager.get_all_stock()

# 獲取低庫存產品
low_stock = manager.get_low_stock_products()
```

## 使用範例

查看 `examples/` 目錄獲取更多範例：

- `basic_usage.py` - 基本庫存操作
- `batch_operations.py` - 批量操作
- `api_server.py` - REST API 服務
- `reports.py` - 庫存報表生成

## API 服務

啟動 FastAPI 服務：

```bash
python examples/api_server.py
```

訪問 http://localhost:8000/docs 查看 API 文檔

### API 端點

- `POST /api/products` - 新增產品
- `GET /api/products` - 獲取所有產品
- `GET /api/products/{code}` - 獲取產品詳情
- `POST /api/warehouses` - 新增倉庫
- `GET /api/warehouses` - 獲取所有倉庫
- `POST /api/stock/in` - 入庫操作
- `POST /api/stock/out` - 出庫操作
- `GET /api/stock` - 獲取所有庫存
- `GET /api/stock/{product_code}` - 獲取產品庫存
- `GET /api/stock/alerts` - 獲取庫存預警

## 數據模型

### Product (產品)
- code: 產品編號
- name: 產品名稱
- unit: 計量單位
- min_quantity: 最低庫存量

### Warehouse (倉庫)
- code: 倉庫編號
- name: 倉庫名稱
- location: 倉庫地址

### Stock (庫存)
- product_code: 產品編號
- warehouse_code: 倉庫編號
- quantity: 庫存數量
- last_updated: 最後更新時間

### Transaction (庫存異動)
- transaction_type: 異動類型 (IN/OUT)
- product_code: 產品編號
- warehouse_code: 倉庫編號
- quantity: 異動數量
- batch_no: 批次號
- reference: 參考單號
- operator: 操作人員
- timestamp: 異動時間

## 測試

```bash
pytest tests/
```

## 技術細節

- **數據庫**: SQLite3
- **ORM**: 原生 SQL (輕量級設計)
- **API 框架**: FastAPI
- **CLI 框架**: argparse
- **數據驗證**: Pydantic

## 應用場景

- 中小型企業庫存管理
- 倉庫管理系統
- 進銷存系統
- 電商庫存管理
- 製造業物料管理

## 功能擴展

可以輕鬆擴展以下功能：

- 🔐 用戶權限管理
- 📊 高級報表（庫存周轉率、ABC 分析）
- 🔄 庫存調撥
- 📦 盤點功能
- 🏷️ 條碼/二維碼支援
- 📤 數據導入/導出
- 🔔 郵件/簡訊預警通知

## 性能優化建議

- 使用索引優化查詢
- 實現數據庫連接池
- 添加 Redis 快取層
- 批量操作使用事務
- 大數據量分頁處理

## 注意事項

- 出庫前會自動檢查庫存數量
- 所有庫存異動都有完整記錄
- 支援並發操作的事務處理
- 定期備份數據庫文件

## 授權

MIT License
