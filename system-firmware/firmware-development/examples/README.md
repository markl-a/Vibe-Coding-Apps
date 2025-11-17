# 📚 韌體開發範例集

這個目錄包含了完整的、可編譯的韌體開發範例，涵蓋從基礎到進階的各種應用場景。

## 📁 目錄結構

```
examples/
├── README.md                    # 本文件
├── Makefile                     # 編譯所有範例
├── basic/                       # 基礎範例
│   └── basic_firmware.c        # 基本韌體框架
├── ota/                        # OTA 更新範例
│   └── ota_http_update.c       # HTTP OTA 更新
├── crypto/                     # 加密範例
│   └── aes_encrypt_decrypt.c   # AES 加密解密
├── flash/                      # Flash 操作範例
│   └── flash_read_write.c      # Flash 讀寫操作
├── bootloader/                 # Bootloader 範例
│   └── secure_boot_example.c   # 安全啟動
└── complete-system/            # 完整系統範例
    └── complete_firmware_system.c  # 整合範例
```

## 🚀 快速開始

### 編譯所有範例

```bash
cd examples
make all
```

### 運行所有範例

```bash
make run
```

### 運行特定範例

```bash
make run-basic      # 基本韌體範例
make run-ota        # OTA 更新範例
make run-crypto     # 加密解密範例
make run-flash      # Flash 讀寫範例
make run-boot       # 安全啟動範例
make run-complete   # 完整系統範例
```

### 清理編譯產物

```bash
make clean
```

## 📖 範例說明

### 1. 基本韌體範例 (basic/basic_firmware.c)

**功能：**
- 韌體基本結構和初始化流程
- 硬體抽象層 (HAL) 實現
- 任務調度器
- GPIO、UART、時鐘配置
- 看門狗管理
- 中斷處理

**學習重點：**
- 理解韌體啟動流程
- 學習任務調度機制
- 掌握硬體初始化順序
- 實現簡單的任務管理

**運行方式：**
```bash
make run-basic
```

**預期輸出：**
```
========================================
  韌體啟動中...
  版本: v1.0.0 (Build 100)
========================================

[HAL] GPIO 初始化完成
[HAL] UART 初始化 (115200 8N1)
[SCHEDULER] 任務調度器初始化 (4 個任務)
  - Task 0: LED Blink (Period: 500 ms)
  - Task 1: Status Report (Period: 5000 ms)
  ...
```

---

### 2. OTA HTTP 更新範例 (ota/ota_http_update.c)

**功能：**
- HTTP 檢查韌體更新
- 下載韌體到 Flash
- 韌體完整性驗證
- 雙分區管理
- 自動切換分區

**學習重點：**
- OTA 更新協議實現
- HTTP 客戶端使用
- Flash 分區管理
- 韌體驗證流程
- 啟動標誌管理

**運行方式：**
```bash
make run-ota
```

**預期輸出：**
```
========================================
  HTTP OTA 更新範例
  當前版本: 1.0.0
========================================

[OTA] 檢查更新...
[OTA] 發現新版本！
  新版本: 1.1.0
  大小: 524288 bytes

[OTA] 開始下載韌體...
[OTA] 下載進度: 25% (131072 / 524288 bytes)
[OTA] 下載進度: 50% (262144 / 524288 bytes)
...
```

**關鍵代碼解析：**

```c
// 1. 檢查更新
ota_check_response_t update_info;
ota_check_for_updates(&update_info);

// 2. 下載並安裝
if (update_info.update_available) {
    ota_download_and_install(&update_info);
}

// 3. 重啟到新韌體
ota_reboot_to_new_firmware();
```

---

### 3. AES 加密解密範例 (crypto/aes_encrypt_decrypt.c)

**功能：**
- AES-256 CBC 模式加密
- AES-256 GCM 模式（認證加密）
- PKCS#7 填充
- 韌體加密應用
- 安全記憶體清除

**學習重點：**
- 對稱加密原理
- 不同加密模式的應用
- 認證加密的重要性
- 填充機制
- 韌體保護技術

**運行方式：**
```bash
make run-crypto
```

**預期輸出：**
```
========================================
  AES 加密解密範例
========================================

========== AES-256-CBC 範例 ==========

明文: 這是一段需要加密的機密數據！
明文長度: 42 字節

[AES] 初始化 AES-256 CBC 模式
[PKCS7] 添加 6 字節填充

--- 加密 ---
[AES-CBC] 加密 48 字節數據
密文: A3 B2 C1 D0 ...

--- 解密 ---
[AES-CBC] 解密 48 字節數據
解密結果: 這是一段需要加密的機密數據！

✅ 加密解密驗證成功！
```

