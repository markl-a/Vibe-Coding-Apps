# ✍️ RSA Signature - RSA 數位簽名

## 概述

RSA 數位簽名實作，支援 PKCS#1 v1.5 和 PSS 填充方案。

## 功能特點

- ✅ RSA-1024/2048/4096
- ✅ PKCS#1 v1.5 簽名
- ✅ PSS 填充支援
- ✅ SHA-256/384/512 哈希
- ✅ PEM/DER 密鑰格式

## 使用範例

### 簽名生成 (私鑰操作)

```c
#include "rsa_signature.h"

void sign_firmware(void)
{
    uint8_t firmware[65536];
    uint8_t hash[32];
    uint8_t signature[256];  // RSA-2048

    // 計算哈希
    sha256_compute(firmware, sizeof(firmware), hash);

    // 載入私鑰
    rsa_private_key_t key;
    rsa_load_private_key(&key, "private_key.pem");

    // 簽名
    rsa_sign_pkcs1v15(&key, hash, 32, signature);

    // 清除私鑰
    rsa_free_private_key(&key);
}
```

### 簽名驗證 (公鑰操作)

```c
void verify_firmware(void)
{
    uint8_t firmware[65536];
    uint8_t hash[32];
    uint8_t signature[256];

    // 計算哈希
    sha256_compute(firmware, sizeof(firmware), hash);

    // 載入公鑰
    rsa_public_key_t key;
    rsa_load_public_key(&key, "public_key.pem");

    // 驗證簽名
    if (rsa_verify_pkcs1v15(&key, hash, 32, signature)) {
        printf("Signature valid!\n");
    } else {
        printf("Signature invalid!\n");
    }

    rsa_free_public_key(&key);
}
```

## 金鑰管理

```bash
# 生成密鑰對
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem

# 查看公鑰資訊
openssl rsa -in public_key.pem -pubin -text -noout
```

**狀態**: ✅ 可用
