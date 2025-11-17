#!/bin/bash

# 中斷監控腳本

echo "==================================================="
echo "           系統中斷監控工具"
echo "==================================================="
echo ""

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
    echo "錯誤: 請使用 sudo 執行此腳本"
    exit 1
fi

# 顯示幫助
show_help() {
    echo "用法: $0 [選項]"
    echo ""
    echo "選項:"
    echo "  -h, --help      顯示此幫助信息"
    echo "  -w, --watch     持續監控中斷（每秒更新）"
    echo "  -i IRQ          監控特定 IRQ"
    echo "  -c CPU          顯示特定 CPU 的中斷"
    echo ""
}

# 顯示所有中斷
show_all_interrupts() {
    echo "系統中斷統計:"
    echo "---------------------------------------------------"
    cat /proc/interrupts
    echo ""
}

# 顯示中斷摘要
show_summary() {
    echo "中斷摘要:"
    echo "---------------------------------------------------"
    echo "CPU 數量: $(nproc)"
    echo ""

    echo "每個 CPU 的中斷總數:"
    awk 'NR==1 {for(i=1;i<=NF;i++) sum[i]=0; next}
         NR>1 {for(i=2;i<=NF-1;i++) if($i~/^[0-9]+$/) sum[i]+=$i}
         END {for(i=2;i<=NF-1;i++) printf "CPU%d: %d\n", i-2, sum[i]}' /proc/interrupts
    echo ""

    echo "前 10 個最活躍的中斷源:"
    tail -n +2 /proc/interrupts | awk '{
        total=0;
        for(i=2; i<=NF-1; i++) {
            if($i~/^[0-9]+$/) total+=$i;
        }
        print total, $0;
    }' | sort -rn | head -10 | awk '{$1=""; print}'
    echo ""
}

# 監控特定 IRQ
monitor_irq() {
    local irq=$1
    local interval=${2:-1}

    echo "監控 IRQ $irq (按 Ctrl+C 停止):"
    echo "---------------------------------------------------"

    local prev_count=$(grep "^ *$irq:" /proc/interrupts | awk '{for(i=2;i<=NF-1;i++) if($i~/^[0-9]+$/) sum+=$i} END {print sum}')

    while true; do
        sleep "$interval"
        local curr_count=$(grep "^ *$irq:" /proc/interrupts | awk '{for(i=2;i<=NF-1;i++) if($i~/^[0-9]+$/) sum+=$i} END {print sum}')
        local rate=$((curr_count - prev_count))
        echo "$(date '+%H:%M:%S') - IRQ $irq: $curr_count 總計 ($rate/秒)"
        prev_count=$curr_count
    done
}

# 持續監控
watch_interrupts() {
    echo "持續監控系統中斷 (按 Ctrl+C 停止)"
    echo "---------------------------------------------------"
    watch -n 1 'cat /proc/interrupts | head -20'
}

# 解析參數
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    -w|--watch)
        watch_interrupts
        exit 0
        ;;
    -i)
        if [ -z "$2" ]; then
            echo "錯誤: 請指定 IRQ 號"
            exit 1
        fi
        monitor_irq "$2"
        exit 0
        ;;
    "")
        show_all_interrupts
        show_summary
        ;;
    *)
        echo "錯誤: 未知選項 $1"
        show_help
        exit 1
        ;;
esac

echo "==================================================="
echo "提示: 使用 --help 查看更多選項"
echo "==================================================="
