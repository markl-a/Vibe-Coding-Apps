#!/bin/bash
# docker_cleanup.py 使用範例
# 這個腳本展示了 Docker 清理工具的各種使用場景

# 設定腳本路徑
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_CLEANUP="$SCRIPT_DIR/docker_cleanup.py"

echo "========================================="
echo "Docker Cleanup 使用範例"
echo "========================================="
echo ""

# 範例 1: 清理已停止的容器
echo "範例 1: 清理已停止的容器"
echo "指令: python3 $DOCKER_CLEANUP --stopped-containers"
echo ""
# python3 "$DOCKER_CLEANUP" --stopped-containers

# 範例 2: 清理懸空映像（dangling images）
echo "範例 2: 清理懸空映像（dangling images）"
echo "指令: python3 $DOCKER_CLEANUP --dangling-images"
echo ""
# python3 "$DOCKER_CLEANUP" --dangling-images

# 範例 3: 清理未使用的卷
echo "範例 3: 清理未使用的卷"
echo "指令: python3 $DOCKER_CLEANUP --unused-volumes"
echo ""
# python3 "$DOCKER_CLEANUP" --unused-volumes

# 範例 4: 清理未使用的網路
echo "範例 4: 清理未使用的網路"
echo "指令: python3 $DOCKER_CLEANUP --unused-networks"
echo ""
# python3 "$DOCKER_CLEANUP" --unused-networks

# 範例 5: 清理所有未使用的資源（不包含卷）
echo "範例 5: 清理所有未使用的資源（不包含卷）"
echo "指令: python3 $DOCKER_CLEANUP --all"
echo ""
# python3 "$DOCKER_CLEANUP" --all

# 範例 6: 完整清理（包含卷）
echo "範例 6: 完整清理（包含卷）"
echo "指令: python3 $DOCKER_CLEANUP --all --volumes"
echo ""
# python3 "$DOCKER_CLEANUP" --all --volumes

# 範例 7: 預覽模式（不實際刪除）
echo "範例 7: 預覽模式（不實際刪除）"
echo "指令: python3 $DOCKER_CLEANUP --all --dry-run"
echo ""
# python3 "$DOCKER_CLEANUP" --all --dry-run

# 範例 8: Docker 系統清理
echo "範例 8: Docker 系統清理"
echo "指令: python3 $DOCKER_CLEANUP --system-prune"
echo ""
# python3 "$DOCKER_CLEANUP" --system-prune

# 範例 9: 系統清理（包含所有映像和卷）
echo "範例 9: 系統清理（包含所有映像和卷）"
echo "指令: python3 $DOCKER_CLEANUP --system-prune --all --volumes"
echo ""
# python3 "$DOCKER_CLEANUP" --system-prune --all --volumes

# 範例 10: 詳細輸出模式
echo "範例 10: 詳細輸出模式"
echo "指令: python3 $DOCKER_CLEANUP --all --verbose"
echo ""
# python3 "$DOCKER_CLEANUP" --all --verbose

# 範例 11: 實用的每週清理腳本
echo "範例 11: 實用的每週清理腳本（可加入 crontab）"
cat << 'WEEKLY_CLEANUP'
#!/bin/bash
# 每週日凌晨 3 點執行 Docker 清理
# crontab -e 加入：0 3 * * 0 /path/to/docker_weekly_cleanup.sh

LOG_FILE="$HOME/logs/docker_cleanup_$(date +'%Y%m%d').log"
mkdir -p "$(dirname "$LOG_FILE")"

echo "=== Docker 清理開始: $(date) ===" >> "$LOG_FILE"

# 先預覽要刪除的內容
python3 /path/to/docker_cleanup.py --all --dry-run >> "$LOG_FILE" 2>&1

# 實際執行清理
python3 /path/to/docker_cleanup.py \
    --stopped-containers \
    --dangling-images \
    --unused-networks \
    --verbose \
    >> "$LOG_FILE" 2>&1

echo "=== Docker 清理完成: $(date) ===" >> "$LOG_FILE"

# 顯示磁碟空間
echo "=== 清理後磁碟空間 ===" >> "$LOG_FILE"
df -h >> "$LOG_FILE"
WEEKLY_CLEANUP

# 範例 12: 緊急情況下的快速清理
echo ""
echo "範例 12: 緊急情況下的快速清理"
cat << 'EMERGENCY_CLEANUP'
#!/bin/bash
# 當磁碟空間不足時的緊急清理腳本

# 檢查磁碟使用率
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -gt 90 ]; then
    echo "警告: 磁碟使用率 ${DISK_USAGE}%，開始清理..."

    # 清理 Docker
    python3 /path/to/docker_cleanup.py --all --volumes

    # 清理 Docker 系統
    docker system prune -af --volumes

    echo "清理完成！"
else
    echo "磁碟使用率正常: ${DISK_USAGE}%"
fi
EMERGENCY_CLEANUP

echo ""
echo "========================================="
echo "提示："
echo "1. 使用 --dry-run 先預覽要刪除的內容"
echo "2. 注意 --volumes 會刪除未使用的卷，可能包含重要數據"
echo "3. 定期清理可以避免磁碟空間不足"
echo "4. 建議在低峰期執行清理操作"
echo "========================================="
