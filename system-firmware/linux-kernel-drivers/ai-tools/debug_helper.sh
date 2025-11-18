#!/bin/bash
# debug_helper.sh - AI 辅助的内核驱动调试工具
#
# 这个工具提供交互式的驱动调试辅助功能，包括：
# - 日志分析
# - 错误诊断
# - 性能监控
# - 崩溃分析

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# AI 建议数据库
declare -A ERROR_SUGGESTIONS=(
    ["-ENOMEM"]="内存分配失败。建议：检查可用内存(free -m)，减小分配大小，使用 vmalloc 替代 kmalloc"
    ["-EFAULT"]="用户空间内存访问错误。建议：检查 copy_to_user/copy_from_user 的参数，确保地址有效"
    ["-ENODEV"]="设备不存在。建议：检查设备是否正确连接，验证设备 ID，查看 dmesg 日志"
    ["-EINVAL"]="无效参数。建议：检查传入的参数值，验证范围和类型"
    ["-EBUSY"]="设备忙。建议：检查是否有其他进程使用设备，确保正确的加锁顺序"
    ["-EPROTO"]="协议错误。建议：检查通信协议实现，验证数据格式"
    ["-ETIMEDOUT"]="超时。建议：增加超时时间，检查设备响应，验证时钟配置"
    ["sleeping function"]="在原子上下文中睡眠。建议：将 mutex_lock 改为 spin_lock，或移到非原子上下文"
    ["BUG:"]="内核 BUG。建议：检查空指针解引用，数组越界，使用 KASAN 调试"
    ["Oops"]="内核 Oops。建议：分析堆栈跟踪，检查最近的代码修改，使用 addr2line 定位"
)

print_header() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Linux 内核驱动调试助手 (AI 辅助)                    ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_ai_suggestion() {
    echo -e "${MAGENTA}[AI 建议]${NC} $1"
}

# 分析内核日志
analyze_dmesg() {
    print_info "分析最近的内核日志..."
    echo ""

    local log=$(dmesg | tail -50)
    local has_error=0

    # 检查常见错误
    for error in "${!ERROR_SUGGESTIONS[@]}"; do
        if echo "$log" | grep -q "$error"; then
            has_error=1
            print_error "发现错误: $error"
            print_ai_suggestion "${ERROR_SUGGESTIONS[$error]}"
            echo ""
        fi
    done

    if [ $has_error -eq 0 ]; then
        print_info "未发现明显错误"
    fi

    # 显示最近的日志
    echo -e "${BLUE}最近的内核消息:${NC}"
    dmesg | tail -20 | while read line; do
        if echo "$line" | grep -qi "error\|fail\|bug\|oops"; then
            echo -e "${RED}$line${NC}"
        elif echo "$line" | grep -qi "warn"; then
            echo -e "${YELLOW}$line${NC}"
        else
            echo "$line"
        fi
    done
}

