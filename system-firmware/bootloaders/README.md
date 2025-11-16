# 🚀 Bootloader 開發
> 使用 AI 驅動的方法進行引導載入程式開發

⚠️ **驗證階段專案** - 此領域目前處於研究與開發階段

## 📋 專案概述

Bootloader (引導載入程式) 是系統啟動的第一段程式碼，負責初始化硬體、載入作業系統或應用程式。本專案展示如何使用 AI 輔助工具來開發各種平台的 Bootloader。

## 🎯 開發領域

### 1. U-Boot 開發
- **通用 Bootloader**
  - ARM/MIPS/x86 支援
  - 設備樹配置
  - 網路啟動 (TFTP)
  - USB 啟動
  - SD/MMC 啟動

- **客製化功能**
  - 自定義命令
  - 環境變數管理
  - 啟動腳本
  - Splash Screen
  - 安全啟動整合

### 2. GRUB 開發
- **PC Bootloader**
  - 多重開機
  - UEFI 支援
  - 主題客製化
  - 模組系統
  - 加密分區啟動

- **配置管理**
  - grub.cfg 生成
  - 核心參數設定
  - 救援模式
  - 網路啟動

### 3. UEFI 應用開發
- **UEFI Bootloader**
  - EDK II 框架
  - UEFI 驅動開發
  - Boot Manager
  - Secure Boot
  - GOP 圖形介面

- **系統服務**
  - Runtime Services
  - Boot Services
  - 變數儲存
  - 時間服務

### 4. ARM Trusted Firmware
- **安全韌體**
  - BL1/BL2/BL31 開發
  - Secure Monitor
  - TrustZone 配置
  - 電源管理
  - 平台移植

- **安全功能**
  - Secure Boot
  - 固件驗證
  - 金鑰管理
  - 安全服務

### 5. 自定義 MCU Bootloader
- **微控制器啟動**
  - 最小化 Bootloader
  - UART 更新
  - USB DFU
  - CAN Bootloader
  - 雙分區切換

- **應用更新**
  - IAP (In-App Programming)
  - 更新協議
  - CRC 校驗
  - 回滾機制

### 6. 多重開機系統
- **多系統管理**
  - Windows/Linux 雙系統
  - Android 多 ROM
  - 救援系統
  - 啟動菜單
  - 預設系統選擇

### 7. 啟動優化
- **性能調優**
  - 啟動時間分析
  - 並行初始化
  - 快速啟動模式
  - 延遲載入
  - Kernel 解壓縮優化

### 8. 救援系統開發
- **恢復功能**
  - 最小 Linux 系統
  - 韌體恢復
  - 分區修復
  - 資料救援
  - 網路診斷

## 🛠️ 技術棧

### 開發語言
- **C** - Bootloader 主要語言
- **Assembly** - 啟動代碼
- **Python** - 建構腳本
- **Bash** - 自動化工具

### 開發工具
- **編譯器**
  - GCC ARM
  - LLVM/Clang
  - EDK II Build Tools

- **除錯工具**
  - JTAG/SWD
  - QEMU 模擬
  - Serial Console
  - OpenOCD

## 🚀 快速開始

### 1. 簡單 MCU Bootloader

