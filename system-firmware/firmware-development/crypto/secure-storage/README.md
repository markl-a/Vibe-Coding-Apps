# 🗄️ Secure Storage - 安全存儲

## 概述

加密的安全存儲系統，用於保護敏感數據如密鑰、證書和憑證。

## 功能特點

- ✅ AES-256-GCM 加密存儲
- ✅ 基於設備 UID 的密鑰派生 (HKDF-SHA256)
- ✅ 防篡改保護 (認證加密)
- ✅ 訪問控制
- ✅ 安全擦除
- ✅ 16 個密鑰槽位管理
- ✅ CRC32 完整性檢查
- ✅ 完整單元測試

## 文件結構

```
secure-storage/
├── secure_storage.h          # 安全存儲 API 頭文件
├── secure_storage.c          # 安全存儲實現
├── key_management.h          # 密鑰管理 API 頭文件
├── key_management.c          # 密鑰管理實現
├── test_storage.c            # 單元測試
├── Makefile                  # 構建文件
├── README.md                 # 本文件
└── examples/
    └── example_secure_storage.c  # 使用示例
```

## 快速開始

### 編譯庫

```bash
# 編譯靜態庫和測試
make

# 運行測試
make test

# 編譯示例
make examples

# 清理
make clean
```

## 使用範例

### 初始化和存儲數據

```c
#include "secure_storage.h"

void store_secrets(void)
{
    // 初始化安全存儲
    secure_storage_context_t ctx;
    int ret = secure_storage_init(&ctx);
    if (ret != STORAGE_OK) {
        printf("Error: %s\n", secure_storage_get_error_string(ret));
        return;
    }

    // 存儲 WiFi 密碼
    const char *wifi_pass = "MySecretPassword123";
    ret = secure_storage_write(&ctx, SLOT_WIFI_PASSWORD,
                               (const uint8_t *)wifi_pass,
                               strlen(wifi_pass));
    if (ret != STORAGE_OK) {
        printf("Error: %s\n", secure_storage_get_error_string(ret));
    }

    // 存儲 API 密鑰
    const char *api_key = "sk-1234567890abcdef";
    ret = secure_storage_write(&ctx, SLOT_API_KEY,
                               (const uint8_t *)api_key,
                               strlen(api_key));

    // 清理
    secure_storage_deinit(&ctx);
}
```

### 讀取敏感數據

```c
void read_secrets(void)
{
    secure_storage_context_t ctx;
    secure_storage_init(&ctx);

    uint8_t buffer[256];
    size_t data_len;

    // 讀取 API 密鑰
    int ret = secure_storage_read(&ctx, SLOT_API_KEY,
                                 buffer, sizeof(buffer), &data_len);
    if (ret == STORAGE_OK) {
        // 使用 API 密鑰
        buffer[data_len] = '\0';
        printf("API Key: %s\n", buffer);

        // 使用完畢後清除
        secure_storage_memzero(buffer, sizeof(buffer));
    } else if (ret == STORAGE_ERR_SLOT_EMPTY) {
        printf("Slot is empty\n");
    } else if (ret == STORAGE_ERR_AUTH_FAILED) {
        printf("Authentication failed - data may be tampered!\n");
    }

    secure_storage_deinit(&ctx);
}
```

### 安全擦除

```c
void erase_secrets(void)
{
    secure_storage_context_t ctx;
    secure_storage_init(&ctx);

    // 擦除單個槽位
    secure_storage_erase(&ctx, SLOT_API_KEY);

    // 擦除所有數據
    secure_storage_erase_all(&ctx);

    secure_storage_deinit(&ctx);
}
```

## API 參考

### 核心函數

```c
// 初始化
int secure_storage_init(secure_storage_context_t *ctx);

// 清理
void secure_storage_deinit(secure_storage_context_t *ctx);

// 寫入數據
int secure_storage_write(secure_storage_context_t *ctx,
                         storage_slot_t slot,
                         const uint8_t *data,
                         size_t data_size);

// 讀取數據
int secure_storage_read(secure_storage_context_t *ctx,
                        storage_slot_t slot,
                        uint8_t *data,
                        size_t buffer_size,
                        size_t *data_size);

// 擦除槽位
int secure_storage_erase(secure_storage_context_t *ctx,
                         storage_slot_t slot);

// 擦除所有
int secure_storage_erase_all(secure_storage_context_t *ctx);

// 檢查槽位
bool secure_storage_is_slot_used(const secure_storage_context_t *ctx,
                                 storage_slot_t slot);
```

### 密鑰管理

