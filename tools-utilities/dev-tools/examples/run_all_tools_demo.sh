#!/bin/bash
# run_all_tools_demo.sh - 運行所有 AI 工具的演示腳本

echo "======================================================================"
echo "🤖 AI 開發工具綜合演示"
echo "======================================================================"
echo ""

# 獲取腳本所在目錄
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DEV_TOOLS_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
DEMO_FILE="$SCRIPT_DIR/demo_ai_tools.py"

cd "$DEV_TOOLS_DIR"

echo "工作目錄: $DEV_TOOLS_DIR"
echo ""

# 1. AI 代碼審查
echo "======================================================================"
echo "1️⃣  AI 代碼審查工具 (ai_code_reviewer.py)"
echo "======================================================================"
echo "審查演示文件..."
python ai_code_reviewer.py "$DEMO_FILE"
echo ""
read -p "按 Enter 繼續..."
echo ""

# 2. 性能分析
echo "======================================================================"
echo "2️⃣  性能分析工具 (performance_profiler.py)"
echo "======================================================================"
echo "分析演示文件性能..."
python performance_profiler.py "$DEMO_FILE"
echo ""
read -p "按 Enter 繼續..."
echo ""

# 3. 安全掃描
echo "======================================================================"
echo "3️⃣  安全掃描工具 (security_scanner.py)"
echo "======================================================================"
echo "掃描演示文件的安全問題..."
python security_scanner.py "$DEMO_FILE"
echo ""
read -p "按 Enter 繼續..."
echo ""

# 4. 環境變量管理（演示）
echo "======================================================================"
echo "4️⃣  環境變量管理工具 (env_manager.py)"
echo "======================================================================"
echo "創建示例 .env 文件..."

# 創建臨時 .env 文件用於演示
cat > /tmp/demo.env << 'EOF'
# Demo Environment Variables
DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=demo_api_key_12345678901234567890
SECRET_KEY=demo_secret_key_98765432109876543210
DEBUG=True
PORT=8000
EOF

echo "顯示環境變量列表..."
python env_manager.py list --env-file /tmp/demo.env

echo ""
echo "執行安全檢查..."
python env_manager.py security --env-file /tmp/demo.env

echo ""
echo "生成範本文件..."
python env_manager.py template --env-file /tmp/demo.env -o /tmp/demo.env.example
cat /tmp/demo.env.example

# 清理
rm -f /tmp/demo.env /tmp/demo.env.example

echo ""
read -p "按 Enter 繼續..."
echo ""

# 總結
echo "======================================================================"
echo "✅ 演示完成！"
echo "======================================================================"
echo ""
echo "已演示的工具:"
echo "  1. AI 代碼審查工具 - 代碼質量分析"
echo "  2. 性能分析工具 - 性能優化建議"
echo "  3. 安全掃描工具 - 安全漏洞檢測"
echo "  4. 環境變量管理工具 - 環境配置管理"
echo ""
echo "更多使用方法請參考 README.md"
echo "======================================================================"
