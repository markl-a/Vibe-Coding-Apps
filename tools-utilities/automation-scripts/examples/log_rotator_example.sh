#!/bin/bash
# log_rotator.py 使用範例
# 這個腳本展示了日誌輪替工具的各種使用場景

# 設定腳本路徑
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_ROTATOR="$SCRIPT_DIR/log_rotator.py"

echo "========================================="
echo "Log Rotator 使用範例"
echo "========================================="
echo ""

# 範例 1: 基於大小輪替（超過 10MB）
echo "範例 1: 基於大小輪替（超過 10MB）"
echo "指令: python3 $LOG_ROTATOR /var/log/app.log --max-size 10M"
echo ""
# python3 "$LOG_ROTATOR" /var/log/app.log --max-size 10M

# 範例 2: 每日輪替
echo "範例 2: 每日輪替"
echo "指令: python3 $LOG_ROTATOR /var/log/app.log --daily"
echo ""
# python3 "$LOG_ROTATOR" /var/log/app.log --daily

# 範例 3: 每週輪替
echo "範例 3: 每週輪替"
echo "指令: python3 $LOG_ROTATOR /var/log/app.log --weekly"
echo ""
# python3 "$LOG_ROTATOR" /var/log/app.log --weekly

# 範例 4: 每月輪替
echo "範例 4: 每月輪替"
echo "指令: python3 $LOG_ROTATOR /var/log/app.log --monthly"
echo ""
# python3 "$LOG_ROTATOR" /var/log/app.log --monthly

# 範例 5: 輪替並壓縮
echo "範例 5: 輪替並壓縮"
echo "指令: python3 $LOG_ROTATOR /var/log/app.log --daily --compress"
echo ""
# python3 "$LOG_ROTATOR" /var/log/app.log --daily --compress

# 範例 6: 保留最近 N 個備份
echo "範例 6: 保留最近 30 個備份"
echo "指令: python3 $LOG_ROTATOR /var/log/app.log --daily --keep 30"
echo ""
# python3 "$LOG_ROTATOR" /var/log/app.log --daily --keep 30

# 範例 7: 強制輪替
echo "範例 7: 強制輪替"
echo "指令: python3 $LOG_ROTATOR /var/log/app.log --force"
echo ""
# python3 "$LOG_ROTATOR" /var/log/app.log --force

# 範例 8: 列出所有備份
echo "範例 8: 列出所有備份"
echo "指令: python3 $LOG_ROTATOR /var/log/app.log --list"
echo ""
# python3 "$LOG_ROTATOR" /var/log/app.log --list

# 範例 9: 詳細輸出模式
echo "範例 9: 詳細輸出模式"
echo "指令: python3 $LOG_ROTATOR /var/log/app.log --daily --verbose"
echo ""
# python3 "$LOG_ROTATOR" /var/log/app.log --daily --verbose

# 範例 10: 每日輪替腳本（crontab）
echo "範例 10: 每日輪替腳本（可加入 crontab）"
cat << 'DAILY_ROTATION'
#!/bin/bash
# 每天凌晨 0 點執行日誌輪替
# crontab -e 加入：0 0 * * * /path/to/daily_log_rotation.sh

LOG_ROTATOR="/path/to/log_rotator.py"
LOG_DIR="/var/log/myapp"

# 應用日誌 - 每日輪替，保留 30 天
python3 "$LOG_ROTATOR" \
    "$LOG_DIR/app.log" \
    --daily \
    --compress \
    --keep 30

# 存取日誌 - 每日輪替，保留 14 天
python3 "$LOG_ROTATOR" \
    "$LOG_DIR/access.log" \
    --daily \
    --compress \
    --keep 14

# 錯誤日誌 - 每日輪替，保留 60 天
python3 "$LOG_ROTATOR" \
    "$LOG_DIR/error.log" \
    --daily \
    --compress \
    --keep 60
DAILY_ROTATION

# 範例 11: 基於大小的自動輪替
echo ""
echo "範例 11: 基於大小的自動輪替"
cat << 'SIZE_BASED_ROTATION'
#!/bin/bash
# 每小時檢查日誌大小，超過閾值則輪替
# crontab -e 加入：0 * * * * /path/to/size_based_rotation.sh

