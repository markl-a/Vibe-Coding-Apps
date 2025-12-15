# 測試用例完整列表

## test_security.py (10 個測試)

### TestPasswordHashing (4 個測試)
1. `test_get_password_hash` - 測試密碼哈希生成
2. `test_verify_password_correct` - 測試正確密碼驗證
3. `test_verify_password_incorrect` - 測試錯誤密碼驗證
4. `test_different_hashes_for_same_password` - 測試相同密碼生成不同哈希值

### TestJWTTokens (6 個測試)
5. `test_create_access_token_default_expiry` - 測試創建默認過期令牌
6. `test_create_access_token_custom_expiry` - 測試創建自定義過期令牌
7. `test_decode_access_token_valid` - 測試解碼有效令牌
8. `test_decode_access_token_invalid` - 測試解碼無效令牌
9. `test_decode_access_token_expired` - 測試解碼過期令牌
10. `test_create_token_with_multiple_claims` - 測試多聲明令牌

---

## test_auth.py (13 個測試)

### TestUserRegistration (5 個測試)
1. `test_register_new_user_success` - 測試成功註冊新用戶
2. `test_register_duplicate_email` - 測試重複郵箱註冊
3. `test_register_duplicate_username` - 測試重複用戶名註冊
4. `test_register_invalid_email` - 測試無效郵箱註冊
5. `test_register_missing_required_fields` - 測試缺少必填字段

### TestUserLogin (4 個測試)
6. `test_login_success` - 測試成功登錄
7. `test_login_incorrect_password` - 測試錯誤密碼登錄
8. `test_login_nonexistent_user` - 測試不存在用戶登錄
9. `test_login_missing_credentials` - 測試缺少憑證登錄

### TestAuthentication (4 個測試)
10. `test_access_protected_route_with_valid_token` - 測試有效令牌訪問
11. `test_access_protected_route_without_token` - 測試無令牌訪問
12. `test_access_protected_route_with_invalid_token` - 測試無效令牌訪問
13. `test_access_protected_route_with_malformed_header` - 測試格式錯誤的認證頭

---

## test_products.py (10 個測試)

### TestGetProducts (4 個測試)
1. `test_get_products_empty_list` - 測試獲取空商品列表
2. `test_get_products_with_data` - 測試獲取商品列表
3. `test_get_products_pagination` - 測試商品列表分頁
4. `test_get_products_only_active` - 測試只返回活動商品

### TestGetProductById (3 個測試)
5. `test_get_product_by_id_success` - 測試成功獲取商品詳情
6. `test_get_product_by_id_not_found` - 測試獲取不存在的商品
7. `test_get_inactive_product_by_id` - 測試獲取非活動商品

### TestCreateProduct (3 個測試)
8. `test_create_product_success` - 測試成功創建商品
9. `test_create_product_missing_fields` - 測試缺少必填字段
10. `test_create_product_invalid_price` - 測試無效價格

---

## test_cart.py (14 個測試)

### TestAddToCart (6 個測試)
1. `test_add_to_cart_success` - 測試成功添加商品
2. `test_add_to_cart_creates_cart_if_not_exists` - 測試自動創建購物車
3. `test_add_to_cart_product_not_found` - 測試添加不存在的商品
4. `test_add_to_cart_insufficient_stock` - 測試庫存不足
5. `test_add_to_cart_update_existing_item` - 測試更新已存在商品
6. `test_add_to_cart_without_authentication` - 測試未認證訪問

### TestGetCart (4 個測試)
7. `test_get_empty_cart` - 測試獲取空購物車
8. `test_get_cart_with_items` - 測試獲取包含商品的購物車
9. `test_get_cart_without_authentication` - 測試未認證訪問
10. `test_get_cart_calculates_total_correctly` - 測試正確計算總價

### TestRemoveFromCart (4 個測試)
11. `test_remove_from_cart_success` - 測試成功移除商品
12. `test_remove_from_cart_item_not_found` - 測試移除不存在的商品
13. `test_remove_from_cart_wrong_user` - 測試錯誤用戶訪問
14. `test_remove_from_cart_without_authentication` - 測試未認證訪問

---

## test_orders.py (14 個測試)

### TestCreateOrder (6 個測試)
1. `test_create_order_success` - 測試成功創建訂單
2. `test_create_order_empty_cart` - 測試空購物車創建訂單
3. `test_create_order_insufficient_stock` - 測試庫存不足
4. `test_create_order_without_authentication` - 測試未認證訪問
5. `test_create_order_missing_fields` - 測試缺少必填字段
6. `test_create_order_with_multiple_items` - 測試多商品訂單

### TestGetOrders (4 個測試)
7. `test_get_orders_empty_list` - 測試獲取空訂單列表
8. `test_get_orders_with_data` - 測試獲取用戶訂單列表
9. `test_get_orders_only_user_orders` - 測試用戶訂單隔離
10. `test_get_orders_without_authentication` - 測試未認證訪問

### TestGetOrderById (4 個測試)
11. `test_get_order_by_id_success` - 測試成功獲取訂單詳情
12. `test_get_order_by_id_not_found` - 測試獲取不存在的訂單
13. `test_get_order_by_id_wrong_user` - 測試錯誤用戶訪問
14. `test_get_order_by_id_without_authentication` - 測試未認證訪問

---

## 總計：61 個測試用例

### 按類型統計
- 單元測試：10 個
- 集成測試：51 個

### 按模組統計
- 安全模組：10 個
- 認證模組：13 個
- 商品模組：10 個
- 購物車模組：14 個
- 訂單模組：14 個
