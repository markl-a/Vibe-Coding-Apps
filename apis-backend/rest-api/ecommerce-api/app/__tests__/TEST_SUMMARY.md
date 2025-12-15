# E-commerce API 測試套件摘要

## 測試統計

- **總測試文件數**：5 個
- **總測試用例數**：61 個
- **測試夾具數**：13 個
- **測試覆蓋範圍**：安全、認證、商品、購物車、訂單

## 測試文件詳情

### 1. test_security.py - 安全模組測試
**測試數量：10 個**

#### 測試類別
- `TestPasswordHashing` - 密碼哈希測試（4 個測試）
  - `test_get_password_hash` - 測試密碼哈希生成
  - `test_verify_password_correct` - 測試正確密碼驗證
  - `test_verify_password_incorrect` - 測試錯誤密碼驗證
  - `test_different_hashes_for_same_password` - 測試相同密碼生成不同哈希值

- `TestJWTTokens` - JWT 令牌測試（6 個測試）
  - `test_create_access_token_default_expiry` - 測試創建默認過期令牌
  - `test_create_access_token_custom_expiry` - 測試創建自定義過期令牌
  - `test_decode_access_token_valid` - 測試解碼有效令牌
  - `test_decode_access_token_invalid` - 測試解碼無效令牌
  - `test_decode_access_token_expired` - 測試解碼過期令牌
  - `test_create_token_with_multiple_claims` - 測試多聲明令牌

**標記**：`@pytest.mark.unit`, `@pytest.mark.security`

---

### 2. test_auth.py - 認證路由測試
**測試數量：13 個**

#### 測試類別
- `TestUserRegistration` - 用戶註冊測試（5 個測試）
  - `test_register_new_user_success` - 測試成功註冊新用戶
  - `test_register_duplicate_email` - 測試重複郵箱註冊
  - `test_register_duplicate_username` - 測試重複用戶名註冊
  - `test_register_invalid_email` - 測試無效郵箱註冊
  - `test_register_missing_required_fields` - 測試缺少必填字段

- `TestUserLogin` - 用戶登錄測試（4 個測試）
  - `test_login_success` - 測試成功登錄
  - `test_login_incorrect_password` - 測試錯誤密碼登錄
  - `test_login_nonexistent_user` - 測試不存在用戶登錄
  - `test_login_missing_credentials` - 測試缺少憑證登錄

- `TestAuthentication` - 認證中間件測試（4 個測試）
  - `test_access_protected_route_with_valid_token` - 測試有效令牌訪問
  - `test_access_protected_route_without_token` - 測試無令牌訪問
  - `test_access_protected_route_with_invalid_token` - 測試無效令牌訪問
  - `test_access_protected_route_with_malformed_header` - 測試格式錯誤的認證頭

**標記**：`@pytest.mark.integration`, `@pytest.mark.auth`

---

### 3. test_products.py - 商品路由測試
**測試數量：10 個**

#### 測試類別
- `TestGetProducts` - 獲取商品列表測試（4 個測試）
  - `test_get_products_empty_list` - 測試獲取空商品列表
  - `test_get_products_with_data` - 測試獲取商品列表
  - `test_get_products_pagination` - 測試商品列表分頁
  - `test_get_products_only_active` - 測試只返回活動商品

- `TestGetProductById` - 獲取單個商品測試（3 個測試）
  - `test_get_product_by_id_success` - 測試成功獲取商品詳情
  - `test_get_product_by_id_not_found` - 測試獲取不存在的商品
  - `test_get_inactive_product_by_id` - 測試獲取非活動商品

- `TestCreateProduct` - 創建商品測試（3 個測試）
  - `test_create_product_success` - 測試成功創建商品
  - `test_create_product_missing_fields` - 測試缺少必填字段
  - `test_create_product_invalid_price` - 測試無效價格

**標記**：`@pytest.mark.integration`, `@pytest.mark.products`

---

### 4. test_cart.py - 購物車路由測試
**測試數量：14 個**

#### 測試類別
- `TestAddToCart` - 添加到購物車測試（6 個測試）
  - `test_add_to_cart_success` - 測試成功添加商品
  - `test_add_to_cart_creates_cart_if_not_exists` - 測試自動創建購物車
  - `test_add_to_cart_product_not_found` - 測試添加不存在的商品
  - `test_add_to_cart_insufficient_stock` - 測試庫存不足
  - `test_add_to_cart_update_existing_item` - 測試更新已存在商品
  - `test_add_to_cart_without_authentication` - 測試未認證訪問

- `TestGetCart` - 獲取購物車測試（4 個測試）
  - `test_get_empty_cart` - 測試獲取空購物車
  - `test_get_cart_with_items` - 測試獲取包含商品的購物車
  - `test_get_cart_without_authentication` - 測試未認證訪問
  - `test_get_cart_calculates_total_correctly` - 測試正確計算總價

- `TestRemoveFromCart` - 從購物車移除測試（4 個測試）
  - `test_remove_from_cart_success` - 測試成功移除商品
  - `test_remove_from_cart_item_not_found` - 測試移除不存在的商品
  - `test_remove_from_cart_wrong_user` - 測試錯誤用戶訪問
  - `test_remove_from_cart_without_authentication` - 測試未認證訪問

**標記**：`@pytest.mark.integration`, `@pytest.mark.cart`

---

### 5. test_orders.py - 訂單路由測試
**測試數量：14 個**

