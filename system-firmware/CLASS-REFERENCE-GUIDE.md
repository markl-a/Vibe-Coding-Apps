# System Firmware 項目 - 類別和功能參考指南

## 目錄
1. [Java 類別詳細清單](#java-類別詳細清單)
2. [C 程式模組清單](#c-程式模組清單)
3. [每個子專案的關鍵類別](#每個子專案的關鍵類別)
4. [使用例子建議](#使用例子建議)
5. [API 參考](#api-參考)

---

## Java 類別詳細清單

### 1. CustomService.java

**位置**: `/home/user/Vibe-Coding-Apps/system-firmware/android-framework/custom-system-service/service/`

**類別簽名**:
```java
public class CustomService extends ICustomService.Stub
```

**主要功能**:
- **服務生命週期管理**: systemReady() 回調
- **資料存儲**: HashMap 基礎的鍵值對存儲
- **權限檢查**: enforcePermission() 強制權限驗證
- **回調管理**: RemoteCallbackList 處理客戶端回調
- **系統屬性監聽**: 監控 persist.custom.property 變化
- **廣播事件**: 系統事件偵測

**核心方法**:
```java
// 資料操作
String getData(String key)
void setData(String key, String value)
CustomData getCustomData(int id)

// 狀態查詢
int getServiceStatus()
boolean isReady()

// 回調管理
void registerCallback(ICustomServiceCallback callback)
void unregisterCallback(ICustomServiceCallback callback)

// 控制命令
void performAction(String action, Bundle params)
void resetService()

// 內部方法
void systemReady()
void enforcePermission()
void updateStatus(int status)
void notifyStatusChanged(int status)
void notifyDataUpdated(String key, String value)
void watchSystemProperties()
void registerBroadcastReceivers()
void handlePropertyChange(String value)
void handleUpdate(Bundle params)
```

**使用建議**:
添加以下實際使用例子:
- 設備電源狀態管理
- 系統配置參數查詢
- 硬體資訊統計
- 錯誤日誌收集

---

### 2. CustomServiceClient.java

**位置**: `/home/user/Vibe-Coding-Apps/system-firmware/android-framework/custom-system-service/client/`

**類別簽名**:
```java
public class CustomServiceClient
```

**主要功能**:
- **服務綁定**: 通過 ServiceManager 獲取 Binder
- **遠端調用代理**: 封裝所有遠端調用
- **異常處理**: 捕獲 RemoteException

**核心方法**:
```java
public CustomServiceClient(Context context)  // 初始化
void bindService()                           // 綁定服務
String getData(String key)                   // 遠端獲取資料
void setData(String key, String value)       // 遠端設置資料
void registerCallback(ICustomServiceCallback callback)
void performAction(String action, Bundle params)
```

**使用建議**:
- 添加自動重連機制
- 實現超時管理
- 添加 UI 回調更新
- 實現批次操作優化

---

### 3. CustomServiceExample.java

**位置**: `/home/user/Vibe-Coding-Apps/system-firmware/android-framework/custom-system-service/client/`

**主要功能**:
- 展示 CustomServiceClient 的基本用法
- 演示異步回調處理

**建議增強**:
- 添加多個實際業務場景的示例
- 展示錯誤恢復流程
- 演示性能測試代碼

---

### 4. CustomData.java (AIDL)

**位置**: `/home/user/Vibe-Coding-Apps/system-firmware/android-framework/custom-system-service/aidl/`

**主要功能**:
- AIDL 可序列化資料容器
- 跨進程資料傳輸

---

## C 程式模組清單

### Bootloader 模組

#### 1. firmware_verify.c

**位置**: `bootloaders/mcu-bootloader/backend/common/crypto/`

**大小**: 4.4K

**主要功能**:
- RSA-2048 簽名驗證
- SHA-256 雜湊計算
- 數位簽名驗證流程

**關鍵函數**:
```c
bool verify_image_signature(uint32_t image_addr)
void calculate_sha256(uint8_t *buf, uint32_t len, uint8_t *hash)
bool rsa_verify(uint8_t *data, uint32_t len, uint8_t *signature)
```

**使用建議**: 
- 添加 ECC 簽名支援
- 實現金鑰證書管理
- 添加版本驗證機制

---

#### 2. custom-board.c

**位置**: `bootloaders/u-boot-development/backend/board-configs/custom-board/`

**大小**: 3.1K

**主要功能**:
- ARM 板級初始化
- 時鐘配置 (PLL、分頻器)
- 記憶體初始化
- GPIO 配置

**關鍵函數**:
```c
void board_init(void)
void setup_clock(void)
void setup_memory(void)
void setup_gpio(void)
```

---

#### 3. cmd_factory_reset.c

**位置**: `bootloaders/u-boot-development/backend/custom-commands/`

**大小**: 2.8K

**主要功能**:
- 工廠重置命令實作
- 清除用戶資料
- 恢復出廠設置

---

#### 4. cmd_system_info.c

**位置**: `bootloaders/u-boot-development/backend/custom-commands/`

**大小**: 5.2K

**主要功能**:
- 查詢系統資訊
- 顯示硬體配置
- 版本資訊輸出

---

### HAL/BSP 模組

#### 5. gpio_hal.h & gpio_hal_stm32.c

**位置**: `hal-bsp/gpio-hal/`

**功能**:
- 統一 GPIO 硬體抽象介面
- STM32 平台實作

**API 列表**:
```c
typedef enum {
    GPIO_MODE_INPUT,
    GPIO_MODE_OUTPUT_PP,    // Push-Pull
    GPIO_MODE_OUTPUT_OD,    // Open-Drain
    GPIO_MODE_AF,           // Alternate Function
    GPIO_MODE_ANALOG
} gpio_mode_t;

typedef enum {
    GPIO_PULL_NONE,
    GPIO_PULL_UP,
    GPIO_PULL_DOWN
} gpio_pull_t;

// 核心函數
gpio_handle_t gpio_init(gpio_port_t port, gpio_pin_t pin, 
                        gpio_mode_t mode, gpio_pull_t pull);
void gpio_set(gpio_handle_t handle);
void gpio_clear(gpio_handle_t handle);
bool gpio_read(gpio_handle_t handle);
void gpio_attach_interrupt(gpio_handle_t handle, 
                          gpio_callback_t callback);
```

**使用建議**:
- 添加多個外設應用 (LED、按鈕、傳感器)
- 實現中斷驅動的狀態機
- 添加電源管理支援

---

#### 6. led_blink.c

**位置**: `hal-bsp/gpio-hal/examples/`

**功能**:
- GPIO HAL 的基本使用範例
- LED 閃爍演示

**建議增強**:
- 添加動態頻率控制
- 實現脈衝寬度調制 (PWM)
- 添加多 LED 協調控制

---

### Embedded Systems 模組

#### 7. freertos_tasks.c

**位置**: `embedded-systems/stm32/freertos/`

**大小**: 4.2K

**主要功能**:
- FreeRTOS 多任務創建
- 任務優先權管理
- 任務同步機制

**關鍵函數**:
```c
void task_create_example(void)
void high_priority_task(void *pvParameters)
void low_priority_task(void *pvParameters)
void task_synchronization_example(void)
```

**使用建議**:
- 添加實際工業應用 (馬達控制、溫度監測)
- 實現任務間通訊
- 添加性能監測

---

#### 8. gpio_blink.c

**位置**: `embedded-systems/stm32/hal-examples/`

**功能**: GPIO 和延時的基本應用

---

### Linux Kernel Drivers

#### 9. simple_ramdisk.c

**位置**: `linux-kernel-drivers/block-device/`

**功能**:
- 虛擬塊設備實作
- 請求隊列管理
- 扇區讀寫操作

---

#### 10. simple_chardev.c

**位置**: `linux-kernel-drivers/char-device/`

**功能**:
- 字元設備驅動框架
- file_operations 實作
- ioctl 命令處理

---

#### 11. interrupt_example.c

**位置**: `linux-kernel-drivers/interrupt-handler/`

**功能**:
- Linux 中斷處理
- 中斷註冊和解註冊
- 中斷上下文管理

---

#### 12. virtual_netdev.c

**位置**: `linux-kernel-drivers/network-driver/`

**功能**:
- 虛擬網路設備驅動
- 數據包發送/接收
- NAPI 輪詢機制

---

#### 13. platform_led_driver.c

**位置**: `linux-kernel-drivers/platform-driver/`

**功能**:
- 平台驅動框架
- LED 設備綁定
- probe/remove 回調

---

### RTOS 模組

#### 14. task-management/main.c

**位置**: `rtos/freertos/task-management/src/`

**大小**: 4.2K

**關鍵函數**:
```c
void vTask1(void *pvParameters)
void vTask2(void *pvParameters)
void main(void)
```

**內容**:
- 任務創建和調度
- 優先權配置
- 上下文切換演示

---

#### 15. synchronization/main.c

**位置**: `rtos/freertos/synchronization/src/`

**大小**: 3.1K

**內容**:
- 信號量使用
- 互斥鎖實作
- 事件組管理

---

## 每個子專案的關鍵類別

### 1. Android Framework

| 類別 | 功能 | 文件大小 |
|------|------|--------|
| CustomService | 服務實作 | ~340 行 |
| CustomServiceClient | 客戶端代理 | ~100 行 |
| CustomServiceExample | 使用範例 | ~50 行 |
| CustomData | 資料容器 | ~30 行 |

**推薦使用例子**:
- 裝置狀態管理服務
- 系統日誌收集服務
- 硬體監測服務

---

### 2. Bootloader

| 模組 | 功能 | 語言 |
|------|------|------|
| firmware_verify.c | 簽名驗證 | C |
| custom-board.c/dts | 板級配置 | C/DTS |
| cmd_*.c | 自定義命令 | C |

**推薦使用例子**:
- 多個 MCU 平台支援
- 不同啟動模式選擇
- 引導菜單實作

---

### 3. Device Drivers

**推薦使用例子**:
- GPIO: 按鈕輸入、LED 輸出
- I2C: 溫度傳感器、加速度計
- USB: 虛擬串口、海量儲存
- Network: 虛擬橋接、VLAN

---

### 4. Embedded Systems

**推薦使用例子**:
- STM32: ADC 採樣、PWM 控制、定時器
- ESP32: Wi-Fi 掃描、BLE 廣告、OTA 更新
- Raspberry Pi: 攝像機捕獲、GPIO 實時控制

---

### 5. Firmware Development

**推薦使用例子**:
- OTA: 增量更新、灰度發佈、回滾恢復
- Crypto: AES 加密、HMAC 認證
- Flash: 磨損平衡、壞塊管理

---

### 6. HAL/BSP

**推薦使用例子**:
- GPIO HAL: 多平台移植
- UART HAL: 自定義通訊協議
- Device Model: 統一設備管理

---

### 7. Linux Kernel Drivers

**推薦使用例子**:
- Char Device: 傳感器驅動、控制卡驅動
- Block Device: 加密分區、虛擬磁盤
- Network: 虛擬 NIC、網橋實現

---

### 8. RTOS

**推薦使用例子**:
- FreeRTOS: 馬達控制、日誌系統
- Zephyr: BLE 信標、低功耗設計
- RT-Thread: IoT 網關、邊緣計算

---

## 使用例子建議

### Android Framework 示例

```java
// 設備狀態管理服務示例
public class DeviceStateManager extends ICustomService.Stub {
    // 監測電池狀態、溫度、記憶體
    public DeviceStatus getDeviceStatus() {
        // 實現細節
    }
}

// 系統日誌服務示例
public class SystemLogger extends ICustomService.Stub {
    // 收集核心日誌、性能指標
    public void logEvent(String tag, String message) {
        // 實現細節
    }
}
```

### Bootloader 示例

```c
// 多啟動模式支援
int main(void) {
    if (check_recovery_mode()) {
        enter_recovery();
    } else if (check_update_mode()) {
        enter_update();
    } else {
        jump_to_application();
    }
}

// USB DFU 更新支援
void dfu_download_callback(uint8_t *buf, uint32_t len) {
    // 接收並寫入 Flash
}
```

### HAL 示例

```c
// 多平台 GPIO 驅動
typedef struct {
    void (*init)(gpio_pin_t pin);
    void (*set)(gpio_pin_t pin);
    void (*clear)(gpio_pin_t pin);
    bool (*read)(gpio_pin_t pin);
} gpio_ops_t;

// STM32 實作
static gpio_ops_t stm32_gpio_ops = {
    .init = stm32_gpio_init,
    .set = stm32_gpio_set,
    // ...
};
```

### RTOS 示例

```c
// 實際應用: 馬達控制
void motor_control_task(void *pvParameters) {
    MotorHandle motor = (MotorHandle)pvParameters;
    
    while (1) {
        // 讀取命令隊列
        MotorCmd cmd;
        xQueueReceive(motor->cmd_queue, &cmd, portMAX_DELAY);
        
        // 執行控制
        motor_set_speed(motor, cmd.speed);
        
        // 監控狀態
        if (motor_check_fault(motor)) {
            notify_fault();
        }
    }
}
```

---

## API 參考

### CustomService AIDL 介面

```aidl
interface ICustomService {
    // 資料操作
    String getData(String key);
    void setData(String key, String value);
    
    // 狀態查詢
    int getServiceStatus();
    boolean isReady();
    
    // 回調
    void registerCallback(ICustomServiceCallback callback);
    void unregisterCallback(ICustomServiceCallback callback);
    
    // 命令
    void performAction(String action, in Bundle params);
    void resetService();
}
```

### GPIO HAL API

```c
// 初始化和配置
gpio_handle_t gpio_init(gpio_port_t port, gpio_pin_t pin, 
                        const gpio_config_t *config);

// I/O 操作
void gpio_set(gpio_handle_t handle);
void gpio_clear(gpio_handle_t handle);
bool gpio_read(gpio_handle_t handle);
void gpio_write(gpio_handle_t handle, bool state);

// 中斷
void gpio_attach_interrupt(gpio_handle_t handle, 
                          gpio_interrupt_mode_t mode,
                          gpio_callback_t callback);

// 清理
void gpio_deinit(gpio_handle_t handle);
```

### FreeRTOS 核心 API

```c
// 任務
TaskHandle_t xTaskCreate(TaskFunction_t pxTaskCode, ...);
void vTaskDelay(TickType_t xTicksToDelay);

// 同步
SemaphoreHandle_t xSemaphoreCreateBinary(void);
BaseType_t xSemaphoreTake(SemaphoreHandle_t xSemaphore, ...);

// 隊列
QueueHandle_t xQueueCreate(UBaseType_t uxQueueLength, ...);
BaseType_t xQueueSend(QueueHandle_t xQueue, ...);
```

---

## 文件位置總表

| 類別/模組 | 路徑 | 類型 |
|----------|------|------|
| CustomService | android-framework/custom-system-service/service/ | Java |
| CustomServiceClient | android-framework/custom-system-service/client/ | Java |
| firmware_verify | bootloaders/mcu-bootloader/backend/common/crypto/ | C |
| custom-board | bootloaders/u-boot-development/backend/board-configs/custom-board/ | C/DTS |
| gpio_driver | device-drivers/gpio-controller/driver/ | C |
| freertos_tasks | embedded-systems/stm32/freertos/ | C |
| gpio_blink | embedded-systems/stm32/hal-examples/ | C |
| gpio_hal | hal-bsp/gpio-hal/ | C |
| led_blink | hal-bsp/gpio-hal/examples/ | C |
| uart_hal | hal-bsp/uart-hal/ | C |
| simple_ramdisk | linux-kernel-drivers/block-device/ | C |
| simple_chardev | linux-kernel-drivers/char-device/ | C |
| interrupt_example | linux-kernel-drivers/interrupt-handler/ | C |
| virtual_netdev | linux-kernel-drivers/network-driver/ | C |
| task-management | rtos/freertos/task-management/src/ | C |
| synchronization | rtos/freertos/synchronization/src/ | C |

---

## 建議的開發順序

1. **學習基礎**: 從 HAL/BSP 和 RTOS 開始理解硬體抽象和任務管理
2. **掌握驅動**: 學習 Device Drivers 和 Linux Kernel Drivers
3. **系統級開發**: 深入 Bootloader 和 Firmware Development
4. **高級應用**: 探索 Android Framework 和複雜的系統集成
5. **實踐應用**: 使用 Embedded Systems 子專案構建實際應用

---

**最後更新**: 2025-11-17
**總包含**: 15+ 個關鍵類別/模組，39+ 個源文件，8 個主要子專案