```c
// bootloader.c - STM32 簡易 Bootloader
#include "stm32f4xx_hal.h"

#define APP_ADDRESS         0x08020000  // 應用程式起始位置
#define BOOTLOADER_SIZE     0x20000     // Bootloader 大小 128KB
#define UPDATE_FLAG_ADDR    0x08000000  // 更新標誌位置

typedef void (*app_function)(void);

// 跳轉到應用程式
void jump_to_application(uint32_t app_addr)
{
    // 檢查堆疊指針有效性 (必須在 RAM 範圍內)
    uint32_t app_stack = *((__IO uint32_t *)app_addr);
    if ((app_stack & 0x2FFE0000) != 0x20000000) {
        return;  // 無效的堆疊指針
    }

    // 取得應用程式重置處理器地址
    app_function app_reset_handler = (app_function)(*((__IO uint32_t *)(app_addr + 4)));

    // 禁用所有中斷
    __disable_irq();

    // 重置所有外設
    HAL_DeInit();

    // 禁用 SysTick
    SysTick->CTRL = 0;
    SysTick->LOAD = 0;
    SysTick->VAL = 0;

    // 清除所有待處理中斷
    for (int i = 0; i < 8; i++) {
        NVIC->ICER[i] = 0xFFFFFFFF;
        NVIC->ICPR[i] = 0xFFFFFFFF;
    }

    // 設置向量表偏移
    SCB->VTOR = app_addr;

    // 設置主堆疊指針
    __set_MSP(app_stack);

    // 跳轉到應用程式
    app_reset_handler();
}

// Bootloader 主程式
int main(void)
{
    HAL_Init();
    SystemClock_Config();

    // 初始化 UART (用於更新)
    UART_Init();

    // 初始化 LED
    GPIO_Init();

    // 檢查更新標誌
    uint32_t update_flag = *((__IO uint32_t *)UPDATE_FLAG_ADDR);

    if (update_flag == 0xDEADBEEF) {
        // 進入更新模式
        LED_Blink_Fast();
        enter_update_mode();
    }

    // 檢查是否有有效的應用程式
    uint32_t app_stack = *((__IO uint32_t *)APP_ADDRESS);
    if ((app_stack & 0x2FFE0000) == 0x20000000) {
        // 有效的應用程式，跳轉
        LED_Off();
        jump_to_application(APP_ADDRESS);
    }

    // 沒有有效應用程式，等待更新
    LED_On();
    while (1) {
        wait_for_update();
    }

    return 0;
}

// UART 韌體更新協議
void enter_update_mode(void)
{
    uint8_t rx_buffer[256];
    uint32_t write_address = APP_ADDRESS;
    uint32_t total_size = 0;

    UART_SendString("Bootloader: Ready for update\r\n");

    while (1) {
        // 接收命令
        uint8_t cmd = UART_ReceiveByte();

        switch (cmd) {
            case 0x01:  // 開始更新
                // 擦除應用程式區域
                UART_SendString("Erasing...\r\n");
                Flash_Erase(APP_ADDRESS, 0x60000);
                write_address = APP_ADDRESS;
                UART_SendByte(0xAA);  // ACK
                break;

            case 0x02:  // 寫入數據
                {
                    // 接收數據長度
                    uint16_t len = UART_ReceiveByte() | (UART_ReceiveByte() << 8);

                    // 接收數據
                    for (uint16_t i = 0; i < len; i++) {
                        rx_buffer[i] = UART_ReceiveByte();
                    }

                    // 寫入 Flash
                    Flash_Write(write_address, rx_buffer, len);
                    write_address += len;
                    total_size += len;

                    UART_SendByte(0xAA);  // ACK
                }
                break;

            case 0x03:  // 完成更新
                UART_SendString("Update complete!\r\n");
                UART_SendString("Rebooting...\r\n");

                // 清除更新標誌
                Flash_Write(UPDATE_FLAG_ADDR, (uint8_t[]){0xFF, 0xFF, 0xFF, 0xFF}, 4);

                HAL_Delay(100);
                NVIC_SystemReset();
                break;

            default:
                UART_SendByte(0xFF);  // NACK
                break;
        }
    }
}
```

### 2. U-Boot 基礎配置

