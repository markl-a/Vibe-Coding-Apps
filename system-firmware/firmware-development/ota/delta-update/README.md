# 🔄 Delta Update - 差分更新

## 概述

實作差分更新算法，僅傳輸韌體變更部分，減少下載時間和流量消耗。

## 功能特點

- ✅ 二進制差分算法 (bsdiff)
- ✅ 壓縮支援 (gzip, lzma)
- ✅ 塊級差分
- ✅ 內存優化
- ✅ 70-90% 流量節省

## 差分包生成 (工具端)

```bash
# 生成差分包
./bsdiff old_firmware.bin new_firmware.bin delta.patch

# 壓縮差分包
gzip delta.patch

# 簽名差分包
./sign_tool delta.patch.gz
```

## 差分包應用 (設備端)

```c
#include "delta_update.h"

void apply_delta(void)
{
    // 讀取當前韌體 (舊版本)
    uint8_t *old_fw = (uint8_t *)0x08010000;
    uint32_t old_size = 512 * 1024;

    // 讀取差分包
    uint8_t delta_patch[128 * 1024];
    uint32_t delta_size = download_delta_patch(delta_patch);

    // 應用差分，生成新韌體
    uint8_t *new_fw = malloc(512 * 1024);
    if (delta_apply(old_fw, old_size, delta_patch, delta_size, new_fw) == 0) {
        // 驗證新韌體
        if (verify_firmware(new_fw)) {
            // 寫入 Flash
            flash_write(0x08090000, new_fw, 512 * 1024);
        }
    }
    free(new_fw);
}
```

## 性能對比

| 更新方式 | 下載大小 | 時間 (4G網絡) |
|---------|---------|--------------|
| 完整更新 | 512 KB  | ~8 秒        |
| 差分更新 | 64 KB   | ~1 秒        |
| 節省     | 87.5%   | 87.5%        |

**狀態**: ✅ 可用
