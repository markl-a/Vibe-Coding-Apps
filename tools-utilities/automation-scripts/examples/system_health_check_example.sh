#!/bin/bash
# system_health_check.py 使用範例
# 這個腳本展示了系統健康檢查工具的各種使用場景

# 設定腳本路徑
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HEALTH_CHECK="$SCRIPT_DIR/system_health_check.py"

echo "========================================="
echo "System Health Check 使用範例"
echo "========================================="
echo ""

# 範例 1: 執行所有檢查
echo "範例 1: 執行所有檢查"
echo "指令: python3 $HEALTH_CHECK"
echo ""
# python3 "$HEALTH_CHECK"

# 範例 2: 只檢查 CPU 和記憶體
echo "範例 2: 只檢查 CPU 和記憶體"
echo "指令: python3 $HEALTH_CHECK --check cpu,memory"
echo ""
# python3 "$HEALTH_CHECK" --check cpu,memory

# 範例 3: 設定自定義告警閾值
echo "範例 3: 設定自定義告警閾值"
echo "指令: python3 $HEALTH_CHECK --cpu-alert 90 --mem-alert 95 --disk-alert 90"
echo ""
# python3 "$HEALTH_CHECK" --cpu-alert 90 --mem-alert 95 --disk-alert 90

# 範例 4: 輸出 JSON 格式
echo "範例 4: 輸出 JSON 格式"
echo "指令: python3 $HEALTH_CHECK --output json"
echo ""
# python3 "$HEALTH_CHECK" --output json > health_report.json

# 範例 5: 詳細模式
echo "範例 5: 詳細模式"
echo "指令: python3 $HEALTH_CHECK --verbose"
echo ""
# python3 "$HEALTH_CHECK" --verbose

# 範例 6: 只檢查磁碟空間
echo "範例 6: 只檢查磁碟空間"
echo "指令: python3 $HEALTH_CHECK --check disk"
echo ""
# python3 "$HEALTH_CHECK" --check disk --disk-alert 80

# 範例 7: 每小時健康檢查腳本
echo "範例 7: 每小時健康檢查腳本（可加入 crontab）"
cat << 'HOURLY_CHECK'
#!/bin/bash
# 每小時執行一次健康檢查
# crontab -e 加入：0 * * * * /path/to/hourly_health_check.sh

HEALTH_CHECK="/path/to/system_health_check.py"
LOG_DIR="$HOME/logs/health"
DATE_DIR="$(date +'%Y%m')"
LOG_FILE="$LOG_DIR/$DATE_DIR/health_$(date +'%Y%m%d_%H').log"

mkdir -p "$(dirname "$LOG_FILE")"

# 執行健康檢查並記錄
python3 "$HEALTH_CHECK" \
    --cpu-alert 80 \
    --mem-alert 85 \
    --disk-alert 90 \
    > "$LOG_FILE" 2>&1

# 檢查退出碼
EXIT_CODE=$?

if [ $EXIT_CODE -eq 2 ]; then
    # ERROR 狀態
    echo "系統健康檢查發現嚴重錯誤！" | \
        mail -s "系統健康檢查 - 錯誤" admin@example.com \
        -a "$LOG_FILE"
elif [ $EXIT_CODE -eq 1 ]; then
    # WARNING 狀態
    echo "系統健康檢查發現警告！" | \
        mail -s "系統健康檢查 - 警告" admin@example.com \
        -a "$LOG_FILE"
fi
HOURLY_CHECK

# 範例 8: 每日完整報告
echo ""
echo "範例 8: 每日完整報告"
cat << 'DAILY_REPORT'
#!/bin/bash
# 每天生成完整的健康報告
# crontab -e 加入：0 8 * * * /path/to/daily_health_report.sh

HEALTH_CHECK="/path/to/system_health_check.py"
REPORT_DIR="$HOME/reports/health"
REPORT_FILE="$REPORT_DIR/health_report_$(date +'%Y%m%d').json"

mkdir -p "$REPORT_DIR"

# 生成 JSON 報告
python3 "$HEALTH_CHECK" --output json > "$REPORT_FILE"

# 同時生成文字報告供閱讀
python3 "$HEALTH_CHECK" > "${REPORT_FILE%.json}.txt"

# 清理 30 天前的報告
find "$REPORT_DIR" -name "health_report_*.json" -mtime +30 -delete
find "$REPORT_DIR" -name "health_report_*.txt" -mtime +30 -delete

echo "每日健康報告已生成: $REPORT_FILE"
DAILY_REPORT

# 範例 9: 監控特定資源
echo ""
echo "範例 9: 監控特定資源"
cat << 'MONITOR_SCRIPT'
#!/bin/bash
# 持續監控系統資源（每 5 分鐘一次）

HEALTH_CHECK="/path/to/system_health_check.py"

