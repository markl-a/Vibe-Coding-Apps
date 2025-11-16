# RTOS 開發入門指南

> 從零開始學習即時作業系統開發

## 📚 目錄

1. [什麼是 RTOS](#什麼是-rtos)
2. [RTOS 選擇指南](#rtos-選擇指南)
3. [開發環境設置](#開發環境設置)
4. [第一個 RTOS 專案](#第一個-rtos-專案)
5. [常見問題](#常見問題)

## 什麼是 RTOS

### 定義

**即時作業系統（Real-Time Operating System, RTOS）** 是一種能夠在確定時間內響應外部事件的作業系統。

### RTOS vs 通用 OS

| 特性 | RTOS | 通用 OS（如 Linux/Windows） |
|------|------|---------------------------|
| **響應時間** | 確定性，微秒級 | 非確定性，毫秒級 |
| **記憶體佔用** | 幾 KB 到幾百 KB | 幾百 MB 到幾 GB |
| **排程算法** | 優先權搶佔式 | 時間片輪轉 + 優先權 |
| **應用場景** | 嵌入式、工控、醫療 | 桌面、伺服器 |
| **開發複雜度** | 較低 | 較高 |

### RTOS 核心概念

#### 1. 任務（Task/Thread）

任務是 RTOS 中的執行單位，類似於程序或執行緒。

```c
// FreeRTOS 範例
void led_task(void *pvParameters)
{
    while (1) {
        toggle_led();
        vTaskDelay(pdMS_TO_TICKS(500));  // 延遲 500ms
    }
}

xTaskCreate(led_task, "LED", 128, NULL, 1, NULL);
```

#### 2. 排程（Scheduling）

RTOS 排程器決定哪個任務應該執行。

- **搶佔式排程**：高優先權任務可以打斷低優先權任務
- **協作式排程**：任務主動讓出 CPU
- **時間片輪轉**：相同優先權任務輪流執行

#### 3. 同步與通訊

任務間需要同步和通訊機制：

- **信號量（Semaphore）**：用於同步和資源計數
- **互斥鎖（Mutex）**：保護共享資源
- **佇列（Queue）**：任務間傳遞資料
- **事件組（Event Group）**：多事件同步

```c
// 信號量範例
SemaphoreHandle_t xSemaphore = xSemaphoreCreateBinary();

// 任務 A：等待事件
xSemaphoreTake(xSemaphore, portMAX_DELAY);

// 任務 B 或 ISR：觸發事件
xSemaphoreGive(xSemaphore);
```

## RTOS 選擇指南

### FreeRTOS

**適合場景：**
- 初學者入門
- 資源受限的嵌入式系統
- 需要商業支援（AWS）

**優勢：**
- ✅ 最流行，資源豐富
- ✅ 小記憶體佔用（< 10KB）
- ✅ 簡單易學
- ✅ MIT 授權

**劣勢：**
- ❌ 功能相對基礎
- ❌ 需要自行整合協議棧

### Zephyr RTOS

**適合場景：**
- IoT 設備開發
- 需要豐富協議支援
- 多平台移植

**優勢：**
- ✅ 內建豐富驅動和協議
- ✅ Devicetree 配置靈活
- ✅ 現代化工具鏈（West）
- ✅ Linux Foundation 支援

**劣勢：**
- ❌ 學習曲線陡峭
- ❌ 記憶體佔用較大

### RT-Thread

**適合場景：**
- 中文環境開發
- 需要快速原型開發
- IoT 雲端整合

**優勢：**
- ✅ 中文文檔完善
- ✅ 組件豐富
- ✅ 圖形化 IDE（RT-Thread Studio）
- ✅ 活躍的中文社群

**劣勢：**
- ❌ 國際化程度相對較低
- ❌ 部分組件品質參差不齊

### VxWorks / QNX

**適合場景：**
- 工業級應用
- 安全關鍵系統
- 航空航天、國防

**優勢：**
- ✅ 硬即時性能
- ✅ 高可靠性
- ✅ 安全認證

**劣勢：**
- ❌ 商業授權，價格昂貴
- ❌ 學習資源較少

## 開發環境設置

### FreeRTOS 環境

#### 1. STM32 平台

```bash
# 下載 STM32CubeIDE
https://www.st.com/en/development-tools/stm32cubeide.html

# 創建專案時選擇 FreeRTOS 中介軟體
# 或手動下載 FreeRTOS
git clone https://github.com/FreeRTOS/FreeRTOS.git
```

#### 2. ESP32 平台

```bash
# 安裝 ESP-IDF
git clone --recursive https://github.com/espressif/esp-idf.git
cd esp-idf
./install.sh

# ESP-IDF 內建 FreeRTOS
```

### Zephyr 環境

```bash
# 安裝依賴
sudo apt install --no-install-recommends git cmake ninja-build gperf \
  ccache dfu-util device-tree-compiler wget \
  python3-dev python3-pip python3-setuptools python3-tk python3-wheel xz-utils file \
  make gcc gcc-multilib g++-multilib libsdl2-dev libmagic1

# 安裝 west
pip3 install west

# 初始化 Zephyr
west init ~/zephyrproject
cd ~/zephyrproject
west update

# 安裝 Python 依賴
pip3 install -r zephyr/scripts/requirements.txt

# 安裝 Zephyr SDK
wget https://github.com/zephyrproject-rtos/sdk-ng/releases/download/v0.16.5/zephyr-sdk-0.16.5_linux-x86_64.tar.xz
tar xvf zephyr-sdk-0.16.5_linux-x86_64.tar.xz
cd zephyr-sdk-0.16.5
./setup.sh
```

### RT-Thread 環境

```bash
# 方法 1: 使用 RT-Thread Studio（推薦）
# 下載：https://www.rt-thread.io/studio.html

# 方法 2: 使用 Env 工具
git clone https://github.com/RT-Thread/env.git
cd env
source env.sh

# 或使用 pip 安裝
pip install scons
```

## 第一個 RTOS 專案

### FreeRTOS Blinky

```c
#include "FreeRTOS.h"
#include "task.h"

void led_task(void *pvParameters)
{
    while (1) {
        HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}

int main(void)
{
    HAL_Init();
    SystemClock_Config();

    xTaskCreate(led_task, "LED", 128, NULL, 1, NULL);
    vTaskStartScheduler();

    while (1);  // 不應到達
}
```

### Zephyr Blinky

```c
#include <zephyr/kernel.h>
#include <zephyr/drivers/gpio.h>

#define LED0_NODE DT_ALIAS(led0)
static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(LED0_NODE, gpios);

int main(void)
{
    gpio_pin_configure_dt(&led, GPIO_OUTPUT_ACTIVE);

    while (1) {
        gpio_pin_toggle_dt(&led);
        k_sleep(K_MSEC(500));
    }
}
```

### RT-Thread Blinky

```c
#include <rtthread.h>
#include <rtdevice.h>

#define LED_PIN GET_PIN(A, 5)

void led_thread_entry(void *parameter)
{
    rt_pin_mode(LED_PIN, PIN_MODE_OUTPUT);

    while (1) {
        rt_pin_write(LED_PIN, PIN_HIGH);
        rt_thread_mdelay(500);
        rt_pin_write(LED_PIN, PIN_LOW);
        rt_thread_mdelay(500);
    }
}

int main(void)
{
    rt_thread_t tid = rt_thread_create("led",
                                       led_thread_entry,
                                       RT_NULL,
                                       1024,
                                       10,
                                       20);
    if (tid != RT_NULL)
        rt_thread_startup(tid);

    return 0;
}
```

## 常見問題

### Q1: 如何選擇合適的 RTOS？

**考慮因素：**
1. **硬體資源**：記憶體、Flash 大小
2. **專案需求**：協議支援、功能需求
3. **團隊經驗**：學習成本
4. **社群支援**：文檔、範例
5. **授權方式**：開源或商業

**建議：**
- 初學者：FreeRTOS
- IoT 專案：Zephyr 或 RT-Thread
- 工業級：VxWorks 或 QNX

### Q2: 堆疊大小如何計算？

**計算方法：**

```c
堆疊大小 = 局部變數 + 函數調用深度 × 棧幀大小 + 中斷嵌套 + 餘量

推薦餘量：20-30%
```

**除錯工具：**
- FreeRTOS: `uxTaskGetStackHighWaterMark()`
- Zephyr: `k_thread_stack_space_get()`
- RT-Thread: `list_thread` 命令

### Q3: 如何避免優先權反轉？

**解決方案：**

1. **使用互斥鎖**（支援優先權繼承）
```c
SemaphoreHandle_t mutex = xSemaphoreCreateMutex();
```

2. **避免長時間持鎖**
```c
// 錯誤
xSemaphoreTake(mutex, portMAX_DELAY);
long_running_task();  // ❌
xSemaphoreGive(mutex);

// 正確
xSemaphoreTake(mutex, portMAX_DELAY);
critical_section();   // ✅ 短時間操作
xSemaphoreGive(mutex);
```

3. **優先權設計合理**

### Q4: 如何除錯 RTOS 應用？

**工具：**

1. **SEGGER SystemView**（FreeRTOS）
2. **Tracealyzer**（商業工具）
3. **內建 Shell**（RT-Thread）
4. **GDB + OpenOCD**

**技巧：**
```c
// 1. 啟用堆疊檢查
configCHECK_FOR_STACK_OVERFLOW 2

// 2. 啟用統計
configGENERATE_RUN_TIME_STATS 1

// 3. 打印任務列表
vTaskList(buffer);
```

### Q5: 中斷中可以做什麼？

**規則：**

✅ **可以：**
- 釋放信號量（FromISR 版本）
- 發送到佇列（FromISR 版本）
- 設定事件位

❌ **不可以：**
- 阻塞等待
- 動態記憶體分配
- 長時間運算

```c
// 正確的 ISR 寫法
void EXTI_IRQHandler(void)
{
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;

    xSemaphoreGiveFromISR(sem, &xHigherPriorityTaskWoken);

    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}
```

## 學習路線圖

### 第 1 階段：基礎（1-2 週）
- [ ] 理解 RTOS 基本概念
- [ ] 完成 Blinky 範例
- [ ] 學習任務創建與管理

### 第 2 階段：同步（2-3 週）
- [ ] 信號量使用
- [ ] 互斥鎖應用
- [ ] 佇列通訊
- [ ] 事件組

### 第 3 階段：進階（3-4 週）
- [ ] 軟體定時器
- [ ] 記憶體管理
- [ ] 中斷處理
- [ ] 功耗管理

### 第 4 階段：實戰（持續）
- [ ] 完整專案開發
- [ ] 性能優化
- [ ] 除錯技巧
- [ ] 最佳實踐

## 參考資源

### 書籍
- **Mastering the FreeRTOS Real Time Kernel** - Richard Barry
- **The Definitive Guide to ARM Cortex-M** - Joseph Yiu
- **Real-Time Embedded Systems** - Xiaocong Fan

### 線上課程
- [FreeRTOS 官方教學](https://www.freertos.org/Documentation/RTOS_book.html)
- [Zephyr Getting Started](https://docs.zephyrproject.org/latest/develop/getting_started/index.html)
- [RT-Thread 入門](https://www.rt-thread.org/document/site/)

### 社群
- [FreeRTOS Forums](https://forums.freertos.org/)
- [Zephyr Discord](https://chat.zephyrproject.org/)
- [RT-Thread 論壇](https://club.rt-thread.org/)

---

**最後更新**: 2025-11-16
**版本**: 1.0.0
