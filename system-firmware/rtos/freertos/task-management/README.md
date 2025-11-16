# FreeRTOS 任務管理範例

> 完整的 FreeRTOS 任務管理系統範例，展示多任務創建、排程和生命週期管理

## 📋 專案簡介

本專案展示 FreeRTOS 核心任務管理功能，包括：
- 任務創建與刪除
- 任務優先權設定
- 任務狀態查詢
- 任務掛起與恢復
- 任務堆疊監控

## 🎯 功能特性

### 1. 多任務系統
- LED 閃爍任務（優先權 1）
- 數據處理任務（優先權 2）
- 監控任務（優先權 3）
- 閒置任務鉤子

### 2. 任務管理
- 動態任務創建
- 任務優先權調整
- 任務掛起/恢復
- 任務統計資訊

### 3. 堆疊監控
- 堆疊使用量檢測
- 堆疊溢位保護
- 高水位標記

## 🏗️ 專案結構

```
task-management/
├── README.md
├── src/
│   ├── main.c              # 主程式
│   ├── task_manager.c      # 任務管理器
│   ├── led_task.c          # LED 任務
│   ├── data_task.c         # 數據處理任務
│   └── monitor_task.c      # 監控任務
├── include/
│   ├── task_manager.h
│   ├── config.h
│   └── tasks.h
└── docs/
    └── architecture.md
```

## 🚀 快速開始

### 硬體需求
- STM32F4 系列開發板
- 或任何支援 FreeRTOS 的 ARM Cortex-M 系列

### 軟體需求
- STM32CubeIDE 或 Keil MDK
- FreeRTOS v10.4.x 或更高版本
- ARM GCC 工具鏈

### 編譯步驟

```bash
# 1. 克隆專案
cd system-firmware/rtos/freertos/task-management

# 2. 配置 FreeRTOSConfig.h
# 根據您的硬體修改配置

# 3. 編譯
make clean
make all

# 4. 燒錄
make flash
```

## 📖 使用說明

### 基本任務創建

參考 `src/main.c` 中的範例：

```c
// 創建 LED 任務
xTaskCreate(
    vLEDTask,           // 任務函數
    "LED",              // 任務名稱
    128,                // 堆疊大小
    NULL,               // 參數
    1,                  // 優先權
    &led_task_handle    // 任務句柄
);
```

### 任務管理

```c
// 掛起任務
vTaskSuspend(led_task_handle);

// 恢復任務
vTaskResume(led_task_handle);

// 刪除任務
vTaskDelete(led_task_handle);

// 改變優先權
vTaskPrioritySet(led_task_handle, 3);
```

### 堆疊監控

```c
// 獲取剩餘堆疊空間
UBaseType_t stack_high_water = uxTaskGetStackHighWaterMark(NULL);
printf("Stack remaining: %u words\n", stack_high_water);
```

## 🧪 測試結果

### 性能指標
- 最小堆疊大小：128 words
- 上下文切換時間：< 10 μs
- 任務響應時間：< 100 μs

### 測試平台
- MCU: STM32F407VGT6
- 時鐘: 168 MHz
- RAM: 192 KB
- FreeRTOS: v10.4.6

## 📚 學習要點

### 1. 任務優先權
- 數值越大，優先權越高
- 相同優先權採用時間片輪轉
- 最高優先權任務優先執行

### 2. 堆疊大小計算
- 考慮局部變數
- 考慮函數調用深度
- 考慮中斷嵌套
- 建議預留 20-30% 餘量

### 3. 任務狀態
- Running: 正在執行
- Ready: 準備執行
- Blocked: 等待事件
- Suspended: 被掛起
- Deleted: 已刪除

## 🤖 AI 輔助開發提示

```
"如何計算 FreeRTOS 任務的最小堆疊大小？"
"優先權反轉問題如何在任務設計中避免？"
"如何實現任務之間的安全通訊？"
"FreeRTOS 任務統計功能如何使用？"
```

## ⚠️ 注意事項

1. **堆疊溢位**
   - 必須使用堆疊溢位檢測
   - 定期監控高水位標記
   - 測試時留有足夠餘量

2. **優先權設計**
   - 避免優先權反轉
   - 關鍵任務給予高優先權
   - 避免過多相同優先權

3. **資源管理**
   - 任務刪除前釋放資源
   - 避免記憶體洩漏
   - 正確使用臨界區

## 🔧 配置參數

### FreeRTOSConfig.h 關鍵設定

```c
#define configUSE_PREEMPTION                1
#define configUSE_IDLE_HOOK                 1
#define configUSE_TICK_HOOK                 0
#define configCPU_CLOCK_HZ                  168000000
#define configTICK_RATE_HZ                  1000
#define configMAX_PRIORITIES                5
#define configMINIMAL_STACK_SIZE            128
#define configTOTAL_HEAP_SIZE               20480
#define configMAX_TASK_NAME_LEN             16
#define configUSE_TRACE_FACILITY            1
#define configUSE_STATS_FORMATTING_FUNCTIONS 1
#define configCHECK_FOR_STACK_OVERFLOW      2
```

## 📊 除錯技巧

### 1. 使用 SEGGER SystemView
```c
#include "SEGGER_SYSVIEW.h"
SEGGER_SYSVIEW_Conf();
```

### 2. 任務統計
```c
char stats_buffer[512];
vTaskList(stats_buffer);
printf("%s\n", stats_buffer);
```

### 3. 執行時間統計
```c
char runtime_buffer[512];
vTaskGetRunTimeStats(runtime_buffer);
printf("%s\n", runtime_buffer);
```

## 🔗 相關資源

- [FreeRTOS 官方文檔](https://www.freertos.org/Documentation/RTOS_book.html)
- [Mastering the FreeRTOS Real Time Kernel](https://www.freertos.org/Documentation/161204_Mastering_the_FreeRTOS_Real_Time_Kernel-A_Hands-On_Tutorial_Guide.pdf)
- [STM32 + FreeRTOS 教程](https://www.st.com/en/embedded-software/stm32-freertos.html)

## 📝 版本歷史

- v1.0.0 (2025-11-16)
  - 初始版本
  - 基本任務管理功能
  - 堆疊監控功能

## 📄 授權

MIT License

---

**維護者**: AI-Assisted Development Team
**最後更新**: 2025-11-16
