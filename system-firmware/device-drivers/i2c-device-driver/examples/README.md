# I2C 設備驅動範例程式

本目錄包含 I2C 設備驅動的使用範例。

## 編譯

```bash
make
```

## 範例程式

### 1. I2C 總線掃描 (i2c_scan)
掃描 I2C 總線上的所有設備。

```bash
sudo ./i2c_scan
```

### 2. BME280 感測器 (bme280_example)
讀取 BME280 溫濕度氣壓感測器數據。

**硬體連接：**
- VCC → 3.3V
- GND → GND
- SDA → I2C SDA
- SCL → I2C SCL

```bash
sudo ./bme280_example
```

### 3. I2C 讀寫測試 (i2c_test)
基本的 I2C 讀寫操作測試。

```bash
sudo ./i2c_test [地址]
```

## 注意事項

1. 需要 root 權限或將用戶添加到 i2c 組
2. 確認 I2C 設備路徑正確（預設 /dev/i2c-1）
3. 檢查 I2C 上拉電阻（通常 4.7kΩ）

## 常見 I2C 設備地址

- BME280: 0x76 或 0x77
- MPU6050: 0x68 或 0x69
- EEPROM: 0x50-0x57
- RTC DS1307: 0x68

---

**最後更新**: 2025-11-17