#### 測試類別
- `TestCreateOrder` - 創建訂單測試（6 個測試）
  - `test_create_order_success` - 測試成功創建訂單
  - `test_create_order_empty_cart` - 測試空購物車創建訂單
  - `test_create_order_insufficient_stock` - 測試庫存不足
  - `test_create_order_without_authentication` - 測試未認證訪問
  - `test_create_order_missing_fields` - 測試缺少必填字段
  - `test_create_order_with_multiple_items` - 測試多商品訂單

- `TestGetOrders` - 獲取訂單列表測試（4 個測試）
  - `test_get_orders_empty_list` - 測試獲取空訂單列表
  - `test_get_orders_with_data` - 測試獲取用戶訂單列表
  - `test_get_orders_only_user_orders` - 測試用戶訂單隔離
  - `test_get_orders_without_authentication` - 測試未認證訪問

- `TestGetOrderById` - 獲取單個訂單測試（4 個測試）
  - `test_get_order_by_id_success` - 測試成功獲取訂單詳情
  - `test_get_order_by_id_not_found` - 測試獲取不存在的訂單
  - `test_get_order_by_id_wrong_user` - 測試錯誤用戶訪問
  - `test_get_order_by_id_without_authentication` - 測試未認證訪問

**標記**：`@pytest.mark.integration`, `@pytest.mark.orders`

---

## 測試夾具（conftest.py）

### 數據庫夾具
- `db` - 測試數據庫會話（SQLite 內存數據庫）
- `client` - FastAPI 測試客戶端

### 用戶夾具
- `test_user` - 測試用戶（email: test@example.com, username: testuser）
- `test_admin` - 測試管理員（email: admin@example.com, username: admin）
- `auth_headers` - 測試用戶認證頭
- `admin_headers` - 管理員認證頭

### 商品夾具
- `test_category` - 測試分類（Electronics）
- `test_product` - 單個測試商品（Test Laptop）
- `test_products` - 多個測試商品列表（5 個商品）

### 購物車夾具
- `test_cart` - 空測試購物車
- `test_cart_with_items` - 包含商品的測試購物車（2 個商品）

### 訂單夾具
- `test_order` - 測試訂單（包含訂單項）

---

## 測試覆蓋的功能

### 安全功能
- ✅ 密碼哈希（bcrypt）
- ✅ 密碼驗證
- ✅ JWT 令牌創建
- ✅ JWT 令牌解碼和驗證
- ✅ 令牌過期處理

### 認證和授權
- ✅ 用戶註冊
- ✅ 用戶登錄
- ✅ 令牌認證
- ✅ 受保護路由訪問控制
- ✅ 用戶數據隔離

### 商品管理
- ✅ 商品列表獲取
- ✅ 商品分頁
- ✅ 商品詳情查看
- ✅ 商品創建
- ✅ 活動/非活動商品過濾

### 購物車功能
- ✅ 添加商品到購物車
- ✅ 自動創建購物車
- ✅ 更新購物車商品數量
- ✅ 查看購物車
- ✅ 計算購物車總價
- ✅ 從購物車移除商品
- ✅ 庫存驗證

### 訂單管理
- ✅ 創建訂單
- ✅ 訂單列表查看
- ✅ 訂單詳情查看
- ✅ 訂單創建後庫存更新
- ✅ 訂單創建後購物車清空
- ✅ 用戶訂單隔離
- ✅ 多商品訂單處理

### 數據驗證
- ✅ 必填字段驗證
- ✅ 郵箱格式驗證
- ✅ 數據類型驗證
- ✅ 業務規則驗證（庫存、權限等）

### 錯誤處理
- ✅ 404 Not Found
- ✅ 400 Bad Request
- ✅ 401 Unauthorized
- ✅ 422 Unprocessable Entity
- ✅ 自定義錯誤消息

---

## 運行測試

### 安裝依賴
```bash
pip install -r requirements-test.txt
```

### 運行所有測試
```bash
pytest
```

### 運行特定文件
```bash
pytest app/__tests__/test_security.py
pytest app/__tests__/test_auth.py
pytest app/__tests__/test_products.py
pytest app/__tests__/test_cart.py
pytest app/__tests__/test_orders.py
```

### 按標記運行
```bash
pytest -m unit          # 只運行單元測試
pytest -m integration   # 只運行集成測試
pytest -m security      # 只運行安全測試
pytest -m auth          # 只運行認證測試
pytest -m products      # 只運行商品測試
pytest -m cart          # 只運行購物車測試
pytest -m orders        # 只運行訂單測試
```

### 查看覆蓋率
```bash
pytest --cov=app --cov-report=html
```

---

## 測試特點

1. **完全隔離**：每個測試使用獨立的數據庫會話
2. **自動清理**：測試完成後自動清理數據
3. **使用 Mock**：使用內存數據庫，不影響生產環境
4. **全面覆蓋**：覆蓋正常流程和異常情況
5. **易於維護**：清晰的測試結構和命名
6. **可擴展**：易於添加新測試

---

## 下一步建議

1. **增加測試覆蓋率**
   - 添加更多邊界條件測試
   - 測試並發場景
   - 測試性能

2. **集成測試**
   - 添加端到端測試
   - 測試完整的用戶流程

3. **持續集成**
   - 設置 GitHub Actions
   - 自動運行測試
   - 覆蓋率報告

4. **性能測試**
   - 添加負載測試
   - 測試數據庫查詢性能
   - API 響應時間測試
