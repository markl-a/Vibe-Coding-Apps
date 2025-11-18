#!/bin/bash
# Bug 檢測示例腳本

echo "================================"
echo "Bug 檢測示例"
echo "================================"
echo ""

# 設置變量
TOOL_DIR="../"
SAMPLE_FILE="sample_code.c"
OUTPUT_DIR="./output"

# 創建輸出目錄
mkdir -p "$OUTPUT_DIR"

echo "1. 完整 Bug 檢測（所有類型）"
python "${TOOL_DIR}/bug_hunter.py" "$SAMPLE_FILE" \
  -o "${OUTPUT_DIR}/full_bug_report.json"
echo ""

echo "2. 僅進行靜態分析"
python "${TOOL_DIR}/bug_hunter.py" "$SAMPLE_FILE" \
  --static-only \
  -o "${OUTPUT_DIR}/static_analysis.json"
echo ""

echo "3. 僅檢測常見錯誤"
python "${TOOL_DIR}/bug_hunter.py" "$SAMPLE_FILE" \
  --common-errors \
  -o "${OUTPUT_DIR}/common_errors.json"
echo ""

echo "4. 僅檢查邊界條件"
python "${TOOL_DIR}/bug_hunter.py" "$SAMPLE_FILE" \
  --boundary-only \
  -o "${OUTPUT_DIR}/boundary_check.json"
echo ""

echo "5. 僅檢測資源洩漏"
python "${TOOL_DIR}/bug_hunter.py" "$SAMPLE_FILE" \
  --leaks \
  -o "${OUTPUT_DIR}/resource_leaks.json"
echo ""

echo "6. 生成 HTML 格式 Bug 報告"
python "${TOOL_DIR}/bug_hunter.py" "$SAMPLE_FILE" \
  -o "${OUTPUT_DIR}/bug_report.html" \
  -f html
echo ""

echo "7. 檢測常見錯誤和資源洩漏"
python "${TOOL_DIR}/bug_hunter.py" "$SAMPLE_FILE" \
  --common-errors --leaks \
  -o "${OUTPUT_DIR}/errors_and_leaks.json"
echo ""

echo "================================"
echo "Bug 檢測完成！結果保存在: $OUTPUT_DIR"
echo "================================"

# 顯示 Bug 統計
if command -v jq &> /dev/null; then
  echo ""
  echo "Bug 統計:"
  echo "總問題數: $(jq -r '.summary.total_issues // "N/A"' "${OUTPUT_DIR}/full_bug_report.json" 2>/dev/null)"
  echo "嚴重問題數: $(jq -r '.summary.critical_issues // "N/A"' "${OUTPUT_DIR}/full_bug_report.json" 2>/dev/null)"
fi
