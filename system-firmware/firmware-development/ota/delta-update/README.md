# Delta Update - 差分更新實現

## 概述

實現基於塊的差分更新算法，通過生成和應用差分補丁來減少 OTA 更新所需的下載數據量，特別適合帶寬受限的場景。

## 功能特點

- **塊差分算法**: 基於固定大小塊的差分算法
- **運行長度編碼**: 自動檢測並壓縮重複數據
- **補丁生成**: 從新舊固件生成差分補丁
- **補丁應用**: 應用差分補丁生成新固件
- **完整性驗證**: SHA256 校驗和驗證
- **進度跟踪**: 實時進度回調
- **70-90% 流量節省**: 顯著減少下載數據量

## 目錄結構

```
delta-update/
├── delta_updater.h         # 差分更新應用器接口
├── delta_updater.c         # 差分更新應用器實現
├── patch_generator.h       # 補丁生成器接口
├── patch_generator.c       # 補丁生成器實現
├── block_diff.h           # 塊差分算法接口
├── block_diff.c           # 塊差分算法實現
├── test_delta.c           # 測試程序
├── Makefile              # 構建文件
└── README.md             # 本文檔
```

## 差分算法

### 塊差分 (Block Diff)

將固件分成固定大小的塊（默認 4KB），比較新舊固件的每個塊：

1. **COPY 操作**: 塊內容相同，從舊固件複製
2. **ADD 操作**: 塊內容不同，添加新數據
3. **RUN 操作**: 檢測到重複數據，使用運行長度編碼

### 補丁格式

```
+------------------+
| Patch Header     | - 魔數、版本、大小、校驗和等
+------------------+
| Operation 1      | - COPY/ADD/RUN 操作
+------------------+
| Operation 2      |
+------------------+
| ...              |
+------------------+
```

### 補丁頭部結構

```c
typedef struct {
    uint32_t magic;                 /* "DPAT" */
    uint32_t version;               /* 補丁版本 */
    uint32_t old_size;              /* 舊固件大小 */
    uint32_t new_size;              /* 新固件大小 */
    uint8_t old_checksum[32];       /* 舊固件 SHA256 */
    uint8_t new_checksum[32];       /* 新固件 SHA256 */
    char old_version[32];           /* 舊版本號 */
    char new_version[32];           /* 新版本號 */
    uint32_t patch_size;            /* 補丁數據大小 */
    uint32_t block_size;            /* 塊大小 */
    uint32_t compression;           /* 壓縮算法 */
} delta_patch_header_t;
```

## API 接口

### 補丁生成 API

#### 創建補丁生成器

```c
patch_generator_config_t config = {
    .block_size = 4096,
    .enable_compression = false,
    .verbose = true,
    .match_threshold = 32
};

patch_generator_context_t *ctx = patch_generator_create(&config);
```

#### 生成補丁

```c
int ret = patch_generator_generate(ctx,
                                   "old_firmware.bin",
                                   "new_firmware.bin",
                                   "firmware.patch");

if (ret == DELTA_ERR_NONE) {
    printf("Patch generated successfully\n");
}
```

#### 獲取統計信息

```c
uint32_t copy_bytes, add_bytes, run_bytes;
patch_generator_get_stats(ctx, &copy_bytes, &add_bytes, &run_bytes);

float ratio = patch_generator_get_compression_ratio(ctx);
printf("Compression ratio: %.2f%%\n", ratio);
```

#### 清理

```c
patch_generator_destroy(ctx);
```

### 補丁應用 API

#### 初始化差分更新器

```c
delta_context_t ctx;
int ret = delta_updater_init(&ctx,
                             "old_firmware.bin",
                             "firmware.patch",
                             "new_firmware.bin");

if (ret != DELTA_ERR_NONE) {
    fprintf(stderr, "Failed to initialize: %d\n", ret);
}
```

#### 驗證補丁頭部

```c
ret = delta_updater_validate_header(&ctx);

if (ret != DELTA_ERR_NONE) {
    fprintf(stderr, "Invalid patch header: %d\n", ret);
}
```

#### 應用補丁

