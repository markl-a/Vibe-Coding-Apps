#!/bin/bash

# CMS Microservices 測試腳本
# 演示如何使用 CMS 微服務架構的各個服務

API_GATEWAY="http://localhost:8000"
TOKEN=""

echo "🏗️  CMS Microservices 測試"
echo "=========================="
echo ""

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 健康檢查 - API Gateway
echo -e "${BLUE}1. API Gateway 健康檢查${NC}"
curl -s "$API_GATEWAY/health" | jq '.'
echo ""

# 2. Content Service - 創建內容
echo -e "${BLUE}2. 創建內容（Content Service）${NC}"
CONTENT_RESPONSE=$(curl -s -X POST "$API_GATEWAY/api/content" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "微服務架構入門指南",
    "slug": "microservices-guide",
    "content": "<h1>什麼是微服務</h1><p>微服務是一種架構風格...</p>",
    "type": "article",
    "status": "published",
    "author": "系統管理員",
    "category": "技術文章",
    "tags": ["微服務", "架構", "後端"]
  }')

CONTENT_ID=$(echo "$CONTENT_RESPONSE" | jq -r '.id')
echo "$CONTENT_RESPONSE" | jq '.'
echo ""

# 3. Content Service - 獲取內容列表
echo -e "${BLUE}3. 獲取內容列表${NC}"
curl -s "$API_GATEWAY/api/content?page=1&limit=5" | jq '.'
echo ""

# 4. Content Service - 按類型篩選
echo -e "${BLUE}4. 按類型篩選內容（article）${NC}"
curl -s "$API_GATEWAY/api/content?type=article" | jq '.'
echo ""

# 5. Media Service - 上傳媒體
echo -e "${BLUE}5. 模擬上傳媒體（Media Service）${NC}"
MEDIA_RESPONSE=$(curl -s -X POST "$API_GATEWAY/api/media/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "hero-image.jpg",
    "fileType": "image/jpeg",
    "fileSize": 1024000,
    "url": "https://example.com/uploads/hero-image.jpg",
    "alt": "英雄圖片",
    "contentId": "'"$CONTENT_ID"'"
  }')

MEDIA_ID=$(echo "$MEDIA_RESPONSE" | jq -r '.id')
echo "$MEDIA_RESPONSE" | jq '.'
echo ""

# 6. Media Service - 獲取媒體列表
echo -e "${BLUE}6. 獲取媒體列表${NC}"
curl -s "$API_GATEWAY/api/media?limit=10" | jq '.'
echo ""

# 7. Media Service - 圖片處理
echo -e "${BLUE}7. 請求圖片縮略圖${NC}"
curl -s "$API_GATEWAY/api/media/$MEDIA_ID/thumbnail?width=300&height=200" | jq '.'
echo ""

# 8. Cache Service - 設置緩存
echo -e "${BLUE}8. 設置緩存（Cache Service）${NC}"
CACHE_RESPONSE=$(curl -s -X POST "$API_GATEWAY/api/cache" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "featured_content",
    "value": {
      "contentId": "'"$CONTENT_ID"'",
      "title": "微服務架構入門指南",
      "views": 1000
    },
    "ttl": 3600
  }')

echo "$CACHE_RESPONSE" | jq '.'
echo ""

# 9. Cache Service - 獲取緩存
echo -e "${BLUE}9. 獲取緩存數據${NC}"
curl -s "$API_GATEWAY/api/cache/featured_content" | jq '.'
echo ""

# 10. Search Service - 索引內容
echo -e "${BLUE}10. 索引內容（Search Service）${NC}"
INDEX_RESPONSE=$(curl -s -X POST "$API_GATEWAY/api/search/index" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "'"$CONTENT_ID"'",
    "title": "微服務架構入門指南",
    "content": "微服務是一種架構風格，將應用程序構建為一組小型服務...",
    "category": "技術文章",
    "tags": ["微服務", "架構", "後端"],
    "author": "系統管理員"
  }')

echo "$INDEX_RESPONSE" | jq '.'
echo ""

# 11. Search Service - 全文搜索
echo -e "${BLUE}11. 全文搜索（關鍵字: 微服務）${NC}"
curl -s "$API_GATEWAY/api/search?q=微服務&limit=10" | jq '.'
echo ""

# 12. Search Service - 按分類搜索
echo -e "${BLUE}12. 按分類搜索${NC}"
curl -s "$API_GATEWAY/api/search?category=技術文章" | jq '.'
echo ""

# 13. Search Service - 按標籤搜索
echo -e "${BLUE}13. 按標籤搜索${NC}"
curl -s "$API_GATEWAY/api/search?tags=架構" | jq '.'
echo ""

# 14. Content Service - 更新內容
echo -e "${BLUE}14. 更新內容${NC}"
curl -s -X PUT "$API_GATEWAY/api/content/$CONTENT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "微服務架構入門指南 - 完整版",
    "status": "published",
    "views": 1500
  }' | jq '.'
echo ""

# 15. Content Service - 獲取單一內容詳情
echo -e "${BLUE}15. 獲取內容詳情${NC}"
curl -s "$API_GATEWAY/api/content/$CONTENT_ID" | jq '.'
echo ""

# 16. Media Service - 獲取內容關聯的媒體
echo -e "${BLUE}16. 獲取內容關聯的媒體${NC}"
curl -s "$API_GATEWAY/api/media?contentId=$CONTENT_ID" | jq '.'
echo ""

# 17. Cache Service - 查看緩存統計
echo -e "${BLUE}17. 緩存統計${NC}"
curl -s "$API_GATEWAY/api/cache/stats" | jq '.'
echo ""

# 18. Search Service - 搜索建議
echo -e "${BLUE}18. 搜索建議（自動完成）${NC}"
curl -s "$API_GATEWAY/api/search/suggest?q=微" | jq '.'
echo ""

echo -e "${GREEN}✅ 測試完成！${NC}"
echo ""
echo -e "${YELLOW}📊 測試摘要：${NC}"
echo "  - 內容 ID: $CONTENT_ID"
echo "  - 媒體 ID: $MEDIA_ID"
echo ""
echo -e "${YELLOW}🏗️  微服務架構：${NC}"
echo "  - API Gateway (Port 8000): 統一入口"
echo "  - Content Service (Port 3001): 內容管理"
echo "  - Media Service (Port 3002): 媒體處理"
echo "  - Cache Service (Port 3003): 緩存管理"
echo "  - Search Service (Port 3004): 全文搜索"
echo ""
echo -e "${YELLOW}💡 提示：${NC}"
echo "  - 使用 docker-compose up 啟動所有服務"
echo "  - API Gateway 負責路由和負載均衡"
echo "  - 每個服務可以獨立擴展和部署"
