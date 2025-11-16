# RT-Thread IoT 閘道器範例

> 使用 RT-Thread RTOS 實作的 IoT 閘道器，支援多種通訊協議

## 📋 專案簡介

本專案展示如何使用 RT-Thread 構建一個功能完整的 IoT 閘道器：
- 多執行緒任務管理
- 設備驅動框架
- 網路協議支援（TCP/IP, MQTT）
- 檔案系統
- Shell 命令列

## 🎯 功能特性

### 1. 核心功能
- 感測器資料採集
- 資料處理與緩存
- 網路傳輸（MQTT）
- 本地儲存（FAT 檔案系統）

### 2. 通訊協議
- WiFi 連接
- MQTT 客戶端
- HTTP 客戶端
- CoAP 支援

### 3. 設備管理
- 感測器驅動
- LED 指示燈
- 按鈕輸入
- UART 通訊

## 🏗️ 專案結構

```
iot-gateway/
├── README.md
├── rtconfig.h              # RT-Thread 配置
├── SConstruct              # SCons 建置腳本
├── applications/
│   ├── main.c              # 主程式
│   ├── sensor_task.c       # 感測器任務
│   ├── mqtt_task.c         # MQTT 任務
│   └── storage_task.c      # 儲存任務
├── board/                  # 板級支援包
│   ├── board.c
│   └── board.h
└── rt-thread/              # RT-Thread 內核
    └── components/
```

## 🚀 快速開始

### 環境準備

```bash
# 安裝 RT-Thread Env 工具
git clone https://github.com/RT-Thread/env.git
cd env
source env.sh

# 或使用 RT-Thread Studio (圖形化 IDE)
# https://www.rt-thread.io/studio.html
```

### 配置專案

```bash
cd system-firmware/rtos/rt-thread/iot-gateway

# 使用 menuconfig 配置
scons --menuconfig

# 編譯
scons -j4

# 燒錄
scons --upload
```

### 支援的開發板

- STM32F4 系列
- STM32F7 系列
- ESP32 系列
- NXP i.MX RT 系列
- 全志 D1 (RISC-V)

## 📖 程式碼說明

### 主程式結構

```c
#include <rtthread.h>
#include <rtdevice.h>
#include <board.h>

/* 執行緒入口 */
void sensor_thread_entry(void *parameter)
{
    while (1)
    {
        /* 讀取感測器 */
        float temperature = read_temperature();
        float humidity = read_humidity();

        rt_kprintf("Temp: %.2f°C, Humidity: %.2f%%\n",
                   temperature, humidity);

        /* 延遲 1 秒 */
        rt_thread_mdelay(1000);
    }
}

/* 創建執行緒 */
int sensor_init(void)
{
    rt_thread_t tid;

    tid = rt_thread_create("sensor",
                           sensor_thread_entry,
                           RT_NULL,
                           2048,
                           RT_THREAD_PRIORITY_MAX / 2,
                           20);

    if (tid != RT_NULL)
        rt_thread_startup(tid);

    return 0;
}
INIT_APP_EXPORT(sensor_init);
```

### MQTT 客戶端

```c
#include <paho_mqtt.h>

static void mqtt_sub_callback(MQTTClient *c, MessageData *msg_data)
{
    rt_kprintf("Received: %.*s\n",
               msg_data->message->payloadlen,
               (char *)msg_data->message->payload);
}

static void mqtt_connect(void)
{
    MQTTClient client;
    Network network;

    NetworkInit(&network);
    NetworkConnect(&network, "broker.emqx.io", 1883);

    MQTTClientInit(&client, &network, 30000,
                   sendbuf, sizeof(sendbuf),
                   readbuf, sizeof(readbuf));

    MQTTPacket_connectData data = MQTTPacket_connectData_initializer;
    data.MQTTVersion = 3;
    data.clientID.cstring = "rtthread_client";

    MQTTConnect(&client, &data);
    MQTTSubscribe(&client, "sensor/data", QOS0, mqtt_sub_callback);
}
```

### 檔案系統操作

```c
#include <dfs_posix.h>

void save_sensor_data(float temp, float hum)
{
    int fd;
    char buffer[128];

    /* 開啟檔案 */
    fd = open("/data/sensor.log", O_WRONLY | O_CREAT | O_APPEND);
    if (fd < 0)
    {
        rt_kprintf("Failed to open file\n");
        return;
    }

    /* 格式化資料 */
    snprintf(buffer, sizeof(buffer),
             "Time: %lu, Temp: %.2f, Hum: %.2f\n",
             rt_tick_get(), temp, hum);

    /* 寫入檔案 */
    write(fd, buffer, strlen(buffer));

    /* 關閉檔案 */
    close(fd);
}
```

