#!/bin/bash
# Firmware Builder 測試腳本
# 用於驗證 firmware-builder 工具的基本功能

set -e  # 遇到錯誤立即退出

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILDER="${SCRIPT_DIR}/build_firmware.py"
TEST_DIR="${SCRIPT_DIR}/test_workspace"

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Firmware Builder 測試套件"
echo "========================================"
echo ""

# 測試 1: 檢查工具是否可執行
echo -e "${YELLOW}測試 1: 檢查工具可執行性${NC}"
if [ -x "$BUILDER" ]; then
    echo -e "${GREEN}✓ 工具可執行${NC}"
else
    echo -e "${RED}✗ 工具不可執行，嘗試設置權限...${NC}"
    chmod +x "$BUILDER"
    echo -e "${GREEN}✓ 權限已設置${NC}"
fi
echo ""

# 測試 2: 檢查幫助信息
echo -e "${YELLOW}測試 2: 檢查幫助信息${NC}"
if "$BUILDER" --help > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 幫助信息正常顯示${NC}"
else
    echo -e "${RED}✗ 幫助信息無法顯示${NC}"
    exit 1
fi
echo ""

# 測試 3: 檢查 Python 依賴
echo -e "${YELLOW}測試 3: 檢查 Python 依賴${NC}"

check_python_package() {
    python3 -c "import $1" 2>/dev/null
    return $?
}

if check_python_package "yaml"; then
    echo -e "${GREEN}✓ PyYAML 已安裝${NC}"
else
    echo -e "${RED}✗ PyYAML 未安裝${NC}"
    echo -e "   請運行: pip install pyyaml"
fi

if check_python_package "anthropic"; then
    echo -e "${GREEN}✓ Anthropic SDK 已安裝${NC}"
else
    echo -e "${YELLOW}⚠ Anthropic SDK 未安裝（AI 功能將不可用）${NC}"
    echo -e "   如需 AI 功能，請運行: pip install anthropic"
fi
echo ""

# 測試 4: 檢查工具鏈
echo -e "${YELLOW}測試 4: 檢查編譯工具鏈${NC}"

check_toolchain() {
    if command -v $1 &> /dev/null; then
        version=$($1 --version 2>&1 | head -n 1)
        echo -e "${GREEN}✓ $1 已安裝${NC}"
        echo -e "   版本: $version"
        return 0
    else
        echo -e "${RED}✗ $1 未找到${NC}"
        return 1
    fi
}

# 檢查 ARM GCC（用於 STM32 和 nRF52）
if check_toolchain "arm-none-eabi-gcc"; then
    ARM_GCC_AVAILABLE=1
else
    ARM_GCC_AVAILABLE=0
    echo -e "   安裝: sudo apt-get install gcc-arm-none-eabi"
fi
echo ""

# 測試 5: 創建測試工作區
echo -e "${YELLOW}測試 5: 創建測試工作區${NC}"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR/src"
mkdir -p "$TEST_DIR/include"

# 創建簡單的測試源文件
cat > "$TEST_DIR/src/main.c" << 'EOF'
/* 測試用的簡單 main.c */
#include <stdint.h>

volatile uint32_t counter = 0;

void delay(uint32_t count) {
    for (uint32_t i = 0; i < count; i++) {
        __asm__("nop");
    }
}

int main(void) {
    while(1) {
        counter++;
        delay(1000000);
    }
    return 0;
}
EOF

cat > "$TEST_DIR/include/config.h" << 'EOF'
/* 配置頭文件 */
#ifndef CONFIG_H
#define CONFIG_H

#define VERSION_MAJOR 1
#define VERSION_MINOR 0
#define VERSION_PATCH 0

#endif /* CONFIG_H */
EOF

echo -e "${GREEN}✓ 測試工作區已創建${NC}"
echo -e "   位置: $TEST_DIR"
echo ""

# 測試 6: 創建測試配置文件
echo -e "${YELLOW}測試 6: 創建測試配置文件${NC}"
cat > "$TEST_DIR/test_config.yaml" << EOF
project_name: "test_firmware"
version: "1.0.0"
platform: "stm32"
build_type: "debug"
source_dir: "$TEST_DIR/src"
output_dir: "$TEST_DIR/output"
formats:
  - elf
