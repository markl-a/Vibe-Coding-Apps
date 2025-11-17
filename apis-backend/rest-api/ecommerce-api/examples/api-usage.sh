#!/bin/bash

# E-commerce API 使用範例腳本
# 演示電商平台的完整購物流程

BASE_URL="http://localhost:8000/api/v1"
TOKEN=""
PRODUCT_ID=""
ORDER_ID=""

echo "🛒 E-commerce API 使用範例"
echo "==========================="
echo ""

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 健康檢查
echo -e "${BLUE}0. 健康檢查${NC}"
curl -s http://localhost:8000/health | jq '.'
echo ""

# 2. 用戶註冊
echo -e "${BLUE}1. 用戶註冊${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shopper@example.com",
    "password": "ShopPass123",
    "full_name": "購物達人",
    "phone": "0912345678"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# 3. 用戶登入
echo -e "${BLUE}2. 用戶登入${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=shopper@example.com&password=ShopPass123")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
echo "$LOGIN_RESPONSE" | jq '.'
echo -e "${GREEN}Token: ${TOKEN:0:30}...${NC}"
echo ""

# 4. 創建商品
echo -e "${BLUE}3. 創建商品${NC}"
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Sony WH-1000XM5 無線降噪耳機",
    "description": "業界領先的降噪技術，30小時電池續航，支援 LDAC 高音質",
    "price": 11990.00,
    "stock": 50,
    "category": "音訊設備",
    "sku": "SONY-WH1000XM5-BLK",
    "images": ["https://example.com/sony-headphone.jpg"],
    "specifications": {
      "顏色": "黑色",
      "重量": "250g",
      "連接方式": "藍牙 5.2"
    }
  }')

PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | jq -r '.id')
echo "$PRODUCT_RESPONSE" | jq '.'
echo ""

# 5. 創建更多商品
echo -e "${BLUE}4. 創建更多商品${NC}"

curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "羅技 MX Master 3S 無線滑鼠",
    "description": "專業級人體工學設計，8000 DPI 感應器",
    "price": 3290.00,
    "stock": 100,
    "category": "電腦週邊",
    "sku": "LOGI-MXMASTER3S"
  }' | jq '.'

echo ""

curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Keychron K8 Pro 機械鍵盤",
    "description": "無線機械鍵盤，支援 QMK/VIA，熱插拔軸體",
    "price": 3990.00,
    "stock": 75,
    "category": "電腦週邊",
    "sku": "KEY-K8PRO-BLUE"
  }' | jq '.'

echo ""

# 6. 獲取商品列表
echo -e "${BLUE}5. 獲取商品列表（分頁）${NC}"
curl -s "$BASE_URL/products?page=1&size=10" | jq '.'
echo ""

# 7. 搜尋商品
echo -e "${BLUE}6. 搜尋商品（關鍵字: 無線）${NC}"
curl -s "$BASE_URL/products?search=無線" | jq '.'
echo ""

# 8. 按分類篩選
echo -e "${BLUE}7. 按分類篩選（電腦週邊）${NC}"
curl -s "$BASE_URL/products?category=電腦週邊" | jq '.'
echo ""

# 9. 獲取商品詳情
echo -e "${BLUE}8. 獲取商品詳情${NC}"
curl -s "$BASE_URL/products/$PRODUCT_ID" | jq '.'
echo ""

# 10. 添加商品到購物車
echo -e "${BLUE}9. 添加商品到購物車${NC}"
curl -s -X POST "$BASE_URL/cart/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"product_id\": \"$PRODUCT_ID\",
    \"quantity\": 2
  }" | jq '.'
echo ""

# 11. 查看購物車
echo -e "${BLUE}10. 查看購物車內容${NC}"
CART_RESPONSE=$(curl -s "$BASE_URL/cart" \
  -H "Authorization: Bearer $TOKEN")
echo "$CART_RESPONSE" | jq '.'
echo ""

# 12. 更新購物車商品數量
echo -e "${BLUE}11. 更新購物車商品數量${NC}"
curl -s -X PUT "$BASE_URL/cart/items/$PRODUCT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "quantity": 1
  }' | jq '.'
echo ""

# 13. 創建訂單
echo -e "${BLUE}12. 創建訂單${NC}"
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "shipping_address": {
      "recipient_name": "購物達人",
      "phone": "0912345678",
      "address": "台北市大安區敦化南路二段105號",
      "city": "台北市",
      "district": "大安區",
      "postal_code": "106"
    },
    "payment_method": "credit_card",
    "notes": "請在平日上午送達，感謝！"
  }')

ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.id')
echo "$ORDER_RESPONSE" | jq '.'
echo ""

# 14. 獲取訂單列表
echo -e "${BLUE}13. 獲取我的訂單列表${NC}"
curl -s "$BASE_URL/orders" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 15. 獲取訂單詳情
echo -e "${BLUE}14. 獲取訂單詳情${NC}"
curl -s "$BASE_URL/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 16. 獲取用戶資料
echo -e "${BLUE}15. 獲取用戶資料${NC}"
curl -s "$BASE_URL/users/me" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 17. 更新用戶資料
echo -e "${BLUE}16. 更新用戶資料${NC}"
curl -s -X PUT "$BASE_URL/users/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "full_name": "超級購物達人",
    "phone": "0987654321"
  }' | jq '.'
echo ""

echo -e "${GREEN}✅ 測試完成！${NC}"
echo ""
echo -e "${YELLOW}📊 測試摘要：${NC}"
echo "  - 商品 ID: $PRODUCT_ID"
echo "  - 訂單 ID: $ORDER_ID"
echo "  - JWT Token: ${TOKEN:0:30}..."
echo ""
echo -e "${YELLOW}💡 提示：${NC}"
echo "  - 訪問 http://localhost:8000/api/docs 查看 Swagger 文檔"
echo "  - 訪問 http://localhost:8000/api/redoc 查看 ReDoc 文檔"
echo "  - 使用 Token 進行需要認證的操作"