```c
// HKDF 密鑰派生
int key_derive_hkdf_sha256(const uint8_t *input_key, size_t input_len,
                          const uint8_t *salt, size_t salt_len,
                          const char *info,
                          uint8_t *output_key, size_t output_len);

// PBKDF2 密鑰派生
int key_derive_pbkdf2_sha256(const char *password, size_t password_len,
                            const uint8_t *salt, size_t salt_len,
                            uint32_t iterations,
                            uint8_t *output_key, size_t output_len);

// 從設備 UID 派生密鑰
int key_derive_from_device_uid(const uint8_t *device_uid, size_t uid_len,
                               uint8_t *master_key);

// 生成隨機密鑰
int key_generate_random(uint8_t *key, size_t key_len);

// 生成隨機 IV
int key_generate_iv(uint8_t *iv, size_t iv_len);

// 安全清除
void key_secure_erase(uint8_t *key, size_t len);
```

## 存儲槽位

系統提供 16 個預定義槽位：

```c
typedef enum {
    SLOT_WIFI_PASSWORD = 0,     // WiFi 憑證
    SLOT_API_KEY,               // API 密鑰
    SLOT_PRIVATE_KEY,           // RSA/ECC 私鑰
    SLOT_CERTIFICATE,           // X.509 證書
    SLOT_ENCRYPTION_KEY,        // 加密密鑰
    SLOT_FIRMWARE_KEY,          // 固件簽名密鑰
    SLOT_USER_DATA_1,           // 用戶數據
    SLOT_USER_DATA_2,           // 用戶數據
    SLOT_USER_DATA_3,           // 用戶數據
    SLOT_USER_DATA_4,           // 用戶數據
    // ... 保留槽位 ...
} storage_slot_t;
```

每個槽位可存儲最多 4KB 數據。

## 密鑰派生流程

```
設備 UID (16 bytes)
    ↓
HKDF-SHA256
    ↓
主密鑰 (32 bytes, AES-256)
    ↓
AES-256-GCM 加密
    ↓
加密數據 + 認證標籤
```

## 安全性說明

### 加密機制

1. **AES-256-GCM**
   - 認證加密 (AEAD)
   - 防止篡改
   - 128-bit 認證標籤

2. **密鑰派生**
   - HKDF-SHA256
   - 基於設備唯一 ID
   - 不可逆推

3. **完整性保護**
   - CRC32 校驗
   - GCM 認證標籤
   - 元數據保護

### 最佳實踐

1. **初始化**
   ```c
   // 總是檢查返回值
   if (secure_storage_init(&ctx) != STORAGE_OK) {
       // 處理錯誤
   }
   ```

2. **使用後清除**
   ```c
   // 使用敏感數據後立即清除
   secure_storage_memzero(buffer, buffer_size);
   ```

3. **錯誤處理**
   ```c
   // 檢查認證失敗
   if (ret == STORAGE_ERR_AUTH_FAILED) {
       // 數據可能被篡改
       alert_security_breach();
   }
   ```

4. **定期驗證**
   ```c
   // 定期驗證數據完整性
   storage_slot_t corrupted[16];
   size_t num_corrupted;
   secure_storage_verify_integrity(&ctx, corrupted, &num_corrupted);
   ```

### 威脅模型

**防護的攻擊**:
- ✅ 未授權讀取 (加密)
- ✅ 數據篡改 (認證標籤)
- ✅ 重放攻擊 (Nonce)
- ✅ 冷啟動攻擊 (設備綁定)

**不防護的攻擊**:
- ❌ 物理側信道攻擊
- ❌ 調試器訪問
- ❌ DMA 攻擊
- ❌ 電源分析

建議配合硬體安全模組 (HSM/TPM) 使用。

## 硬體平台支持

### STM32 平台

需要配置：
- Flash/EEPROM 作為後端存儲
- 硬體隨機數生成器 (RNG)
- 設備唯一 ID 寄存器

### ESP32 平台

需要配置：
- NVS (Non-Volatile Storage)
- 硬體隨機數生成器
- eFuse 設備 ID

### 通用平台

使用 mbedTLS 軟體實現，配合文件系統。

## 測試

```bash
# 運行所有測試
make test

# 測試覆蓋
make coverage

# 靜態分析
make analyze
```

## 依賴

- **mbedTLS**: 2.28.0 或更高版本 (加密、哈希、HKDF)
- **GCC**: 4.9 或更高版本
- **Make**: GNU Make 3.81 或更高版本

## 性能

典型操作時間 (x86_64, mbedTLS):

| 操作       | 時間         |
|-----------|--------------|
| 初始化     | ~5 ms        |
| 寫入 (1KB) | ~2 ms        |
| 讀取 (1KB) | ~2 ms        |
| 擦除       | ~1 ms        |

實際性能取決於後端存儲速度 (Flash/EEPROM)。

## 許可證

本模組遵循項目主許可證。

**狀態**: ✅ 可用
