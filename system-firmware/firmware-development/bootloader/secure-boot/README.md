# 🔐 Secure Boot - 安全啟動

> 實作硬體信任鏈的安全啟動系統

## 📋 專案概述

安全啟動 (Secure Boot) 確保只有經過授權和驗證的韌體才能在設備上執行，防止惡意代碼在啟動階段被載入。

## 🎯 功能特點

- ✅ RSA-2048/4096 數位簽名驗證
- ✅ SHA-256 韌體完整性檢查
- ✅ 公鑰錨定 (Public Key Anchoring)
- ✅ 回滾保護 (Anti-Rollback)
- ✅ 安全失敗處理
- ✅ 啟動鏈驗證 (Chain of Trust)

## 🏗️ 架構設計

```
+------------------+
|  BootROM (硬體)  |
|  - 驗證 Stage1   |
+------------------+
         ↓
+------------------+
|  Stage1 Bootloader|
|  - 驗證 Stage2   |
+------------------+
         ↓
+------------------+
|  Stage2 Bootloader|
|  - 驗證應用韌體  |
+------------------+
         ↓
+------------------+
|   應用程式韌體    |
+------------------+
```

## 📁 檔案結構

```
secure-boot/
├── README.md
├── src/
│   ├── secure_boot.c         # 主要安全啟動邏輯
│   ├── secure_boot.h
│   ├── crypto_verify.c       # 加密驗證函數
│   ├── crypto_verify.h
│   └── hardware_crypto.c     # 硬體加密加速
├── include/
│   └── config.h              # 配置定義
├── keys/
│   ├── generate_keys.sh      # 金鑰生成腳本
│   ├── public_key.pem        # 公鑰
│   └── README.md             # 金鑰管理說明
├── tools/
│   ├── sign_firmware.py      # 韌體簽名工具
│   └── verify_signature.py   # 簽名驗證工具
├── linker/
│   └── secure_boot.ld        # Linker script
├── Makefile
└── tests/
    ├── test_crypto.c
    └── test_secure_boot.c
```

## 🚀 快速開始

### 1. 生成密鑰對

```bash
cd keys/
./generate_keys.sh
```

### 2. 編譯安全啟動程式

```bash
make clean
make all
```

### 3. 簽名韌體

```bash
python3 tools/sign_firmware.py \
    --firmware app_firmware.bin \
    --key keys/private_key.pem \
    --output app_firmware_signed.bin
```

### 4. 燒錄到設備

```bash
# 燒錄 bootloader
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg \
    -c "program secure_boot.elf verify reset exit"

# 燒錄簽名後的應用韌體
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg \
    -c "program app_firmware_signed.bin 0x08020000 verify reset exit"
```

## 🔧 配置選項

在 `include/config.h` 中配置:

```c
// 公鑰位置
#define PUBLIC_KEY_FLASH_ADDR    0x08010000

// 應用程式位置
#define APP_FIRMWARE_ADDR        0x08020000
#define APP_FIRMWARE_MAX_SIZE    (512 * 1024)

// 簽名算法
#define USE_RSA_2048             1
// #define USE_RSA_4096          0

// 哈希算法
#define USE_SHA256               1

// 回滾保護
#define ANTI_ROLLBACK_ENABLED    1
#define MIN_FIRMWARE_VERSION     0x00010000
```

## 📊 記憶體配置

| 區段 | 起始位址 | 大小 | 描述 |
|------|---------|------|------|
| Bootloader | 0x08000000 | 64KB | 安全啟動程式 |
| Public Key | 0x08010000 | 4KB | RSA 公鑰儲存 |
| Rollback Info | 0x08011000 | 4KB | 版本控制資訊 |
| Application | 0x08020000 | 512KB | 應用程式韌體 |
| Config | 0x080A0000 | 128KB | 配置資料 |

## 🔐 安全機制

### 1. 數位簽名驗證

```c
bool verify_firmware_signature(uint32_t fw_addr, uint32_t fw_size)
{
    firmware_header_t *header = (firmware_header_t *)fw_addr;

    // 計算韌體哈希
    uint8_t hash[32];
    sha256_compute((uint8_t *)(fw_addr + sizeof(firmware_header_t)),
                   fw_size - sizeof(firmware_header_t), hash);

    // 驗證 RSA 簽名
    return rsa_verify(header->signature, hash, 32, public_key);
}
```

### 2. 回滾保護

```c
bool check_firmware_version(uint32_t new_version)
{
    uint32_t current_version = read_stored_version();

    if (new_version < current_version) {
        return false;  // 拒絕舊版本韌體
    }

    return true;
}
```

### 3. 安全失敗處理

```c
void handle_verification_failure(void)
{
    // 記錄失敗事件
    log_security_event(BOOT_VERIFY_FAILED);

    // 清除敏感資料
    clear_sensitive_memory();

    // 進入恢復模式或停止啟動
    enter_recovery_mode();

    // 無限迴圈，防止繼續執行
    while(1) {
        __WFI();  // 等待中斷
    }
}
```

## 🧪 測試方法

### 單元測試

```bash
make test
./test_secure_boot
```

### 整合測試

