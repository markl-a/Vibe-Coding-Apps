#!/bin/bash

# E-commerce API 測試運行腳本

echo "================================================"
echo "E-commerce API 測試套件"
echo "================================================"
echo ""

# 檢查是否安裝了測試依賴
echo "檢查測試依賴..."
if ! python -c "import pytest" &> /dev/null; then
    echo "❌ pytest 未安裝"
    echo "正在安裝測試依賴..."
    pip install -r requirements-test.txt
else
    echo "✅ 測試依賴已安裝"
fi

echo ""
echo "================================================"
echo "測試統計"
echo "================================================"
echo ""

# 統計測試文件和測試用例
TEST_FILES=$(find app/__tests__ -name "test_*.py" | wc -l)
TEST_CASES=$(grep -r "def test_" app/__tests__/test_*.py | wc -l)

echo "測試文件數: $TEST_FILES"
echo "測試用例數: $TEST_CASES"
echo ""

echo "各文件測試數量:"
for file in app/__tests__/test_*.py; do
    count=$(grep -c "def test_" "$file")
    basename=$(basename "$file")
    echo "  - $basename: $count 個測試"
done

echo ""
echo "================================================"
echo "開始運行測試"
echo "================================================"
echo ""

# 運行測試
pytest -v --cov=app --cov-report=term-missing --cov-report=html

echo ""
echo "================================================"
echo "測試完成"
echo "================================================"
echo ""
echo "查看詳細覆蓋率報告: htmlcov/index.html"
