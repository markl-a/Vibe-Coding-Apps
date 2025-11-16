# FreeRTOS 同步機制範例

> 完整的 FreeRTOS 同步機制實作，包括信號量、互斥鎖、事件組等

## 📋 專案簡介

本專案展示 FreeRTOS 的各種同步機制：
- 二進制信號量（Binary Semaphore）
- 計數信號量（Counting Semaphore）
- 互斥鎖（Mutex）
- 遞迴互斥鎖（Recursive Mutex）
- 事件組（Event Groups）

## 🎯 功能特性

### 1. 信號量應用
- ISR 與任務同步
- 資源計數管理
- 生產者-消費者模式

### 2. 互斥鎖應用
- 臨界區保護
- 優先權繼承
- 死鎖避免

### 3. 事件組應用
- 多事件同步
- 事件標誌管理
- 複雜同步場景

## 🏗️ 專案結構

```
synchronization/
├── README.md
├── src/
│   ├── main.c              # 主程式
│   ├── semaphore_demo.c    # 信號量示範
│   ├── mutex_demo.c        # 互斥鎖示範
│   └── event_group_demo.c  # 事件組示範
└── include/
    ├── sync_config.h
    └── sync_demos.h
```

## 🚀 快速開始

### 編譯步驟

```bash
cd system-firmware/rtos/freertos/synchronization
make clean && make all
make flash
```

## 📖 核心概念

### 1. 二進制信號量

用於任務與 ISR 之間的同步：

```c
// 創建二進制信號量
SemaphoreHandle_t binary_sem = xSemaphoreCreateBinary();

// ISR 中釋放
void EXTI_IRQHandler(void) {
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    xSemaphoreGiveFromISR(binary_sem, &xHigherPriorityTaskWoken);
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}

// 任務中等待
xSemaphoreTake(binary_sem, portMAX_DELAY);
```

### 2. 計數信號量

用於資源計數管理：

```c
// 創建計數信號量（最大計數 10）
SemaphoreHandle_t counting_sem = xSemaphoreCreateCounting(10, 0);

// 生產者：增加計數
xSemaphoreGive(counting_sem);

// 消費者：減少計數
xSemaphoreTake(counting_sem, portMAX_DELAY);
```

### 3. 互斥鎖

用於保護共享資源：

```c
// 創建互斥鎖
SemaphoreHandle_t mutex = xSemaphoreCreateMutex();

// 獲取互斥鎖
if (xSemaphoreTake(mutex, portMAX_DELAY) == pdTRUE) {
    // 臨界區
    shared_resource++;

    // 釋放互斥鎖
    xSemaphoreGive(mutex);
}
```

### 4. 事件組

用於多事件同步：

```c
// 創建事件組
EventGroupHandle_t event_group = xEventGroupCreate();

// 設定事件位
xEventGroupSetBits(event_group, BIT_0 | BIT_1);

// 等待事件位
EventBits_t bits = xEventGroupWaitBits(
    event_group,
    BIT_0 | BIT_1,  // 等待的位
    pdTRUE,         // 清除位
    pdTRUE,         // 等待所有位
    portMAX_DELAY
);
```

## 📚 應用場景

### 場景 1: 按鈕中斷處理

```c
// 使用二進制信號量同步 ISR 和任務
SemaphoreHandle_t button_sem;

void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin) {
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    xSemaphoreGiveFromISR(button_sem, &xHigherPriorityTaskWoken);
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}

void button_task(void *pvParameters) {
    while (1) {
        if (xSemaphoreTake(button_sem, portMAX_DELAY)) {
            printf("Button pressed!\n");
            // 處理按鈕事件
        }
    }
}
```

### 場景 2: 資源池管理

```c
// 使用計數信號量管理資源池
#define RESOURCE_COUNT 5
SemaphoreHandle_t resource_sem;

void init_resources(void) {
    resource_sem = xSemaphoreCreateCounting(RESOURCE_COUNT, RESOURCE_COUNT);
}

void use_resource(void) {
    if (xSemaphoreTake(resource_sem, pdMS_TO_TICKS(1000))) {
        // 使用資源
        do_work();
        // 釋放資源
        xSemaphoreGive(resource_sem);
    }
}
```

### 場景 3: 共享數據保護

```c
// 使用互斥鎖保護共享數據結構
typedef struct {
    int value;
    char name[32];
} SharedData_t;

SharedData_t shared_data;
SemaphoreHandle_t data_mutex;

void update_shared_data(int new_value, const char *new_name) {
    if (xSemaphoreTake(data_mutex, portMAX_DELAY)) {
        shared_data.value = new_value;
        strncpy(shared_data.name, new_name, sizeof(shared_data.name));
        xSemaphoreGive(data_mutex);
    }
}
```

### 場景 4: 多條件等待

```c
// 使用事件組等待多個條件
#define EVENT_DATA_READY    (1 << 0)
#define EVENT_WIFI_CONNECTED (1 << 1)
#define EVENT_SENSOR_OK     (1 << 2)

EventGroupHandle_t system_events;

void wait_for_system_ready(void) {
    const EventBits_t required_bits =
        EVENT_DATA_READY | EVENT_WIFI_CONNECTED | EVENT_SENSOR_OK;

    EventBits_t bits = xEventGroupWaitBits(
        system_events,
        required_bits,
        pdFALSE,    // 不清除位
        pdTRUE,     // 等待所有位
        portMAX_DELAY
    );

    printf("System ready!\n");
}
```

## 🤖 AI 輔助開發提示

```
"FreeRTOS 中信號量和互斥鎖有什麼區別？"
"如何避免死鎖問題？"
"優先權繼承是如何工作的？"
"事件組適合哪些應用場景？"
```

## ⚠️ 注意事項

### 1. 互斥鎖 vs 二進制信號量
- 互斥鎖有優先權繼承，信號量沒有
- 互斥鎖必須由同一任務獲取和釋放
- 信號量可以用於任務間計數

### 2. 死鎖預防
- 始終以相同順序獲取多個鎖
- 使用超時避免永久阻塞
- 盡量減少持鎖時間

### 3. ISR 安全
- 在 ISR 中使用 FromISR 版本的 API
- 注意檢查 xHigherPriorityTaskWoken
- ISR 中不能使用會阻塞的 API

## 📊 性能考慮

### 信號量操作時間
- Give/Take: < 1 μs
- ISR 版本: < 500 ns
- 上下文切換: < 10 μs

### 記憶體佔用
- 二進制信號量: 72 bytes
- 互斥鎖: 88 bytes
- 事件組: 48 bytes

## 🔗 相關資源

- [FreeRTOS Semaphore Guide](https://www.freertos.org/a00113.html)
- [Mutex vs Binary Semaphore](https://www.freertos.org/Real-time-embedded-RTOS-mutexes.html)
- [Event Groups](https://www.freertos.org/FreeRTOS-event-groups.html)

## 📝 版本歷史

- v1.0.0 (2025-11-16) - 初始版本

## 📄 授權

MIT License
