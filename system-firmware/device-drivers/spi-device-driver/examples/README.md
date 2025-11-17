# SPI 設備驅動範例程式

本目錄包含 SPI 設備驅動的使用範例。

## 編譯

```bash
make
```

## 範例程式

### 1. SPI 迴路測試 (spi_loopback)
測試 SPI 迴路連接（MOSI 連接到 MISO）。

```bash
sudo ./spi_loopback
```

### 2. SPI Flash 測試 (spi_flash_test)
讀取 SPI Flash 晶片 ID。

```bash
sudo ./spi_flash_test
```

## 硬體連接

### 迴路測試
```
MOSI → MISO
```

### SPI Flash (W25Q128)
```
CS   → SPI CS0
MOSI → SPI MOSI
MISO → SPI MISO
CLK  → SPI CLK
VCC  → 3.3V
GND  → GND
```

## 注意事項

1. 需要 root 權限
2. 確認 SPI 設備路徑（預設 /dev/spidev0.0）
3. 檢查時鐘極性和相位設置

---

**最後更新**: 2025-11-17