```c
void progress_callback(uint32_t current, uint32_t total, void *user_data)
{
    int percent = (total > 0) ? (current * 100 / total) : 0;
    printf("\rProgress: %d%%", percent);
    fflush(stdout);
}

ret = delta_updater_apply_patch(&ctx, progress_callback, NULL);

if (ret != DELTA_ERR_NONE) {
    fprintf(stderr, "Failed to apply patch: %d\n", ret);
}
```

#### 驗證生成的固件

```c
ret = delta_updater_verify(&ctx);

if (ret != DELTA_ERR_NONE) {
    fprintf(stderr, "Verification failed: %d\n", ret);
}
```

#### 清理

```c
delta_updater_cleanup(&ctx);
```

### 塊差分 API

```c
/* 創建塊差分上下文 */
block_diff_context_t *ctx = block_diff_create(4096);

/* 生成差分 */
int ret = block_diff_generate(ctx, old_file, new_file, patch_file);

/* 獲取統計信息 */
block_diff_stats_t stats;
block_diff_get_stats(ctx, &stats);

printf("Total blocks: %u\n", stats.total_blocks);
printf("Matched blocks: %u\n", stats.matched_blocks);
printf("Different blocks: %u\n", stats.different_blocks);

/* 清理 */
block_diff_destroy(ctx);
```

## 使用示例

### 生成差分補丁

```c
#include "patch_generator.h"

int main(void)
{
    /* 配置補丁生成器 */
    patch_generator_config_t config = {
        .block_size = 4096,
        .enable_compression = false,
        .verbose = true,
        .match_threshold = 32
    };

    /* 創建生成器 */
    patch_generator_context_t *ctx = patch_generator_create(&config);
    if (!ctx) {
        fprintf(stderr, "Failed to create patch generator\n");
        return 1;
    }

    /* 生成補丁 */
    int ret = patch_generator_generate(ctx,
                                       "firmware_v1.0.bin",
                                       "firmware_v1.1.bin",
                                       "firmware_v1.0_to_v1.1.patch");

    if (ret == DELTA_ERR_NONE) {
        /* 顯示統計信息 */
        uint32_t copy_bytes, add_bytes, run_bytes;
        patch_generator_get_stats(ctx, &copy_bytes, &add_bytes, &run_bytes);

        printf("Patch Statistics:\n");
        printf("  COPY operations: %u bytes\n", copy_bytes);
        printf("  ADD operations: %u bytes\n", add_bytes);
        printf("  RUN operations: %u bytes\n", run_bytes);
        printf("  Compression ratio: %.2f%%\n",
               patch_generator_get_compression_ratio(ctx));
    } else {
        fprintf(stderr, "Failed to generate patch: %d\n", ret);
    }

    patch_generator_destroy(ctx);
    return (ret == DELTA_ERR_NONE) ? 0 : 1;
}
```

### 應用差分補丁

```c
#include "delta_updater.h"

void progress_callback(uint32_t current, uint32_t total, void *user_data)
{
    int percent = (total > 0) ? (current * 100 / total) : 0;
    printf("\rApplying patch: %d%% (%u/%u bytes)", percent, current, total);
    fflush(stdout);
}

int main(void)
{
    delta_context_t ctx;

    /* 初始化 */
    int ret = delta_updater_init(&ctx,
                                 "firmware_v1.0.bin",
                                 "firmware_v1.0_to_v1.1.patch",
                                 "firmware_v1.1_new.bin");

    if (ret != DELTA_ERR_NONE) {
        fprintf(stderr, "Failed to initialize: %d\n", ret);
        return 1;
    }

    /* 驗證補丁頭部 */
    ret = delta_updater_validate_header(&ctx);
    if (ret != DELTA_ERR_NONE) {
        fprintf(stderr, "Invalid patch header: %d\n", ret);
        delta_updater_cleanup(&ctx);
        return 1;
    }

    /* 應用補丁 */
    ret = delta_updater_apply_patch(&ctx, progress_callback, NULL);
    printf("\n");

    if (ret != DELTA_ERR_NONE) {
        fprintf(stderr, "Failed to apply patch: %d\n", ret);
        delta_updater_cleanup(&ctx);
        return 1;
    }

    /* 驗證結果 */
    ret = delta_updater_verify(&ctx);
    if (ret != DELTA_ERR_NONE) {
        fprintf(stderr, "Verification failed: %d\n", ret);
        delta_updater_cleanup(&ctx);
        return 1;
    }

    printf("Patch applied successfully!\n");

    delta_updater_cleanup(&ctx);
    return 0;
}
```

