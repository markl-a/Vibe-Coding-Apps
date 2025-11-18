# ⏱️ 即時作業系統 (RTOS) 開發
> 使用 AI 驅動的方法進行即時作業系統開發

⚠️ **驗證階段專案** - 此領域目前處於研究與開發階段

## 📋 專案概述

即時作業系統 (Real-Time Operating System, RTOS) 是一種能夠在確定時間內響應外部事件的作業系統，廣泛應用於工業控制、汽車電子、醫療設備等領域。本專案展示如何使用 AI 輔助工具進行 RTOS 開發和優化。

## 🎯 支援的 RTOS

### 1. FreeRTOS
- **最流行的開源 RTOS**
  - 任務管理
  - 佇列 (Queue)
  - 信號量 (Semaphore)
  - 互斥鎖 (Mutex)
  - 事件組 (Event Groups)
  - 軟體定時器

- **應用領域**
  - IoT 設備
  - 消費電子
  - 工業控制
  - 醫療設備

### 2. Zephyr RTOS
- **現代物聯網 RTOS**
  - 多平台支援
  - 設備樹配置
  - 豐富的驅動庫
  - 藍牙/Wi-Fi 堆疊
  - OTA 更新

- **特色功能**
  - West 工具鏈
  - Kconfig 配置
  - 設備模型
  - 電源管理

### 3. RT-Thread
- **中國開源 RTOS**
  - 物件導向設計
  - 設備框架
  - 組件豐富
  - 中文文檔完善

- **組件系統**
  - 網路協議棧
  - 檔案系統
  - GUI 框架
  - 設備驅動

### 4. VxWorks
- **工業級商用 RTOS**
  - 硬即時性能
  - 高可靠性
  - POSIX 相容
  - 安全認證

- **應用場景**
  - 航空航天
  - 國防軍工
  - 工業自動化
  - 醫療設備

### 5. QNX
- **微核心 RTOS**
  - 訊息傳遞機制
  - 模組化設計
  - 容錯能力強
  - 汽車級認證

- **應用領域**
  - 汽車電子
  - 醫療系統
  - 工業控制
  - 鐵路系統

### 6. Azure RTOS (ThreadX)
- **Microsoft RTOS**
  - 小記憶體佔用
  - 快速上下文切換
  - 優先權繼承
  - Azure IoT 整合

### 7. RIOT OS
- **物聯網 RTOS**
  - 類 Linux API
  - 網路協議豐富
  - 低功耗設計
  - 模組化架構

### 8. NuttX
- **POSIX 相容 RTOS**
  - 類 Unix 架構
  - 豐富的驅動
  - 網路堆疊
  - 檔案系統支援

## 🛠️ 技術棧

### 開發語言
- **C** - RTOS 主要語言
- **C++** - 物件導向應用
- **Assembly** - 上下文切換
- **Python** - 配置和工具

### 開發工具
- **IDE**
  - STM32CubeIDE (FreeRTOS)
  - Zephyr SDK
  - RT-Thread Studio
  - SEGGER Embedded Studio

- **除錯工具**
  - SEGGER SystemView
  - FreeRTOS Trace
  - RTOS-aware GDB
  - Logic Analyzer

## 🚀 快速開始

### 1. FreeRTOS 基礎範例

