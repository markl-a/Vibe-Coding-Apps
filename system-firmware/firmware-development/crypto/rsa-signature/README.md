# ✍️ RSA Signature - RSA 數位簽名

## 概述

RSA 數位簽名實作，支援 PKCS#1 v1.5 和 PSS 填充方案。

## 功能特點

- ✅ RSA-2048/4096 (可擴展至 1024/3072)
- ✅ PKCS#1 v1.5 簽名
- ✅ PSS 填充支援
- ✅ SHA-256/384/512 哈希
- ✅ PEM/DER 密鑰格式
- ✅ 硬體加速支援 (STM32, ESP32, mbedTLS)
- ✅ 完整單元測試
- ✅ 性能基準測試

## 文件結構

```
rsa-signature/
├── rsa_crypto.h                  # API 頭文件
├── rsa_crypto.c                  # 實現文件
├── test_rsa.c                    # 單元測試
├── Makefile                      # 構建文件
├── README.md                     # 本文件
└── examples/
    ├── example_firmware_sign.c   # 固件簽名示例
    └── example_pss.c             # PSS 簽名示例
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

# 生成密鑰對
make keygen

# 清理
make clean
```

### 生成密鑰對

```bash
# RSA-2048 密鑰對
make keygen

# RSA-4096 密鑰對
make keygen4096

# 查看密鑰信息
make keyinfo
```

## 使用範例

### 簽名生成 (私鑰操作)

```c
#include "rsa_crypto.h"

void sign_firmware(void)
{
    uint8_t firmware[65536];
    uint8_t hash[32];
    uint8_t signature[256];  // RSA-2048
    size_t sig_len;

    // 載入私鑰
    rsa_private_key_t priv_key;
    const char *pem_data = "-----BEGIN RSA PRIVATE KEY-----\n...";
    rsa_load_private_key_pem(&priv_key, pem_data, strlen(pem_data), NULL);

    // 計算固件哈希
    size_t hash_len;
    rsa_compute_hash(RSA_HASH_SHA256, firmware, sizeof(firmware),
                    hash, &hash_len);

    // 簽名
    rsa_sign_pkcs1v15(&priv_key, RSA_HASH_SHA256,
                     hash, hash_len, signature, &sig_len);

    // 清除私鑰
    rsa_free_private_key(&priv_key);
}
```

### 簽名驗證 (公鑰操作)

```c
void verify_firmware(void)
{
    uint8_t firmware[65536];
    uint8_t hash[32];
    uint8_t signature[256];
    size_t hash_len;

    // 載入公鑰
    rsa_public_key_t pub_key;
    const char *pem_data = "-----BEGIN PUBLIC KEY-----\n...";
    rsa_load_public_key_pem(&pub_key, pem_data, strlen(pem_data));

    // 計算固件哈希
    rsa_compute_hash(RSA_HASH_SHA256, firmware, sizeof(firmware),
                    hash, &hash_len);

    // 驗證簽名
    int ret = rsa_verify_pkcs1v15(&pub_key, RSA_HASH_SHA256,
                                 hash, hash_len, signature, 256);
    if (ret == RSA_OK) {
        printf("Signature valid!\n");
    } else {
        printf("Signature invalid!\n");
    }

    rsa_free_public_key(&pub_key);
}
```

### PSS 簽名 (推薦)

```c
void sign_with_pss(void)
{
    rsa_private_key_t priv_key;
    uint8_t hash[32];
    uint8_t signature[256];
    size_t sig_len;

    // ... 載入密鑰和計算哈希 ...

    // 使用 PSS 簽名 (更安全)
    rsa_sign_pss(&priv_key, RSA_HASH_SHA256,
                hash, 32, signature, &sig_len, 0);

    // 驗證 PSS 簽名
    rsa_verify_pss(&pub_key, RSA_HASH_SHA256,
                  hash, 32, signature, sig_len, 0);
}
```

## API 參考

### 密鑰管理

```c
// 生成密鑰對
int rsa_generate_keypair(rsa_public_key_t *public_key,
                        rsa_private_key_t *private_key,
                        rsa_key_size_t key_size,
                        uint32_t exponent);

// 載入公鑰 (PEM)
int rsa_load_public_key_pem(rsa_public_key_t *key,
                           const char *pem_data,
                           size_t pem_len);

// 載入私鑰 (PEM)
int rsa_load_private_key_pem(rsa_private_key_t *key,
                            const char *pem_data,
                            size_t pem_len,
                            const char *password);

// 釋放密鑰
void rsa_free_public_key(rsa_public_key_t *key);
void rsa_free_private_key(rsa_private_key_t *key);
```

### 簽名和驗證

