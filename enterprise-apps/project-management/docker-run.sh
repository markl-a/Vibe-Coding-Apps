#!/bin/bash

# Docker 快速啟動腳本

echo "🚀 啟動專案管理系統 Docker 容器"
echo "=================================="

# 檢查 Docker 是否安裝
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安裝，請先安裝 Docker"
    exit 1
fi

# 檢查 Docker Compose 是否安裝
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安裝，請先安裝 Docker Compose"
    exit 1
fi

# 創建數據目錄
mkdir -p data logs

# 構建並啟動容器
echo ""
echo "📦 構建 Docker 映像..."
docker-compose build

echo ""
echo "🚀 啟動服務..."
docker-compose up -d

echo ""
echo "✅ 服務已啟動！"
echo ""
echo "訪問以下 URL:"
echo "  📊 Sprint Manager:    http://localhost:8501"
echo "  📋 Kanban Board:      http://localhost:8502"
echo "  📅 Gantt Chart:       http://localhost:8503"
echo "  📈 Dashboard:         http://localhost:8504"
echo ""
echo "查看日誌: docker-compose logs -f"
echo "停止服務: docker-compose down"
echo ""
