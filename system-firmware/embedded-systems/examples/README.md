# 嵌入式系統範例集合

完整的嵌入式系統開發範例，涵蓋多種平台和應用場景。

## 專案概述

本範例集合提供從基礎到進階的嵌入式系統開發範例，適合初學者入門和經驗豐富的開發者參考。所有範例都經過精心設計，包含詳細註解和實用功能。

## 支援平台

### 1. STM32 微控制器
**目錄：** `../stm32/examples/`

**範例內容：**
- ✓ UART 通訊（回音、中斷、命令處理）
- ✓ I2C BME280 環境感測器
- ✓ SPI SD 卡讀寫
- ✓ 溫度監控系統實際專案

**適合場景：**
- 工業控制
- 嵌入式系統
- 實時應用
- 馬達控制

**技術特點：**
- HAL 函式庫
- FreeRTOS 支援
- 豐富外設
- 高性能

[查看 STM32 範例 →](../stm32/examples/README.md)

---

### 2. ESP32 物聯網平台
**目錄：** `../esp32/examples/`

**範例內容：**
- ✓ LED 控制（閃爍、PWM 呼吸燈）
- ✓ UART 通訊與命令系統
- ✓ I2C 掃描器
- ✓ SPI 通訊協議
- ✓ 智能家居控制系統（Wi-Fi + MQTT + Web）

**適合場景：**
- 物聯網應用
- 智能家居
- 無線通訊
- Web 伺服器

**技術特點：**
- Wi-Fi/藍牙
- Arduino 框架
- MQTT 支援
- Web 介面

[查看 ESP32 範例 →](../esp32/examples/README.md)

---

### 3. Arduino 快速原型
**目錄：** `../arduino/examples/`

**範例內容：**
- ✓ LED 閃爍與串口通訊
- ✓ 按鈕輸入控制
- ✓ 超音波距離感測器

**適合場景：**
- 快速原型
- 教育學習
- DIY 專案
- 感測器測試

**技術特點：**
- 簡單易學
- 豐富生態
- 即時編譯
- 大量函式庫

---

### 4. Raspberry Pi 單板電腦
**目錄：** `../raspberry-pi/examples/`

**範例內容：**
- ✓ GPIO LED 控制（閃爍、PWM、按鈕）
- ✓ DHT11 溫濕度監控
- ✓ 數據記錄

**適合場景：**
- Linux 應用
- Python 開發
- 多媒體處理
- 教育專案

**技術特點：**
- 完整 Linux
- Python 簡單
- 強大算力
- 豐富介面

---

### 5. ARM Cortex-M 裸機
**目錄：** `../cortex-m/examples/`

**範例內容：**
- ✓ 直接暫存器操作
- ✓ 裸機 GPIO 控制
- ✓ 中斷向量表

**適合場景：**
- 深入學習
- 性能優化
- 系統底層
- 驅動開發

**技術特點：**
- 無作業系統
- 完全控制
- 最小開銷
- 確定性執行

---

## 範例分類

### 基礎範例
| 範例 | STM32 | ESP32 | Arduino | Raspberry Pi |
|------|-------|-------|---------|--------------|
| LED 閃爍 | ✓ | ✓ | ✓ | ✓ |
| PWM 控制 | - | ✓ | - | ✓ |
| 按鈕輸入 | - | - | ✓ | ✓ |

### 通訊協議
| 協議 | STM32 | ESP32 | Arduino | Raspberry Pi |
|------|-------|-------|---------|--------------|
| UART | ✓ | ✓ | ✓ | - |
| I2C  | ✓ | ✓ | - | - |
| SPI  | ✓ | ✓ | - | - |

### 感測器
| 感測器 | STM32 | ESP32 | Arduino | Raspberry Pi |
|--------|-------|-------|---------|--------------|
| BME280 (溫濕度) | ✓ | - | - | - |
| DHT11/22 | - | ✓ | - | ✓ |
| 超音波 | - | - | ✓ | - |

### 實際專案
| 專案 | 平台 | 功能 |
|------|------|------|
| 溫度監控系統 | STM32 | I2C感測器 + UART命令 + 警告系統 |
| 智能家居控制 | ESP32 | Wi-Fi + MQTT + Web介面 + 自動化 |

## 快速開始

### 1. 選擇平台

根據您的需求選擇合適的平台：

- **需要高性能和實時控制** → STM32
- **需要 Wi-Fi/物聯網功能** → ESP32
- **快速原型和學習** → Arduino
- **需要 Linux 和複雜運算** → Raspberry Pi
- **深入學習底層原理** → Cortex-M 裸機

### 2. 準備硬體

每個範例都標註了所需硬體，例如：
```
硬體需求：
- ESP32 開發板
- DHT22 溫濕度感測器 (GPIO4)
- 繼電器模組 (GPIO25, GPIO26, GPIO27)
- LED (GPIO2)
```