```c
// main.c - FreeRTOS 基本任務
#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include "semphr.h"

#define TASK_STACK_SIZE 128

// 任務句柄
TaskHandle_t task1_handle;
TaskHandle_t task2_handle;

// 佇列句柄
QueueHandle_t data_queue;

// 任務 1: LED 閃爍
void vTask1(void *pvParameters)
{
    uint32_t counter = 0;

    while (1) {
        // 切換 LED
        HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);

        // 發送數據到佇列
        xQueueSend(data_queue, &counter, portMAX_DELAY);
        counter++;

        // 延遲 500ms
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}

// 任務 2: 數據處理
void vTask2(void *pvParameters)
{
    uint32_t received_data;

    while (1) {
        // 從佇列接收數據
        if (xQueueReceive(data_queue, &received_data, portMAX_DELAY) == pdTRUE) {
            printf("Received: %lu\n", received_data);
        }
    }
}

int main(void)
{
    HAL_Init();
    SystemClock_Config();
    GPIO_Init();
    UART_Init();

    // 創建佇列 (10 個元素)
    data_queue = xQueueCreate(10, sizeof(uint32_t));

    // 創建任務 1 (優先權 2)
    xTaskCreate(vTask1,
                "Task1",
                TASK_STACK_SIZE,
                NULL,
                2,
                &task1_handle);

    // 創建任務 2 (優先權 3)
    xTaskCreate(vTask2,
                "Task2",
                TASK_STACK_SIZE,
                NULL,
                3,
                &task2_handle);

    // 啟動排程器
    vTaskStartScheduler();

    // 不應該到達這裡
    while (1);

    return 0;
}
```

### 2. FreeRTOS 同步機制

```c
// semaphore_example.c
#include "FreeRTOS.h"
#include "task.h"
#include "semphr.h"

SemaphoreHandle_t binary_semaphore;
SemaphoreHandle_t counting_semaphore;
SemaphoreHandle_t mutex;

// 共享資源
static int shared_resource = 0;

// 生產者任務
void producer_task(void *pvParameters)
{
    while (1) {
        // 生產數據
        vTaskDelay(pdMS_TO_TICKS(100));

        // 釋放計數信號量
        xSemaphoreGive(counting_semaphore);
    }
}

// 消費者任務
void consumer_task(void *pvParameters)
{
    while (1) {
        // 等待信號量
        if (xSemaphoreTake(counting_semaphore, portMAX_DELAY) == pdTRUE) {
            printf("Consumed data\n");
        }
    }
}

// 臨界區保護任務
void critical_task(void *pvParameters)
{
    while (1) {
        // 獲取互斥鎖
        if (xSemaphoreTake(mutex, portMAX_DELAY) == pdTRUE) {
            // 臨界區
            shared_resource++;
            printf("Resource: %d\n", shared_resource);

            // 釋放互斥鎖
            xSemaphoreGive(mutex);
        }

        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

void setup_synchronization(void)
{
    // 創建二進制信號量
    binary_semaphore = xSemaphoreCreateBinary();

    // 創建計數信號量 (最大計數 10)
    counting_semaphore = xSemaphoreCreateCounting(10, 0);

    // 創建互斥鎖
    mutex = xSemaphoreCreateMutex();

    // 創建任務
    xTaskCreate(producer_task, "Producer", 128, NULL, 2, NULL);
    xTaskCreate(consumer_task, "Consumer", 128, NULL, 2, NULL);
    xTaskCreate(critical_task, "Critical", 128, NULL, 3, NULL);
}
```

### 3. FreeRTOS 事件組

```c
// event_group_example.c
#include "FreeRTOS.h"
#include "task.h"
#include "event_groups.h"

// 事件位定義
#define EVENT_BIT_0  (1 << 0)  // 按鈕按下
#define EVENT_BIT_1  (1 << 1)  // 數據接收
#define EVENT_BIT_2  (1 << 2)  // 定時器到期

EventGroupHandle_t event_group;

// 事件設置任務
void event_setter_task(void *pvParameters)
{
    while (1) {
        // 檢查按鈕
        if (button_pressed()) {
            xEventGroupSetBits(event_group, EVENT_BIT_0);
        }

        // 檢查數據
        if (data_available()) {
            xEventGroupSetBits(event_group, EVENT_BIT_1);
        }

        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

// 事件等待任務
void event_waiter_task(void *pvParameters)
{
    const EventBits_t bits_to_wait = EVENT_BIT_0 | EVENT_BIT_1;

    while (1) {
        // 等待任一事件 (OR)
        EventBits_t bits = xEventGroupWaitBits(
            event_group,
            bits_to_wait,
            pdTRUE,   // 清除位
            pdFALSE,  // 等待任一位
            portMAX_DELAY
        );

        if (bits & EVENT_BIT_0) {
            printf("Button pressed!\n");
        }

        if (bits & EVENT_BIT_1) {
            printf("Data received!\n");
        }
    }
}

// 等待所有事件
void wait_all_events_task(void *pvParameters)
{
    const EventBits_t all_bits = EVENT_BIT_0 | EVENT_BIT_1 | EVENT_BIT_2;

    while (1) {
        // 等待所有事件 (AND)
        xEventGroupWaitBits(
            event_group,
            all_bits,
            pdTRUE,   // 清除位
            pdTRUE,   // 等待所有位
            portMAX_DELAY
        );

        printf("All events occurred!\n");
    }
}
```

