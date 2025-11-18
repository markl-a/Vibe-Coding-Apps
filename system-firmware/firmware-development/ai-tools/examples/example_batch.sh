#!/bin/bash
# 批處理示例腳本

echo "================================"
echo "批處理示例"
echo "================================"
echo ""

# 設置變量
TOOL_DIR="../"
OUTPUT_DIR="./output"
BATCH_OUTPUT="${OUTPUT_DIR}/batch_results"

# 創建輸出目錄
mkdir -p "$BATCH_OUTPUT"

# 假設有多個源文件
FILES=(
  "sample_code.c"
  "sample_firmware.c"
  # 添加更多文件...
)

echo "處理的文件："
for file in "${FILES[@]}"; do
  echo "  - $file"
done
echo ""

echo "1. 使用 AI 助手進行批處理（分析 + Bug 檢測）"
python "${TOOL_DIR}/ai_assistant.py" batch "${FILES[@]}" \
  --operations analyze bugs \
  -o "$BATCH_OUTPUT/analyze_bugs/"
echo ""

echo "2. 批處理所有操作"
python "${TOOL_DIR}/ai_assistant.py" batch "${FILES[@]}" \
  --operations analyze optimize test document bugs \
  -o "$BATCH_OUTPUT/full_analysis/"
echo ""

echo "3. 僅批處理優化和測試"
python "${TOOL_DIR}/ai_assistant.py" batch "${FILES[@]}" \
  --operations optimize test \
  -o "$BATCH_OUTPUT/optimize_test/"
echo ""

echo "================================"
echo "批處理完成！結果保存在: $BATCH_OUTPUT"
echo "================================"

# 顯示批處理摘要
if [ -f "$BATCH_OUTPUT/analyze_bugs/batch_summary.json" ]; then
  echo ""
  echo "批處理摘要："
  if command -v jq &> /dev/null; then
    jq -r '.total_files' "$BATCH_OUTPUT/analyze_bugs/batch_summary.json" 2>/dev/null | \
      xargs -I {} echo "處理文件數: {}"
  else
    echo "查看 $BATCH_OUTPUT/analyze_bugs/batch_summary.json 獲取詳細信息"
  fi
fi

# 列出所有生成的報告
echo ""
echo "生成的報告："
find "$BATCH_OUTPUT" -type f -name "*.json" -o -name "*.html" | sort
