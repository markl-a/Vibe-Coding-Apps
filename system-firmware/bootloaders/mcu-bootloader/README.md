# MCU Bootloader 開發
> AI 驅動的微控制器 Bootloader 開發專案

## 📋 專案簡介

微控制器 Bootloader 是嵌入式系統中實現韌體在線更新 (OTA/IAP) 的關鍵組件。本專案展示如何使用 AI 輔助工具開發支援多種更新協議的 MCU Bootloader，包括 UART、USB DFU、CAN、藍牙等更新方式。

## 🎯 專案目標

- 開發支援多種 MCU 平台的 Bootloader
- 實作可靠的韌體更新機制
- 支援多種通訊協議 (UART、USB、CAN、BLE)
- 實作安全啟動和韌體驗證
- 雙分區管理和回滾機制
- 壓縮韌體支援和差分更新

## 🛠️ 技術棧

### 支援的 MCU 平台
- **STM32** - ARM Cortex-M 系列
- **ESP32/ESP8266** - Wi-Fi/藍牙 SoC
- **Nordic nRF52** - 藍牙 Low Energy
- **NXP LPC/Kinetis** - ARM Cortex-M
- **Microchip PIC32** - MIPS 架構
- **Texas Instruments MSP430** - 低功耗 MCU

### 後端開發
- **語言**: C, C++
- **工具**:
  - ARM GCC / ESP-IDF / Nordic SDK
  - STM32CubeMX / PlatformIO
  - J-Link / ST-Link

### 前端開發
- **框架**: React + TypeScript
- **UI**: Ant Design
- **功能**: 韌體上傳工具、更新管理、串口終端

## 📁 專案結構

```
mcu-bootloader/
├── backend/
│   ├── stm32/                      # STM32 Bootloader
│   │   ├── uart-bootloader/
│   │   ├── usb-dfu-bootloader/
│   │   └── can-bootloader/
│   ├── esp32/                      # ESP32 Bootloader
│   │   ├── ota-bootloader/
│   │   └── bluetooth-bootloader/
│   ├── nordic/                     # Nordic nRF52 Bootloader
│   │   ├── ble-dfu-bootloader/
│   │   └── secure-bootloader/
│   ├── common/                     # 共用代碼
│   │   ├── crypto/                 # 加密和驗證
│   │   ├── compression/            # 壓縮演算法
│   │   └── flash-driver/           # Flash 操作
│   └── tools/                      # 開發工具
│       ├── firmware-packer/
│       ├── signing-tool/
│       └── update-client/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FirmwareUploader/   # 韌體上傳
│   │   │   ├── SerialTerminal/     # 串口終端
│   │   │   ├── DeviceManager/      # 設備管理
│   │   │   └── UpdateMonitor/      # 更新監控
│   │   └── utils/
│   │       ├── serial-port.ts
│   │       └── firmware-utils.ts
│   └── package.json
└── README.md
```

## 🚀 核心功能

### 1. UART Bootloader (通用型)

支援通過串口更新韌體的基礎 Bootloader。

**特性**:
- XModem/YModem 協議支援
- 自定義二進制協議
- 進度反饋
- CRC32 校驗

### 2. USB DFU Bootloader (USB 設備)

符合 USB DFU 標準的 Bootloader，支援標準 DFU 工具。

**特性**:
- USB DFU 1.1 規範
- 運行時切換 DFU 模式
- 支援 dfu-util 工具
- 狀態 LED 指示

### 3. CAN Bootloader (汽車電子)

用於 CAN 總線環境的 Bootloader，適合汽車電子應用。

**特性**:
- ISO-TP 協議
- UDS 診斷服務
- 多節點同時更新
- 錯誤處理和重傳

### 4. OTA Bootloader (IoT 設備)

支援 Wi-Fi 或藍牙無線更新的 Bootloader。

**特性**:
- HTTP/HTTPS 下載
- 藍牙 DFU (Nordic DFU 協議)
- 斷點續傳
- 差分更新支援

### 5. Secure Bootloader (安全啟動)

具備安全功能的 Bootloader，防止惡意韌體。

**特性**:
- RSA/ECDSA 簽名驗證
- AES 加密韌體
- 安全金鑰儲存
- 防回滾機制

## 💻 開發範例

### STM32 UART Bootloader