```c
// include/configs/myboard.h - U-Boot 板級配置
#ifndef __CONFIG_MYBOARD_H
#define __CONFIG_MYBOARD_H

/* CPU 配置 */
#define CONFIG_ARM_ARCH_7
#define CONFIG_SYS_THUMB_BUILD

/* 記憶體配置 */
#define CONFIG_SYS_SDRAM_BASE   0x80000000
#define CONFIG_SYS_SDRAM_SIZE   0x40000000  // 1GB

/* 串口配置 */
#define CONFIG_SYS_NS16550
#define CONFIG_SYS_NS16550_SERIAL
#define CONFIG_SYS_NS16550_CLK  48000000
#define CONFIG_CONS_INDEX       1
#define CONFIG_BAUDRATE         115200

/* Flash 配置 */
#define CONFIG_SYS_FLASH_BASE   0x08000000
#define CONFIG_ENV_OFFSET       0x100000
#define CONFIG_ENV_SIZE         0x10000

/* 網路配置 */
#define CONFIG_CMD_NET
#define CONFIG_CMD_PING
#define CONFIG_CMD_DHCP
#define CONFIG_IPADDR           192.168.1.100
#define CONFIG_SERVERIP         192.168.1.1

/* 啟動配置 */
#define CONFIG_BOOTDELAY        3
#define CONFIG_BOOTCOMMAND      \
    "mmc dev 0; " \
    "fatload mmc 0:1 ${loadaddr} zImage; " \
    "fatload mmc 0:1 ${fdtaddr} devicetree.dtb; " \
    "bootz ${loadaddr} - ${fdtaddr}"

/* 環境變數 */
#define CONFIG_EXTRA_ENV_SETTINGS \
    "loadaddr=0x82000000\0" \
    "fdtaddr=0x88000000\0" \
    "console=ttyS0,115200n8\0" \
    "bootargs=console=${console} root=/dev/mmcblk0p2 rootwait rw\0"

#endif /* __CONFIG_MYBOARD_H */
```

### 3. GRUB 配置範例

```bash
# /boot/grub/grub.cfg
set timeout=5
set default=0

# 主題配置
set theme=/boot/grub/themes/mytheme/theme.txt

# Linux 啟動項
menuentry 'Linux' {
    insmod gzio
    insmod part_gpt
    insmod ext2
    set root='hd0,gpt2'
    linux /vmlinuz root=/dev/sda2 ro quiet splash
    initrd /initrd.img
}

# Linux 救援模式
menuentry 'Linux (Recovery)' {
    insmod gzio
    insmod part_gpt
    insmod ext2
    set root='hd0,gpt2'
    linux /vmlinuz root=/dev/sda2 ro recovery nomodeset
    initrd /initrd.img
}

# Windows 啟動項
menuentry 'Windows' {
    insmod part_gpt
    insmod ntfs
    set root='hd0,gpt1'
    chainloader /EFI/Microsoft/Boot/bootmgfw.efi
}

# 記憶體測試
menuentry 'Memory Test' {
    linux16 /memtest86+.bin
}
```

### 4. USB DFU Bootloader (STM32)

```c
// usb_dfu_bootloader.c
#include "stm32f4xx_hal.h"
#include "usb_device.h"
#include "usbd_dfu.h"

#define DFU_APP_ADDRESS  0x08010000

// DFU 狀態
typedef enum {
    DFU_STATE_IDLE,
    DFU_STATE_DOWNLOAD,
    DFU_STATE_UPLOAD,
    DFU_STATE_ERROR
} dfu_state_t;

static dfu_state_t dfu_state = DFU_STATE_IDLE;
static uint32_t dfu_address = DFU_APP_ADDRESS;

// DFU 下載回調 (接收韌體)
void DFU_Download_Callback(uint8_t *buf, uint32_t len, uint32_t offset)
{
    if (offset == 0) {
        // 第一個數據塊，擦除 Flash
        Flash_Erase(DFU_APP_ADDRESS, 0x70000);
        dfu_address = DFU_APP_ADDRESS;
    }

    // 寫入 Flash
    Flash_Write(dfu_address, buf, len);
    dfu_address += len;
}

// DFU 上傳回調 (讀取韌體)
void DFU_Upload_Callback(uint8_t *buf, uint32_t *len, uint32_t offset)
{
    uint32_t read_len = (*len > 256) ? 256 : *len;
    Flash_Read(DFU_APP_ADDRESS + offset, buf, read_len);
    *len = read_len;
}

// 檢測 DFU 模式
bool Check_DFU_Mode(void)
{
    // 檢查 GPIO 按鈕 (例如: Boot 按鈕)
    if (HAL_GPIO_ReadPin(BOOT_BTN_GPIO_Port, BOOT_BTN_Pin) == GPIO_PIN_RESET) {
        return true;
    }

    // 檢查特殊記憶體標記
    if (*(uint32_t *)0x2001FFFC == 0xDFUMODE) {
        // 清除標記
        *(uint32_t *)0x2001FFFC = 0;
        return true;
    }

    return false;
}

int main(void)
{
    HAL_Init();
    SystemClock_Config();
    GPIO_Init();

    if (Check_DFU_Mode()) {
        // 進入 DFU 模式
        LED_Blink();
        MX_USB_DEVICE_Init();

        while (1) {
            // DFU 處理由 USB 中斷完成
        }
    } else {
        // 正常啟動應用程式
        jump_to_application(DFU_APP_ADDRESS);
    }

    return 0;
}
```