```c
// PKCS#1 v1.5 簽名
int rsa_sign_pkcs1v15(const rsa_private_key_t *key,
                     rsa_hash_t hash_alg,
                     const uint8_t *hash,
                     size_t hash_len,
                     uint8_t *signature,
                     size_t *sig_len);

// PKCS#1 v1.5 驗證
int rsa_verify_pkcs1v15(const rsa_public_key_t *key,
                       rsa_hash_t hash_alg,
                       const uint8_t *hash,
                       size_t hash_len,
                       const uint8_t *signature,
                       size_t sig_len);

// PSS 簽名
int rsa_sign_pss(const rsa_private_key_t *key,
                rsa_hash_t hash_alg,
                const uint8_t *hash,
                size_t hash_len,
                uint8_t *signature,
                size_t *sig_len,
                size_t salt_len);

// PSS 驗證
int rsa_verify_pss(const rsa_public_key_t *key,
                  rsa_hash_t hash_alg,
                  const uint8_t *hash,
                  size_t hash_len,
                  const uint8_t *signature,
                  size_t sig_len,
                  size_t salt_len);
```

### 工具函數

```c
// 計算哈希
int rsa_compute_hash(rsa_hash_t hash_alg,
                    const uint8_t *data,
                    size_t data_len,
                    uint8_t *hash,
                    size_t *hash_len);

// 獲取哈希長度
size_t rsa_get_hash_length(rsa_hash_t hash_alg);

// 獲取簽名長度
size_t rsa_get_signature_length(rsa_key_size_t key_size);

// 錯誤信息
const char* rsa_get_error_string(int error_code);
```

## 金鑰管理

### 使用 OpenSSL 生成密鑰

```bash
# 生成 RSA-2048 私鑰
openssl genrsa -out private_key.pem 2048

# 從私鑰提取公鑰
openssl rsa -in private_key.pem -pubout -out public_key.pem

# 生成加密的私鑰
openssl genrsa -aes256 -out private_key_encrypted.pem 2048

# 查看公鑰資訊
openssl rsa -in public_key.pem -pubin -text -noout

# 查看私鑰資訊
openssl rsa -in private_key.pem -text -noout
```

### 使用 Makefile

```bash
# 生成 RSA-2048 密鑰對
make keygen

# 生成 RSA-4096 密鑰對
make keygen4096

# 查看密鑰信息
make keyinfo
```

## 硬體加速支持

### STM32 平台

在 `rsa_crypto.h` 中配置：

```c
#define RSA_HW_ACCEL RSA_HW_ACCEL_STM32
```

需要 STM32 HAL 庫和 PKA 外設支持。

### ESP32 平台

```c
#define RSA_HW_ACCEL RSA_HW_ACCEL_ESP32
```

需要 ESP-IDF 框架。

### mbedTLS 軟體實現

```c
#define RSA_HW_ACCEL RSA_HW_ACCEL_MBEDTLS
```

使用 mbedTLS 庫，跨平台支持。

## 性能基準

典型性能數據 (mbedTLS, x86_64):

| 操作      | 密鑰大小 | 性能           |
|-----------|----------|----------------|
| 簽名      | 2048-bit | ~50 ops/sec    |
| 驗證      | 2048-bit | ~1500 ops/sec  |
| 簽名      | 4096-bit | ~10 ops/sec    |
| 驗證      | 4096-bit | ~500 ops/sec   |

硬體加速可提供 2-5 倍性能提升。

## 安全性說明

### 最佳實踐

1. **密鑰大小選擇**
   - 最小使用 RSA-2048
   - 高安全要求使用 RSA-4096
   - 不推薦使用 RSA-1024

2. **填充方案**
   - 優先使用 PSS (更安全)
   - PKCS#1 v1.5 用於兼容性

3. **哈希算法**
   - 使用 SHA-256 或更強
   - 不要使用 SHA-1 或 MD5

4. **私鑰保護**
   - 私鑰必須保密
   - 使用密碼加密私鑰
   - 使用後立即清除：`rsa_free_private_key()`
   - 考慮使用硬體安全模組 (HSM)

5. **固件簽名流程**
   - 開發環境簽名 (離線)
   - 設備僅驗證 (在線)
   - 公鑰可以公開
   - 私鑰永不離開安全環境

### 常見陷阱

- ❌ 密鑰太小 (< 2048 bits)
- ❌ 使用弱哈希算法 (MD5, SHA-1)
- ❌ 私鑰未加密存儲
- ❌ 在不安全設備上使用私鑰
- ✅ 使用 PSS 填充
- ✅ RSA-2048 或更大
- ✅ SHA-256 或更強

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

# 內存洩漏檢查
make memcheck
```

## 依賴

- **mbedTLS**: 2.28.0 或更高版本
- **GCC**: 4.9 或更高版本
- **Make**: GNU Make 3.81 或更高版本
- **OpenSSL**: (可選) 用於密鑰生成

## 許可證

本模組遵循項目主許可證。

**狀態**: ✅ 可用