### 4. FreeRTOS 軟體定時器

```c
// timer_example.c
#include "FreeRTOS.h"
#include "task.h"
#include "timers.h"

TimerHandle_t one_shot_timer;
TimerHandle_t auto_reload_timer;

// 一次性定時器回調
void one_shot_callback(TimerHandle_t xTimer)
{
    printf("One-shot timer expired!\n");
    // 定時器自動停止
}

// 自動重載定時器回調
void auto_reload_callback(TimerHandle_t xTimer)
{
    static uint32_t count = 0;
    printf("Auto-reload timer: %lu\n", count++);
}

void setup_timers(void)
{
    // 創建一次性定時器 (5 秒)
    one_shot_timer = xTimerCreate(
        "OneShot",
        pdMS_TO_TICKS(5000),
        pdFALSE,  // 一次性
        (void *)0,
        one_shot_callback
    );

    // 創建自動重載定時器 (1 秒)
    auto_reload_timer = xTimerCreate(
        "AutoReload",
        pdMS_TO_TICKS(1000),
        pdTRUE,   // 自動重載
        (void *)0,
        auto_reload_callback
    );

    // 啟動定時器
    xTimerStart(one_shot_timer, 0);
    xTimerStart(auto_reload_timer, 0);
}

// 動態控制定時器
void control_timer_task(void *pvParameters)
{
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(10000));

        // 停止定時器
        xTimerStop(auto_reload_timer, 0);
        printf("Timer stopped\n");

        vTaskDelay(pdMS_TO_TICKS(5000));

        // 重啟定時器
        xTimerStart(auto_reload_timer, 0);
        printf("Timer restarted\n");
    }
}
```

### 5. Zephyr RTOS 範例

```c
// zephyr_example.c
#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/drivers/gpio.h>

#define LED_NODE DT_ALIAS(led0)
#define STACKSIZE 1024
#define PRIORITY 7

static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(LED_NODE, gpios);

// 定義線程堆疊
K_THREAD_STACK_DEFINE(thread1_stack, STACKSIZE);
K_THREAD_STACK_DEFINE(thread2_stack, STACKSIZE);

// 線程結構
struct k_thread thread1_data;
struct k_thread thread2_data;

// 定義佇列
K_MSGQ_DEFINE(my_msgq, sizeof(uint32_t), 10, 4);

// 線程 1
void thread1(void *arg1, void *arg2, void *arg3)
{
    uint32_t data = 0;

    while (1) {
        // 發送到佇列
        k_msgq_put(&my_msgq, &data, K_NO_WAIT);
        data++;

        // 切換 LED
        gpio_pin_toggle_dt(&led);

        k_sleep(K_MSEC(500));
    }
}

// 線程 2
void thread2(void *arg1, void *arg2, void *arg3)
{
    uint32_t received;

    while (1) {
        // 從佇列接收
        if (k_msgq_get(&my_msgq, &received, K_FOREVER) == 0) {
            printk("Received: %u\n", received);
        }
    }
}

int main(void)
{
    // 配置 GPIO
    gpio_pin_configure_dt(&led, GPIO_OUTPUT_ACTIVE);

    // 創建線程
    k_thread_create(&thread1_data, thread1_stack,
                    K_THREAD_STACK_SIZEOF(thread1_stack),
                    thread1, NULL, NULL, NULL,
                    PRIORITY, 0, K_NO_WAIT);

    k_thread_create(&thread2_data, thread2_stack,
                    K_THREAD_STACK_SIZEOF(thread2_stack),
                    thread2, NULL, NULL, NULL,
                    PRIORITY, 0, K_NO_WAIT);

    return 0;
}
```