## 📚 開發範例

### 範例 1: 啟動時間測量

```c
// boot_time_profiler.c
#include <stdint.h>

typedef struct {
    const char *name;
    uint32_t timestamp;
} boot_event_t;

#define MAX_EVENTS 32
static boot_event_t boot_events[MAX_EVENTS];
static uint32_t event_count = 0;

// 記錄啟動事件
void boot_log_event(const char *name)
{
    if (event_count < MAX_EVENTS) {
        boot_events[event_count].name = name;
        boot_events[event_count].timestamp = HAL_GetTick();
        event_count++;
    }
}

// 顯示啟動時間分析
void boot_print_profile(void)
{
    printf("Boot Time Profile:\n");
    printf("%-30s %10s %10s\n", "Event", "Time(ms)", "Delta(ms)");
    printf("-------------------------------------------------------------\n");

    for (uint32_t i = 0; i < event_count; i++) {
        uint32_t delta = (i > 0) ?
            (boot_events[i].timestamp - boot_events[i-1].timestamp) : 0;

        printf("%-30s %10lu %10lu\n",
               boot_events[i].name,
               boot_events[i].timestamp,
               delta);
    }

    printf("Total boot time: %lu ms\n", boot_events[event_count-1].timestamp);
}
```

### 範例 2: Secure Boot 驗證

```c
// secure_boot.c
#include "mbedtls/rsa.h"
#include "mbedtls/sha256.h"

#define PUBLIC_KEY_N    /* RSA 公鑰 modulus */
#define PUBLIC_KEY_E    65537

typedef struct {
    uint32_t magic;
    uint32_t version;
    uint32_t image_size;
    uint8_t  hash[32];
    uint8_t  signature[256];
} signed_image_header_t;

bool verify_image_signature(uint32_t image_addr)
{
    signed_image_header_t *header = (signed_image_header_t *)image_addr;
    mbedtls_rsa_context rsa;
    int ret;

    // 檢查魔數
    if (header->magic != 0x53454355) {  // "SECU"
        return false;
    }

    // 計算鏡像哈希
    uint8_t calculated_hash[32];
    mbedtls_sha256((uint8_t *)(image_addr + sizeof(signed_image_header_t)),
                   header->image_size,
                   calculated_hash, 0);

    // 驗證哈希匹配
    if (memcmp(header->hash, calculated_hash, 32) != 0) {
        return false;
    }

    // 初始化 RSA 上下文
    mbedtls_rsa_init(&rsa, MBEDTLS_RSA_PKCS_V15, 0);
    mbedtls_mpi_read_binary(&rsa.N, PUBLIC_KEY_N, sizeof(PUBLIC_KEY_N));
    mbedtls_mpi_lset(&rsa.E, PUBLIC_KEY_E);
    rsa.len = 256;

    // 驗證簽名
    ret = mbedtls_rsa_pkcs1_verify(&rsa, NULL, NULL,
                                   MBEDTLS_RSA_PUBLIC,
                                   MBEDTLS_MD_SHA256,
                                   32, calculated_hash,
                                   header->signature);

    mbedtls_rsa_free(&rsa);

    return (ret == 0);
}
```

