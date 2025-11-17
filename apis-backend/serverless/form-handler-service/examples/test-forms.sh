#!/bin/bash

# Form Handler Serverless Service 測試腳本
# 演示表單處理無服務器函數的功能

# 注意：需要先部署到 AWS Lambda 或使用 serverless offline
BASE_URL="http://localhost:3000/dev"  # 本地測試
# BASE_URL="https://YOUR-API-ID.execute-api.REGION.amazonaws.com/dev"  # AWS Lambda

echo "📝 Form Handler Service 測試"
echo "============================"
echo ""

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 提交聯絡表單
echo -e "${BLUE}1. 提交聯絡表單${NC}"
CONTACT_RESPONSE=$(curl -s -X POST "$BASE_URL/submitContact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "張小明",
    "email": "ming.chang@example.com",
    "phone": "0912345678",
    "subject": "產品詢問",
    "message": "我想了解更多關於你們產品的資訊，特別是企業方案的部分。請盡快與我聯繫，謝謝！",
    "company": "科技公司 ABC",
    "preferredContactMethod": "email"
  }')

echo "$CONTACT_RESPONSE" | jq '.'
echo ""

# 2. 提交聯絡表單（驗證錯誤）
echo -e "${BLUE}2. 提交無效的聯絡表單（缺少必填字段）${NC}"
INVALID_CONTACT=$(curl -s -X POST "$BASE_URL/submitContact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "張小明",
    "message": "測試訊息"
  }')

echo "$INVALID_CONTACT" | jq '.'
echo ""

# 3. 提交聯絡表單（無效 email）
echo -e "${BLUE}3. 提交無效 email 的表單${NC}"
INVALID_EMAIL=$(curl -s -X POST "$BASE_URL/submitContact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試用戶",
    "email": "invalid-email",
    "phone": "0912345678",
    "subject": "測試",
    "message": "測試訊息"
  }')

echo "$INVALID_EMAIL" | jq '.'
echo ""

# 4. 訂閱新聞通訊
echo -e "${BLUE}4. 訂閱新聞通訊${NC}"
NEWSLETTER_RESPONSE=$(curl -s -X POST "$BASE_URL/submitNewsletter" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com",
    "name": "訂閱者",
    "preferences": {
      "frequency": "weekly",
      "topics": ["技術", "產品更新", "活動資訊"]
    }
  }')

echo "$NEWSLETTER_RESPONSE" | jq '.'
echo ""

# 5. 訂閱新聞通訊（重複訂閱）
echo -e "${BLUE}5. 重複訂閱測試${NC}"
DUPLICATE_SUB=$(curl -s -X POST "$BASE_URL/submitNewsletter" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com",
    "name": "訂閱者"
  }')

echo "$DUPLICATE_SUB" | jq '.'
echo ""

# 6. 批量提交測試
echo -e "${BLUE}6. 批量提交多個聯絡表單${NC}"
for i in {1..3}; do
  echo -e "${YELLOW}提交表單 #$i${NC}"
  curl -s -X POST "$BASE_URL/submitContact" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "用戶 '"$i"'",
      "email": "user'"$i"'@example.com",
      "phone": "091234567'"$i"'",
      "subject": "詢問 #'"$i"'",
      "message": "這是第 '"$i"' 個測試訊息"
    }' | jq '.success, .message'
  echo ""
done

# 7. 測試 CORS（如果有設置）
echo -e "${BLUE}7. 測試 CORS 預檢請求${NC}"
curl -s -X OPTIONS "$BASE_URL/submitContact" \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -I
echo ""

# 8. 性能測試（提交延遲）
echo -e "${BLUE}8. 性能測試（測量響應時間）${NC}"
echo "開始時間: $(date +%H:%M:%S)"

START=$(date +%s)
curl -s -X POST "$BASE_URL/submitContact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "性能測試",
    "email": "perf@example.com",
    "phone": "0912345678",
    "subject": "性能測試",
    "message": "測試表單提交響應時間"
  }' > /dev/null
END=$(date +%s)

DURATION=$((END - START))
echo "結束時間: $(date +%H:%M:%S)"
echo "響應時間: ${DURATION}秒"
echo ""

# 9. 測試最大字段長度
echo -e "${BLUE}9. 測試長文本訊息${NC}"
LONG_MESSAGE=$(curl -s -X POST "$BASE_URL/submitContact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試用戶",
    "email": "test@example.com",
    "phone": "0912345678",
    "subject": "長文本測試",
    "message": "'"$(python3 -c 'print("這是一個很長的訊息" * 100)')"'"
  }')

echo "$LONG_MESSAGE" | jq '.success, .message'
echo ""

# 10. 測試國際化（不同語言）
echo -e "${BLUE}10. 測試國際化內容${NC}"
INTL_RESPONSE=$(curl -s -X POST "$BASE_URL/submitContact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "山田太郎",
    "email": "yamada@example.jp",
    "phone": "+81-90-1234-5678",
    "subject": "お問い合わせ",
    "message": "日本語のメッセージテストです。よろしくお願いします。"
  }')

echo "$INTL_RESPONSE" | jq '.'
echo ""

echo -e "${GREEN}✅ 測試完成！${NC}"
echo ""
echo -e "${YELLOW}📊 測試摘要：${NC}"
echo "  - 聯絡表單提交測試：完成"
echo "  - 新聞通訊訂閱測試：完成"
echo "  - 驗證測試：完成"
echo "  - 性能測試：完成"
echo ""
echo -e "${YELLOW}💡 提示：${NC}"
echo "  - 本地測試: serverless offline"
echo "  - 部署到 AWS: serverless deploy"
echo "  - 查看日誌: serverless logs -f submitContact -t"
echo "  - 查看指標: 在 AWS CloudWatch 中查看"
