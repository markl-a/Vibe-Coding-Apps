# Bootloader 使用範例

本目錄包含 bootloader 相關模組的實際應用範例，涵蓋韌體驗證、U-Boot 命令等實用場景。

## 範例列表

### 1. firmware_verify_example.c
**韌體驗證範例**

展示如何使用韌體驗證模組進行安全啟動和 OTA 更新，包含 8 個實際應用場景：

#### 範例 1: 基本 CRC32 計算和驗證
- 計算韌體資料的 CRC32 校驗和
- 驗證資料完整性
- 測試錯誤檢測能力

#### 範例 2: OTA 更新前驗證
- 模擬從網路下載韌體
- 驗證下載的韌體完整性
- 決定是否繼續安裝或重新下載

#### 範例 3: 多區塊韌體驗證
- 分塊下載大型韌體
- 逐塊驗證 CRC32
- 檢測損壞的區塊

#### 範例 4: 增量更新驗證
- 應用韌體補丁
- 驗證更新後的韌體
- 確認更新成功

#### 範例 5: 雙韌體分區驗證（A/B 更新）
- A/B 分區管理
- 驗證待機分區
- 安全切換分區

#### 範例 6: 安全啟動驗證流程
- 完整的安全啟動流程
- 多層驗證（Magic、CRC、簽名）
- 啟動失敗處理

#### 範例 7: 韌體回滾保護
- 版本號檢查
- 防止降級攻擊
- 最小版本控制

#### 範例 8: 批次韌體驗證
- 多模組韌體驗證
- 系統完整性檢查
- 啟動決策

**編譯和運行：**
```bash
# 基本編譯（僅 CRC32）
make firmware_verify_example

# 使用 mbedTLS 編譯（支持 SHA256 和 RSA）
make firmware_verify_example USE_MBEDTLS=1

# 運行範例
./firmware_verify_example
```

**輸出範例：**
```
========================================
  Firmware Verification Examples
========================================

========== Example 1: Basic CRC32 ==========
Firmware Data: Hello, Firmware Update System!
Calculated CRC32: 0x3B8C9D7E
CRC32 Verification: PASSED
Wrong CRC32 Test: FAILED (expected FAILED)

========== Example 2: OTA Update Verification ==========
Downloaded firmware size: 512 bytes
Server CRC32: 0x12345678
Local CRC32:  0xABCDEF12
Status: Firmware corrupted during download!
Action: Re-download required

[... 其他範例輸出 ...]
```

---

### 2. uboot_commands_example.txt
**U-Boot 命令使用範例**

涵蓋 `sysinfo` 和 `factory_reset` 命令的 18 個實際應用場景：

#### sysinfo 命令範例

**基本使用：**
```
=> sysinfo              # 顯示所有系統資訊
=> sysinfo cpu          # 只顯示 CPU 資訊
=> sysinfo mem          # 只顯示記憶體資訊
=> sysinfo boot         # 只顯示啟動資訊
=> sysinfo storage      # 只顯示儲存資訊
=> sysinfo net          # 只顯示網路資訊
=> sysinfo board        # 只顯示板載資訊
```

**實際應用場景：**
- **生產測試**：快速驗證硬體配置是否符合規格
- **故障診斷**：系統無法啟動時檢查硬體狀態
- **網路設置**：查看和配置網路參數
- **記憶體除錯**：檢查記憶體配置和可用空間
- **儲存管理**：確認儲存設備狀態

#### factory_reset 命令範例

**基本使用：**
```
=> factory_reset        # 顯示警告，需要確認
=> factory_reset -y     # 確認執行出廠重置
```

**執行過程：**
1. 清除配置分區
2. 重置環境變數為預設值
3. 儲存預設環境
4. 清除用戶資料
5. 自動重啟

**實際應用場景：**
- **RMA 流程**：退貨維修前清除用戶資料
- **開發除錯**：清除測試配置，恢復乾淨狀態
- **環境損壞**：環境變數損壞時恢復預設
- **系統恢復**：系統無法正常啟動時重置
- **批量生產**：生產後清除測試數據

---

## 編譯指南

### 依賴要求

**基本編譯：**
- GCC 編譯器
- Make 工具

**完整功能（包含 RSA 驗證）：**
- mbedTLS 函式庫

```bash
# Ubuntu/Debian
sudo apt-get install build-essential libmbedtls-dev

# CentOS/RHEL
sudo yum install gcc make mbedtls-devel

# macOS
brew install mbedtls
```

### 編譯步驟

```bash
# 1. 進入範例目錄
cd system-firmware/bootloaders/examples

# 2. 查看可用目標
make help

# 3. 基本編譯（僅 CRC32 功能）
make

# 4. 完整編譯（包含 SHA256 和 RSA）
make USE_MBEDTLS=1

# 5. 編譯並運行
make run

# 6. 清理
make clean
```

---

## 使用指南

### 韌體驗證範例

**場景 1: OTA 更新系統**

```c
// 1. 下載韌體
uint8_t *firmware = download_firmware(url, &size);

// 2. 獲取預期的 CRC（從伺服器）
uint32_t expected_crc = get_firmware_crc_from_server();

// 3. 驗證完整性
if (firmware_verify_crc32(firmware, size, expected_crc)) {
    // 安裝韌體
    install_firmware(firmware, size);
} else {
    // 重新下載
    retry_download();
}
```

**場景 2: 安全啟動**

