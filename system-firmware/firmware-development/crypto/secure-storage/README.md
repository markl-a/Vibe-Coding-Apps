# 🗄️ Secure Storage - 安全存儲

## 概述

加密的安全存儲系統，用於保護敏感數據如密鑰、證書和憑證。

## 功能特點

- ✅ AES-256 加密存儲
- ✅ 基於設備 ID 的密鑰派生
- ✅ 防篡改保護
- ✅ 訪問控制
- ✅ 安全擦除
- ✅ 密鑰槽管理

## 使用範例

### 存儲敏感數據

```c
#include "secure_storage.h"

void store_secret(void)
{
    uint8_t api_key[] = "sk-1234567890abcdef";
    uint8_t wifi_password[] = "MySecretPassword";

    // 初始化安全存儲
    secure_storage_init();

    // 存儲 API 密鑰
    secure_storage_write(SLOT_API_KEY, api_key, sizeof(api_key));

    // 存儲 WiFi 密碼
    secure_storage_write(SLOT_WIFI_PASS, wifi_password, sizeof(wifi_password));
}
```

### 讀取敏感數據

```c
void read_secret(void)
{
    uint8_t api_key[64];
    uint32_t size;

    // 讀取 API 密鑰
    if (secure_storage_read(SLOT_API_KEY, api_key, &size) == 0) {
        // 使用 API 密鑰
        use_api_key(api_key, size);

        // 使用完畢後清除
        secure_memzero(api_key, sizeof(api_key));
    }
}
```

### 安全擦除

```c
void erase_all_secrets(void)
{
    // 擦除單個槽位
    secure_storage_erase(SLOT_API_KEY);

    // 擦除所有數據
    secure_storage_erase_all();
}
```

## 密鑰派生

```c
// 基於設備唯一 ID 派生加密密鑰
void derive_encryption_key(void)
{
    uint8_t device_uid[12];
    uint8_t master_key[32];

    // 獲取設備 UID
    get_device_unique_id(device_uid, 12);

    // 使用 HKDF 派生密鑰
    hkdf_sha256(device_uid, 12,
                "SECURE_STORAGE_KEY",
                master_key, 32);

    // 使用 master_key 加密數據
}
```

## 存儲槽位

```c
#define SLOT_API_KEY          0
#define SLOT_WIFI_PASS        1
#define SLOT_CERT             2
#define SLOT_PRIVATE_KEY      3
#define SLOT_USER_DATA        4
#define MAX_SLOTS             16
```

**狀態**: ✅ 可用