### 3. 開發環境設定

**STM32：**
- [STM32CubeIDE](https://www.st.com/en/development-tools/stm32cubeide.html)
- [Keil MDK](https://www.keil.com/)
- [PlatformIO](https://platformio.org/)

**ESP32：**
- [Arduino IDE](https://www.arduino.cc/en/software) + ESP32 板子支援
- [PlatformIO](https://platformio.org/)
- [ESP-IDF](https://docs.espressif.com/projects/esp-idf/)

**Arduino：**
- [Arduino IDE](https://www.arduino.cc/en/software)
- [PlatformIO](https://platformio.org/)

**Raspberry Pi：**
- Python 3
- RPi.GPIO 函式庫
- Adafruit 感測器函式庫

### 4. 編譯與上傳

詳細步驟請參考各平台的 README：
- [STM32 編譯指南](../stm32/examples/README.md#編譯與燒錄)
- [ESP32 編譯指南](../esp32/examples/README.md#編譯與上傳)

## 學習路徑

### 初學者路徑
```
1. Arduino LED 閃爍
   ↓
2. Arduino 按鈕輸入
   ↓
3. Arduino 超音波感測器
   ↓
4. ESP32 基礎範例
   ↓
5. ESP32 Wi-Fi 連接
```

### 進階開發者路徑
```
1. STM32 HAL 函式庫
   ↓
2. STM32 通訊協議 (UART/I2C/SPI)
   ↓
3. STM32 + FreeRTOS
   ↓
4. ESP32 物聯網專案
   ↓
5. Cortex-M 裸機開發
```

### 專案導向路徑
```
1. 溫度監控系統 (STM32)
   ↓
2. 智能家居控制 (ESP32)
   ↓
3. 整合多平台方案
```

## 範例特色

### 詳細註解
每個範例都包含：
- 功能說明
- 硬體需求
- 接線圖
- 程式碼註解
- 使用方法

### 實用功能
- ✓ 錯誤處理
- ✓ 狀態指示
- ✓ 除錯輸出
- ✓ 可擴展架構

### 最佳實踐
- ✓ 模組化設計
- ✓ 清晰命名
- ✓ 資源管理
- ✓ 安全檢查

## 常見問題

### Q: 我應該從哪個平台開始？

**A:** 建議順序：
1. **完全新手** → Arduino（最簡單）
2. **有程式基礎** → ESP32（功能強大且易用）
3. **需要專業開發** → STM32（工業級）
4. **深入學習** → Cortex-M 裸機（理解底層）

### Q: 範例可以直接用於商業專案嗎？

**A:** 可以。所有範例採用 MIT 授權，可自由用於商業和個人專案。但建議：
- 添加適當的錯誤處理
- 進行充分測試
- 根據實際需求優化
- 遵守相關安全標準

### Q: 如何擴展這些範例？

**A:** 每個範例都設計為可擴展：
- 添加更多感測器
- 整合雲端服務
- 實現 OTA 更新
- 添加顯示介面
- 實現數據記錄

### Q: 遇到問題怎麼辦？

**A:** 除錯步驟：
1. 檢查硬體連接
2. 查看串口輸出
3. 參考除錯技巧章節
4. 查閱官方文件
5. 搜尋社群論壇

## 資源連結

### 官方文件
- [STM32](https://www.st.com/en/microcontrollers-microprocessors/stm32-32-bit-arm-cortex-mcus.html)
- [ESP32](https://www.espressif.com/en/products/socs/esp32)
- [Arduino](https://www.arduino.cc/)
- [Raspberry Pi](https://www.raspberrypi.org/)

### 社群
- [STM32 Community](https://community.st.com/)
- [ESP32 Forum](https://www.esp32.com/)
- [Arduino Forum](https://forum.arduino.cc/)
- [Raspberry Pi Forums](https://forums.raspberrypi.com/)

### 學習資源
- [Embedded Systems Programming](https://www.embedded.com/)
- [Hackaday](https://hackaday.com/)
- [Instructables](https://www.instructables.com/)

## 貢獻指南

歡迎貢獻新範例！請確保：
- 程式碼清晰易讀
- 包含詳細註解
- 提供硬體需求
- 測試通過
- 遵循現有格式

## 授權

MIT License - 可自由使用於商業和個人專案

## 更新紀錄

- **2025-11-17:** 初始版本發布
  - STM32 範例（4個）
  - ESP32 範例（7個）
  - Arduino 範例（2個）
  - Raspberry Pi 範例（2個）
  - Cortex-M 範例（1個）

---

**維護者：** AI-Assisted Development Team
**最後更新：** 2025-11-17
**版本：** 1.0.0

---

## 下一步

1. 選擇一個平台開始
2. 閱讀該平台的 README
3. 準備硬體
4. 上傳第一個範例
5. 開始您的嵌入式之旅！

祝您開發順利！ 🚀
