# 🚀 Main Firmware - 主韌體應用

## 概述

主韌體應用程式框架，包含完整的系統初始化、任務調度、外設管理和通訊協議。

## 功能特點

- ✅ RTOS 任務管理 (FreeRTOS)
- ✅ 事件驅動架構
- ✅ 低功耗模式
- ✅ 看門狗保護
- ✅ 系統監控與日誌
- ✅ OTA 更新支援

## 架構設計

```
main_firmware/
├── src/
│   ├── main.c                    # 主程式入口
│   ├── system_init.c             # 系統初始化
│   ├── task_manager.c            # 任務管理
│   ├── peripheral_driver.c       # 外設驅動
│   ├── power_management.c        # 電源管理
│   └── watchdog.c                # 看門狗
├── include/
├── Makefile
└── README.md
```

## 快速開始

```bash
make clean
make all
make flash
```

## 核心功能

### 系統初始化

```c
void system_init(void)
{
    // 時鐘配置
    clock_config();

    // GPIO 初始化
    gpio_init();

    // UART/I2C/SPI 初始化
    peripheral_init();

    // RTOS 初始化
    rtos_init();
}
```

### 任務調度

```c
void create_tasks(void)
{
    xTaskCreate(sensor_task, "Sensor", 256, NULL, 1, NULL);
    xTaskCreate(comm_task, "Comm", 512, NULL, 2, NULL);
    xTaskCreate(led_task, "LED", 128, NULL, 1, NULL);
}
```

**狀態**: ✅ 可用
