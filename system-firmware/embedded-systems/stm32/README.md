# STM32 開發專案

STM32 微控制器開發範例專案集合。

## 📁 專案結構

```
stm32/
├── hal-examples/       # STM32 HAL 函式庫範例
├── freertos/          # FreeRTOS 多任務範例
└── motor-control/     # 馬達控制應用
```

## 🎯 支援的 STM32 系列

- STM32F0 - 入門級
- STM32F1 - 主流基礎型
- STM32F4 - 高性能
- STM32F7 - 超高性能
- STM32H7 - 最高性能
- STM32L 系列 - 低功耗

## 🛠️ 開發工具

### IDE
- STM32CubeIDE（推薦）
- Keil MDK
- IAR Embedded Workbench
- VS Code + PlatformIO

### 程式燒錄
- ST-Link
- J-Link
- USB DFU

## 🚀 快速開始

1. 使用 STM32CubeMX 配置硬體
2. 生成 HAL 初始化程式碼
3. 在 `main.c` 中實作應用邏輯
4. 編譯並燒錄到開發板

## 📚 學習資源

- [STM32 官方文檔](https://www.st.com/en/microcontrollers-microprocessors/stm32-32-bit-arm-cortex-mcus.html)
- [STM32CubeIDE 下載](https://www.st.com/en/development-tools/stm32cubeide.html)
- [HAL 函式庫參考](https://www.st.com/en/embedded-software/stm32cube-mcu-mpu-packages.html)

## 📄 授權

MIT License
