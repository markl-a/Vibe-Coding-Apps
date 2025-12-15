#!/bin/bash

# Weather API 測試運行腳本

set -e

echo "========================================="
echo "Weather API 測試套件"
echo "========================================="
echo ""

# 檢查 Python 環境
if ! command -v python3 &> /dev/null; then
    echo "錯誤: 未找到 Python 3"
    exit 1
fi

echo "Python 版本:"
python3 --version
echo ""

# 安裝測試依賴
echo "安裝測試依賴..."
pip install -q -r requirements.txt
pip install -q -r requirements-test.txt
echo "✓ 依賴安裝完成"
echo ""

# 設置測試環境變量
export ENVIRONMENT=testing
export OPENWEATHER_API_KEY=test-api-key
export SECRET_KEY=test-secret-key
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_DB=1

# 運行測試
echo "運行測試..."
echo ""

# 選項 1: 運行所有測試
if [ "$1" == "all" ] || [ -z "$1" ]; then
    echo "運行所有測試..."
    pytest tests/ -v
fi

# 選項 2: 只運行單元測試
if [ "$1" == "unit" ]; then
    echo "運行單元測試..."
    pytest tests/ -v -m unit
fi

# 選項 3: 只運行集成測試
if [ "$1" == "integration" ]; then
    echo "運行集成測試..."
    pytest tests/ -v -m integration
fi

# 選項 4: 運行測試並生成覆蓋率報告
if [ "$1" == "coverage" ]; then
    echo "運行測試並生成覆蓋率報告..."
    pytest tests/ -v --cov=app --cov-report=html --cov-report=term
    echo ""
    echo "覆蓋率報告已生成: htmlcov/index.html"
fi

# 選項 5: 運行特定測試文件
if [ "$1" == "file" ] && [ ! -z "$2" ]; then
    echo "運行測試文件: $2"
    pytest tests/$2 -v
fi

echo ""
echo "========================================="
echo "測試完成"
echo "========================================="