LOG_ROTATOR="/path/to/log_rotator.py"
LOG_FILE="/var/log/myapp/app.log"

# 檢查日誌大小，超過 100MB 則輪替
python3 "$LOG_ROTATOR" \
    "$LOG_FILE" \
    --max-size 100M \
    --compress \
    --keep 20

# 記錄輪替操作
if [ $? -eq 0 ]; then
    echo "$(date): 日誌輪替成功" >> /var/log/rotation.log
fi
SIZE_BASED_ROTATION

# 範例 12: 多個應用的日誌輪替
echo ""
echo "範例 12: 多個應用的日誌輪替"
cat << 'MULTI_APP_ROTATION'
#!/bin/bash
# 輪替多個應用的日誌

LOG_ROTATOR="/path/to/log_rotator.py"

# 定義日誌檔案列表
LOGS=(
    "/var/log/app1/app.log"
    "/var/log/app2/app.log"
    "/var/log/nginx/access.log"
    "/var/log/nginx/error.log"
    "/var/log/mysql/mysql.log"
)

# 批次輪替
for LOG in "${LOGS[@]}"; do
    if [ -f "$LOG" ]; then
        echo "輪替 $LOG ..."
        python3 "$LOG_ROTATOR" \
            "$LOG" \
            --daily \
            --compress \
            --keep 30 \
            --verbose
    fi
done
MULTI_APP_ROTATION

# 範例 13: 條件式輪替
echo ""
echo "範例 13: 條件式輪替"
cat << 'CONDITIONAL_ROTATION'
#!/bin/bash
# 根據日誌內容或大小決定輪替策略

LOG_FILE="/var/log/myapp/app.log"
LOG_ROTATOR="/path/to/log_rotator.py"

# 獲取日誌大小（MB）
LOG_SIZE=$(du -m "$LOG_FILE" | cut -f1)

if [ "$LOG_SIZE" -gt 500 ]; then
    # 超過 500MB：立即輪替
    echo "日誌過大 (${LOG_SIZE}MB)，立即輪替"
    python3 "$LOG_ROTATOR" "$LOG_FILE" --force --compress
elif [ "$LOG_SIZE" -gt 100 ]; then
    # 超過 100MB：檢查是否需要每日輪替
    echo "日誌較大 (${LOG_SIZE}MB)，檢查每日輪替"
    python3 "$LOG_ROTATOR" "$LOG_FILE" --daily --compress
else
    # 小於 100MB：每週輪替
    echo "日誌正常 (${LOG_SIZE}MB)，每週輪替"
    python3 "$LOG_ROTATOR" "$LOG_FILE" --weekly --compress
fi
CONDITIONAL_ROTATION

# 範例 14: 整合監控告警
echo ""
echo "範例 14: 整合監控告警"
cat << 'MONITORING_ROTATION'
#!/bin/bash
# 輪替時檢查日誌是否有錯誤

LOG_FILE="/var/log/myapp/app.log"
LOG_ROTATOR="/path/to/log_rotator.py"

# 檢查日誌中的錯誤
ERROR_COUNT=$(grep -c "ERROR" "$LOG_FILE" 2>/dev/null || echo 0)

if [ "$ERROR_COUNT" -gt 100 ]; then
    echo "警告: 日誌中發現 $ERROR_COUNT 個錯誤" | \
        mail -s "日誌錯誤告警" admin@example.com
fi

# 執行輪替
python3 "$LOG_ROTATOR" \
    "$LOG_FILE" \
    --daily \
    --compress \
    --keep 30

# 輪替後發送報告
if [ $? -eq 0 ]; then
    echo "日誌輪替完成，錯誤數: $ERROR_COUNT" | \
        mail -s "日誌輪替報告" admin@example.com
fi
MONITORING_ROTATION

# 範例 15: Web 伺服器日誌輪替
echo ""
echo "範例 15: Web 伺服器日誌輪替"
cat << 'WEB_SERVER_ROTATION'
#!/bin/bash
# Nginx/Apache 日誌輪替

