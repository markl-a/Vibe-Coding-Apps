#!/bin/bash
# 韌體優化示例腳本

echo "================================"
echo "韌體優化示例"
echo "================================"
echo ""

# 設置變量
TOOL_DIR="../"
SAMPLE_FILE="sample_firmware.c"
OUTPUT_DIR="./output"

# 創建輸出目錄
mkdir -p "$OUTPUT_DIR"

echo "1. 完整優化分析"
python "${TOOL_DIR}/firmware_optimizer.py" "$SAMPLE_FILE" \
  -o "${OUTPUT_DIR}/full_optimization.json"
echo ""

echo "2. 僅進行大小優化分析"
python "${TOOL_DIR}/firmware_optimizer.py" "$SAMPLE_FILE" \
  --size \
  -o "${OUTPUT_DIR}/size_optimization.json"
echo ""

echo "3. 僅進行速度優化分析"
python "${TOOL_DIR}/firmware_optimizer.py" "$SAMPLE_FILE" \
  --speed \
  -o "${OUTPUT_DIR}/speed_optimization.json"
echo ""

echo "4. 僅進行記憶體優化分析"
python "${TOOL_DIR}/firmware_optimizer.py" "$SAMPLE_FILE" \
  --memory \
  -o "${OUTPUT_DIR}/memory_optimization.json"
echo ""

echo "5. 僅進行功耗優化分析"
python "${TOOL_DIR}/firmware_optimizer.py" "$SAMPLE_FILE" \
  --power \
  -o "${OUTPUT_DIR}/power_optimization.json"
echo ""

echo "6. 大小和速度聯合優化"
python "${TOOL_DIR}/firmware_optimizer.py" "$SAMPLE_FILE" \
  --size --speed \
  -o "${OUTPUT_DIR}/size_speed_optimization.json"
echo ""

echo "7. 生成 HTML 優化報告"
python "${TOOL_DIR}/firmware_optimizer.py" "$SAMPLE_FILE" \
  -o "${OUTPUT_DIR}/optimization_report.html" \
  -f html
echo ""

echo "================================"
echo "優化分析完成！結果保存在: $OUTPUT_DIR"
echo "================================"

# 顯示優化建議摘要
if command -v jq &> /dev/null; then
  echo ""
  echo "大小優化預估:"
  jq -r '.optimizations.size.estimated_size_reduction_percent // "N/A"' \
    "${OUTPUT_DIR}/full_optimization.json" 2>/dev/null
  echo ""
  echo "速度優化預估:"
  jq -r '.optimizations.speed.estimated_speedup_percent // "N/A"' \
    "${OUTPUT_DIR}/full_optimization.json" 2>/dev/null
fi