**實際應用：**

```c
// 韌體加密保護
uint8_t encryption_key[32] = { /* 從安全存儲獲取 */ };
uint8_t nonce[12];
uint8_t encrypted_firmware[FIRMWARE_SIZE];
uint8_t auth_tag[16];

// 加密韌體
aes_gcm_encrypt(encryption_key, 32, nonce, 12,
                firmware_data, firmware_size,
                encrypted_firmware, auth_tag);

// 解密並驗證
if (aes_gcm_decrypt(encryption_key, 32, nonce, 12,
                    encrypted_firmware, firmware_size,
                    decrypted_firmware, auth_tag) == 0) {
    // 驗證成功，可以使用韌體
}
```

---

### 4. Flash 讀寫範例 (flash/flash_read_write.c)

**功能：**
- 內部 Flash 操作
- SPI Flash 操作
- 扇區擦除和頁面編程
- CRC32 完整性校驗
- Flash 性能測試
- 配置存儲示例

**學習重點：**
- Flash 記憶體特性
- 擦除和寫入順序
- 磨損平衡概念
- 數據完整性保護
- 配置持久化

**運行方式：**
```bash
make run-flash
```

**預期輸出：**
```
========================================
  Flash 讀寫操作範例
========================================

--- 測試內部 Flash ---
[Flash] 初始化 Flash 驅動
[Internal Flash] 初始化

========== Flash 資訊 ==========
類型: 內部 Flash
製造商: STMicroelectronics
型號: STM32F407
總容量: 1024 KB
扇區大小: 128 KB
================================

========== Flash 讀寫測試 ==========
測試地址: 0x08080000
測試大小: 1024 字節

寫入數據 CRC32: 0x12345678
[FLASH] 擦除扇區 0 @ 0x08080000
[FLASH] 寫入 1024 字節 @ 0x08080000
[FLASH] 讀取 1024 字節 @ 0x08080000
讀取數據 CRC32: 0x12345678

✅ Flash 讀寫測試成功！
```

**配置存儲範例：**

```c
typedef struct {
    uint32_t magic;
    uint32_t version;
    char device_name[32];
    uint32_t ip_address;
    uint16_t port;
    uint32_t crc32;
} device_config_t;

// 保存配置
device_config_t config = { /* ... */ };
config.crc32 = crc32_calculate(&config, sizeof(config));
flash_erase_sector(CONFIG_FLASH_ADDR);
flash_write(CONFIG_FLASH_ADDR, &config, sizeof(config));

// 讀取配置
flash_read(CONFIG_FLASH_ADDR, &config, sizeof(config));
// 驗證 CRC ...
```

---

### 5. 安全啟動範例 (bootloader/secure_boot_example.c)

**功能：**
- 韌體簽名驗證
- SHA-256 哈希計算
- RSA-2048 簽名驗證
- 回滾保護機制
- 啟動計數和錯誤處理
- 恢復模式

**學習重點：**
- 信任鏈概念
- 數字簽名原理
- 安全啟動流程
- 回滾攻擊防護
- 錯誤恢復策略

**運行方式：**
```bash
make run-boot
```

**預期輸出：**
```
========================================
  🔒 安全啟動 v1.0.0
========================================

[SecureBoot] 活動分區: A
[SecureBoot] 啟動嘗試: 0
[SecureBoot] 韌體地址: 0x08020000

[SecureBoot] 載入公鑰...
[SecureBoot] 公鑰載入成功 (RSA-2048)

[SecureBoot] 驗證韌體標頭...
[SecureBoot] 韌體標頭有效
  版本: 1
  大小: 524288 字節

[SecureBoot] 驗證韌體哈希...
[SHA256] 計算哈希值 (524032 字節)
[SecureBoot] 哈希驗證成功

[SecureBoot] 驗證韌體簽名...
[RSA] 驗證簽名...
[SecureBoot] 簽名驗證成功

[SecureBoot] 檢查韌體版本...
[SecureBoot] 版本檢查通過 (v1)

========================================
  ✅ 韌體驗證成功！
========================================
韌體版本: 1
韌體大小: 524288 字節
啟動分區: A
========================================

[SecureBoot] 跳轉到應用程式 @ 0x08020000
```

**安全啟動流程：**

