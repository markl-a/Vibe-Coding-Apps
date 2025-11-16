# 🔐 AES Encryption - AES 加密

## 概述

實作 AES-128/192/256 加密算法，支持多種模式 (ECB, CBC, CTR, GCM)。

## 功能特點

- ✅ AES-128/192/256
- ✅ ECB/CBC/CTR/GCM 模式
- ✅ 硬體加速支援
- ✅ PKCS#7 填充
- ✅ 安全記憶體清除

## 使用範例

### CBC 模式加密

```c
#include "aes_encryption.h"

void encrypt_data(void)
{
    uint8_t key[32] = {...};  // AES-256 key
    uint8_t iv[16] = {...};   // Initialization vector
    uint8_t plaintext[64] = "Secret data";
    uint8_t ciphertext[64];

    aes_context_t ctx;
    aes_init(&ctx, AES_256, AES_MODE_CBC);
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

    aes_gcm_encrypt(key, 32, nonce, 12,
                    plaintext, 64, ciphertext, tag);

    // 解密時驗證 tag
    if (aes_gcm_decrypt(key, 32, nonce, 12,
                        ciphertext, 64, plaintext, tag)) {
        printf("Decryption and verification OK\n");
    }
}
```

## API 參考

```c
// 初始化
int aes_init(aes_context_t *ctx, aes_key_size_t size, aes_mode_t mode);

// 加密
int aes_encrypt(aes_context_t *ctx, const uint8_t *in, uint8_t *out, size_t len);

// 解密
int aes_decrypt(aes_context_t *ctx, const uint8_t *in, uint8_t *out, size_t len);

// 清理
void aes_free(aes_context_t *ctx);
```

**狀態**: ✅ 可用
