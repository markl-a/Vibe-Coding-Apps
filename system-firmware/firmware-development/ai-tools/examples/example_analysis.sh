#!/bin/bash
# 代碼分析示例腳本

echo "================================"
echo "代碼質量分析示例"
echo "================================"
echo ""

# 設置變量
TOOL_DIR="../"
SAMPLE_FILE="sample_code.c"
OUTPUT_DIR="./output"

# 創建輸出目錄
mkdir -p "$OUTPUT_DIR"

echo "1. 完整代碼分析（JSON 格式）"
python "${TOOL_DIR}/code_analyzer.py" "$SAMPLE_FILE" \
  -o "${OUTPUT_DIR}/full_analysis.json"
echo ""

echo "2. 完整代碼分析（HTML 格式）"
python "${TOOL_DIR}/code_analyzer.py" "$SAMPLE_FILE" \
  -o "${OUTPUT_DIR}/full_analysis.html" \
  -f html
echo ""

echo "3. 僅進行代碼質量分析"
python "${TOOL_DIR}/code_analyzer.py" "$SAMPLE_FILE" \
  --quality-only \
  -o "${OUTPUT_DIR}/quality_only.json"
echo ""

echo "4. 僅進行安全分析"
python "${TOOL_DIR}/code_analyzer.py" "$SAMPLE_FILE" \
  --security-only \
  -o "${OUTPUT_DIR}/security_only.json"
echo ""

echo "5. 僅進行性能分析"
python "${TOOL_DIR}/code_analyzer.py" "$SAMPLE_FILE" \
  --performance-only \
  -o "${OUTPUT_DIR}/performance_only.json"
echo ""

echo "6. 僅進行記憶體分析"
python "${TOOL_DIR}/code_analyzer.py" "$SAMPLE_FILE" \
  --memory-only \
  -o "${OUTPUT_DIR}/memory_only.json"
echo ""

echo "================================"
echo "分析完成！結果保存在: $OUTPUT_DIR"
echo "================================"

# 顯示結果摘要
if command -v jq &> /dev/null; then
  echo ""
  echo "總體評分:"
  jq -r '.overall_score' "${OUTPUT_DIR}/full_analysis.json" 2>/dev/null || echo "N/A"
else
  echo "提示: 安裝 jq 以查看 JSON 結果摘要"
fi