while true; do
    echo "=== 檢查時間: $(date) ==="

    # 只檢查 CPU 和記憶體
    python3 "$HEALTH_CHECK" \
        --check cpu,memory \
        --cpu-alert 90 \
        --mem-alert 90

    EXIT_CODE=$?

    if [ $EXIT_CODE -ne 0 ]; then
        echo "發現資源告警！"
        # 可以在這裡加入通知邏輯
        # notify-send "系統資源告警" "CPU 或記憶體使用率過高"
    fi

    # 等待 5 分鐘
    sleep 300
done
MONITOR_SCRIPT

# 範例 10: 整合到 CI/CD 流程
echo ""
echo "範例 10: 整合到 CI/CD 流程"
cat << 'CI_INTEGRATION'
#!/bin/bash
# 在 CI/CD 流程中檢查系統健康狀態

# 執行健康檢查
python3 /path/to/system_health_check.py \
    --check cpu,memory,disk \
    --cpu-alert 95 \
    --mem-alert 95 \
    --disk-alert 95 \
    --output json \
    > health_check.json

EXIT_CODE=$?

# 根據退出碼決定是否繼續 CI/CD 流程
if [ $EXIT_CODE -eq 2 ]; then
    echo "錯誤: 系統健康檢查失敗，中止部署"
    exit 1
elif [ $EXIT_CODE -eq 1 ]; then
    echo "警告: 系統資源緊張，建議稍後部署"
    # 可以選擇繼續或中止
    exit 0
else
    echo "系統健康狀態良好，繼續部署"
    exit 0
fi
CI_INTEGRATION

# 範例 11: 資源使用趨勢分析
echo ""
echo "範例 11: 資源使用趨勢分析"
cat << 'TREND_ANALYSIS'
#!/bin/bash
# 記錄系統資源使用趨勢（每 10 分鐘記錄一次）

HEALTH_CHECK="/path/to/system_health_check.py"
TREND_FILE="$HOME/logs/resource_trend_$(date +'%Y%m%d').csv"

# 如果檔案不存在，創建 CSV 標題
if [ ! -f "$TREND_FILE" ]; then
    echo "timestamp,cpu_percent,memory_percent,disk_percent" > "$TREND_FILE"
fi

# 獲取 JSON 格式的健康檢查結果
RESULT=$(python3 "$HEALTH_CHECK" --output json)

# 解析 JSON 並提取關鍵指標（需要 jq）
TIMESTAMP=$(date +'%Y-%m-%d %H:%M:%S')
CPU=$(echo "$RESULT" | jq -r '.checks.cpu.usage_percent // "N/A"')
MEMORY=$(echo "$RESULT" | jq -r '.checks.memory.virtual.percent // "N/A"')
DISK=$(echo "$RESULT" | jq -r '.checks.disk.partitions[0].percent // "N/A"')

# 記錄到 CSV
echo "$TIMESTAMP,$CPU,$MEMORY,$DISK" >> "$TREND_FILE"

# 清理 7 天前的趨勢檔案
find "$(dirname "$TREND_FILE")" -name "resource_trend_*.csv" -mtime +7 -delete
TREND_ANALYSIS

# 範例 12: 簡單的告警腳本
echo ""
echo "範例 12: 簡單的告警腳本"
cat << 'ALERT_SCRIPT'
#!/bin/bash
# 檢查系統健康並在發現問題時發送告警

HEALTH_CHECK="/path/to/system_health_check.py"

# 執行檢查
python3 "$HEALTH_CHECK" \
    --cpu-alert 85 \
    --mem-alert 90 \
    --disk-alert 90 \
    > /tmp/health_check_result.txt

EXIT_CODE=$?

if [ $EXIT_CODE -eq 1 ] || [ $EXIT_CODE -eq 2 ]; then
    # 發送告警（可以使用 mail, Slack, Discord 等）

    # 郵件通知
    mail -s "系統健康告警 - $(hostname)" admin@example.com < /tmp/health_check_result.txt

    # Slack 通知（需要 webhook URL）
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"系統健康告警: $(hostname)\"}" \
    #     https://hooks.slack.com/services/YOUR/WEBHOOK/URL

    # Discord 通知
    # curl -H "Content-Type: application/json" \
    #     -X POST \
    #     -d "{\"content\":\"系統健康告警: $(hostname)\"}" \
    #     https://discord.com/api/webhooks/YOUR/WEBHOOK
fi
ALERT_SCRIPT

echo ""
echo "========================================="
echo "提示："
echo "1. 根據系統特性調整告警閾值"
echo "2. 定期執行健康檢查並保存記錄"
echo "3. 整合告警通知系統（郵件、Slack 等）"
echo "4. 使用 JSON 輸出便於程式化處理"
echo "5. 退出碼: 0=正常, 1=警告, 2=錯誤"
echo "========================================="
