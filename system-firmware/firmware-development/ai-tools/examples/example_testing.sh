#!/bin/bash
# 測試生成示例腳本

echo "================================"
echo "測試生成示例"
echo "================================"
echo ""

# 設置變量
TOOL_DIR="../"
SAMPLE_FILE="sample_code.c"
OUTPUT_DIR="./output"

# 創建輸出目錄
mkdir -p "$OUTPUT_DIR"

echo "1. 生成完整測試套件（包含所有類型）"
python "${TOOL_DIR}/test_generator.py" "$SAMPLE_FILE" \
  -o "${OUTPUT_DIR}/full_tests/" \
  -f code
echo ""

echo "2. 僅生成單元測試代碼"
python "${TOOL_DIR}/test_generator.py" "$SAMPLE_FILE" \
  --unit-tests-only \
  -o "${OUTPUT_DIR}/unit_tests.c"
echo ""

echo "3. 生成測試用例（JSON 格式）"
python "${TOOL_DIR}/test_generator.py" "$SAMPLE_FILE" \
  --test-cases \
  -o "${OUTPUT_DIR}/test_cases.json"
echo ""

echo "4. 生成覆蓋率分析"
python "${TOOL_DIR}/test_generator.py" "$SAMPLE_FILE" \
  --coverage \
  -o "${OUTPUT_DIR}/coverage_analysis.json"
echo ""

echo "5. 生成模糊測試建議"
python "${TOOL_DIR}/test_generator.py" "$SAMPLE_FILE" \
  --fuzzing \
  -o "${OUTPUT_DIR}/fuzzing_suggestions.json"
echo ""

echo "6. 使用 CppUTest 框架生成測試"
python "${TOOL_DIR}/test_generator.py" "$SAMPLE_FILE" \
  -t CppUTest \
  -o "${OUTPUT_DIR}/cpputest_tests/" \
  -f code
echo ""

echo "7. 生成 HTML 格式測試報告"
python "${TOOL_DIR}/test_generator.py" "$SAMPLE_FILE" \
  -o "${OUTPUT_DIR}/test_report.html" \
  -f html
echo ""

echo "================================"
echo "測試生成完成！結果保存在: $OUTPUT_DIR"
echo "================================"

# 列出生成的測試文件
echo ""
echo "生成的文件："
find "$OUTPUT_DIR" -type f -name "*.c" -o -name "*.h" -o -name "*.json" -o -name "*.html" | sort
