#!/bin/bash
# auto_backup.py 使用範例
# 這個腳本展示了自動備份工具的各種使用場景

# 設定腳本路徑
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUTO_BACKUP="$SCRIPT_DIR/auto_backup.py"

echo "========================================="
echo "Auto Backup 使用範例"
echo "========================================="
echo ""

# 範例 1: 完整備份（不壓縮）
echo "範例 1: 完整備份（不壓縮）"
echo "指令: python3 $AUTO_BACKUP /source /backup"
echo ""
# python3 "$AUTO_BACKUP" "$HOME/Documents" "$HOME/Backups"

# 範例 2: 增量備份（只備份變更的檔案）
echo "範例 2: 增量備份（只備份變更的檔案）"
echo "指令: python3 $AUTO_BACKUP /source /backup --incremental"
echo ""
# python3 "$AUTO_BACKUP" "$HOME/Documents" "$HOME/Backups" --incremental

# 範例 3: 壓縮備份（ZIP 格式）
echo "範例 3: 壓縮備份（ZIP 格式）"
echo "指令: python3 $AUTO_BACKUP /source /backup --compress zip"
echo ""
# python3 "$AUTO_BACKUP" "$HOME/Documents" "$HOME/Backups" --compress zip

# 範例 4: 壓縮備份（TAR.GZ 格式）
echo "範例 4: 壓縮備份（TAR.GZ 格式）"
echo "指令: python3 $AUTO_BACKUP /source /backup --compress tar.gz"
echo ""
# python3 "$AUTO_BACKUP" "$HOME/Documents" "$HOME/Backups" --compress tar.gz

# 範例 5: 保留最近 N 個備份
echo "範例 5: 保留最近 7 個備份"
echo "指令: python3 $AUTO_BACKUP /source /backup --keep 7"
echo ""
# python3 "$AUTO_BACKUP" "$HOME/Documents" "$HOME/Backups" --keep 7

# 範例 6: 排除特定檔案
echo "範例 6: 排除特定檔案"
echo "指令: python3 $AUTO_BACKUP /source /backup --exclude '*.tmp,*.log,*.cache'"
echo ""
# python3 "$AUTO_BACKUP" "$HOME/Documents" "$HOME/Backups" --exclude "*.tmp,*.log,*.cache"

# 範例 7: 驗證備份完整性
echo "範例 7: 驗證備份完整性"
echo "指令: python3 $AUTO_BACKUP /source /backup --compress zip --verify"
echo ""
# python3 "$AUTO_BACKUP" "$HOME/Documents" "$HOME/Backups" --compress zip --verify

# 範例 8: 模擬執行（不實際備份）
echo "範例 8: 模擬執行（不實際備份）"
echo "指令: python3 $AUTO_BACKUP /source /backup --dry-run"
echo ""
# python3 "$AUTO_BACKUP" "$HOME/Documents" "$HOME/Backups" --dry-run

# 範例 9: 增量備份 + 壓縮 + 驗證
echo "範例 9: 增量備份 + 壓縮 + 驗證"
echo "指令: python3 $AUTO_BACKUP /source /backup --incremental --compress tar.gz --verify"
echo ""
# python3 "$AUTO_BACKUP" "$HOME/Documents" "$HOME/Backups" --incremental --compress tar.gz --verify

# 範例 10: 每日自動備份腳本
echo "範例 10: 每日自動備份腳本（可加入 crontab）"
cat << 'DAILY_BACKUP'
#!/bin/bash
# 每天凌晨 2 點執行備份
# crontab -e 加入：0 2 * * * /path/to/daily_backup.sh

AUTO_BACKUP="/path/to/auto_backup.py"
SOURCE_DIR="$HOME/Documents"
BACKUP_DIR="/mnt/backup/documents"
LOG_FILE="$HOME/logs/backup_$(date +'%Y%m%d').log"

mkdir -p "$(dirname "$LOG_FILE")"

echo "=== 備份開始: $(date) ===" >> "$LOG_FILE"

