#!/bin/bash
# cleanup_old_files.py 使用範例
# 這個腳本展示了舊檔案清理工具的各種使用場景

# 設定腳本路徑
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLEANUP_TOOL="$SCRIPT_DIR/cleanup_old_files.py"

echo "========================================="
echo "Cleanup Old Files 使用範例"
echo "========================================="
echo ""

# 範例 1: 刪除 30 天前的檔案
echo "範例 1: 刪除 30 天前的檔案"
echo "指令: python3 $CLEANUP_TOOL /tmp --days 30"
echo ""
# python3 "$CLEANUP_TOOL" /tmp --days 30

# 範例 2: 清理大於 100MB 的檔案
echo "範例 2: 清理大於 100MB 的檔案"
echo "指令: python3 $CLEANUP_TOOL ~/Downloads --size-gt 100M"
echo ""
# python3 "$CLEANUP_TOOL" "$HOME/Downloads" --size-gt 100M

# 範例 3: 清理小於 1KB 的空檔案
echo "範例 3: 清理小於 1KB 的空檔案"
echo "指令: python3 $CLEANUP_TOOL /tmp --size-lt 1K"
echo ""
# python3 "$CLEANUP_TOOL" /tmp --size-lt 1K

# 範例 4: 只清理 .log 檔案
echo "範例 4: 只清理 .log 檔案"
echo "指令: python3 $CLEANUP_TOOL /var/log --pattern '*.log' --days 7"
echo ""
# python3 "$CLEANUP_TOOL" /var/log --pattern "*.log" --days 7

# 範例 5: 安全模式（移至垃圾桶而非刪除）
echo "範例 5: 安全模式（移至垃圾桶而非刪除）"
echo "指令: python3 $CLEANUP_TOOL /temp --days 7 --safe-mode"
echo ""
# python3 "$CLEANUP_TOOL" /temp --days 7 --safe-mode

# 範例 6: 預覽模式（不實際刪除）
echo "範例 6: 預覽模式（不實際刪除）"
echo "指令: python3 $CLEANUP_TOOL /data --days 90 --dry-run"
echo ""
# python3 "$CLEANUP_TOOL" /data --days 90 --dry-run --verbose

# 範例 7: 遞迴清理子目錄
echo "範例 7: 遞迴清理子目錄"
echo "指令: python3 $CLEANUP_TOOL ~/projects --days 180 --recursive"
echo ""
# python3 "$CLEANUP_TOOL" "$HOME/projects" --days 180 --recursive

# 範例 8: 組合條件：清理 30 天前且大於 10MB 的 .tmp 檔案
echo "範例 8: 組合條件：清理 30 天前且大於 10MB 的 .tmp 檔案"
echo "指令: python3 $CLEANUP_TOOL /tmp --days 30 --size-gt 10M --pattern '*.tmp'"
echo ""
# python3 "$CLEANUP_TOOL" /tmp --days 30 --size-gt 10M --pattern "*.tmp"

# 範例 9: 強制刪除（不需要確認）
echo "範例 9: 強制刪除（不需要確認）"
echo "指令: python3 $CLEANUP_TOOL /tmp --days 7 --force"
echo ""
# python3 "$CLEANUP_TOOL" /tmp --days 7 --force

# 範例 10: 清理暫存目錄的實用腳本
echo "範例 10: 清理暫存目錄的實用腳本"
cat << 'TEMP_CLEANUP'
#!/bin/bash
# 清理各種暫存目錄
# 建議每日執行

CLEANUP_TOOL="/path/to/cleanup_old_files.py"
LOG_FILE="$HOME/logs/cleanup_$(date +'%Y%m%d').log"
mkdir -p "$(dirname "$LOG_FILE")"

echo "=== 開始清理暫存檔案: $(date) ===" >> "$LOG_FILE"

# 清理系統暫存目錄（30 天前）
python3 "$CLEANUP_TOOL" /tmp --days 30 --force >> "$LOG_FILE" 2>&1

# 清理下載目錄（90 天前）
python3 "$CLEANUP_TOOL" "$HOME/Downloads" --days 90 --force >> "$LOG_FILE" 2>&1

# 清理專案的建置快取（7 天前）
python3 "$CLEANUP_TOOL" "$HOME/projects" \
    --pattern "*.pyc" \
    --recursive \
    --days 7 \
    --force >> "$LOG_FILE" 2>&1

# 清理 node_modules 裡的舊檔案（60 天前）
python3 "$CLEANUP_TOOL" "$HOME/projects" \
    --pattern "node_modules/*" \
    --recursive \
    --days 60 \
    --force >> "$LOG_FILE" 2>&1

echo "=== 清理完成: $(date) ===" >> "$LOG_FILE"
TEMP_CLEANUP

# 範例 11: 清理備份目錄（保留最近 30 天）
echo ""
echo "範例 11: 清理備份目錄（保留最近 30 天）"
cat << 'BACKUP_CLEANUP'
#!/bin/bash
# 清理舊備份檔案

BACKUP_DIR="$HOME/backups"
LOG_FILE="$HOME/logs/backup_cleanup_$(date +'%Y%m%d').log"

# 預覽將要刪除的備份
python3 /path/to/cleanup_old_files.py \
    "$BACKUP_DIR" \
    --days 30 \
    --pattern "*.tar.gz" \
    --dry-run \
    --verbose \
    > "$LOG_FILE"

# 確認後執行刪除
echo "請檢查日誌檔案: $LOG_FILE"
read -p "確定要刪除這些備份嗎？(y/N): " confirm

if [ "$confirm" = "y" ]; then
    python3 /path/to/cleanup_old_files.py \
        "$BACKUP_DIR" \
        --days 30 \
        --pattern "*.tar.gz" \
        --force
    echo "備份清理完成"
else
    echo "操作已取消"
fi
BACKUP_CLEANUP

# 範例 12: 清理日誌檔案
echo ""
echo "範例 12: 清理日誌檔案"
cat << 'LOG_CLEANUP'
#!/bin/bash
# 清理舊日誌檔案（保留最近 14 天）

python3 /path/to/cleanup_old_files.py \
    /var/log \
    --days 14 \
    --pattern "*.log" \
    --size-gt 10M \
    --safe-mode \
    --trash-dir /var/log/.archive
LOG_CLEANUP

echo ""
echo "========================================="
echo "提示："
echo "1. 使用 --dry-run 先預覽要刪除的檔案"
echo "2. 使用 --safe-mode 將檔案移至垃圾桶而非永久刪除"
echo "3. 重要目錄建議使用 --verbose 查看詳細資訊"
echo "4. 可以組合多個條件進行精確過濾"
echo "5. 定期清理可以釋放磁碟空間"
echo "========================================="
