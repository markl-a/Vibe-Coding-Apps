# GDB 初始化腳本 - RTOS 除錯
# 適用於 ARM Cortex-M 和 FreeRTOS/Zephyr/RT-Thread

# 連接設置
target extended-remote localhost:3333

# 載入符號
# symbol-file build/firmware.elf

# 設置架構
set architecture arm

# 允許自動載入本地 .gdbinit
set auto-load safe-path /

# 顯示設置
set print pretty on
set print object on
set print static-members on
set print vtbl on
set print demangle on
set demangle-style gnu-v3
set print sevenbit-strings off

# History
set history save on
set history size 10000
set history filename ~/.gdb_history

# 禁用分頁
set pagination off

# 顯示彩色輸出
set style enabled on

# ==================== FreeRTOS 支援 ====================

# 任務列表
define freertos-tasks
    printf "FreeRTOS Tasks:\n"
    printf "%-20s %-10s %-10s %-10s\n", "Name", "State", "Priority", "Stack"
    printf "================================================================\n"

    # 這需要 FreeRTOS-aware GDB
    # 或使用 FreeRTOS+Trace
    info threads
end

document freertos-tasks
List all FreeRTOS tasks with their states
end

# 當前任務信息
define freertos-current
    printf "Current Task:\n"
    # 需要讀取 pxCurrentTCB
    # p *pxCurrentTCB
end

document freertos-current
Show current running FreeRTOS task
end

# ==================== Cortex-M 寄存器 ====================

# 顯示所有核心寄存器
define show-regs
    printf "Core Registers:\n"
    printf "  R0:  0x%08x    R1:  0x%08x    R2:  0x%08x    R3:  0x%08x\n", $r0, $r1, $r2, $r3
    printf "  R4:  0x%08x    R5:  0x%08x    R6:  0x%08x    R7:  0x%08x\n", $r4, $r5, $r6, $r7
    printf "  R8:  0x%08x    R9:  0x%08x    R10: 0x%08x    R11: 0x%08x\n", $r8, $r9, $r10, $r11
    printf "  R12: 0x%08x    SP:  0x%08x    LR:  0x%08x    PC:  0x%08x\n", $r12, $sp, $lr, $pc
    printf "  xPSR: 0x%08x\n", $xpsr
end

document show-regs
Display all Cortex-M core registers
end

# 顯示堆疊
define show-stack
    printf "Stack (SP=0x%08x):\n", $sp
    x/32wx $sp
end

document show-stack
Display current stack content
end

# ==================== 中斷和異常 ====================

# 顯示 NVIC 狀態
define show-nvic
    printf "NVIC Status:\n"

    # NVIC ISER (Interrupt Set-Enable Registers)
    set $iser0 = *(unsigned int*)0xE000E100
    set $iser1 = *(unsigned int*)0xE000E104
    set $iser2 = *(unsigned int*)0xE000E108

    printf "  ISER0: 0x%08x\n", $iser0
    printf "  ISER1: 0x%08x\n", $iser1
    printf "  ISER2: 0x%08x\n", $iser2

    # NVIC ISPR (Interrupt Set-Pending Registers)
    set $ispr0 = *(unsigned int*)0xE000E200
    printf "  ISPR0: 0x%08x (Pending interrupts)\n", $ispr0
end

document show-nvic
Display NVIC (Nested Vectored Interrupt Controller) status
end

# 顯示異常狀態
define show-exceptions
    printf "Exception Status:\n"

    # SCB ICSR (Interrupt Control and State Register)
    set $icsr = *(unsigned int*)0xE000ED04
    set $vectactive = $icsr & 0x1FF

    printf "  ICSR: 0x%08x\n", $icsr
    printf "  Active Vector: %d\n", $vectactive

    if $vectactive == 0
        printf "  Status: Thread mode\n"
    else
        printf "  Status: Handler mode\n"
    end
end

document show-exceptions
Display exception and interrupt status
end

# ==================== 記憶體檢查 ====================