# 執行增量備份並壓縮
python3 "$AUTO_BACKUP" \
    "$SOURCE_DIR" \
    "$BACKUP_DIR" \
    --incremental \
    --compress tar.gz \
    --keep 30 \
    --exclude "*.tmp,*.cache,node_modules/*,__pycache__/*" \
    --verify \
    >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "=== 備份成功: $(date) ===" >> "$LOG_FILE"
else
    echo "=== 備份失敗: $(date) ===" >> "$LOG_FILE"
    # 發送告警郵件
    mail -s "備份失敗通知" admin@example.com < "$LOG_FILE"
fi
DAILY_BACKUP

# 範例 11: 每週完整備份腳本
echo ""
echo "範例 11: 每週完整備份腳本"
cat << 'WEEKLY_BACKUP'
#!/bin/bash
# 每週日凌晨 1 點執行完整備份
# crontab -e 加入：0 1 * * 0 /path/to/weekly_backup.sh

AUTO_BACKUP="/path/to/auto_backup.py"
LOG_FILE="$HOME/logs/weekly_backup_$(date +'%Y%m%d').log"

mkdir -p "$(dirname "$LOG_FILE")"

echo "=== 每週完整備份開始: $(date) ===" >> "$LOG_FILE"

# 備份多個重要目錄
DIRS=(
    "$HOME/Documents"
    "$HOME/Projects"
    "$HOME/Pictures"
    "$HOME/.config"
)

for DIR in "${DIRS[@]}"; do
    if [ -d "$DIR" ]; then
        echo "備份 $DIR ..." >> "$LOG_FILE"
        python3 "$AUTO_BACKUP" \
            "$DIR" \
            "/mnt/backup/weekly" \
            --compress tar.gz \
            --keep 8 \
            --verify \
            >> "$LOG_FILE" 2>&1
    fi
done

echo "=== 每週完整備份完成: $(date) ===" >> "$LOG_FILE"
WEEKLY_BACKUP

# 範例 12: 備份到遠端伺服器
echo ""
echo "範例 12: 備份到遠端伺服器"
cat << 'REMOTE_BACKUP'
#!/bin/bash
# 備份並上傳到遠端伺服器

AUTO_BACKUP="/path/to/auto_backup.py"
SOURCE_DIR="$HOME/Projects"
LOCAL_BACKUP="/tmp/backup"
REMOTE_SERVER="user@backup-server.com"
REMOTE_DIR="/backups/projects"

# 創建本地備份
python3 "$AUTO_BACKUP" \
    "$SOURCE_DIR" \
    "$LOCAL_BACKUP" \
    --compress tar.gz \
    --keep 1