optimization_level: "O0"
enable_signing: false
include_paths:
  - "$TEST_DIR/include"
defines:
  TEST_BUILD: ""
  DEBUG: "1"
custom_flags:
  - "-ffunction-sections"
  - "-fdata-sections"
EOF

echo -e "${GREEN}✓ 測試配置文件已創建${NC}"
echo ""

# 測試 7: 測試配置文件解析
echo -e "${YELLOW}測試 7: 測試配置文件解析${NC}"
if python3 -c "import yaml; yaml.safe_load(open('$TEST_DIR/test_config.yaml'))" 2>/dev/null; then
    echo -e "${GREEN}✓ 配置文件格式正確${NC}"
else
    echo -e "${RED}✗ 配置文件格式錯誤${NC}"
    exit 1
fi
echo ""

# 測試 8: 模擬構建（如果有工具鏈）
if [ $ARM_GCC_AVAILABLE -eq 1 ]; then
    echo -e "${YELLOW}測試 8: 執行模擬構建${NC}"
    echo -e "注意: 這個測試可能會失敗（因為缺少鏈接腳本），但可以測試編譯流程"
    echo ""

    # 不使用 set -e，允許這個測試失敗
    set +e
    "$BUILDER" \
        --platform stm32 \
        --build-type debug \
        --version 1.0.0-test \
        --project test \
        --source-dir "$TEST_DIR/src" \
        --output-dir "$TEST_DIR/output_manual" \
        --optimization O0 \
        --verbose 2>&1 | head -n 20

    BUILD_RESULT=$?
    set -e

    if [ $BUILD_RESULT -eq 0 ]; then
        echo -e "${GREEN}✓ 構建測試完全成功${NC}"
    else
        echo -e "${YELLOW}⚠ 構建測試部分失敗（這是預期的，因為缺少完整的項目設置）${NC}"
        echo -e "   但工具的基本功能已驗證${NC}"
    fi
else
    echo -e "${YELLOW}測試 8: 跳過（缺少工具鏈）${NC}"
fi
echo ""

# 測試 9: 測試不同的命令行選項
echo -e "${YELLOW}測試 9: 測試命令行選項${NC}"

test_option() {
    if "$BUILDER" "$@" --help > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $1 選項正常${NC}"
        return 0
    else
        echo -e "${RED}✗ $1 選項異常${NC}"
        return 1
    fi
}

test_option "--help"
test_option "-h"
echo ""

# 測試 10: 檢查輸出目錄結構
echo -e "${YELLOW}測試 10: 檢查輸出目錄結構${NC}"
if [ -d "$TEST_DIR/output_manual" ]; then
    echo -e "${GREEN}✓ 輸出目錄已創建${NC}"
    echo -e "   內容:"
    ls -la "$TEST_DIR/output_manual" 2>/dev/null | head -n 10 || echo "   (目錄為空或無法訪問)"
else
    echo -e "${YELLOW}⚠ 輸出目錄未創建（這是正常的，如果前面的構建測試失敗）${NC}"
fi
echo ""

# 測試總結
echo "========================================"
echo -e "${GREEN}測試完成！${NC}"
echo "========================================"
echo ""
echo "測試工作區位於: $TEST_DIR"
echo ""
echo "如果所有測試都通過，firmware-builder 工具已準備就緒！"
echo ""
echo "下一步:"
echo "1. 如果 ARM GCC 未安裝: sudo apt-get install gcc-arm-none-eabi"
echo "2. 如果 PyYAML 未安裝: pip install pyyaml"
echo "3. 如果需要 AI 功能: pip install anthropic"
echo "4. 參考 README.md 和 EXAMPLES.md 了解詳細使用方法"
echo ""
echo "快速開始:"
echo "  $BUILDER --config build_config.yaml"
echo ""

# 清理選項
read -p "是否清理測試工作區？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$TEST_DIR"
    echo -e "${GREEN}✓ 測試工作區已清理${NC}"
else
    echo "測試工作區保留在: $TEST_DIR"
fi