```
┌─────────────────┐
│  Bootloader     │
│  (ROM/Flash)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 1. 載入公鑰     │
│ 2. 讀取韌體標頭 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. 驗證標頭     │
│ 4. 計算哈希     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. 驗證簽名     │
│ 6. 檢查版本     │
└────────┬────────┘
         │
    ┌────┴────┐
    │ 成功？  │
    └────┬────┘
         │
    ┌────┴────┐
    │是      否│
    ▼         ▼
┌───────┐  ┌──────────┐
│跳轉APP│  │恢復模式  │
└───────┘  └──────────┘
```

---

### 6. 完整韌體系統範例 (complete-system/complete_firmware_system.c)

**功能：**
- 完整的配置管理系統
- 網路連接管理
- 自動 OTA 更新
- 系統監控和狀態報告
- 任務調度
- 資源管理

**學習重點：**
- 系統架構設計
- 模組化開發
- 狀態管理
- 完整的韌體生命週期
- 生產級代碼結構

**運行方式：**
```bash
make run-complete
```

**預期輸出：**
```
========================================
  完整韌體系統初始化
  SecureIoTDevice v1.2.3
========================================

[Config] 從 Flash 載入配置
[Config] 配置載入成功

========== 系統配置 ==========
網路:
  SSID: MyWiFi
  IP: 192.168.1.100
  Port: 8080
  DHCP: 啟用

OTA:
  服務器: https://ota.example.com/api
  檢查間隔: 3600 秒
  自動更新: 否

安全:
  加密: 啟用
  安全啟動: 啟用

[System] 初始化硬體...
[Network] 初始化網路...
[Network] WiFi 連接成功 (RSSI: -45 dBm)

[System] ✅ 系統初始化完成！

========== 進入主循環 ==========

[Heartbeat] 系統運行正常 (Uptime: 60 秒)

[OTA] 檢查更新...
[OTA] 發現新版本: 1.3.0

[Demo] 模擬觸發 OTA 更新...
[OTA] 開始下載韌體...
[OTA] 下載進度: 32%
[OTA] 下載進度: 64%
[OTA] 下載進度: 96%
[OTA] 下載完成 (100%)
[OTA] 驗證韌體...
[OTA] 韌體驗證成功
[OTA] ✅ OTA 更新成功！
[OTA] 系統將在 5 秒後重啟...
```

**系統架構：**

```
┌─────────────────────────────────────┐
│         應用程式層                   │
│  - 業務邏輯                          │
│  - 用戶介面                          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         系統服務層                   │
│  - 配置管理  - OTA 更新              │
│  - 網路管理  - 系統監控              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         硬體抽象層 (HAL)             │
│  - Flash    - GPIO    - UART         │
│  - SPI      - I2C     - Timer        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         硬體層                       │
│  - MCU      - Flash   - Peripherals  │
└─────────────────────────────────────┘
```

## 🛠️ 移植到實際硬體

這些範例是為 x86/x64 平台編譯的演示程序。要移植到實際的嵌入式硬體（如 STM32、ESP32），需要：

### 1. 替換硬體抽象層 (HAL)

**模擬代碼：**
```c
void gpio_set(gpio_pin_t pin, bool state) {
    printf("[HAL] GPIO %d 設置為 %d\n", pin, state);
}
```

**實際 STM32 代碼：**
```c
void gpio_set(gpio_pin_t pin, bool state) {
    HAL_GPIO_WritePin(gpio_ports[pin], gpio_pins[pin],
                      state ? GPIO_PIN_SET : GPIO_PIN_RESET);
}
```

### 2. 實現 Flash 操作

**實際 STM32 Flash：**
```c
int flash_write(uint32_t address, const uint8_t *data, uint32_t size) {
    HAL_FLASH_Unlock();

    for (uint32_t i = 0; i < size; i += 4) {
        uint32_t word = *(uint32_t *)(data + i);
        HAL_FLASH_Program(FLASH_TYPEPROGRAM_WORD, address + i, word);
    }

    HAL_FLASH_Lock();
    return 0;
}
```

### 3. 整合加密庫

使用 mbedTLS 或其他加密庫：

```c
#include "mbedtls/aes.h"
#include "mbedtls/sha256.h"
#include "mbedtls/rsa.h"

void sha256_compute(const uint8_t *data, uint32_t length, uint8_t *hash) {
    mbedtls_sha256_context ctx;
    mbedtls_sha256_init(&ctx);
    mbedtls_sha256_starts(&ctx, 0);
    mbedtls_sha256_update(&ctx, data, length);
    mbedtls_sha256_finish(&ctx, hash);
    mbedtls_sha256_free(&ctx);
}
```

### 4. 配置編譯環境

**platformio.ini (ESP32):**
```ini
[env:esp32]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps =
    ArduinoJson
    PubSubClient
    mbedtls
```