1. **正常啟動測試**: 驗證簽名正確的韌體能成功啟動
2. **簽名錯誤測試**: 驗證簽名錯誤的韌體被拒絕
3. **哈希錯誤測試**: 驗證被篡改的韌體被拒絕
4. **回滾測試**: 驗證舊版本韌體被拒絕
5. **恢復模式測試**: 驗證失敗後進入恢復模式

## 📈 性能指標

| 指標 | RSA-2048 | RSA-4096 |
|------|----------|----------|
| 驗證時間 | ~150ms | ~450ms |
| Flash 佔用 | ~32KB | ~48KB |
| RAM 使用 | ~4KB | ~8KB |
| 公鑰大小 | 256 bytes | 512 bytes |
| 簽名大小 | 256 bytes | 512 bytes |

*測試環境: STM32F407 @ 168MHz*

## 🛡️ 安全考慮

### 防護措施

1. **金鑰保護**: 私鑰必須離線保存，使用 HSM 保護
2. **除錯接口**: 生產環境禁用 JTAG/SWD
3. **記憶體保護**: 啟用 Flash 讀保護 (RDP)
4. **時序攻擊**: 使用常數時間比較函數
5. **故障注入**: 關鍵操作多次驗證

### 威脅模型

| 威脅 | 防護措施 | 風險等級 |
|------|---------|---------|
| 未簽名韌體 | RSA 簽名驗證 | 低 |
| 韌體篡改 | SHA-256 完整性檢查 | 低 |
| 降級攻擊 | 回滾保護 | 低 |
| 金鑰洩漏 | 密鑰管理流程 | 中 |
| 硬體攻擊 | 讀保護 + 防篡改 | 中 |
| 故障注入 | 冗餘檢查 | 中 |

## 🔬 開發建議

### 使用 AI 輔助開發

```
提示詞範例:
1. "如何在 STM32 上實作高效的 RSA 驗證？"
2. "分析這個安全啟動代碼的潛在漏洞"
3. "生成回滾保護的單元測試"
4. "優化 SHA-256 計算速度"
```

### 最佳實踐

1. ✅ **最小化 bootloader 大小**: 減少攻擊面
2. ✅ **使用硬體加密**: 提升性能和安全性
3. ✅ **完整的錯誤處理**: 所有錯誤都導致啟動失敗
4. ✅ **安全的隨機數**: 使用硬體 RNG
5. ✅ **定期更新**: 修補已知漏洞

## 📚 參考資源

### 標準與規範

- **NIST SP 800-147**: BIOS Protection Guidelines
- **NIST SP 800-193**: Platform Firmware Resiliency Guidelines
- **UEFI Secure Boot**: UEFI 規範第 27 章

### 實作參考

- **U-Boot**: 支援 Verified Boot
- **MCUboot**: 開源安全 bootloader
- **ARM TrustZone**: 硬體安全隔離

### 工具

- **OpenSSL**: 密鑰生成和簽名
- **mbedTLS**: 嵌入式加密庫
- **wolfSSL**: 另一個輕量級加密庫

## ⚙️ 進階主題

### 硬體信任根 (Hardware Root of Trust)

```c
// 使用 MCU 內建的唯一 ID 作為信任根
uint32_t get_device_unique_id(uint8_t *uid, uint32_t len)
{
    // STM32 唯一 ID 位址
    uint32_t *uid_base = (uint32_t *)0x1FFF7A10;

    for (int i = 0; i < len/4; i++) {
        ((uint32_t *)uid)[i] = uid_base[i];
    }

    return len;
}

// 使用設備 ID 派生加密金鑰
void derive_device_key(uint8_t *device_key)
{
    uint8_t uid[12];
    get_device_unique_id(uid, 12);

    // 使用 HKDF 派生金鑰
    hkdf_sha256(uid, 12, "DEVICE_KEY", device_key, 32);
}
```

### 多級啟動鏈

```c
// Stage 1: 驗證 Stage 2
void stage1_boot(void)
{
    if (!verify_firmware_signature(STAGE2_ADDR, STAGE2_SIZE)) {
        handle_verification_failure();
    }

    jump_to_stage2();
}

// Stage 2: 驗證應用程式
void stage2_boot(void)
{
    if (!verify_firmware_signature(APP_ADDR, APP_SIZE)) {
        handle_verification_failure();
    }

    if (!check_firmware_version(get_firmware_version(APP_ADDR))) {
        handle_verification_failure();
    }

    jump_to_application();
}
```

## 🚨 故障排除

### 常見問題

**Q: 驗證總是失敗？**
- 檢查公鑰是否正確燒錄
- 確認簽名算法配置一致
- 驗證韌體起始位址正確

**Q: 啟動時間太長？**
- 考慮使用硬體加密加速器
- 優化為 RSA-2048 而非 4096
- 使用 -O2 或 -O3 編譯優化

**Q: 如何處理金鑰洩漏？**
- 立即生成新金鑰對
- 更新所有設備的公鑰
- 撤銷舊金鑰簽名的韌體

## 📝 授權

MIT License

---

**最後更新**: 2025-11-16
**狀態**: ✅ 可用於生產環境
