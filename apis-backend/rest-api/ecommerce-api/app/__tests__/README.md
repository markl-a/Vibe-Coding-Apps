# E-commerce API 測試套件

完整的測試套件，用於測試電商 API 的所有核心功能。

## 測試結構

```
app/__tests__/
├── __init__.py           # 測試包初始化
├── conftest.py           # pytest 配置和測試夾具
├── test_security.py      # 安全模組單元測試（密碼哈希、JWT）
├── test_auth.py          # 認證路由測試（註冊、登錄）
├── test_products.py      # 商品路由測試（CRUD 操作）
├── test_cart.py          # 購物車路由測試（添加、查看、刪除）
└── test_orders.py        # 訂單路由測試（創建、查看）
```

## 測試覆蓋範圍

### 1. 安全模組測試 (test_security.py)
- 密碼哈希生成
- 密碼驗證（正確和錯誤）
- JWT 令牌創建（默認和自定義過期時間）
- JWT 令牌解碼（有效、無效、過期）
- 多個聲明的令牌處理

**測試用例數量：9 個**

### 2. 認證測試 (test_auth.py)
- 用戶註冊（成功、重複郵箱、重複用戶名、無效輸入）
- 用戶登錄（成功、錯誤密碼、不存在用戶）
- 令牌驗證（有效令牌、無效令牌、缺少令牌）

**測試用例數量：11 個**

### 3. 商品測試 (test_products.py)
- 獲取商品列表（空列表、有數據、分頁）
- 只顯示活動商品
- 獲取單個商品（成功、不存在、非活動）
- 創建商品（成功、缺少字段、無效數據）

**測試用例數量：10 個**

### 4. 購物車測試 (test_cart.py)
- 添加商品到購物車（成功、自動創建購物車、商品不存在、庫存不足）
- 更新已存在的購物車商品
- 獲取購物車（空購物車、包含商品、總價計算）
- 從購物車移除商品（成功、不存在、錯誤用戶）
- 認證檢查

**測試用例數量：14 個**

### 5. 訂單測試 (test_orders.py)
- 創建訂單（成功、空購物車、庫存不足、多個商品）
- 訂單創建後庫存更新
- 訂單創建後購物車清空
- 獲取訂單列表（空列表、用戶訂單隔離）
- 獲取單個訂單（成功、不存在、錯誤用戶）
- 認證檢查

**測試用例數量：13 個**

## 總測試用例數量

**57 個測試用例**，覆蓋以下方面：
- ✅ 單元測試：安全功能（密碼哈希、JWT）
- ✅ 集成測試：API 端點
- ✅ 認證和授權
- ✅ 數據驗證
- ✅ 錯誤處理
- ✅ 業務邏輯（庫存管理、訂單處理）
- ✅ 用戶隔離和安全性

## 安裝測試依賴

```bash
pip install -r requirements-test.txt
```

## 運行測試

### 運行所有測試
```bash
pytest
```

### 運行特定測試文件
```bash
pytest app/__tests__/test_security.py
pytest app/__tests__/test_auth.py
pytest app/__tests__/test_products.py
pytest app/__tests__/test_cart.py
pytest app/__tests__/test_orders.py
```

### 運行特定測試類別
```bash
# 只運行單元測試
pytest -m unit

# 只運行集成測試
pytest -m integration

# 只運行安全相關測試
pytest -m security

# 只運行認證測試
pytest -m auth

# 只運行購物車測試
pytest -m cart
```

### 查看測試覆蓋率
```bash
pytest --cov=app --cov-report=html
```

覆蓋率報告將生成在 `htmlcov/index.html`

### 詳細輸出
```bash
pytest -v
```

### 顯示打印語句
```bash
pytest -s
```

### 運行並在第一個失敗時停止
```bash
pytest -x
```

## 測試夾具

conftest.py 提供以下測試夾具：

- `db`: 測試數據庫會話（使用 SQLite 內存數據庫）
- `client`: FastAPI 測試客戶端
- `test_user`: 測試用戶
- `test_admin`: 測試管理員
- `auth_headers`: 認證請求頭
- `admin_headers`: 管理員認證請求頭
- `test_category`: 測試商品分類
- `test_product`: 單個測試商品
- `test_products`: 多個測試商品列表
- `test_cart`: 空測試購物車
- `test_cart_with_items`: 包含商品的測試購物車
- `test_order`: 測試訂單

## 測試隔離

- 每個測試使用獨立的數據庫會話
- 測試完成後自動清理數據庫
- 使用 SQLite 內存數據庫，不影響生產數據
- Mock 機制確保測試不依賴外部服務

## 持續集成

測試可以輕松集成到 CI/CD 流程：

```yaml
# .github/workflows/test.yml 示例
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: pip install -r requirements-test.txt
      - name: Run tests
        run: pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## 最佳實踐

1. **保持測試獨立**：每個測試應該能夠獨立運行
2. **使用描述性名稱**：測試函數名稱清楚描述測試內容
3. **AAA 模式**：Arrange（準備）、Act（執行）、Assert（斷言）
4. **測試邊界情況**：包括正常情況和異常情況
5. **定期運行測試**：在提交代碼前運行測試
6. **維護測試覆蓋率**：目標至少 80% 的代碼覆蓋率