```c
// stm32_uart_bootloader.c
#include "stm32f4xx_hal.h"
#include <string.h>

#define APP_ADDRESS         0x08020000  // 應用程式起始地址
#define BOOTLOADER_SIZE     0x20000     // Bootloader 128KB
#define FLASH_SECTOR_SIZE   0x20000     // Flash 扇區大小

// 命令定義
#define CMD_HELLO           0x01
#define CMD_ERASE           0x02
#define CMD_WRITE           0x03
#define CMD_VERIFY          0x04
#define CMD_BOOT            0x05

// 回應碼
#define ACK                 0xAA
#define NACK                0xFF

typedef struct {
    uint8_t cmd;
    uint16_t len;
    uint8_t data[256];
    uint16_t crc;
} __attribute__((packed)) bl_packet_t;

UART_HandleTypeDef huart1;

// CRC16 計算
uint16_t calculate_crc16(uint8_t *data, uint16_t len)
{
    uint16_t crc = 0xFFFF;
    for (uint16_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (uint8_t j = 0; j < 8; j++) {
            if (crc & 0x0001) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }
    return crc;
}

// 跳轉到應用程式
void jump_to_application(void)
{
    uint32_t app_stack = *((__IO uint32_t *)APP_ADDRESS);

    // 驗證堆疊指針
    if ((app_stack & 0x2FFE0000) != 0x20000000) {
        return;  // 無效應用程式
    }

    typedef void (*app_function)(void);
    app_function app_reset = (app_function)(*((__IO uint32_t *)(APP_ADDRESS + 4)));

    // 禁用中斷和外設
    __disable_irq();
    HAL_DeInit();

    // 重置 SysTick
    SysTick->CTRL = 0;
    SysTick->LOAD = 0;
    SysTick->VAL = 0;

    // 清除中斷
    for (int i = 0; i < 8; i++) {
        NVIC->ICER[i] = 0xFFFFFFFF;
        NVIC->ICPR[i] = 0xFFFFFFFF;
    }

    // 設置向量表
    SCB->VTOR = APP_ADDRESS;

    // 設置堆疊
    __set_MSP(app_stack);

    // 跳轉
    app_reset();
}

// 擦除 Flash
HAL_StatusTypeDef erase_flash(uint32_t address, uint32_t size)
{
    FLASH_EraseInitTypeDef erase_init;
    uint32_t sector_error;

    HAL_FLASH_Unlock();

    // 計算需要擦除的扇區
    uint8_t start_sector = (address - 0x08000000) / FLASH_SECTOR_SIZE;
    uint8_t num_sectors = (size + FLASH_SECTOR_SIZE - 1) / FLASH_SECTOR_SIZE;

    erase_init.TypeErase = FLASH_TYPEERASE_SECTORS;
    erase_init.Sector = start_sector;
    erase_init.NbSectors = num_sectors;
    erase_init.VoltageRange = FLASH_VOLTAGE_RANGE_3;

    HAL_StatusTypeDef status = HAL_FLASHEx_Erase(&erase_init, &sector_error);

    HAL_FLASH_Lock();
    return status;
}

// 寫入 Flash
HAL_StatusTypeDef write_flash(uint32_t address, uint8_t *data, uint16_t len)
{
    HAL_FLASH_Unlock();

    for (uint16_t i = 0; i < len; i++) {
        if (HAL_FLASH_Program(FLASH_TYPEPROGRAM_BYTE, address + i, data[i]) != HAL_OK) {
            HAL_FLASH_Lock();
            return HAL_ERROR;
        }
    }

    HAL_FLASH_Lock();
    return HAL_OK;
}

// 驗證 Flash
bool verify_flash(uint32_t address, uint8_t *data, uint16_t len)
{
    for (uint16_t i = 0; i < len; i++) {
        if (*(uint8_t *)(address + i) != data[i]) {
            return false;
        }
    }
    return true;
}

// 處理 Bootloader 命令
void process_command(bl_packet_t *packet)
{
    static uint32_t write_address = APP_ADDRESS;
    uint8_t response = NACK;

    // 驗證 CRC
    uint16_t calc_crc = calculate_crc16((uint8_t *)packet,
                                        sizeof(packet->cmd) + sizeof(packet->len) + packet->len);
    if (calc_crc != packet->crc) {
        HAL_UART_Transmit(&huart1, &response, 1, 100);
        return;
    }

    switch (packet->cmd) {
        case CMD_HELLO:
            // 返回 Bootloader 版本信息
            response = ACK;
            HAL_UART_Transmit(&huart1, &response, 1, 100);
            HAL_UART_Transmit(&huart1, (uint8_t *)"STM32 BL v1.0", 13, 100);
            break;

        case CMD_ERASE:
            // 擦除應用程式區域
            if (erase_flash(APP_ADDRESS, 0x60000) == HAL_OK) {
                write_address = APP_ADDRESS;
                response = ACK;
            }
            HAL_UART_Transmit(&huart1, &response, 1, 100);
            break;

        case CMD_WRITE:
            // 寫入數據
            if (write_flash(write_address, packet->data, packet->len) == HAL_OK) {
                write_address += packet->len;
                response = ACK;
            }
            HAL_UART_Transmit(&huart1, &response, 1, 100);
            break;

        case CMD_VERIFY:
            // 驗證數據
            if (verify_flash(APP_ADDRESS, packet->data, packet->len)) {
                response = ACK;
            }
            HAL_UART_Transmit(&huart1, &response, 1, 100);
            break;

        case CMD_BOOT:
            // 跳轉到應用程式
            response = ACK;
            HAL_UART_Transmit(&huart1, &response, 1, 100);
            HAL_Delay(100);
            jump_to_application();
            break;

        default:
            HAL_UART_Transmit(&huart1, &response, 1, 100);
            break;
    }
}

// Bootloader 主程式
int main(void)
{
    HAL_Init();
    SystemClock_Config();

    // 初始化 UART
    huart1.Instance = USART1;
    huart1.Init.BaudRate = 115200;
    huart1.Init.WordLength = UART_WORDLENGTH_8B;
    huart1.Init.StopBits = UART_STOPBITS_1;
    huart1.Init.Parity = UART_PARITY_NONE;
    huart1.Init.Mode = UART_MODE_TX_RX;
    HAL_UART_Init(&huart1);

    // 初始化 GPIO LED
    GPIO_InitTypeDef gpio_init = {0};
    gpio_init.Pin = GPIO_PIN_13;
    gpio_init.Mode = GPIO_MODE_OUTPUT_PP;
    gpio_init.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(GPIOC, &gpio_init);

    // LED 閃爍表示進入 Bootloader
    for (int i = 0; i < 3; i++) {
        HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_SET);
        HAL_Delay(100);
        HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_RESET);
        HAL_Delay(100);
    }

    // 檢查是否有更新請求（可以是按鈕或標誌位）
    // 這裡假設等待 2 秒看是否收到數據
    uint32_t timeout = HAL_GetTick() + 2000;
    uint8_t rx_byte;

    while (HAL_GetTick() < timeout) {
        if (HAL_UART_Receive(&huart1, &rx_byte, 1, 10) == HAL_OK) {
            // 收到數據，進入更新模式
            goto bootloader_mode;
        }
    }

    // 沒有更新請求，嘗試啟動應用程式
    jump_to_application();

bootloader_mode:
    // Bootloader 模式
    HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_SET);

    bl_packet_t packet;
    uint8_t *p = (uint8_t *)&packet;
    uint16_t received = 0;

    while (1) {
        // 接收數據包
        if (HAL_UART_Receive(&huart1, p + received, 1, 1000) == HAL_OK) {
            received++;

            // 檢查是否接收完整包頭
            if (received >= sizeof(packet.cmd) + sizeof(packet.len)) {
                uint16_t expected_len = sizeof(bl_packet_t) - sizeof(packet.data) + packet.len;

                // 接收完整數據包
                if (received >= expected_len) {
                    process_command(&packet);
                    received = 0;
                }
            }
        }
    }

    return 0;
}
```

