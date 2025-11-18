#!/bin/bash
# 文檔生成示例腳本

echo "================================"
echo "文檔生成示例"
echo "================================"
echo ""

# 設置變量
TOOL_DIR="../"
SAMPLE_FILE="sample_code.c"
OUTPUT_DIR="./output"
PROJECT_NAME="Sample Firmware"

# 創建輸出目錄
mkdir -p "$OUTPUT_DIR"

echo "1. 生成完整文檔包"
python "${TOOL_DIR}/doc_generator.py" "$SAMPLE_FILE" \
  -p "$PROJECT_NAME" \
  -o "${OUTPUT_DIR}/docs/"
echo ""

echo "2. 僅生成 API 文檔"
python "${TOOL_DIR}/doc_generator.py" "$SAMPLE_FILE" \
  --api-only \
  -p "$PROJECT_NAME" \
  -o "${OUTPUT_DIR}/API.md"
echo ""

echo "3. 僅生成帶註釋的代碼"
python "${TOOL_DIR}/doc_generator.py" "$SAMPLE_FILE" \
  --comments-only \
  --comment-style doxygen \
  -o "${OUTPUT_DIR}/commented_code.c"
echo ""

echo "4. 僅生成使用手冊"
python "${TOOL_DIR}/doc_generator.py" "$SAMPLE_FILE" \
  --manual-only \
  -p "$PROJECT_NAME" \
  -o "${OUTPUT_DIR}/USER_MANUAL.md"
echo ""

echo "5. 僅生成 README"
python "${TOOL_DIR}/doc_generator.py" "$SAMPLE_FILE" \
  --readme-only \
  -p "$PROJECT_NAME" \
  -o "${OUTPUT_DIR}/README.md"
echo ""

echo "6. 使用 JavaDoc 風格註釋"
python "${TOOL_DIR}/doc_generator.py" "$SAMPLE_FILE" \
  --comments-only \
  --comment-style javadoc \
  -o "${OUTPUT_DIR}/commented_code_javadoc.c"
echo ""

echo "7. 生成 HTML 格式文檔"
python "${TOOL_DIR}/doc_generator.py" "$SAMPLE_FILE" \
  -p "$PROJECT_NAME" \
  --doc-format html \
  -o "${OUTPUT_DIR}/docs_html/"
echo ""

echo "================================"
echo "文檔生成完成！結果保存在: $OUTPUT_DIR"
echo "================================"

# 列出生成的文檔文件
echo ""
echo "生成的文檔："
find "$OUTPUT_DIR" -type f \( -name "*.md" -o -name "*.c" -o -name "*.html" \) | sort