```c
// 1. 讀取韌體包
uint8_t *package = read_firmware_from_flash(FIRMWARE_ADDR);
uint32_t size = get_firmware_size();

// 2. 讀取公鑰
uint8_t *public_key = read_public_key();
uint32_t key_len = get_key_length();

// 3. 完整驗證
if (firmware_verify_complete(package, size, public_key, key_len)) {
    // 啟動韌體
    jump_to_firmware();
} else {
    // 進入恢復模式
    enter_recovery_mode();
}
```

**場景 3: A/B 分區更新**

```c
// 當前在分區 A
partition_t current = PARTITION_A;
partition_t standby = PARTITION_B;

// 下載新韌體到待機分區
download_to_partition(standby, firmware_url);

// 驗證待機分區
if (verify_partition(standby)) {
    // 標記待機分區為活動
    set_active_partition(standby);
    // 重啟
    reboot();
} else {
    // 繼續使用當前分區
    continue_with_partition(current);
}
```

### U-Boot 命令範例

**場景 1: 生產線測試**

```bash
#!/bin/bash
# 自動化測試腳本

# 連接到 U-Boot 控制台
expect << EOF
spawn minicom -D /dev/ttyUSB0
expect "=>"

# 檢查 CPU
send "sysinfo cpu\r"
expect "Frequency:"
set cpu_freq \$expect_out(buffer)

# 檢查記憶體
send "sysinfo mem\r"
expect "DRAM Size:"
set mem_size \$expect_out(buffer)

# 檢查儲存
send "sysinfo storage\r"
expect "MMC0:"
set storage_info \$expect_out(buffer)

# 驗證結果
# ... 檢查是否符合規格 ...

EOF
```

**場景 2: 除錯工作流程**

```
# 1. 查看系統狀態
=> sysinfo

# 2. 嘗試修改配置
=> setenv bootargs 'console=ttyS0,115200 root=/dev/mmcblk0p2'
=> saveenv

# 3. 測試啟動
=> boot

# 4. 如果出現問題，重置
=> factory_reset -y
```

**場景 3: RMA 流程**

```
# 1. 記錄設備資訊（可選）
=> sysinfo > device_info.txt

# 2. 執行出廠重置
=> factory_reset -y

# 設備將自動重啟並恢復出廠設置
```

---

## 整合到實際專案

### 1. 整合韌體驗證模組

```makefile
# 在你的 Makefile 中添加
SRCS += path/to/firmware_verify.c
CFLAGS += -DUSE_MBEDTLS
LDFLAGS += -lmbedtls -lmbedx509 -lmbedcrypto
```

### 2. 整合 U-Boot 命令

```makefile
# 在 U-Boot 配置中
obj-y += cmd_factory_reset.o
obj-y += cmd_system_info.o
```

```c
// 在 include/configs/your_board.h 中
#define CONFIG_CMD_FACTORY_RESET
#define CONFIG_CMD_SYSINFO
```

---

## 進階主題

### 自定義韌體格式

可以擴展 `firmware_header_t` 結構以支持更多資訊：

```c
typedef struct {
    uint32_t magic;
    uint32_t version;
    uint32_t timestamp;
    uint32_t size;
    uint32_t crc32;
    uint8_t  sha256[32];
    uint8_t  signature[256];

    // 新增欄位
    uint32_t hw_version;      // 硬體版本
    uint32_t min_bootloader;  // 最小 bootloader 版本
    uint8_t  build_id[16];    // 建置 ID
    uint8_t  reserved[48];
} __attribute__((packed)) firmware_header_t;
```

### 實現簽名生成工具

```bash
#!/bin/bash
# sign_firmware.sh - 韌體簽名工具

FIRMWARE=$1
PRIVATE_KEY=$2
OUTPUT=$3

# 計算 SHA256
sha256sum $FIRMWARE > firmware.sha256

# 使用 RSA 私鑰簽名
openssl dgst -sha256 -sign $PRIVATE_KEY -out firmware.sig $FIRMWARE

# 組合韌體包
cat header.bin $FIRMWARE firmware.sig > $OUTPUT
```

### 安全考慮

1. **金鑰管理**
   - 私鑰必須安全儲存
   - 公鑰可以硬編碼在 bootloader 中
   - 考慮使用 HSM（硬體安全模組）

2. **回滾保護**
   - 實現版本檢查
   - 使用防熔斷位（eFuse）儲存最小版本號
   - 防止降級攻擊

3. **驗證鏈**
   - Bootloader 驗證 Kernel
   - Kernel 驗證 Filesystem
   - 建立完整的信任鏈

---

## 故障排除

### 問題 1: 編譯錯誤 - mbedTLS 找不到

```bash
# 解決方案：安裝 mbedTLS 或不使用 RSA 功能
make clean
make  # 不使用 USE_MBEDTLS 標誌
```

### 問題 2: U-Boot 命令無法使用

檢查 U-Boot 配置：
```c
// include/configs/your_board.h
#define CONFIG_CMD_FACTORY_RESET
#define CONFIG_CMD_SYSINFO
```

重新編譯 U-Boot：
```bash
make clean
make your_board_defconfig
make
```

### 問題 3: CRC32 驗證總是失敗

確認：
- 資料長度正確
- 沒有包含不應該計算的資料（如標頭）
- 位元組序（endianness）是否一致

---

## 相關文件

- [MCU Bootloader](../mcu-bootloader/README.md)
- [U-Boot Development](../u-boot-development/README.md)
- [Secure Boot](../secure-boot/README.md)
- [主專案 README](../README.md)

---

## 授權

與主專案相同的授權條款。