# 檢查堆疊使用
define check-stack
    if $argc != 2
        printf "Usage: check-stack <stack_bottom> <stack_top>\n"
    else
        set $bottom = $arg0
        set $top = $arg1
        set $current = $sp

        set $used = $top - $current
        set $total = $top - $bottom
        set $percent = ($used * 100) / $total

        printf "Stack Usage:\n"
        printf "  Bottom:  0x%08x\n", $bottom
        printf "  Top:     0x%08x\n", $top
        printf "  Current: 0x%08x\n", $current
        printf "  Used:    %d bytes (%d%%)\n", $used, $percent
        printf "  Free:    %d bytes\n", $total - $used

        if $percent > 80
            printf "  WARNING: Stack usage >80%%!\n"
        end
    end
end

document check-stack
Check stack usage: check-stack <stack_bottom> <stack_top>
end

# 檢查記憶體洩漏
define check-heap
    printf "Heap Status:\n"
    # 需要根據使用的堆分配器實現
    # 對於 FreeRTOS:
    # p xPortGetFreeHeapSize()
    # p xPortGetMinimumEverFreeHeapSize()
end

document check-heap
Check heap usage and fragmentation
end

# ==================== 斷點助手 ====================

# 在 HardFault 處設置斷點
define break-hardfault
    break HardFault_Handler
    commands
        silent
        printf "\n*** HardFault detected! ***\n"
        show-regs
        show-stack
        printf "\nStack frame:\n"
        # 顯示保存的寄存器
        set $sp_val = $sp
        printf "  R0:  0x%08x\n", *(int*)($sp_val + 0)
        printf "  R1:  0x%08x\n", *(int*)($sp_val + 4)
        printf "  R2:  0x%08x\n", *(int*)($sp_val + 8)
        printf "  R3:  0x%08x\n", *(int*)($sp_val + 12)
        printf "  R12: 0x%08x\n", *(int*)($sp_val + 16)
        printf "  LR:  0x%08x\n", *(int*)($sp_val + 20)
        printf "  PC:  0x%08x (fault location)\n", *(int*)($sp_val + 24)
        printf "  xPSR: 0x%08x\n", *(int*)($sp_val + 28)
        bt
    end
end

document break-hardfault
Set breakpoint at HardFault handler with auto-display
end

# 在所有異常處設置斷點
define break-all-exceptions
    break HardFault_Handler
    break MemManage_Handler
    break BusFault_Handler
    break UsageFault_Handler
    printf "Breakpoints set on all exception handlers\n"
end

document break-all-exceptions
Set breakpoints on all Cortex-M exception handlers
end

# ==================== RTOS 除錯助手 ====================

# 追蹤任務切換
define trace-context-switch
    # 在 vTaskSwitchContext 設置斷點
    break vTaskSwitchContext
    commands
        silent
        printf "Task switch: "
        # 顯示切換的任務
        # p pcTaskGetName(pxCurrentTCB)
        continue
    end
end

document trace-context-switch
Trace FreeRTOS task context switches
end

# ==================== 初始化 ====================

# 連接後執行
define connect-target
    monitor reset halt
    load
    monitor reset halt
    printf "\nTarget connected and firmware loaded\n"
    printf "Ready to debug. Type 'c' to continue or 's' to step\n\n"
end

document connect-target
Connect to target, load firmware and reset
end

# 歡迎信息
printf "\n╔═══════════════════════════════════════════════╗\n"
printf "║    RTOS GDB Configuration Loaded             ║\n"
printf "╚═══════════════════════════════════════════════╝\n\n"

printf "Available commands:\n"
printf "  freertos-tasks       - List all FreeRTOS tasks\n"
printf "  show-regs            - Display all registers\n"
printf "  show-stack           - Display stack content\n"
printf "  show-nvic            - Display NVIC status\n"
printf "  show-exceptions      - Display exception status\n"
printf "  check-stack <b> <t>  - Check stack usage\n"
printf "  break-hardfault      - Break on HardFault\n"
printf "  break-all-exceptions - Break on all exceptions\n"
printf "  connect-target       - Connect and load firmware\n"
printf "\n"

# 自動設置異常斷點
# break-hardfault

# 啟用 semihosting（可選）
# monitor arm semihosting enable