**CMakeLists.txt (STM32):**
```cmake
add_executable(firmware
    src/main.c
    src/ota_update.c
    src/flash_driver.c
    src/crypto.c
)

target_link_libraries(firmware
    HAL
    mbedtls
)
```

## 📊 性能基準

| 操作 | 平台 | 速度 | 備註 |
|------|------|------|------|
| Flash 擦除 (4KB) | STM32F4 | ~100ms | 內部 Flash |
| Flash 寫入 (256B) | STM32F4 | ~10ms | 頁面編程 |
| SHA-256 (1MB) | STM32F4@168MHz | ~500ms | 軟體實現 |
| AES-256 加密 (1MB) | STM32F4@168MHz | ~200ms | 硬體加速 |
| OTA 下載 (512KB) | ESP32 WiFi | ~10s | 依網速而定 |

## 🔍 調試技巧

### 1. 使用 printf 調試

在實際硬體上，將 printf 重定向到 UART：

```c
int _write(int file, char *ptr, int len) {
    HAL_UART_Transmit(&huart1, (uint8_t *)ptr, len, HAL_MAX_DELAY);
    return len;
}
```

### 2. LED 狀態指示

```c
typedef enum {
    LED_STATUS_OK,       // 綠燈：正常運行
    LED_STATUS_WARNING,  // 黃燈：警告
    LED_STATUS_ERROR,    // 紅燈：錯誤
    LED_STATUS_UPDATING  // 藍燈閃爍：更新中
} led_status_t;

void led_set_status(led_status_t status);
```

### 3. Watchdog 調試

```c
// 暫時禁用 watchdog 進行調試
#ifdef DEBUG
    #define WATCHDOG_REFRESH()  // 空操作
#else
    #define WATCHDOG_REFRESH()  HAL_IWDG_Refresh(&hiwdg)
#endif
```

## 🧪 測試建議

### 1. 單元測試

```c
// 測試 CRC32 計算
void test_crc32(void) {
    uint8_t data[] = "123456789";
    uint32_t crc = crc32_calculate(data, 9);
    assert(crc == 0xCBF43926);  // 已知值
}
```

### 2. 集成測試

- Flash 讀寫循環測試（1000 次）
- OTA 更新完整流程測試
- 斷電恢復測試
- 回滾測試

### 3. 壓力測試

- 連續運行 24 小時
- 記憶體洩漏檢測
- 極端溫度測試
- 電源波動測試

## 📚 延伸閱讀

### 推薦書籍
1. **Making Embedded Systems** - Elecia White
2. **The Firmware Handbook** - Jack Ganssle
3. **Embedded Systems Security** - David Kleidermacher

### 線上資源
- [STM32 Application Notes](https://www.st.com/en/applications.html)
- [ESP-IDF Documentation](https://docs.espressif.com/projects/esp-idf/)
- [Interrupt Blog](https://interrupt.memfault.com/)
- [Embedded Artistry](https://embeddedartistry.com/)

### 相關標準
- **MISRA C** - 嵌入式 C 編程標準
- **CERT C** - 安全編程規範
- **ISO 26262** - 汽車功能安全標準

## ❓ 常見問題

### Q1: 為什麼 Flash 寫入前必須擦除？

A: Flash 記憶體的特性是只能將位從 1 寫為 0，不能從 0 寫為 1。擦除操作將所有位設為 1。

### Q2: 如何防止 OTA 更新失敗導致設備變磚？

A: 使用雙分區策略 (A/B partition)，保留舊韌體作為備份。更新失敗時可以回滾。

### Q3: 安全啟動會增加多少啟動時間？

A: 典型的 RSA-2048 簽名驗證約需 100-500ms，取決於 MCU 性能。

### Q4: 如何選擇加密算法？

A:
- **AES-128/256**: 對稱加密，速度快，適合大量數據
- **RSA-2048**: 非對稱加密，用於簽名和金鑰交換
- **ECDSA**: 橢圓曲線簽名，更短的金鑰長度

### Q5: Flash 的壽命有多長？

A:
- **內部 Flash**: 通常 10,000 次擦除週期
- **SPI Flash**: 通常 100,000 次擦除週期
- 使用磨損平衡技術可以延長壽命

## 🤝 貢獻

歡迎提交問題報告、功能請求或代碼貢獻！

## 📄 授權

所有範例代碼採用 MIT 授權，可自由用於商業和非商業項目。

---

**最後更新**: 2025-11-17
**維護者**: AI-Assisted Firmware Development Team
**版本**: 1.0.0
