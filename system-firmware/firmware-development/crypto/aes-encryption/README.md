# 🔐 AES Encryption - AES 加密

## 概述

實作 AES-128/192/256 加密算法，支持多種模式 (ECB, CBC, CTR, GCM)。

## 功能特點

- ✅ AES-128/192/256
- ✅ ECB/CBC/CTR/GCM 模式
- ✅ 硬體加速支援 (STM32, ESP32, mbedTLS)
- ✅ PKCS#7 填充
- ✅ 安全記憶體清除
- ✅ GCM 認證加密
- ✅ 完整單元測試
- ✅ 性能基準測試

## 文件結構

```
aes-encryption/
├── aes_crypto.h          # API 頭文件
├── aes_crypto.c          # 實現文件
├── test_aes.c            # 單元測試
├── Makefile              # 構建文件
├── README.md             # 本文件
└── examples/
    ├── example_cbc.c     # CBC 模式示例
    └── example_gcm.c     # GCM 模式示例
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

### 平台特定編譯

```bash
# STM32 平台
make stm32

# ESP32 平台
make esp32
```

## 使用範例

### CBC 模式加密

```c
#include "aes_crypto.h"

void encrypt_data(void)
{
    uint8_t key[32] = {...};  // AES-256 key
    uint8_t iv[16] = {...};   // Initialization vector
    uint8_t plaintext[64] = "Secret data";
    uint8_t ciphertext[64];

    aes_context_t ctx;
    aes_init(&ctx, AES_KEY_256, AES_MODE_CBC);
    aes_set_key(&ctx, key, 32);
    aes_set_iv(&ctx, iv, 16);

    aes_encrypt(&ctx, plaintext, ciphertext, 64);

    aes_free(&ctx);
}
```

### GCM 模式 (認證加密)

```c
void encrypt_with_auth(void)
{
    uint8_t key[32] = {...};
    uint8_t nonce[12] = {...};
    uint8_t plaintext[64] = "Secret data";
    uint8_t ciphertext[64];
    uint8_t tag[16];  // Authentication tag

    aes_context_t ctx;
    aes_aad_t aad = {
        .data = (uint8_t *)"metadata",
        .length = 8
    };

    aes_init(&ctx, AES_KEY_256, AES_MODE_GCM);
    aes_set_key(&ctx, key, 32);
    aes_set_nonce(&ctx, nonce, 12);

    aes_gcm_encrypt(&ctx, plaintext, 64, ciphertext, &aad, tag);

    // 解密時驗證 tag
    aes_set_nonce(&ctx, nonce, 12);
    if (aes_gcm_decrypt(&ctx, ciphertext, 64, plaintext, &aad, tag) == AES_OK) {
        printf("Decryption and verification OK\n");
    }

    aes_free(&ctx);
}
```

## API 參考

### 初始化和配置

```c
// 初始化
int aes_init(aes_context_t *ctx, aes_key_size_t size, aes_mode_t mode);

// 設置密鑰
int aes_set_key(aes_context_t *ctx, const uint8_t *key, size_t key_len);

// 設置 IV (CBC, CTR 模式)
int aes_set_iv(aes_context_t *ctx, const uint8_t *iv, size_t iv_len);

// 設置 Nonce (GCM 模式)
int aes_set_nonce(aes_context_t *ctx, const uint8_t *nonce, size_t nonce_len);
```

### 加密解密

```c
// 加密
int aes_encrypt(aes_context_t *ctx, const uint8_t *in, uint8_t *out, size_t len);

// 解密
int aes_decrypt(aes_context_t *ctx, const uint8_t *in, uint8_t *out, size_t len);

// GCM 認證加密
int aes_gcm_encrypt(aes_context_t *ctx, const uint8_t *input, size_t input_len,
                    uint8_t *output, const aes_aad_t *aad, uint8_t *tag);

// GCM 認證解密
int aes_gcm_decrypt(aes_context_t *ctx, const uint8_t *input, size_t input_len,
                    uint8_t *output, const aes_aad_t *aad, const uint8_t *tag);
```

### 工具函數

```c
// 清理
void aes_free(aes_context_t *ctx);

// PKCS#7 填充
int aes_pkcs7_pad(uint8_t *data, size_t data_len, size_t buffer_size, size_t *padded_len);
int aes_pkcs7_unpad(const uint8_t *data, size_t padded_len, size_t *unpadded_len);

// 安全清除
void aes_secure_memzero(void *ptr, size_t len);

// 錯誤信息
const char* aes_get_error_string(int error_code);
```

## 硬體加速支持

### STM32 平台

在 `aes_crypto.h` 中配置：

```c
#define AES_HW_ACCEL AES_HW_ACCEL_STM32
```

需要 STM32 HAL 庫和 CRYP 外設支持。

### ESP32 平台

```c
#define AES_HW_ACCEL AES_HW_ACCEL_ESP32
```

需要 ESP-IDF 框架。

### mbedTLS 軟體實現

```c
#define AES_HW_ACCEL AES_HW_ACCEL_MBEDTLS
```

使用 mbedTLS 庫，跨平台支持。

## 性能基準

典型性能數據 (mbedTLS, x86_64):

| 模式      | 密鑰大小 | 吞吐量        |
|-----------|----------|---------------|
| CBC       | 128-bit  | ~80 MB/s      |
| CBC       | 256-bit  | ~60 MB/s      |
| CTR       | 128-bit  | ~90 MB/s      |
| GCM       | 256-bit  | ~50 MB/s      |

硬體加速可提供 5-10 倍性能提升。

## 安全性說明

### 最佳實踐

1. **永遠不要重用 IV/Nonce**
   - CBC: 每次加密使用隨機 IV
   - GCM: 每個密鑰下 nonce 必須唯一

2. **使用認證加密**
   - 優先使用 GCM 模式
   - 避免單獨使用 ECB 或 CBC 模式

3. **密鑰管理**
   - 使用硬體隨機數生成器生成密鑰
   - 使用後立即清除密鑰：`aes_free()`

4. **填充預言攻擊**
   - 使用 GCM 避免填充
   - 使用 CBC 時驗證填充

### 常見陷阱

- ❌ ECB 模式不安全 (不隱藏模式)
- ❌ CBC 模式容易受到填充預言攻擊
- ❌ 重用 IV/Nonce 會洩露信息
- ✅ 使用 GCM 模式進行認證加密

## 測試

```bash
# 運行所有測試
make test

# 運行性能基準測試
make benchmark

# 生成代碼覆蓋報告
make coverage

# 靜態代碼分析
make analyze
```

## 依賴

- **mbedTLS**: 2.28.0 或更高版本
- **GCC**: 4.9 或更高版本
- **Make**: GNU Make 3.81 或更高版本

## 許可證

本模組遵循項目主許可證。

**狀態**: ✅ 可用
