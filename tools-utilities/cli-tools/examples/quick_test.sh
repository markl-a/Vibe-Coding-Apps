#!/bin/bash
# 快速测试所有 CLI 工具的脚本

echo "======================================"
echo "CLI Tools 快速测试脚本"
echo "======================================"
echo ""

# 切换到 CLI 工具目录
cd "$(dirname "$0")/.."

# 1. 测试 filetree
echo "1. 测试 filetree.py"
echo "-----------------------------------"
python filetree.py examples/test_directory --depth 2
echo ""
echo ""

# 2. 测试 passgen
echo "2. 测试 passgen.py"
echo "-----------------------------------"
echo "生成 3 个随机密码："
python passgen.py --count 3
echo ""
echo "生成 2 个记忆短语："
python passgen.py --type passphrase --count 2
echo ""
echo "生成 1 个 PIN 码："
python passgen.py --type pin --length 6
echo ""
echo ""

# 3. 测试 markdown-preview（终端模式）
echo "3. 测试 markdown-preview（终端模式）"
echo "-----------------------------------"
python markdown-preview/markdown_preview.py examples/sample.md | head -40
echo ""
echo "... (输出已截断)"
echo ""
echo ""

# 4. 测试 file-organizer（模拟模式）
echo "4. 测试 file-organizer（模拟模式）"
echo "-----------------------------------"
python file-organizer/file_organizer.py examples/test_files --dry-run
echo ""
echo ""

# 5. 测试 todo-cli
echo "5. 测试 todo-cli"
echo "-----------------------------------"
TEMP_TODO="/tmp/test_todo_$$.json"
echo "使用临时数据文件: $TEMP_TODO"
echo ""
echo "添加测试任务..."
python todo-cli/todo.py --file "$TEMP_TODO" add "测试任务 1" --priority high --tags test
python todo-cli/todo.py --file "$TEMP_TODO" add "测试任务 2" --priority medium --tags test,demo
python todo-cli/todo.py --file "$TEMP_TODO" add "测试任务 3" --priority low
echo ""
echo "列出所有任务..."
python todo-cli/todo.py --file "$TEMP_TODO" list
echo ""
echo "完成任务 #1..."
python todo-cli/todo.py --file "$TEMP_TODO" done 1
echo ""
echo "列出所有任务（包括已完成）..."
python todo-cli/todo.py --file "$TEMP_TODO" list --all
echo ""
echo "清理临时文件..."
rm -f "$TEMP_TODO"
echo ""
echo ""

echo "======================================"
echo "所有测试完成！"
echo "======================================"
echo ""
echo "查看详细使用说明："
echo "  cat examples/README.md"
echo ""