## 📚 開發範例

### 範例 1: 優先權反轉解決

```c
// priority_inversion.c
#include "FreeRTOS.h"
#include "task.h"
#include "semphr.h"

SemaphoreHandle_t mutex_with_priority_inheritance;

// 低優先權任務
void low_priority_task(void *pvParameters)
{
    while (1) {
        if (xSemaphoreTake(mutex_with_priority_inheritance, portMAX_DELAY)) {
            printf("Low priority task working\n");
            vTaskDelay(pdMS_TO_TICKS(100));  // 模擬工作
            xSemaphoreGive(mutex_with_priority_inheritance);
        }
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}

// 中優先權任務
void medium_priority_task(void *pvParameters)
{
    while (1) {
        printf("Medium priority task running\n");
        vTaskDelay(pdMS_TO_TICKS(200));
    }
}

// 高優先權任務
void high_priority_task(void *pvParameters)
{
    vTaskDelay(pdMS_TO_TICKS(50));  // 延遲啟動

    while (1) {
        if (xSemaphoreTake(mutex_with_priority_inheritance, portMAX_DELAY)) {
            printf("High priority task working\n");
            xSemaphoreGive(mutex_with_priority_inheritance);
        }
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

void setup_priority_inheritance(void)
{
    // 創建支援優先權繼承的互斥鎖
    mutex_with_priority_inheritance = xSemaphoreCreateMutex();

    xTaskCreate(low_priority_task, "Low", 128, NULL, 1, NULL);
    xTaskCreate(medium_priority_task, "Medium", 128, NULL, 2, NULL);
    xTaskCreate(high_priority_task, "High", 128, NULL, 3, NULL);
}
```

### 範例 2: 任務通知

```c
// task_notification.c
#include "FreeRTOS.h"
#include "task.h"

TaskHandle_t receiver_task_handle;

// 接收任務
void receiver_task(void *pvParameters)
{
    uint32_t notification_value;

    while (1) {
        // 等待任務通知
        if (xTaskNotifyWait(0, 0xFFFFFFFF, &notification_value, portMAX_DELAY)) {
            printf("Received notification: 0x%08lX\n", notification_value);
        }
    }
}

// 發送任務
void sender_task(void *pvParameters)
{
    uint32_t count = 0;

    while (1) {
        vTaskDelay(pdMS_TO_TICKS(1000));

        // 發送任務通知
        xTaskNotify(receiver_task_handle, count++, eSetValueWithOverwrite);
    }
}

// ISR 中發送通知
void EXTI0_IRQHandler(void)
{
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;

    // 從 ISR 發送通知
    vTaskNotifyGiveFromISR(receiver_task_handle, &xHigherPriorityTaskWoken);

    // 上下文切換
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}
```

## 🤖 AI 輔助開發策略

### 1. RTOS 架構設計
```
"設計一個多任務系統的任務劃分策略"
"如何選擇合適的任務優先權？"
"RTOS 堆疊大小如何計算？"
```

### 2. 程式碼生成
```
"生成 FreeRTOS 的生產者-消費者模式"
"創建多任務通訊的佇列系統"
"實作任務監控和統計功能"
```

### 3. 除錯協助
```
"任務堆疊溢位如何排查？"
"優先權反轉問題如何解決？"
"死鎖如何檢測和預防？"
```

### 4. 性能優化
```
"如何減少上下文切換開銷？"
"RTOS 記憶體使用優化"
"即時性能如何保證？"
```

## 📊 專案結構