# 检查模块状态
check_module() {
    local module_name="$1"

    if [ -z "$module_name" ]; then
        print_error "请提供模块名称"
        return 1
    fi

    print_info "检查模块: $module_name"
    echo ""

    # 检查模块是否加载
    if lsmod | grep -q "^$module_name "; then
        print_info "模块已加载"

        # 显示模块信息
        echo -e "${BLUE}模块详情:${NC}"
        lsmod | grep "^$module_name "

        # 显示模块参数
        if [ -d "/sys/module/$module_name/parameters" ]; then
            echo ""
            echo -e "${BLUE}模块参数:${NC}"
            for param in /sys/module/$module_name/parameters/*; do
                if [ -r "$param" ]; then
                    echo "  $(basename $param) = $(cat $param 2>/dev/null || echo '(无法读取)')"
                fi
            done
        fi

        # 检查相关的设备节点
        echo ""
        echo -e "${BLUE}相关设备节点:${NC}"
        find /dev -name "*${module_name}*" 2>/dev/null || echo "  未找到"

    else
        print_warn "模块未加载"
        print_ai_suggestion "使用 'sudo insmod ${module_name}.ko' 加载模块"
    fi
}

# 内存泄漏检测
check_memory_leak() {
    local module_name="$1"

    print_info "检查内存泄漏..."
    echo ""

    # 显示当前内存使用
    echo -e "${BLUE}系统内存状态:${NC}"
    free -h

    # 检查 slab 分配器
    if [ -n "$module_name" ]; then
        echo ""
        echo -e "${BLUE}Slab 分配统计:${NC}"
        sudo cat /proc/slabinfo 2>/dev/null | head -20 || {
            print_warn "无法读取 /proc/slabinfo (需要 root 权限)"
        }
    fi

    # AI 建议
    echo ""
    print_ai_suggestion "使用 kmemleak 检测内存泄漏:"
    echo "  echo scan > /sys/kernel/debug/kmemleak"
    echo "  cat /sys/kernel/debug/kmemleak"
    echo ""
    print_ai_suggestion "使用 KASAN (Kernel Address Sanitizer) 进行更深入的检测"
}

# 性能分析
performance_analysis() {
    local module_name="$1"

    print_info "性能分析..."
    echo ""

    # CPU 使用率
    echo -e "${BLUE}CPU 使用率 (top 5 进程):${NC}"
    ps aux --sort=-%cpu | head -6

    echo ""
    # 中断统计
    echo -e "${BLUE}中断统计 (IRQ):${NC}"
    cat /proc/interrupts | head -10

    echo ""
    print_ai_suggestion "性能优化建议:"
    echo "  1. 使用 perf 进行性能分析: sudo perf record -a -g -- sleep 10"
    echo "  2. 使用 ftrace 追踪函数调用: echo function > /sys/kernel/debug/tracing/current_tracer"
    echo "  3. 检查中断负载: watch -n 1 'cat /proc/interrupts'"
    echo "  4. 分析锁争用: cat /proc/lock_stat"
}

# 崩溃分析
crash_analysis() {
    print_info "分析最近的内核崩溃..."
    echo ""

    # 检查 oops 或 panic
    local oops=$(dmesg | grep -i "oops\|panic\|bug" | tail -20)

    if [ -n "$oops" ]; then
        print_error "发现内核崩溃信息:"
        echo "$oops"

        echo ""
        print_ai_suggestion "崩溃分析步骤:"
        echo "  1. 定位崩溃地址: 在 Oops 信息中查找 'RIP' 或 'PC'"
        echo "  2. 使用 addr2line: addr2line -e <module>.ko <address>"
        echo "  3. 检查堆栈跟踪，找到最后调用的函数"
        echo "  4. 检查最近的代码修改"
        echo "  5. 使用 KASAN 或 KMSAN 检测内存错误"

    else
        print_info "未发现最近的崩溃信息"
    fi
}

# 锁检测
check_locks() {
    print_info "检查锁问题..."
    echo ""

    # 检查死锁
    if [ -f /proc/lock_stat ]; then
        echo -e "${BLUE}锁统计:${NC}"
        sudo cat /proc/lock_stat 2>/dev/null | head -20 || {
            print_warn "无法读取 /proc/lock_stat"
        }
    fi

    echo ""
    print_ai_suggestion "锁调试建议:"
    echo "  1. 启用 lockdep: CONFIG_PROVE_LOCKING=y"
    echo "  2. 检查锁顺序，避免死锁"
    echo "  3. 使用 spin_lock_irqsave 在中断上下文"
    echo "  4. 避免在锁内调用可能睡眠的函数"
    echo "  5. 使用 lock validator 检测问题"
}

# 设备树分析 (针对设备驱动)
device_tree_analysis() {
    local device="$1"

    if [ -z "$device" ]; then
        print_error "请提供设备路径 (例如: /dev/my_device)"
        return 1
    fi

    print_info "分析设备: $device"
    echo ""

    if [ -e "$device" ]; then
        echo -e "${BLUE}设备信息:${NC}"
        ls -l "$device"

        # 获取主次设备号
        local major=$(stat -c %t "$device")
        local minor=$(stat -c %T "$device")
        echo "主设备号: $major"
        echo "次设备号: $minor"

        # 查找对应的驱动
        echo ""
        echo -e "${BLUE}相关 sysfs 信息:${NC}"
        local dev_name=$(basename "$device")
        find /sys/class -name "$dev_name" 2>/dev/null | while read path; do
            echo "路径: $path"
            [ -e "$path/uevent" ] && cat "$path/uevent"
        done

    else
        print_warn "设备节点不存在: $device"
        print_ai_suggestion "检查驱动是否正确创建设备节点"
    fi
}

# 生成调试报告
generate_report() {
    local module_name="$1"
    local report_file="debug_report_$(date +%Y%m%d_%H%M%S).txt"

    print_info "生成调试报告..."

    {
        echo "======================================"
        echo "  内核驱动调试报告"
        echo "  生成时间: $(date)"
        echo "======================================"
        echo ""

        echo "=== 系统信息 ==="
        uname -a
        echo ""

        echo "=== 内核版本 ==="
        cat /proc/version
        echo ""

        if [ -n "$module_name" ]; then
            echo "=== 模块信息: $module_name ==="
            lsmod | grep "^$module_name " || echo "模块未加载"
            echo ""
        fi

        echo "=== 内存状态 ==="
        free -h
        echo ""

        echo "=== 最近的内核日志 ==="
        dmesg | tail -50
        echo ""

        echo "=== 中断统计 ==="
        cat /proc/interrupts
        echo ""

    } > "$report_file"

    print_info "报告已保存到: $report_file"
}

# 交互式菜单
show_menu() {
    echo ""
    echo -e "${CYAN}请选择操作:${NC}"
    echo "  1) 分析内核日志 (dmesg)"
    echo "  2) 检查模块状态"
    echo "  3) 内存泄漏检测"
    echo "  4) 性能分析"
    echo "  5) 崩溃分析"
    echo "  6) 锁问题检测"
    echo "  7) 设备节点分析"
    echo "  8) 生成调试报告"
    echo "  9) 显示 AI 调试技巧"
    echo "  0) 退出"
    echo ""
}

# AI 调试技巧
show_debug_tips() {
    print_info "AI 调试技巧和最佳实践"
    echo ""

    echo -e "${MAGENTA}═══ 常用调试技术 ═══${NC}"
    echo "1. printk 调试:"
    echo "   pr_debug(), pr_info(), pr_warn(), pr_err()"
    echo ""

    echo "2. ftrace 函数追踪:"
    echo "   echo function > /sys/kernel/debug/tracing/current_tracer"
    echo "   echo 1 > /sys/kernel/debug/tracing/tracing_on"
    echo ""

    echo "3. kprobe 动态探测:"
    echo "   echo 'p:myprobe do_sys_open' > /sys/kernel/debug/tracing/kprobe_events"
    echo ""

    echo "4. 内存调试:"
    echo "   使用 KASAN (CONFIG_KASAN=y)"
    echo "   使用 kmemleak 检测泄漏"
    echo ""

    echo "5. 锁调试:"
    echo "   使用 lockdep (CONFIG_PROVE_LOCKING=y)"
    echo "   检查 /proc/lock_stat"
    echo ""

    echo -e "${MAGENTA}═══ 错误处理模式 ═══${NC}"
    echo "• 始终检查返回值"
    echo "• 使用 goto 进行错误清理"
    echo "• 正确释放所有资源"
    echo "• 避免在错误路径中重复释放"
    echo ""

    echo -e "${MAGENTA}═══ 性能优化建议 ═══${NC}"
    echo "• 减少锁的持有时间"
    echo "• 使用每 CPU 变量"
    echo "• 避免在中断上下文中进行重量级操作"
    echo "• 使用 DMA 减少 CPU 负载"
}

# 主程序
main() {
    print_header
    echo ""

    # 如果提供了命令行参数，直接执行
    if [ $# -gt 0 ]; then
        case "$1" in
            analyze|dmesg)
                analyze_dmesg
                ;;
            check|module)
                check_module "$2"
                ;;
            leak|memory)
                check_memory_leak "$2"
                ;;
            perf|performance)
                performance_analysis "$2"
                ;;
            crash|oops)
                crash_analysis
                ;;
            lock|locks)
                check_locks
                ;;
            device|dev)
                device_tree_analysis "$2"
                ;;
            report)
                generate_report "$2"
                ;;
            tips|help)
                show_debug_tips
                ;;
            *)
                echo "用法: $0 {analyze|check|leak|perf|crash|lock|device|report|tips} [参数]"
                exit 1
                ;;
        esac
        exit 0
    fi

    # 交互式模式
    while true; do
        show_menu
        read -p "请选择 (0-9): " choice

        case $choice in
            1)
                analyze_dmesg
                ;;
            2)
                read -p "输入模块名称: " mod_name
                check_module "$mod_name"
                ;;
            3)
                read -p "输入模块名称 (可选): " mod_name
                check_memory_leak "$mod_name"
                ;;
            4)
                read -p "输入模块名称 (可选): " mod_name
                performance_analysis "$mod_name"
                ;;
            5)
                crash_analysis
                ;;
            6)
                check_locks
                ;;
            7)
                read -p "输入设备路径 (例如: /dev/my_device): " dev_path
                device_tree_analysis "$dev_path"
                ;;
            8)
                read -p "输入模块名称 (可选): " mod_name
                generate_report "$mod_name"
                ;;
            9)
                show_debug_tips
                ;;
            0)
                print_info "退出"
                exit 0
                ;;
            *)
                print_error "无效的选择"
                ;;
        esac

        echo ""
        read -p "按 Enter 继续..."
    done
}

# 运行主程序
main "$@"