## 🤖 AI 輔助開發策略

### 1. Bootloader 架構設計
```
"設計一個支援多種更新方式的 Bootloader 架構"
"如何實作安全啟動鏈？"
"Bootloader 與應用程式如何通訊？"
```

### 2. 程式碼生成
```
"生成 STM32 的 USB DFU Bootloader"
"創建支援 A/B 分區的啟動邏輯"
"實作 CAN Bootloader 協議"
```

### 3. 除錯協助
```
"Bootloader 跳轉失敗可能是什麼原因？"
"如何除錯早期啟動代碼？"
"UART 沒有輸出如何診斷？"
```

### 4. 優化建議
```
"如何減少 Bootloader 大小？"
"啟動時間優化策略"
"並行初始化的實作方法"
```

## 📊 專案結構

```
bootloaders/
├── README.md
├── mcu-bootloader/
│   ├── stm32/
│   ├── esp32/
│   └── nordic/
├── u-boot/
│   ├── board-configs/
│   ├── custom-commands/
│   └── drivers/
├── grub/
│   ├── themes/
│   ├── configs/
│   └── modules/
├── uefi/
│   ├── bootloader/
│   ├── drivers/
│   └── applications/
└── tools/
    ├── firmware-signer/
    ├── update-packager/
    └── boot-profiler/
```

## 🧪 開發路線圖

### Phase 1: 基礎 Bootloader ✅
- [x] 簡單跳轉功能
- [x] UART 更新
- [x] Flash 操作
- [x] 基本驗證

### Phase 2: 進階功能
- [ ] USB DFU
- [ ] 網路更新
- [ ] 多分區管理
- [ ] 回滾機制

### Phase 3: 安全強化
- [ ] Secure Boot
- [ ] 簽名驗證
- [ ] 加密鏡像
- [ ] 防回滾攻擊

### Phase 4: 優化與工具
- [ ] 啟動時間優化
- [ ] 更新工具開發
- [ ] 測試框架
- [ ] 文檔完善

## 🔬 學習資源

### 書籍推薦
1. **Das U-Boot Manual**
2. **UEFI Specification**
3. **GNU GRUB Manual**
4. **ARM Trusted Firmware Design**

### 線上資源
- [U-Boot Documentation](https://u-boot.readthedocs.io/)
- [GRUB Manual](https://www.gnu.org/software/grub/manual/)
- [TianoCore EDK II](https://github.com/tianocore/tianocore.github.io/wiki/EDK-II)
- [ARM Trusted Firmware](https://www.trustedfirmware.org/)

## ⚙️ 開發最佳實踐

### 1. 最小化設計
```c
// 只包含必要功能
#define BOOTLOADER_FEATURES \
    (FEATURE_UART_UPDATE | \
     FEATURE_BASIC_VERIFY | \
     FEATURE_DUAL_BANK)
```

### 2. 穩定可靠
```c
// 多重驗證
if (!verify_checksum(image) ||
    !verify_signature(image) ||
    !verify_version(image)) {
    boot_fallback();
}
```

### 3. 安全第一
```c
// 禁用除錯接口 (生產環境)
#ifndef DEBUG_BUILD
    DBGMCU->CR = 0;  // 禁用除錯
    disable_jtag();
    disable_swd();
#endif
```

## ⚠️ 注意事項

### 關鍵考慮
- **可靠性**: Bootloader 損壞可能導致設備變磚
- **安全性**: 必須驗證韌體完整性
- **兼容性**: 向後兼容舊版本
- **恢復機制**: 必須有緊急恢復方法

### 常見陷阱
- **堆疊設置**: 跳轉前正確設置堆疊指針
- **向量表**: 應用程式向量表偏移
- **時鐘配置**: 確保時鐘正確初始化
- **外設重置**: 跳轉前重置所有外設

## 📄 授權

範例代碼採用 MIT 授權

---

**最後更新**: 2025-11-16
**狀態**: 🚧 研究與開發中
**維護者**: AI-Assisted Development Team
