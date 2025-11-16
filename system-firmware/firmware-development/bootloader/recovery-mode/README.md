# 🆘 Recovery Mode - 恢復模式

> 韌體損壞時的緊急恢復系統

## 📋 專案概述

Recovery Mode 提供一個最小化的安全環境，用於在主韌體損壞時恢復設備功能。

## 🎯 功能特點

- ✅ 最小化系統環境
- ✅ UART/USB 韌體刷寫
- ✅ 韌體完整性修復
- ✅ 配置重置
- ✅ 診斷工具
- ✅ 工廠恢復

## 🚀 進入恢復模式

### 觸發條件

1. 按住復位按鈕 + 電源開機
2. 韌體驗證失敗 3 次
3. 應用程式觸發 (軟體重置)
4. 看門狗超時重置

### 視覺指示

- LED 快速閃爍 (10Hz)
- UART 輸出 "RECOVERY MODE"
- USB 設備重新枚舉為 DFU 模式

## 📁 檔案結構

```
recovery-mode/
├── README.md
├── src/
│   ├── recovery_main.c
│   ├── uart_flasher.c
│   ├── usb_dfu.c
│   └── diagnostic.c
├── Makefile
└── tools/
    └── recovery_flash.py
```

## 🔧 核心功能

### 1. UART 刷寫

```c
void uart_flash_mode(void)
{
    uart_println("Ready for firmware upload");
    uart_println("Send binary file using XMODEM...");

    if (xmodem_receive(FLASH_APP_ADDR) == 0) {
        uart_println("Firmware received successfully");
        uart_println("Verifying...");

        if (verify_firmware(FLASH_APP_ADDR)) {
            uart_println("Verification OK, rebooting...");
            system_reset();
        }
    }
}
```

### 2. USB DFU 模式

```c
void usb_dfu_mode(void)
{
    usb_dfu_init();

    while (1) {
        usb_dfu_poll();

        if (dfu_state == DFU_MANIFEST) {
            verify_and_reset();
        }
    }
}
```

### 3. 診斷工具

```c
void run_diagnostics(void)
{
    printf("=== System Diagnostics ===\n");
    printf("Flash Status: %s\n", check_flash() ? "OK" : "FAIL");
    printf("RAM Test: %s\n", ram_test() ? "OK" : "FAIL");
    printf("Peripherals: %s\n", check_peripherals() ? "OK" : "FAIL");
    printf("Clock: %lu MHz\n", get_system_clock() / 1000000);
}
```

## 📊 恢復選單

```
╔══════════════════════════════════╗
║    RECOVERY MODE v1.0.0          ║
╠══════════════════════════════════╣
║ 1. Flash firmware (UART)         ║
║ 2. Flash firmware (USB DFU)      ║
║ 3. Run diagnostics               ║
║ 4. Factory reset                 ║
║ 5. Reboot to main firmware       ║
║ 6. Reboot to bootloader          ║
║ 7. Show system info              ║
║ 8. Exit recovery mode            ║
╚══════════════════════════════════╝
Enter selection: _
```

## 🛠️ 使用工具

### Python 刷寫工具

```bash
# 透過 UART 刷寫
python3 recovery_flash.py --port /dev/ttyUSB0 --file firmware.bin

# 透過 USB DFU 刷寫
python3 recovery_flash.py --dfu --file firmware.bin

# 工廠重置
python3 recovery_flash.py --factory-reset
```

## 🔒 安全考慮

- 恢復模式代碼獨立於主韌體
- 最小化攻擊面
- 可選的密碼保護
- 禁用調試接口(生產環境)

## 📝 授權

MIT License

---

**最後更新**: 2025-11-16