## 編譯和測試

### 編譯

```bash
make
```

### 運行測試

```bash
make test
```

### 安裝

```bash
sudo make install
```

### 清理

```bash
make clean
```

## 性能分析

### 典型壓縮比

| 場景 | 新舊版本差異 | 補丁大小比例 | 流量節省 |
|------|-------------|-------------|---------|
| 小改動 | < 5% | 5-10% | 90-95% |
| 中等改動 | 10-30% | 15-40% | 60-85% |
| 大改動 | > 50% | 50-80% | 20-50% |

### 內存使用

- **塊大小 4KB**: ~128KB 內存
- **塊大小 8KB**: ~256KB 內存
- **塊大小 16KB**: ~512KB 內存

### 處理速度

- **補丁生成**: ~5-10 MB/s
- **補丁應用**: ~10-20 MB/s

## 錯誤碼

| 錯誤碼 | 名稱 | 說明 |
|--------|------|------|
| 0 | DELTA_ERR_NONE | 成功 |
| -1 | DELTA_ERR_INVALID_PARAM | 無效參數 |
| -2 | DELTA_ERR_NO_MEMORY | 內存不足 |
| -3 | DELTA_ERR_IO | IO 錯誤 |
| -4 | DELTA_ERR_CORRUPT_PATCH | 補丁損壞 |
| -5 | DELTA_ERR_VERSION_MISMATCH | 版本不匹配 |
| -6 | DELTA_ERR_CHECKSUM | 校驗和錯誤 |
| -7 | DELTA_ERR_SIZE | 大小不匹配 |
| -8 | DELTA_ERR_UNSUPPORTED | 不支持的功能 |

## 優化建議

### 塊大小選擇

- **小塊 (1-2KB)**: 更精細的差分，但開銷較大
- **中塊 (4-8KB)**: 平衡效果，推薦使用
- **大塊 (16-32KB)**: 處理速度快，但差分粗糙

### 內存優化

```c
/* 使用較小的塊大小 */
config.block_size = 2048;

/* 禁用校驗和驗證（僅開發時） */
delta_updater_set_verify(&ctx, false);
```

### 速度優化

```c
/* 使用較大的塊大小 */
config.block_size = 8192;

/* 降低匹配閾值 */
config.match_threshold = 64;
```

## 安全考慮

1. **完整性驗證**
   - 始終驗證舊固件校驗和
   - 驗證新固件校驗和
   - 使用 SHA256 確保安全性

2. **版本檢查**
   - 檢查補丁版本兼容性
   - 驗證舊固件版本號
   - 確保正確的升級路徑

3. **錯誤處理**
   - 驗證失敗時拒絕應用
   - 保留原始固件備份
   - 提供回滾機制

## 故障排查

### 補丁生成失敗

- 檢查舊固件和新固件是否存在
- 確保有足夠的磁盤空間
- 驗證文件讀取權限

### 補丁應用失敗

- 驗證舊固件版本是否匹配
- 檢查補丁文件是否損壞
- 確認有足夠的內存

### 校驗和不匹配

- 確保舊固件未被修改
- 驗證補丁文件完整性
- 檢查傳輸過程中的錯誤

## 版本歷史

- **v1.0.0** - 初始版本
  - 基礎塊差分算法
  - 補丁生成和應用
  - SHA256 校驗和驗證
  - 運行長度編碼優化

## 許可證

MIT License

## 相關文檔

- [Update Protocol](../update-protocol/README.md) - OTA 更新協議
- [Rollback System](../rollback-system/README.md) - 回滾系統
- [OTA Manager](../README.md) - OTA 管理器總覽