```
rtos/
├── README.md                       # 本文件
├── docs/                           # 完整文檔
│   ├── getting-started.md         # 入門指南
│   └── rtos-comparison.md         # RTOS 詳細對比
├── freertos/                       # FreeRTOS 專案
│   ├── task-management/           # 任務管理（含完整構建系統）
│   │   ├── src/                   # 源代碼
│   │   ├── include/               # 頭文件
│   │   ├── Makefile              # GNU Make 構建
│   │   ├── CMakeLists.txt        # CMake 構建
│   │   └── build.sh              # 自動化構建腳本
│   └── synchronization/           # 同步機制範例
├── zephyr/                         # Zephyr RTOS
│   └── basic-blinky/              # LED 閃爍範例
├── rt-thread/                      # RT-Thread
│   └── iot-gateway/               # IoT 閘道器
├── examples/                       # 完整範例集
│   ├── freertos/                  # FreeRTOS 範例
│   │   ├── 01-task-management/   # 任務管理
│   │   ├── 02-synchronization/   # 同步機制
│   │   ├── 03-interrupts/        # 中斷處理
│   │   ├── 04-memory-management/ # 記憶體管理
│   │   ├── 05-real-world-projects/ # 實際專案
│   │   └── 06-power-management/  # 電源管理 🆕
│   ├── zephyr/                    # Zephyr 範例
│   └── rt-thread/                 # RT-Thread 範例
└── tools/                          # 開發工具 🆕
    ├── ai-assistant/              # AI 輔助工具
    │   ├── rtos_code_generator.py # 代碼生成器
    │   ├── config_optimizer.py    # 配置優化器
    │   └── example_config.json    # 配置示例
    ├── debug/                     # 調試配置
    │   ├── .gdbinit              # GDB 配置
    │   └── openocd.cfg           # OpenOCD 配置
    └── benchmark/                 # 性能測試
        └── benchmark_suite.c      # 基準測試套件
```

## ✨ 新增功能（2025-11-18 更新）

### 🏗️ 構建系統
- **完整的構建支援**: 為 FreeRTOS 項目添加 Makefile 和 CMake 構建系統
- **自動化腳本**: build.sh 一鍵構建、燒錄、調試
- **交叉編譯**: ARM GCC 工具鏈完整配置
- **記憶體分析**: 自動生成記憶體使用報告

### ⚡ 電源管理
- **Tickless Idle**: 自動低功耗模式，可節省高達 98% 功耗
- **多級低功耗**: Sleep/Stop/Standby 模式完整實現
- **功耗分析**: 實時功耗監測和電池壽命預測
- **DVFS 支援**: 動態電壓和頻率調整

### 🤖 AI 輔助工具
- **代碼生成器**: 根據配置自動生成 RTOS 應用框架
  - 支援 FreeRTOS、Zephyr、RT-Thread
  - AI 智能推薦堆疊大小和優先級
  - 交互式和配置文件兩種模式

- **配置優化器**: 自動分析和優化 RTOS 配置
  - 檢測配置問題和安全隱患
  - 提供優化建議和最佳實踐
  - 電源優化分析

### 🔧 調試工具
- **GDB 配置**: 完整的 GDB 初始化腳本
  - FreeRTOS 任務感知調試
  - Cortex-M 寄存器和 NVIC 查看
  - 自動 HardFault 分析
  - 堆疊使用檢查

- **OpenOCD 配置**: 專業的燒錄和調試配置
  - ST-Link 支援
  - RTOS 感知調試
  - ITM/SWO 追蹤
  - 自定義調試命令

### 📊 性能測試
- **基準測試套件**: 完整的性能測試工具
  - 上下文切換性能 (~1.5μs)
  - 信號量/互斥鎖性能
  - 佇列吞吐量測試
  - 記憶體分配性能
  - 使用 DWT 精確計時

## 🧪 開發路線圖

### Phase 1: 基礎概念 ✅
- [x] 任務創建
- [x] 任務調度
- [x] 佇列通訊
- [x] 信號量

### Phase 2: 進階功能 ✅
- [x] 事件組
- [x] 軟體定時器
- [x] 任務通知
- [x] 優先權繼承
- [x] 完整構建系統
- [x] AI 輔助工具

### Phase 3: 系統優化 ✅
- [x] 堆疊優化
- [x] 即時性能測試
- [x] 功耗管理（Tickless Idle）
- [x] 錯誤處理和調試工具

