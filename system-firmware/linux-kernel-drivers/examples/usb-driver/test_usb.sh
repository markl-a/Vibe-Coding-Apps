#!/bin/bash
# test_usb.sh - USB 驱动自动化测试脚本

set -e

DRIVER_DIR="../../usb-driver"
DRIVER_NAME="usb_skeleton"
DEVICE_PATH="/dev/usb/skel0"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否以 root 权限运行
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 sudo 运行此脚本"
        exit 1
    fi
}

# 编译测试程序
compile_test() {
    print_info "编译测试程序..."
    if [ -f test_usb_device.c ]; then
        gcc -o test_usb_device test_usb_device.c -Wall
        print_info "编译完成"
    else
        print_error "找不到 test_usb_device.c"
        exit 1
    fi
}

# 加载驱动
load_driver() {
    print_info "加载 USB 驱动..."

    # 检查驱动文件是否存在
    if [ ! -f "$DRIVER_DIR/${DRIVER_NAME}.ko" ]; then
        print_warn "驱动文件不存在，尝试编译..."
        (cd "$DRIVER_DIR" && make) || {
            print_error "驱动编译失败"
            exit 1
        }
    fi

    # 卸载旧驱动
    if lsmod | grep -q "$DRIVER_NAME"; then
        print_info "卸载已存在的驱动..."
        rmmod "$DRIVER_NAME" 2>/dev/null || true
    fi

    # 加载驱动
    insmod "$DRIVER_DIR/${DRIVER_NAME}.ko" || {
        print_error "驱动加载失败"
        dmesg | tail -20
        exit 1
    }

    print_info "驱动加载成功"
    sleep 1
}

# 卸载驱动
unload_driver() {
    print_info "卸载 USB 驱动..."
    if lsmod | grep -q "$DRIVER_NAME"; then
        rmmod "$DRIVER_NAME" || {
            print_error "驱动卸载失败"
            exit 1
        }
        print_info "驱动卸载成功"
    else
        print_warn "驱动未加载"
    fi
}

# 显示驱动信息
show_info() {
    print_info "=== 驱动信息 ==="
    if lsmod | grep -q "$DRIVER_NAME"; then
        echo "驱动状态: 已加载"
        lsmod | grep "$DRIVER_NAME"
    else
        echo "驱动状态: 未加载"
    fi

    echo ""
    print_info "=== USB 设备列表 ==="
    lsusb -t

    echo ""
    print_info "=== 最近的内核消息 ==="
    dmesg | tail -15
}

# 运行基本测试
run_basic_test() {
    print_info "=== 运行基本测试 ==="

    # 注意：这个测试需要实际的 USB 设备
    # 在没有真实设备的情况下，这部分会失败

    if [ -e "$DEVICE_PATH" ]; then
        export USB_DEVICE="$DEVICE_PATH"
        ./test_usb_device test || {
            print_warn "基本测试失败（可能没有连接实际的 USB 设备）"
        }
    else
        print_warn "设备节点 $DEVICE_PATH 不存在"
        print_warn "这是正常的，因为没有匹配的 USB 设备连接"
    fi
}

# 显示 USB 调试信息
show_debug_info() {
    print_info "=== USB 调试信息 ==="

    if [ -d /sys/kernel/debug/usb ]; then
        echo "USB 设备树:"
        cat /sys/kernel/debug/usb/devices 2>/dev/null || {
            print_warn "无法读取 USB 设备信息（需要 debugfs）"
        }
    else
        print_warn "USB debugfs 未挂载"
        print_info "尝试挂载 debugfs..."
        mount -t debugfs none /sys/kernel/debug 2>/dev/null || {
            print_warn "挂载 debugfs 失败"
        }
    fi

    echo ""
    echo "USB 总线设备:"
    ls -l /sys/bus/usb/devices/ 2>/dev/null || true
}

# 主菜单
show_menu() {
    echo ""
    echo "=== USB 驱动测试工具 ==="
    echo "1) 编译并加载驱动"
    echo "2) 运行测试程序"
    echo "3) 显示驱动信息"
    echo "4) 显示 USB 调试信息"
    echo "5) 卸载驱动"
    echo "6) 完整测试流程"
    echo "7) 退出"
    echo ""
}

# 完整测试流程
full_test() {
    print_info "开始完整测试流程..."

    # 1. 编译
    compile_test

    # 2. 加载驱动
    load_driver

    # 3. 显示信息
    show_info

    # 4. 显示调试信息
    show_debug_info

    # 5. 运行测试
    run_basic_test

    # 6. 显示结果
    print_info "=== 测试完成 ==="
    dmesg | tail -20

    echo ""
    read -p "是否卸载驱动? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        unload_driver
    fi
}

# 主程序
main() {
    check_root

    # 如果提供了命令行参数
    if [ $# -gt 0 ]; then
        case "$1" in
            load)
                compile_test
                load_driver
                ;;
            unload)
                unload_driver
                ;;
            test)
                full_test
                ;;
            info)
                show_info
                ;;
            debug)
                show_debug_info
                ;;
            *)
                echo "用法: $0 {load|unload|test|info|debug}"
                exit 1
                ;;
        esac
        exit 0
    fi

    # 交互式菜单
    while true; do
        show_menu
        read -p "请选择 (1-7): " choice

        case $choice in
            1)
                compile_test
                load_driver
                ;;
            2)
                compile_test
                run_basic_test
                ;;
            3)
                show_info
                ;;
            4)
                show_debug_info
                ;;
            5)
                unload_driver
                ;;
            6)
                full_test
                ;;
            7)
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