LOG_ROTATOR="/path/to/log_rotator.py"

# Nginx 存取日誌 - 每日輪替
python3 "$LOG_ROTATOR" \
    /var/log/nginx/access.log \
    --daily \
    --compress \
    --keep 90

# Nginx 錯誤日誌 - 每週輪替
python3 "$LOG_ROTATOR" \
    /var/log/nginx/error.log \
    --weekly \
    --compress \
    --keep 52

# 重新載入 Nginx 配置
nginx -s reopen
WEB_SERVER_ROTATION

# 範例 16: 資料庫日誌輪替
echo ""
echo "範例 16: 資料庫日誌輪替"
cat << 'DATABASE_LOG_ROTATION'
#!/bin/bash
# MySQL/PostgreSQL 日誌輪替

LOG_ROTATOR="/path/to/log_rotator.py"

# MySQL 查詢日誌 - 基於大小輪替（超過 500MB）
python3 "$LOG_ROTATOR" \
    /var/log/mysql/query.log \
    --max-size 500M \
    --compress \
    --keep 10

# MySQL 慢查詢日誌 - 每週輪替
python3 "$LOG_ROTATOR" \
    /var/log/mysql/slow-query.log \
    --weekly \
    --compress \
    --keep 12

# PostgreSQL 日誌 - 每日輪替
python3 "$LOG_ROTATOR" \
    /var/log/postgresql/postgresql.log \
    --daily \
    --compress \
    --keep 30
DATABASE_LOG_ROTATION

# 範例 17: 應用程式日誌輪替策略
echo ""
echo "範例 17: 應用程式日誌輪替策略"
cat << 'APP_LOG_STRATEGY'
#!/bin/bash
# 根據日誌類型採用不同的輪替策略

LOG_ROTATOR="/path/to/log_rotator.py"
APP_LOG_DIR="/var/log/myapp"

# 錯誤日誌：保留時間長，每日輪替
python3 "$LOG_ROTATOR" \
    "$APP_LOG_DIR/error.log" \
    --daily \
    --compress \
    --keep 90

# 存取日誌：基於大小輪替，保留時間短
python3 "$LOG_ROTATOR" \
    "$APP_LOG_DIR/access.log" \
    --max-size 200M \
    --compress \
    --keep 14

# 除錯日誌：每週輪替，保留時間短
python3 "$LOG_ROTATOR" \
    "$APP_LOG_DIR/debug.log" \
    --weekly \
    --compress \
    --keep 4

# 審計日誌：每月輪替，保留時間長
python3 "$LOG_ROTATOR" \
    "$APP_LOG_DIR/audit.log" \
    --monthly \
    --compress \
    --keep 24
APP_LOG_STRATEGY

# 範例 18: 清理分析腳本
echo ""
echo "範例 18: 清理分析腳本"
cat << 'CLEANUP_ANALYSIS'
#!/bin/bash
# 分析並清理日誌備份

LOG_FILE="/var/log/myapp/app.log"
LOG_ROTATOR="/path/to/log_rotator.py"

# 列出所有備份
echo "=== 現有日誌備份 ==="
python3 "$LOG_ROTATOR" "$LOG_FILE" --list

# 計算備份總大小
BACKUP_DIR=$(dirname "$LOG_FILE")
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo ""
echo "備份目錄總大小: $TOTAL_SIZE"

# 執行輪替並清理
echo ""
echo "執行輪替並清理舊備份..."
python3 "$LOG_ROTATOR" \
    "$LOG_FILE" \
    --force \
    --compress \
    --keep 14

echo "清理完成！"
CLEANUP_ANALYSIS

echo ""
echo "========================================="
echo "提示："
echo "1. 根據日誌類型選擇合適的輪替策略"
echo "2. 重要日誌（如審計日誌）保留時間要長"
echo "3. 使用壓縮可以大幅節省空間"
echo "4. 定期檢查備份數量，避免佔用過多空間"
echo "5. 輪替後要重新載入應用程式配置"
echo "========================================="
