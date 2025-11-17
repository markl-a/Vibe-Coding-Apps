#!/bin/bash
# git_auto_sync.py 使用範例
# 這個腳本展示了 Git 自動同步工具的各種使用場景

# 設定腳本路徑
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GIT_SYNC="$SCRIPT_DIR/git_auto_sync.py"

echo "========================================="
echo "Git Auto Sync 使用範例"
echo "========================================="
echo ""

# 範例 1: 查看單個倉庫的狀態
echo "範例 1: 查看單個倉庫的狀態"
echo "指令: python3 $GIT_SYNC /path/to/repo --status-only"
echo ""
# python3 "$GIT_SYNC" "$HOME/my-project" --status-only

# 範例 2: 同步單個倉庫（拉取和推送）
echo "範例 2: 同步單個倉庫（拉取和推送）"
echo "指令: python3 $GIT_SYNC /path/to/repo"
echo ""
# python3 "$GIT_SYNC" "$HOME/my-project"

# 範例 3: 只拉取不推送
echo "範例 3: 只拉取不推送"
echo "指令: python3 $GIT_SYNC /path/to/repo --no-push"
echo ""
# python3 "$GIT_SYNC" "$HOME/my-project" --no-push

# 範例 4: 自動提交所有更改並同步
echo "範例 4: 自動提交所有更改並同步"
echo "指令: python3 $GIT_SYNC /path/to/repo --commit --message 'Auto sync'"
echo ""
# python3 "$GIT_SYNC" "$HOME/my-project" --commit --message "Auto sync $(date +'%Y-%m-%d %H:%M:%S')"

# 範例 5: 遞迴搜索並同步目錄下的所有 Git 倉庫
echo "範例 5: 遞迴搜索並同步目錄下的所有 Git 倉庫"
echo "指令: python3 $GIT_SYNC /path/to/projects --recursive"
echo ""
# python3 "$GIT_SYNC" "$HOME/projects" --recursive --max-depth 2

# 範例 6: 使用 rebase 而非 merge
echo "範例 6: 使用 rebase 而非 merge"
echo "指令: python3 $GIT_SYNC /path/to/repo --rebase"
echo ""
# python3 "$GIT_SYNC" "$HOME/my-project" --rebase

# 範例 7: 輸出 JSON 格式（方便程式化處理）
echo "範例 7: 輸出 JSON 格式（方便程式化處理）"
echo "指令: python3 $GIT_SYNC /path/to/repo --output json"
echo ""
# python3 "$GIT_SYNC" "$HOME/my-project" --output json > sync_report.json

# 範例 8: 使用設定檔同步多個倉庫
echo "範例 8: 使用設定檔同步多個倉庫"
echo "首先創建設定檔 repos.json："
cat << 'EOF'
{
  "repos": [
    "/home/user/project1",
    "/home/user/project2",
    "/home/user/project3"
  ]
}
EOF
echo ""
echo "指令: python3 $GIT_SYNC --config repos.json"
echo ""
# python3 "$GIT_SYNC" --config repos.json

# 範例 9: 實用的定時任務腳本
echo "範例 9: 實用的定時任務腳本（可加入 crontab）"
cat << 'CRON_EXAMPLE'
#!/bin/bash
# 每天凌晨 2 點自動同步所有項目
# crontab -e 加入：0 2 * * * /path/to/auto_sync_daily.sh

LOG_FILE="$HOME/logs/git_sync_$(date +'%Y%m%d').log"
mkdir -p "$(dirname "$LOG_FILE")"

python3 /path/to/git_auto_sync.py \
    "$HOME/projects" \
    --recursive \
    --no-push \
    --verbose \
    >> "$LOG_FILE" 2>&1

# 如果有錯誤，發送通知
if [ $? -ne 0 ]; then
    echo "Git sync failed at $(date)" | mail -s "Git Sync Error" user@example.com
fi
CRON_EXAMPLE

echo ""
echo "========================================="
echo "提示："
echo "1. 使用 --status-only 先查看狀態，確認無誤後再同步"
echo "2. 使用 --dry-run 預覽操作（如果支援）"
echo "3. 定期備份重要倉庫"
echo "4. 搭配 crontab 實現自動化"
echo "========================================="
