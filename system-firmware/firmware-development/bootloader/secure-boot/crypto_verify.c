#include "crypto_verify.h"
#include <string.h>

// SHA-256 常數
static const uint32_t K[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
};

typedef struct {
    uint32_t state[8];
    uint32_t count[2];
    uint8_t buffer[64];
} sha256_ctx_t;

static sha256_ctx_t g_sha256_ctx;

// 輔助函數
#define ROTR(x, n) (((x) >> (n)) | ((x) << (32 - (n))))
#define SHR(x, n) ((x) >> (n))
#define CH(x, y, z) (((x) & (y)) ^ (~(x) & (z)))
#define MAJ(x, y, z) (((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)))
#define EP0(x) (ROTR(x, 2) ^ ROTR(x, 13) ^ ROTR(x, 22))
#define EP1(x) (ROTR(x, 6) ^ ROTR(x, 11) ^ ROTR(x, 25))
#define SIG0(x) (ROTR(x, 7) ^ ROTR(x, 18) ^ SHR(x, 3))
#define SIG1(x) (ROTR(x, 17) ^ ROTR(x, 19) ^ SHR(x, 10))

static void sha256_transform(sha256_ctx_t *ctx, const uint8_t *data)
{
    uint32_t W[64];
    uint32_t a, b, c, d, e, f, g, h;
    uint32_t t1, t2;
    int i;

    // 準備訊息調度
    for (i = 0; i < 16; i++) {
        W[i] = (data[i * 4] << 24) | (data[i * 4 + 1] << 16) |
               (data[i * 4 + 2] << 8) | (data[i * 4 + 3]);
    }

    for (i = 16; i < 64; i++) {
        W[i] = SIG1(W[i - 2]) + W[i - 7] + SIG0(W[i - 15]) + W[i - 16];
    }

    // 初始化工作變數
    a = ctx->state[0];
    b = ctx->state[1];
    c = ctx->state[2];
    d = ctx->state[3];
    e = ctx->state[4];
    f = ctx->state[5];
    g = ctx->state[6];
    h = ctx->state[7];

    // 主迴圈
    for (i = 0; i < 64; i++) {
        t1 = h + EP1(e) + CH(e, f, g) + K[i] + W[i];
        t2 = EP0(a) + MAJ(a, b, c);
        h = g;
        g = f;
        f = e;
        e = d + t1;
        d = c;
        c = b;
        b = a;
        a = t1 + t2;
    }

    // 更新狀態
    ctx->state[0] += a;
    ctx->state[1] += b;
    ctx->state[2] += c;
    ctx->state[3] += d;
    ctx->state[4] += e;
    ctx->state[5] += f;
    ctx->state[6] += g;
    ctx->state[7] += h;
}

void sha256_init(void)
{
    g_sha256_ctx.count[0] = 0;
    g_sha256_ctx.count[1] = 0;
    g_sha256_ctx.state[0] = 0x6a09e667;
    g_sha256_ctx.state[1] = 0xbb67ae85;
    g_sha256_ctx.state[2] = 0x3c6ef372;
    g_sha256_ctx.state[3] = 0xa54ff53a;
    g_sha256_ctx.state[4] = 0x510e527f;
    g_sha256_ctx.state[5] = 0x9b05688c;
    g_sha256_ctx.state[6] = 0x1f83d9ab;
    g_sha256_ctx.state[7] = 0x5be0cd19;
}

void sha256_update(const uint8_t *data, uint32_t length)
{
    uint32_t i, index, part_len;

    index = (g_sha256_ctx.count[0] >> 3) & 0x3F;

    if ((g_sha256_ctx.count[0] += (length << 3)) < (length << 3)) {
        g_sha256_ctx.count[1]++;
    }
    g_sha256_ctx.count[1] += (length >> 29);

    part_len = 64 - index;

    if (length >= part_len) {
        memcpy(&g_sha256_ctx.buffer[index], data, part_len);
        sha256_transform(&g_sha256_ctx, g_sha256_ctx.buffer);

        for (i = part_len; i + 63 < length; i += 64) {
            sha256_transform(&g_sha256_ctx, &data[i]);
        }

        index = 0;
    } else {
        i = 0;
    }

    memcpy(&g_sha256_ctx.buffer[index], &data[i], length - i);
}

void sha256_final(uint8_t *hash)
{
    uint8_t bits[8];
    uint32_t index, pad_len;

    // 儲存位數
    for (int i = 0; i < 8; i++) {
        bits[i] = (g_sha256_ctx.count[i >= 4 ? 0 : 1] >> ((3 - (i & 3)) * 8)) & 0xFF;
    }

    // Pad
    index = (g_sha256_ctx.count[0] >> 3) & 0x3F;
    pad_len = (index < 56) ? (56 - index) : (120 - index);
    uint8_t padding[64];
    memset(padding, 0, sizeof(padding));
    padding[0] = 0x80;
    sha256_update(padding, pad_len);

    // 附加長度
    sha256_update(bits, 8);

    // 儲存結果
    for (int i = 0; i < 32; i++) {
        hash[i] = (g_sha256_ctx.state[i >> 2] >> ((3 - (i & 3)) * 8)) & 0xFF;
    }

    // 清除敏感資料
    secure_memzero(&g_sha256_ctx, sizeof(g_sha256_ctx));
}

void sha256_compute(const uint8_t *data, uint32_t length, uint8_t *hash)
{
#ifdef USE_HW_CRYPTO
    if (hw_sha256_compute(data, length, hash)) {
        return;
    }
#endif

    sha256_init();
    sha256_update(data, length);
    sha256_final(hash);
}

/**
 * @brief RSA 簽名驗證 (簡化版，實際應使用 mbedTLS 等)
 * @note 這是一個簡化的實作，生產環境應使用成熟的加密庫
 */
bool rsa_verify_signature(
    const uint8_t *signature,
    const uint8_t *hash,
    uint32_t hash_len,
    const public_key_t *public_key)
{
#ifdef USE_HW_CRYPTO
    if (hw_rsa_verify(signature, hash, hash_len, public_key)) {
        return true;
    }
#endif

    // 注意: 這裡應該實作完整的 RSA 驗證
    // 包括:
    // 1. 使用公鑰 (modulus, exponent) 解密簽名
    // 2. PKCS#1 v1.5 或 PSS 填充驗證
    // 3. 比較解密後的哈希與計算的哈希
    //
    // 建議使用成熟的加密庫:
    // - mbedTLS
    // - wolfSSL
    // - BearSSL
    //
    // 此處為範例框架

    // 暫時返回 false，需要整合加密庫
    (void)signature;
    (void)hash;
    (void)hash_len;
    (void)public_key;

    // TODO: 整合真實的 RSA 驗證
    return false;
}

/**
 * @brief 常數時間比較，防止時序攻擊
 */
bool constant_time_compare(const uint8_t *a, const uint8_t *b, uint32_t len)
{
    volatile uint8_t result = 0;

    for (uint32_t i = 0; i < len; i++) {
        result |= a[i] ^ b[i];
    }

    return (result == 0);
}

/**
 * @brief 安全清除記憶體
 */
void secure_memzero(void *ptr, uint32_t len)
{
    volatile uint8_t *p = (volatile uint8_t *)ptr;
    while (len--) {
        *p++ = 0;
    }
}
