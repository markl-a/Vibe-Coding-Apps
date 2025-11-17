# RTOS 實用範例集

> 完整的即時作業系統 (RTOS) 範例代碼集合

## 📋 目錄

- [概述](#概述)
- [範例結構](#範例結構)
- [FreeRTOS 範例](#freertos-範例)
- [Zephyr RTOS 範例](#zephyr-rtos-範例)
- [RT-Thread 範例](#rt-thread-範例)
- [編譯和運行](#編譯和運行)
- [學習路徑](#學習路徑)

## 🎯 概述

本目錄包含三個主流 RTOS 的完整實用範例：

| RTOS | 特點 | 適用場景 |
|------|------|----------|
| **FreeRTOS** | 輕量、廣泛使用 | IoT、嵌入式設備、工業控制 |
| **Zephyr** | 現代、模組化 | 物聯網、智能設備、藍牙應用 |
| **RT-Thread** | 豐富組件、中文支援 | 工業自動化、智能硬體 |

每個 RTOS 都包含以下類別的範例：

1. ✅ **任務/執行緒管理** - 創建、控制、優先權管理
2. ✅ **同步機制** - 信號量、互斥鎖、佇列、事件
3. ✅ **中斷處理** - ISR 通訊、延遲處理
4. ✅ **記憶體管理** - 動態分配、記憶體池、監控
5. ✅ **實際專案** - 完整的應用系統範例

## 📁 範例結構

```
examples/
├── README.md                    # 本文件
│
├── freertos/                    # FreeRTOS 範例
│   ├── 01-task-management/     # 任務管理
│   │   └── task_creation.c
│   ├── 02-synchronization/     # 同步機制
│   │   └── queue_example.c
│   ├── 03-interrupts/          # 中斷處理
│   │   └── isr_handling.c
│   ├── 04-memory-management/   # 記憶體管理
│   │   └── memory_example.c
│   └── 05-real-world-projects/ # 實際專案
│       └── data_acquisition_system.c
│
├── zephyr/                      # Zephyr RTOS 範例
│   ├── 01-threads/             # 執行緒管理
│   │   └── thread_management.c
│   ├── 02-synchronization/     # 同步機制
│   │   └── sync_example.c
│   ├── 03-interrupts/          # 中斷處理
│   ├── 04-memory/              # 記憶體管理
│   └── 05-projects/            # 實際專案
│
└── rt-thread/                   # RT-Thread 範例
    ├── 01-threads/             # 執行緒管理
    │   └── thread_example.c
    ├── 02-ipc/                 # 執行緒間通訊
    │   └── ipc_example.c
    ├── 03-interrupts/          # 中斷處理
    ├── 04-memory/              # 記憶體管理
    └── 05-projects/            # 實際專案
```

## 🚀 FreeRTOS 範例

### 01 - 任務管理 (`task_creation.c`)

**展示內容：**
- ✅ 基本任務創建和刪除
- ✅ 任務參數傳遞
- ✅ 任務優先權設置和動態修改
- ✅ 任務掛起和恢復
- ✅ 任務狀態查詢
- ✅ 堆疊使用監控

**關鍵 API：**
```c
xTaskCreate()          // 創建任務
vTaskDelete()          // 刪除任務
vTaskSuspend()         // 掛起任務
vTaskResume()          // 恢復任務
vTaskPrioritySet()     // 設置優先權
eTaskGetState()        // 獲取任務狀態
```

**編譯：**
```bash
# 需要包含 FreeRTOS 源碼
gcc -I<freertos_include> task_creation.c <freertos_src> -o task_demo
```

### 02 - 同步機制 (`queue_example.c`)

**展示內容：**
- ✅ 佇列創建和使用
- ✅ 多生產者-多消費者模式
- ✅ 優先權佇列 (SendToFront)
- ✅ Peek 操作（不移除元素）
- ✅ 佇列狀態監控

**特色功能：**
- 🎯 三個生產者任務（快速、慢速、緊急）
- 🎯 兩個消費者任務（處理、監控）
- 🎯 完整的統計和錯誤處理

**關鍵 API：**
```c
xQueueCreate()         // 創建佇列
xQueueSend()           // 發送到佇列尾
xQueueSendToFront()    // 發送到佇列頭
xQueueReceive()        // 接收
xQueuePeek()           // 查看但不移除
```

### 03 - 中斷處理 (`isr_handling.c`)

**展示內容：**
- ✅ 從 ISR 發送到佇列
- ✅ 從 ISR 釋放信號量
- ✅ 任務通知（最輕量同步）
- ✅ 延遲中斷處理 (Deferred Interrupt)
- ✅ 臨界區保護

**模擬的中斷源：**
- 🔘 按鈕中斷 (EXTI)
- ⏱️ 定時器中斷 (TIM)
- 📡 UART 接收中斷

**關鍵 API：**
```c
xQueueSendFromISR()            // 從 ISR 發送佇列
xSemaphoreGiveFromISR()        // 從 ISR 釋放信號量
vTaskNotifyGiveFromISR()       // 從 ISR 發送任務通知
portYIELD_FROM_ISR()           // ISR 中觸發上下文切換
taskENTER_CRITICAL()           // 進入臨界區
```

### 04 - 記憶體管理 (`memory_example.c`)

**展示內容：**
- ✅ 動態記憶體分配 (pvPortMalloc/vPortFree)
- ✅ 記憶體池實作
- ✅ 堆記憶體監控
- ✅ 記憶體洩漏檢測
- ✅ 堆疊使用監控

**特色功能：**
- 📊 完整的記憶體統計
- 🛡️ 記憶體洩漏演示（教學用）
- 📈 堆疊高水位標記監控

**關鍵 API：**
```c
pvPortMalloc()                 // 分配記憶體
vPortFree()                    // 釋放記憶體
xPortGetFreeHeapSize()         // 獲取剩餘堆大小
xPortGetMinimumEverFreeHeapSize() // 最小剩餘堆
uxTaskGetStackHighWaterMark()  // 堆疊高水位
```

### 05 - 實際專案 (`data_acquisition_system.c`)

**專案描述：** 多通道數據採集系統

**系統功能：**
- 📡 4 通道感測器數據採集（溫度、濕度、壓力、光照）
- 🔄 數據處理和過濾（移動平均）
- 💾 循環緩衝區記錄
- 📤 UART 數據傳輸
- 🚨 警報系統（閾值監控）
- 📊 系統監控

**任務架構：**
```
採集任務 (高優先權) → 處理任務 (中) → 記錄任務 (中)
                                        ↓
                    監控任務 ← 通訊任務 (低)
```

**適用場景：**
- 工業數據採集
- 環境監測
- 智能農業
- 建築自動化

## 🌊 Zephyr RTOS 範例

### 01 - 執行緒管理 (`thread_management.c`)

**展示內容：**
- ✅ 靜態和動態執行緒創建
- ✅ 執行緒參數傳遞
- ✅ 執行緒控制（掛起、恢復、優先權）
- ✅ 工作佇列 (Work Queue)
- ✅ 延遲工作 (Delayed Work)

**Zephyr 特色：**
- 🎯 使用設備樹 (Device Tree) 配置
- 🎯 K_THREAD_STACK_DEFINE 巨集
- 🎯 系統工作佇列

**關鍵 API：**
```c
k_thread_create()      // 創建執行緒
k_thread_suspend()     // 掛起執行緒
k_thread_resume()      // 恢復執行緒
k_thread_priority_set() // 設置優先權
k_work_submit()        // 提交工作
k_work_schedule()      // 調度延遲工作
```

### 02 - 同步機制 (`sync_example.c`)

**展示內容：**
- ✅ 信號量（二進制、計數）
- ✅ 互斥鎖
- ✅ 訊息佇列 (Message Queue)
- ✅ FIFO
- ✅ 生產者-消費者模式

**關鍵 API：**
```c
K_SEM_DEFINE()         // 定義信號量
K_MUTEX_DEFINE()       // 定義互斥鎖
K_MSGQ_DEFINE()        // 定義訊息佇列
K_FIFO_DEFINE()        // 定義 FIFO
k_sem_give/take()      // 信號量操作
k_mutex_lock/unlock()  // 互斥鎖操作
```

## 🧵 RT-Thread 範例

### 01 - 執行緒管理 (`thread_example.c`)

**展示內容：**
- ✅ 靜態執行緒初始化
- ✅ 動態執行緒創建
- ✅ 執行緒控制和監控
- ✅ MSH 命令擴展

**RT-Thread 特色：**
- 🎯 物件導向設計
- 🎯 自動初始化 (INIT_APP_EXPORT)
- 🎯 FinSH/MSH Shell 支援

**關鍵 API：**
```c
rt_thread_init()       // 初始化靜態執行緒
rt_thread_create()     // 創建動態執行緒
rt_thread_startup()    // 啟動執行緒
rt_thread_suspend()    // 掛起執行緒
rt_thread_resume()     // 恢復執行緒
```

### 02 - IPC 通訊 (`ipc_example.c`)

**展示內容：**
- ✅ 信號量（二進制、計數）
- ✅ 互斥鎖
- ✅ 事件集 (Event)
- ✅ 郵箱 (Mailbox)
- ✅ 訊息佇列 (Message Queue)

**完整的 IPC 機制演示**

**關鍵 API：**
```c
rt_sem_create()        // 創建信號量
rt_mutex_create()      // 創建互斥鎖
rt_event_create()      // 創建事件
rt_mb_create()         // 創建郵箱
rt_mq_create()         // 創建訊息佇列
```

## 🛠️ 編譯和運行

### FreeRTOS

#### 1. 準備環境

```bash
# 下載 FreeRTOS
git clone https://github.com/FreeRTOS/FreeRTOS.git

# 設置環境變數
export FREERTOS_PATH=/path/to/FreeRTOS
```

#### 2. 編譯範例

```bash
cd examples/freertos/01-task-management

# 根據你的平台選擇編譯方式
# 方法 1: 使用 GCC (需要移植層)
gcc -I$FREERTOS_PATH/FreeRTOS/Source/include \
    -I$FREERTOS_PATH/FreeRTOS/Source/portable/GCC/ARM_CM4F \
    -I. \
    task_creation.c \
    $FREERTOS_PATH/FreeRTOS/Source/*.c \
    -o task_demo

# 方法 2: 使用 CMake
mkdir build && cd build
cmake ..
make
```

#### 3. 配置文件

創建 `FreeRTOSConfig.h`:

```c
#define configUSE_PREEMPTION              1
#define configUSE_IDLE_HOOK               1
#define configUSE_TICK_HOOK               1
#define configCPU_CLOCK_HZ                168000000
#define configTICK_RATE_HZ                1000
#define configMAX_PRIORITIES              5
#define configMINIMAL_STACK_SIZE          128
#define configTOTAL_HEAP_SIZE             20480
#define configMAX_TASK_NAME_LEN           16
#define configUSE_TRACE_FACILITY          1
#define configUSE_16_BIT_TICKS            0
#define configIDLE_SHOULD_YIELD           1
#define configUSE_MUTEXES                 1
#define configQUEUE_REGISTRY_SIZE         8
#define configCHECK_FOR_STACK_OVERFLOW    2
#define configUSE_MALLOC_FAILED_HOOK      1
#define configGENERATE_RUN_TIME_STATS     1
```

### Zephyr

#### 1. 安裝 Zephyr SDK

```bash
# 安裝 west
pip install west

# 初始化工作區
west init ~/zephyrproject
cd ~/zephyrproject
west update

# 安裝依賴
pip install -r zephyr/scripts/requirements.txt
```

#### 2. 編譯範例

```bash
cd examples/zephyr/01-threads

# 創建 CMakeLists.txt
cat > CMakeLists.txt << 'EOF'
cmake_minimum_required(VERSION 3.20.0)
find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(thread_management)

target_sources(app PRIVATE thread_management.c)
EOF

# 創建 prj.conf
cat > prj.conf << 'EOF'
CONFIG_PRINTK=y
CONFIG_CONSOLE=y
CONFIG_SERIAL=y
EOF

# 編譯（以 qemu_cortex_m3 為例）
west build -b qemu_cortex_m3

# 運行
west build -t run
```

### RT-Thread

#### 1. 準備環境

```bash
# 下載 RT-Thread
git clone https://github.com/RT-Thread/rt-thread.git

# 安裝 env 工具
# Windows: 下載 env 工具
# Linux: 使用 scons
pip install scons
```

#### 2. 編譯範例

```bash
cd rt-thread/bsp/qemu-vexpress-a9

# 複製範例到 applications 目錄
cp /path/to/examples/rt-thread/01-threads/thread_example.c applications/

# 配置
scons --menuconfig

# 編譯
scons

# 運行
./qemu.sh
```

## 📚 學習路徑

### 初學者路線

1. **第一週：基礎概念**
   - ✅ FreeRTOS: `01-task-management/task_creation.c`
   - ✅ 理解任務創建、優先權、調度

2. **第二週：同步機制**
   - ✅ FreeRTOS: `02-synchronization/queue_example.c`
   - ✅ 學習佇列、信號量、互斥鎖

3. **第三週：中斷處理**
   - ✅ FreeRTOS: `03-interrupts/isr_handling.c`
   - ✅ 理解 ISR 和任務的交互

4. **第四週：記憶體管理**
   - ✅ FreeRTOS: `04-memory-management/memory_example.c`
   - ✅ 學習動態分配、記憶體池

### 進階路線

1. **實際專案實作**
   - ✅ FreeRTOS: `05-real-world-projects/data_acquisition_system.c`
   - ✅ 完整系統架構

2. **跨平台學習**
   - ✅ 比較 FreeRTOS、Zephyr、RT-Thread 的差異
   - ✅ 理解各自的設計哲學

3. **性能優化**
   - 📊 堆疊大小優化
   - ⚡ 任務優先權調整
   - 🔧 中斷處理優化

## 💡 最佳實踐

### 任務設計原則

1. **單一職責**
   ```c
   // ✅ 好的設計
   void sensor_read_task() { /* 只讀取感測器 */ }
   void data_process_task() { /* 只處理數據 */ }

   // ❌ 不好的設計
   void mega_task() { /* 做所有事情 */ }
   ```

2. **適當的優先權**
   ```c
   // 高優先權：硬即時、關鍵任務
   #define ISR_HANDLER_PRIORITY    3

   // 中優先權：軟即時、數據處理
   #define DATA_PROCESS_PRIORITY   5

   // 低優先權：監控、日誌
   #define MONITOR_PRIORITY        10
   ```

3. **避免忙等待**
   ```c
   // ✅ 使用阻塞等待
   xQueueReceive(queue, &data, portMAX_DELAY);

   // ❌ 忙等待浪費 CPU
   while (!data_ready) { /* 空轉 */ }
   ```

### 同步機制選擇

| 需求 | 使用 |
|------|------|
| 事件通知 | 二進制信號量 |
| 資源計數 | 計數信號量 |
| 共享資源保護 | 互斥鎖 |
| 數據傳遞 | 佇列 |
| 多事件同步 | 事件組 |

### 調試技巧

1. **啟用堆疊檢查**
   ```c
   #define configCHECK_FOR_STACK_OVERFLOW  2
   ```

2. **使用運行時統計**
   ```c
   #define configGENERATE_RUN_TIME_STATS   1
   vTaskGetRunTimeStats(buffer);
   ```

3. **監控堆記憶體**
   ```c
   size_t free = xPortGetFreeHeapSize();
   size_t min = xPortGetMinimumEverFreeHeapSize();
   ```

## 🔗 參考資源

### 官方文檔

- [FreeRTOS 官方網站](https://www.freertos.org/)
- [Zephyr Project](https://www.zephyrproject.org/)
- [RT-Thread 文檔](https://www.rt-thread.io/document/site/)

### 推薦書籍

1. **Mastering the FreeRTOS Real Time Kernel**
2. **The Definitive Guide to ARM Cortex-M**
3. **Real-Time Concepts for Embedded Systems**

### 線上課程

- FreeRTOS 官方教程
- Zephyr Getting Started
- RT-Thread 編程指南

## ❓ 常見問題

### Q: 選擇哪個 RTOS？

**A:** 根據需求：
- **FreeRTOS**: 需要廣泛硬體支援和成熟生態
- **Zephyr**: 現代 IoT 專案，需要藍牙/網路堆疊
- **RT-Thread**: 中文支援好，組件豐富

### Q: 如何移植到自己的硬體？

**A:**
1. 查找對應的 BSP (Board Support Package)
2. 修改啟動文件和鏈接腳本
3. 實作平台相關的移植層
4. 測試基本範例

### Q: 任務優先權如何設置？

**A:**
- 數字越小優先權越高（FreeRTOS、RT-Thread）
- 數字越小優先權越低（Zephyr）
- 按響應時間要求分配

## 📄 授權

所有範例代碼採用 MIT 授權，可自由用於商業和非商業專案。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

**最後更新**: 2025-11-17
**維護者**: AI-Assisted Development Team