# 找到最新的備份檔案
LATEST_BACKUP=$(ls -t "$LOCAL_BACKUP"/*.tar.gz | head -1)

if [ -f "$LATEST_BACKUP" ]; then
    echo "上傳備份到遠端伺服器..."
    scp "$LATEST_BACKUP" "$REMOTE_SERVER:$REMOTE_DIR/"

    if [ $? -eq 0 ]; then
        echo "備份上傳成功"
        # 清理本地備份
        rm -rf "$LOCAL_BACKUP"
    else
        echo "備份上傳失敗"
        exit 1
    fi
fi
REMOTE_BACKUP

# 範例 13: 資料庫備份
echo ""
echo "範例 13: 資料庫備份"
cat << 'DATABASE_BACKUP'
#!/bin/bash
# 備份資料庫並壓縮

AUTO_BACKUP="/path/to/auto_backup.py"
DB_NAME="mydb"
DB_USER="dbuser"
DUMP_DIR="/tmp/db_dump"
BACKUP_DIR="/mnt/backup/databases"

mkdir -p "$DUMP_DIR"

# 匯出資料庫
mysqldump -u "$DB_USER" -p "$DB_NAME" > "$DUMP_DIR/${DB_NAME}.sql"

# 備份匯出的檔案
python3 "$AUTO_BACKUP" \
    "$DUMP_DIR" \
    "$BACKUP_DIR" \
    --compress tar.gz \
    --keep 14 \
    --verify

# 清理暫存檔案
rm -rf "$DUMP_DIR"
DATABASE_BACKUP

# 範例 14: 差異備份策略
echo ""
echo "範例 14: 差異備份策略"
cat << 'DIFFERENTIAL_BACKUP'
#!/bin/bash
# 實施差異備份策略
# 每週日完整備份，其他日子增量備份

AUTO_BACKUP="/path/to/auto_backup.py"
SOURCE_DIR="$HOME/Documents"
BACKUP_DIR="/mnt/backup"

DAY_OF_WEEK=$(date +%u)  # 1=週一, 7=週日

if [ "$DAY_OF_WEEK" -eq 7 ]; then
    # 週日：完整備份
    echo "執行完整備份..."
    python3 "$AUTO_BACKUP" \
        "$SOURCE_DIR" \
        "$BACKUP_DIR/full" \
        --compress tar.gz \
        --keep 4
else
    # 其他日子：增量備份
    echo "執行增量備份..."
    python3 "$AUTO_BACKUP" \
        "$SOURCE_DIR" \
        "$BACKUP_DIR/incremental" \
        --incremental \
        --compress tar.gz \
        --keep 30
fi
DIFFERENTIAL_BACKUP

# 範例 15: 多目的地備份
echo ""
echo "範例 15: 多目的地備份"
cat << 'MULTI_DESTINATION'
#!/bin/bash
# 同時備份到多個位置（本地 + 外接硬碟 + NAS）

AUTO_BACKUP="/path/to/auto_backup.py"
SOURCE_DIR="$HOME/Documents"

# 目的地列表
DESTINATIONS=(
    "/mnt/backup/local"
    "/mnt/external_hdd/backup"
    "/mnt/nas/backup"
)

for DEST in "${DESTINATIONS[@]}"; do
    if [ -d "$(dirname "$DEST")" ]; then
        echo "備份到 $DEST ..."
        python3 "$AUTO_BACKUP" \
            "$SOURCE_DIR" \
            "$DEST" \
            --incremental \
            --compress tar.gz \
            --keep 7 \
            --verify
    else
        echo "警告: $DEST 不可用"
    fi
done
MULTI_DESTINATION

# 範例 16: 智能備份腳本
echo ""
echo "範例 16: 智能備份腳本（根據可用空間決定策略）"
cat << 'SMART_BACKUP'
#!/bin/bash
# 根據可用磁碟空間決定備份策略

AUTO_BACKUP="/path/to/auto_backup.py"
SOURCE_DIR="$HOME/Documents"
BACKUP_DIR="/mnt/backup"

# 檢查可用空間（GB）
AVAILABLE_SPACE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $4}')
AVAILABLE_GB=$((AVAILABLE_SPACE / 1024 / 1024))

if [ "$AVAILABLE_GB" -gt 100 ]; then
    # 空間充足：完整備份 + 壓縮
    echo "空間充足，執行完整壓縮備份"
    python3 "$AUTO_BACKUP" \
        "$SOURCE_DIR" \
        "$BACKUP_DIR" \
        --compress tar.gz \
        --keep 14
elif [ "$AVAILABLE_GB" -gt 50 ]; then
    # 空間一般：增量備份 + 壓縮
    echo "空間一般，執行增量壓縮備份"
    python3 "$AUTO_BACKUP" \
        "$SOURCE_DIR" \
        "$BACKUP_DIR" \
        --incremental \
        --compress tar.gz \
        --keep 7
else
    # 空間不足：只增量備份
    echo "空間不足，執行增量備份"
    python3 "$AUTO_BACKUP" \
        "$SOURCE_DIR" \
        "$BACKUP_DIR" \
        --incremental \
        --keep 3
fi
SMART_BACKUP

echo ""
echo "========================================="
echo "提示："
echo "1. 使用 --dry-run 先測試備份流程"
echo "2. 定期驗證備份的完整性"
echo "3. 遵循 3-2-1 備份原則："
echo "   - 3 份副本"
echo "   - 2 種不同媒體"
echo "   - 1 份異地備份"
echo "4. 加密敏感數據的備份"
echo "5. 定期測試還原流程"
echo "========================================="