### ESP32 OTA Bootloader

```c
// esp32_ota_bootloader.c
#include "freertos/FreeRTOS.h"
#include "esp_system.h"
#include "esp_event.h"
#include "esp_ota_ops.h"
#include "esp_http_client.h"
#include "esp_https_ota.h"
#include "esp_log.h"

static const char *TAG = "OTA";

#define FIRMWARE_URL "https://example.com/firmware.bin"

esp_err_t validate_image_header(esp_app_desc_t *new_app_info)
{
    if (new_app_info == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    const esp_partition_t *running = esp_ota_get_running_partition();
    esp_app_desc_t running_app_info;

    if (esp_ota_get_partition_description(running, &running_app_info) == ESP_OK) {
        ESP_LOGI(TAG, "Running firmware version: %s", running_app_info.version);
    }

    ESP_LOGI(TAG, "New firmware version: %s", new_app_info->version);

    // 版本比較（可選）
    if (strcmp(new_app_info->version, running_app_info.version) <= 0) {
        ESP_LOGW(TAG, "New version is not newer than running version");
        return ESP_FAIL;
    }

    return ESP_OK;
}

esp_err_t perform_ota_update(void)
{
    ESP_LOGI(TAG, "Starting OTA update...");

    esp_http_client_config_t config = {
        .url = FIRMWARE_URL,
        .cert_pem = NULL,  // 使用 HTTPS 時設置證書
        .timeout_ms = 5000,
        .keep_alive_enable = true,
    };

    esp_https_ota_config_t ota_config = {
        .http_config = &config,
    };

    esp_https_ota_handle_t https_ota_handle = NULL;
    esp_err_t err = esp_https_ota_begin(&ota_config, &https_ota_handle);

    if (err != ESP_OK) {
        ESP_LOGE(TAG, "ESP HTTPS OTA Begin failed");
        return err;
    }

    esp_app_desc_t app_desc;
    err = esp_https_ota_get_img_desc(https_ota_handle, &app_desc);

    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to get image description");
        goto ota_end;
    }

    err = validate_image_header(&app_desc);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Image header validation failed");
        goto ota_end;
    }

    while (1) {
        err = esp_https_ota_perform(https_ota_handle);
        if (err != ESP_ERR_HTTPS_OTA_IN_PROGRESS) {
            break;
        }

        // 進度報告
        int progress = esp_https_ota_get_image_len_read(https_ota_handle);
        ESP_LOGI(TAG, "Image bytes read: %d", progress);
    }

    if (esp_https_ota_is_complete_data_received(https_ota_handle) != true) {
        ESP_LOGE(TAG, "Complete data was not received.");
        err = ESP_FAIL;
    } else {
        err = esp_https_ota_finish(https_ota_handle);
        if (err == ESP_OK) {
            ESP_LOGI(TAG, "OTA update successful. Rebooting...");
            esp_restart();
        } else {
            ESP_LOGE(TAG, "ESP HTTPS OTA finish failed");
        }
    }

ota_end:
    esp_https_ota_abort(https_ota_handle);
    return err;
}

void app_main(void)
{
    ESP_LOGI(TAG, "OTA Bootloader started");

    // 執行 OTA 更新
    esp_err_t err = perform_ota_update();

    if (err == ESP_OK) {
        ESP_LOGI(TAG, "Update successful!");
    } else {
        ESP_LOGE(TAG, "Update failed, staying in bootloader");
    }
}
```

