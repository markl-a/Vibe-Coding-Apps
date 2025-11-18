#!/bin/bash
# AI 工具安裝驗證腳本

echo "=========================================="
echo "AI 輔助開發工具套件 - 安裝驗證"
echo "=========================================="
echo ""

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUCCESS=0
FAILED=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((SUCCESS++))
    else
        echo -e "${RED}✗${NC} $1 (缺失)"
        ((FAILED++))
    fi
}

check_executable() {
    if [ -x "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 (可執行)"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}!${NC} $1 (不可執行，將設置權限)"
        chmod +x "$1"
        ((SUCCESS++))
    fi
}

echo "1. 檢查核心 Python 工具..."
check_executable "code_analyzer.py"
check_executable "firmware_optimizer.py"
check_executable "test_generator.py"
check_executable "doc_generator.py"
check_executable "bug_hunter.py"
check_executable "ai_assistant.py"
echo ""

echo "2. 檢查配置文件..."
check_file "config.yaml"
check_file "requirements.txt"
check_file ".gitignore"
echo ""

echo "3. 檢查文檔..."
check_file "README.md"
check_file "QUICKSTART.md"
check_file "TOOLS_OVERVIEW.md"
echo ""

echo "4. 檢查示例腳本..."
check_executable "examples/example_analysis.sh"
check_executable "examples/example_optimization.sh"
check_executable "examples/example_testing.sh"
check_executable "examples/example_documentation.sh"
check_executable "examples/example_bug_detection.sh"
check_executable "examples/example_batch.sh"
echo ""

echo "5. 檢查示例代碼和文檔..."
check_file "examples/sample_code.c"
check_file "examples/README.md"
echo ""

echo "6. 檢查 Python 版本..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    echo -e "${GREEN}✓${NC} Python 3 已安裝 (版本: $PYTHON_VERSION)"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} Python 3 未安裝"
    ((FAILED++))
fi
echo ""

echo "7. 檢查必要的 Python 包..."
PACKAGES=("anthropic" "yaml")
for pkg in "${PACKAGES[@]}"; do
    if python3 -c "import $pkg" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $pkg 已安裝"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}!${NC} $pkg 未安裝 (運行 'pip install -r requirements.txt')"
        ((FAILED++))
    fi
done
echo ""

echo "8. 檢查 API 密鑰..."
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo -e "${GREEN}✓${NC} ANTHROPIC_API_KEY 環境變量已設置"
    ((SUCCESS++))
else
    echo -e "${YELLOW}!${NC} ANTHROPIC_API_KEY 環境變量未設置"
    echo "   請運行: export ANTHROPIC_API_KEY='your-api-key'"
    ((FAILED++))
fi
echo ""

echo "9. 測試工具可用性..."
for tool in code_analyzer.py firmware_optimizer.py test_generator.py doc_generator.py bug_hunter.py ai_assistant.py; do
    if python3 "$tool" --help &> /dev/null; then
        echo -e "${GREEN}✓${NC} $tool 可正常運行"
        ((SUCCESS++))
    else
        echo -e "${RED}✗${NC} $tool 運行失敗"
        ((FAILED++))
    fi
done
echo ""

echo "=========================================="
echo "驗證結果"
echo "=========================================="
echo -e "成功: ${GREEN}$SUCCESS${NC}"
echo -e "失敗: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 所有檢查通過！工具已準備就緒。${NC}"
    echo ""
    echo "下一步:"
    echo "  1. 設置 API 密鑰: export ANTHROPIC_API_KEY='your-key'"
    echo "  2. 安裝依賴: pip install -r requirements.txt"
    echo "  3. 閱讀快速入門: cat QUICKSTART.md"
    echo "  4. 運行示例: cd examples && ./example_analysis.sh"
    echo ""
    exit 0
else
    echo -e "${RED}✗ 發現 $FAILED 個問題，請檢查並修復。${NC}"
    echo ""
    echo "常見問題解決:"
    echo "  - 安裝 Python 3.8+: sudo apt-get install python3"
    echo "  - 安裝依賴: pip install -r requirements.txt"
    echo "  - 設置權限: chmod +x *.py examples/*.sh"
    echo "  - 設置 API 密鑰: export ANTHROPIC_API_KEY='your-key'"
    echo ""
    exit 1
fi