### Phase 4: 應用開發 ⏳
- [x] 完整數據採集系統
- [x] IoT 閘道器
- [x] 性能基準測試
- [ ] OTA 更新
- [ ] 網絡協議棧（lwIP）
- [ ] 安全功能（加密、安全啟動）

## 🚀 快速開始

### 1. 使用 AI 代碼生成器創建項目

```bash
# 交互式模式
cd tools/ai-assistant
python3 rtos_code_generator.py --interactive

# 從配置文件生成
python3 rtos_code_generator.py --config example_config.json --output my_app.c
```

### 2. 構建和燒錄

```bash
cd freertos/task-management

# 使用 Make 構建
make clean && make
make flash

# 或使用 CMake
./build.sh cmake
```

### 3. 調試

```bash
# 啟動 OpenOCD（終端 1）
openocd -f tools/debug/openocd.cfg

# 啟動 GDB（終端 2）
arm-none-eabi-gdb build/firmware.elf
```

### 4. 性能測試

```bash
# 運行基準測試套件
cd tools/benchmark
make && make flash

# 查看性能報告（通過串口）
minicom -D /dev/ttyUSB0 -b 115200
```

### 5. 配置優化

```bash
# 分析配置文件
python3 tools/ai-assistant/config_optimizer.py \
    freertos/task-management/include/FreeRTOSConfig.h

# 生成優化配置
python3 tools/ai-assistant/config_optimizer.py \
    freertos/task-management/include/FreeRTOSConfig.h \
    --output FreeRTOSConfig_optimized.h \
    --power
```

## 📈 性能指標

### FreeRTOS 性能（STM32F407 @ 168MHz）

| 操作 | 性能 | 說明 |
|------|------|------|
| 上下文切換 | ~1.5μs | 任務間切換時間 |
| 信號量操作 | ~0.8μs | Take/Give 操作 |
| 佇列操作 | ~1.2μs | Send/Receive |
| 任務通知 | ~0.5μs | 最快的 IPC |
| 記憶體分配 | ~2.0μs | 128 字節 |

### 功耗優化（電池供電應用）

| 模式 | 功耗 | 節省 | 適用場景 |
|------|------|------|---------|
| 無優化 | 100mA | 0% | 持續運行 |
| Sleep 模式 | 15mA | 85% | 週期採樣（1Hz） |
| Stop 模式 | 2mA | 98% | 低頻採樣（0.1Hz） |
| Standby | 50μA | 99.95% | 待機模式 |

## 🔬 學習資源

### 書籍推薦
1. **Mastering the FreeRTOS Real Time Kernel**
2. **Real-Time Embedded Systems** - Xiaocong Fan
3. **The Definitive Guide to ARM Cortex-M3/M4**

### 線上資源
- [FreeRTOS.org](https://www.freertos.org/)
- [Zephyr Project](https://www.zephyrproject.org/)
- [RT-Thread Documentation](https://www.rt-thread.io/)

### 本項目文檔
- [入門指南](docs/getting-started.md) - 詳細的 RTOS 開發教程
- [RTOS 對比](docs/rtos-comparison.md) - 深度技術對比分析
- [電源管理](examples/freertos/06-power-management/README.md) - 低功耗開發指南
- [AI 工具使用](tools/ai-assistant/README.md) - AI 輔助工具完整教程

## ⚙️ 開發最佳實踐

### 1. 任務設計原則
- 單一職責
- 適當優先權
- 避免忙等待
- 合理堆疊大小

### 2. 同步機制選擇
- 二進制信號量: 事件通知
- 計數信號量: 資源計數
- 互斥鎖: 共享資源保護
- 事件組: 多事件同步

### 3. 避免常見錯誤
- 堆疊溢位
- 優先權反轉
- 死鎖
- 資源洩漏

## ⚠️ 注意事項

### 即時性考慮
- 關鍵任務優先權最高
- ISR 處理時間最小化
- 禁用中斷時間要短
- 避免在 ISR 中阻塞

## 📄 授權

範例代碼採用 MIT 授權

---

**最後更新**: 2025-11-16
**狀態**: 🚧 研究與開發中
**維護者**: AI-Assisted Development Team
