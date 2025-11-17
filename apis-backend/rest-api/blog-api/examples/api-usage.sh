#!/bin/bash

# Blog API 使用範例腳本
# 這個腳本演示如何使用 Blog API 的主要功能

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""

echo "🚀 Blog API 使用範例"
echo "===================="
echo ""

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 用戶註冊
echo -e "${BLUE}1. 用戶註冊${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo_user",
    "email": "demo@example.com",
    "password": "DemoPass123",
    "displayName": "Demo User"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# 2. 用戶登入
echo -e "${BLUE}2. 用戶登入${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo_user",
    "password": "DemoPass123"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
echo "$LOGIN_RESPONSE" | jq '.'
echo -e "${GREEN}Token: $TOKEN${NC}"
echo ""

# 3. 創建分類
echo -e "${BLUE}3. 創建分類${NC}"
CATEGORY_RESPONSE=$(curl -s -X POST "$BASE_URL/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "技術",
    "slug": "tech",
    "description": "技術相關文章"
  }')

CATEGORY_ID=$(echo "$CATEGORY_RESPONSE" | jq -r '.id')
echo "$CATEGORY_RESPONSE" | jq '.'
echo ""

# 4. 創建標籤
echo -e "${BLUE}4. 創建標籤${NC}"
TAG1_RESPONSE=$(curl -s -X POST "$BASE_URL/tags" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "NestJS",
    "slug": "nestjs"
  }')

TAG1_ID=$(echo "$TAG1_RESPONSE" | jq -r '.id')
echo "$TAG1_RESPONSE" | jq '.'
echo ""

TAG2_RESPONSE=$(curl -s -X POST "$BASE_URL/tags" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "TypeScript",
    "slug": "typescript"
  }')

TAG2_ID=$(echo "$TAG2_RESPONSE" | jq -r '.id')
echo "$TAG2_RESPONSE" | jq '.'
echo ""

# 5. 創建文章
echo -e "${BLUE}5. 創建文章${NC}"
ARTICLE_RESPONSE=$(curl -s -X POST "$BASE_URL/articles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"title\": \"NestJS 完整入門指南\",
    \"slug\": \"nestjs-complete-guide\",
    \"content\": \"NestJS 是一個用於構建高效、可擴展的 Node.js 服務器端應用程序的框架。它使用現代 JavaScript，並結合了 OOP（面向對象編程）、FP（函數式編程）和 FRP（函數響應式編程）的元素。\\n\\n## 核心概念\\n\\n1. **模塊（Modules）**：組織應用程序結構\\n2. **控制器（Controllers）**：處理傳入的請求\\n3. **提供者（Providers）**：實現業務邏輯\\n4. **中間件（Middleware）**：請求處理管道\\n\\n## 開始使用\\n\\n首先，安裝 NestJS CLI：\\n\`\`\`bash\\nnpm i -g @nestjs/cli\\n\`\`\`\\n\\n創建新項目：\\n\`\`\`bash\\nnest new project-name\\n\`\`\`\\n\\n這個指南將幫助你快速上手 NestJS 開發。\",
    \"excerpt\": \"學習如何使用 NestJS 構建現代化的後端應用程序\",
    \"status\": \"published\",
    \"categoryIds\": [\"$CATEGORY_ID\"],
    \"tagIds\": [\"$TAG1_ID\", \"$TAG2_ID\"]
  }")

ARTICLE_ID=$(echo "$ARTICLE_RESPONSE" | jq -r '.id')
echo "$ARTICLE_RESPONSE" | jq '.'
echo ""

# 6. 獲取文章列表
echo -e "${BLUE}6. 獲取文章列表（分頁）${NC}"
curl -s "$BASE_URL/articles?page=1&limit=10" | jq '.'
echo ""

# 7. 獲取單一文章
echo -e "${BLUE}7. 獲取單一文章${NC}"
curl -s "$BASE_URL/articles/$ARTICLE_ID" | jq '.'
echo ""

# 8. 點讚文章
echo -e "${BLUE}8. 點讚文章${NC}"
curl -s -X POST "$BASE_URL/articles/$ARTICLE_ID/like" | jq '.'
echo ""

# 9. 添加評論
echo -e "${BLUE}9. 添加評論${NC}"
COMMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"content\": \"很棒的文章！NestJS 真的很強大。\",
    \"articleId\": \"$ARTICLE_ID\"
  }")

COMMENT_ID=$(echo "$COMMENT_RESPONSE" | jq -r '.id')
echo "$COMMENT_RESPONSE" | jq '.'
echo ""

# 10. 獲取文章評論
echo -e "${BLUE}10. 獲取文章評論${NC}"
curl -s "$BASE_URL/comments?articleId=$ARTICLE_ID" | jq '.'
echo ""

# 11. 審核評論
echo -e "${BLUE}11. 審核評論${NC}"
curl -s -X POST "$BASE_URL/comments/$COMMENT_ID/approve" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 12. 更新文章
echo -e "${BLUE}12. 更新文章${NC}"
curl -s -X PUT "$BASE_URL/articles/$ARTICLE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "NestJS 完整入門指南 - 2024版"
  }' | jq '.'
echo ""

# 13. 獲取所有分類
echo -e "${BLUE}13. 獲取所有分類${NC}"
curl -s "$BASE_URL/categories" | jq '.'
echo ""

# 14. 獲取所有標籤
echo -e "${BLUE}14. 獲取所有標籤${NC}"
curl -s "$BASE_URL/tags" | jq '.'
echo ""

echo -e "${GREEN}✅ 測試完成！${NC}"
echo ""
echo "提示："
echo "  - 訪問 http://localhost:3000/api/docs 查看完整的 API 文檔"
echo "  - 你的 JWT Token: $TOKEN"
echo "  - 文章 ID: $ARTICLE_ID"