## 🤖 AI 輔助開發

### 使用場景

1. **Bootloader 設計**
   - "設計一個支援 UART 和 USB 雙模式的 STM32 Bootloader"
   - "如何實作安全的韌體驗證機制？"

2. **協議實作**
   - "實作 XModem 協議的接收端"
   - "生成符合 USB DFU 規範的描述符"

3. **除錯協助**
   - "Bootloader 跳轉失敗可能的原因"
   - "Flash 寫入錯誤如何診斷？"

4. **安全優化**
   - "如何防止韌體被惡意替換？"
   - "實作 AES 加密的韌體更新"

## 📚 學習資源

### 文檔
- [STM32 AN2606 Bootloader](https://www.st.com/resource/en/application_note/cd00167594.pdf)
- [USB DFU Specification](https://www.usb.org/document-library/device-firmware-upgrade-11-new-version-31-aug-2004)
- [Nordic nRF52 Secure DFU](https://infocenter.nordicsemi.com/topic/sdk_nrf5_v16.0.0/lib_bootloader.html)
- [ESP-IDF OTA Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/ota.html)

## 🧪 測試與驗證

### 測試項目
- Bootloader 啟動測試
- 韌體完整性驗證
- 更新中斷恢復
- 回滾機制測試
- 安全功能測試

### 測試工具
- STM32 ST-Link Utility
- dfu-util (USB DFU)
- esptool (ESP32)
- nrfutil (Nordic)

## ⚠️ 注意事項

- **不可磚化**: 必須保證 Bootloader 本身不會損壞
- **備份機制**: 實作雙分區和回滾功能
- **安全驗證**: 驗證韌體簽名和完整性
- **斷電保護**: 處理更新過程中的斷電情況
- **版本控制**: 防止降級到舊版本韌體

## 📄 授權

MIT License

---

**最後更新**: 2025-11-16
**狀態**: ✅ 活躍開發中
**維護者**: AI-Assisted Development Team