### Shell 命令

```c
#include <rtthread.h>

static int sensor_read(int argc, char **argv)
{
    float temp = read_temperature();
    float hum = read_humidity();

    rt_kprintf("Temperature: %.2f°C\n", temp);
    rt_kprintf("Humidity: %.2f%%\n", hum);

    return 0;
}
MSH_CMD_EXPORT(sensor_read, Read sensor data);

static int led_control(int argc, char **argv)
{
    if (argc < 2)
    {
        rt_kprintf("Usage: led_control <on|off>\n");
        return -1;
    }

    if (strcmp(argv[1], "on") == 0)
    {
        rt_pin_write(LED_PIN, PIN_HIGH);
        rt_kprintf("LED ON\n");
    }
    else if (strcmp(argv[1], "off") == 0)
    {
        rt_pin_write(LED_PIN, PIN_LOW);
        rt_kprintf("LED OFF\n");
    }

    return 0;
}
MSH_CMD_EXPORT(led_control, Control LED);
```

## 📚 RT-Thread 核心概念

### 1. 物件導向設計

RT-Thread 採用物件導向設計，所有資源都是物件：

```c
/* 執行緒物件 */
struct rt_thread thread;

/* 信號量物件 */
struct rt_semaphore sem;

/* 互斥鎖物件 */
struct rt_mutex mutex;

/* 訊息佇列物件 */
struct rt_messagequeue mq;
```

### 2. 設備驅動框架

```c
/* 註冊設備 */
rt_device_t device = rt_device_find("uart1");
rt_device_open(device, RT_DEVICE_FLAG_RDWR);

/* 讀取資料 */
char buffer[128];
rt_device_read(device, 0, buffer, sizeof(buffer));

/* 寫入資料 */
rt_device_write(device, 0, "Hello", 5);

/* 關閉設備 */
rt_device_close(device);
```

### 3. 自動初始化機制

```c
/* 板級初始化 */
INIT_BOARD_EXPORT(board_init);

/* 設備初始化 */
INIT_DEVICE_EXPORT(device_init);

/* 組件初始化 */
INIT_COMPONENT_EXPORT(component_init);

/* 環境初始化 */
INIT_ENV_EXPORT(env_init);

/* 應用初始化 */
INIT_APP_EXPORT(app_init);
```

## 🤖 AI 輔助開發提示

```
"RT-Thread 的設備驅動框架如何使用？"
"如何在 RT-Thread 中實現 MQTT 通訊？"
"RT-Thread 的自動初始化機制是什麼？"
"如何使用 RT-Thread Studio 開發專案？"
```

## 📊 RT-Thread 特色

### 優勢
1. **中文文檔完善** - 對中文開發者友善
2. **組件豐富** - 內建大量組件和軟體包
3. **設備框架** - 統一的設備驅動介面
4. **物件導向** - 易於理解和使用
5. **社群活躍** - 有活躍的中文社群

### 內建組件
- **網路協議**: TCP/IP, MQTT, CoAP, HTTP
- **檔案系統**: FAT, LittleFS, RomFS
- **GUI**: LVGL, Persimmon UI
- **安全**: mbedTLS, TinyCrypt
- **OTA**: 支援遠程更新

## ⚠️ 注意事項

### 1. SCons 建置系統
- 需要安裝 Python 和 SCons
- 使用 `scons --menuconfig` 配置
- 編譯命令：`scons -j4`

### 2. 設備驅動
- 使用統一的設備框架
- 支援多種設備類型
- 自動管理設備註冊

### 3. 記憶體管理
- 支援多種記憶體管理算法
- 可配置堆大小
- 支援記憶體池

## 🔧 常用命令

### Shell 命令

```bash
# 查看執行緒
list_thread

# 查看記憶體
list_mem

# 查看設備
list_device

# 查看信號量
list_sem

# 查看互斥鎖
list_mutex

# 系統資訊
version
```

### SCons 命令

```bash
# 配置
scons --menuconfig

# 編譯
scons -j4

# 清理
scons -c

# 產生 IDE 專案
scons --target=mdk5
scons --target=iar
```

## 🔗 相關資源

- [RT-Thread 官網](https://www.rt-thread.io/)
- [RT-Thread 文檔中心](https://www.rt-thread.org/document/site/)
- [RT-Thread 論壇](https://club.rt-thread.org/)
- [RT-Thread GitHub](https://github.com/RT-Thread/rt-thread)
- [軟體包中心](https://packages.rt-thread.org/)

## 📝 版本歷史

- v1.0.0 (2025-11-16) - 初始版本

## 📄 授權

Apache License 2.0
