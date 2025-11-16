# I2C/SPI 設備驅動 (I2C/SPI Device Drivers)

這是完整的 I2C 和 SPI 設備驅動範例集合。

## 📋 專案簡介

此專案包含兩個驅動範例：
1. **I2C 虛擬設備驅動** - 展示 I2C 設備驅動開發
2. **SPI 虛擬設備驅動** - 展示 SPI 設備驅動開發

### 特性

**I2C 驅動**:
- I2C 設備註冊和探測
- 寄存器讀寫操作
- sysfs 接口
- 設備樹支援

**SPI 驅動**:
- SPI 設備註冊和探測
- 單向和全雙工傳輸
- sysfs 接口
- SPI 模式配置

## 🎯 學習目標

- 理解 I2C 和 SPI 驅動架構
- 掌握總線設備驅動模型
- 學習設備樹綁定
- 了解 sysfs 用戶空間接口

## 🛠️ 編譯與安裝

### 編譯

```bash
make
```

### 載入驅動

```bash
# 載入 I2C 驅動
make install-i2c

# 或載入 SPI 驅動
make install-spi

# 或兩個都載入
make install
```

### 卸載驅動

```bash
make uninstall
```

## 🧪 測試驅動

### I2C 設備測試

1. **載入驅動**
```bash
sudo insmod i2c_dummy_device.ko
```

2. **手動創建 I2C 設備**
```bash
# 在 I2C bus 1 上創建地址為 0x50 的設備
echo i2c_dummy 0x50 | sudo tee /sys/bus/i2c/devices/i2c-1/new_device
```

3. **通過 sysfs 訪問**
```bash
# 設置寄存器地址
echo 0x10 | sudo tee /sys/bus/i2c/devices/1-0050/reg_addr

# 寫入寄存器值
echo 0x42 | sudo tee /sys/bus/i2c/devices/1-0050/reg_value

# 讀取寄存器值
cat /sys/bus/i2c/devices/1-0050/reg_value
```

4. **刪除設備**
```bash
echo 0x50 | sudo tee /sys/bus/i2c/devices/i2c-1/delete_device
```

### SPI 設備測試

1. **載入驅動**
```bash
sudo insmod spi_dummy_device.ko
```

2. **手動創建 SPI 設備**
```bash
# 創建 SPI 設備（需要 spidev 或自定義方法）
# 這通常通過設備樹完成
```

3. **通過 sysfs 訪問**
```bash
# 寫入十六進制數據
echo "01 02 03 04" | sudo tee /sys/bus/spi/devices/spi0.0/data

# 讀取數據
cat /sys/bus/spi/devices/spi0.0/data
```

## 📊 代碼結構

### I2C 驅動

```
i2c_dummy_device.c
├── 設備數據結構
│   └── i2c_dummy_data
├── I2C 操作
│   ├── i2c_dummy_read_byte()
│   └── i2c_dummy_write_byte()
├── sysfs 接口
│   ├── reg_addr (讀寫)
│   └── reg_value (讀寫)
└── 驅動接口
    ├── i2c_dummy_probe()
    └── i2c_dummy_remove()
```

### SPI 驅動

```
spi_dummy_device.c
├── 設備數據結構
│   └── spi_dummy_data
├── SPI 操作
│   ├── spi_dummy_read()
│   ├── spi_dummy_write()
│   └── spi_dummy_transfer()
├── sysfs 接口
│   └── data (讀寫)
└── 驅動接口
    ├── spi_dummy_probe()
    └── spi_dummy_remove()
```

## 🔍 核心概念解析

### I2C 驅動開發

**1. 驅動註冊**
```c
static struct i2c_driver i2c_dummy_driver = {
    .driver = {
        .name = DRIVER_NAME,
        .of_match_table = i2c_dummy_of_match,
    },
    .probe = i2c_dummy_probe,
    .remove = i2c_dummy_remove,
    .id_table = i2c_dummy_id,
};

module_i2c_driver(i2c_dummy_driver);
```

**2. I2C 讀寫**
```c
/* 讀取字節 */
val = i2c_smbus_read_byte_data(client, reg);

/* 寫入字節 */
i2c_smbus_write_byte_data(client, reg, val);

/* 讀取塊數據 */
i2c_smbus_read_i2c_block_data(client, reg, len, buf);
```

**3. 設備樹綁定**
```dts
&i2c1 {
    i2c_dummy@50 {
        compatible = "vendor,i2c-dummy";
        reg = <0x50>;
    };
};
```

### SPI 驅動開發

**1. 驅動註冊**
```c
static struct spi_driver spi_dummy_driver = {
    .driver = {
        .name = DRIVER_NAME,
        .of_match_table = spi_dummy_of_match,
    },
    .probe = spi_dummy_probe,
    .remove = spi_dummy_remove,
};

module_spi_driver(spi_dummy_driver);
```

**2. SPI 傳輸**
```c
struct spi_transfer xfer = {
    .tx_buf = tx_buffer,
    .rx_buf = rx_buffer,
    .len = length,
};
struct spi_message msg;

spi_message_init(&msg);
spi_message_add_tail(&xfer, &msg);
spi_sync(spi, &msg);
```

**3. SPI 配置**
```c
spi->mode = SPI_MODE_0;        /* CPOL=0, CPHA=0 */
spi->bits_per_word = 8;
spi->max_speed_hz = 1000000;   /* 1 MHz */
spi_setup(spi);
```

**4. 設備樹綁定**
```dts
&spi0 {
    spi_dummy@0 {
        compatible = "vendor,spi-dummy";
        reg = <0>;
        spi-max-frequency = <1000000>;
    };
};
```

## 📈 實際應用範例

### I2C 設備範例

**EEPROM 驅動**
```c
static int eeprom_read(struct i2c_client *client, u8 addr, u8 *data)
{
    return i2c_smbus_read_byte_data(client, addr);
}

static int eeprom_write(struct i2c_client *client, u8 addr, u8 data)
{
    return i2c_smbus_write_byte_data(client, addr, data);
}
```

**感測器驅動（如溫度感測器）**
```c
static int temp_sensor_read(struct i2c_client *client)
{
    s32 temp;

    temp = i2c_smbus_read_word_data(client, TEMP_REG);
    if (temp < 0)
        return temp;

    /* 轉換為攝氏度 */
    return (temp >> 4) / 16;
}
```

### SPI 設備範例

**Flash 存儲驅動**
```c
static int flash_read(struct spi_device *spi, u32 addr, u8 *buf, size_t len)
{
    u8 cmd[4] = {
        FLASH_CMD_READ,
        (addr >> 16) & 0xFF,
        (addr >> 8) & 0xFF,
        addr & 0xFF,
    };

    struct spi_transfer xfer[2] = {
        {
            .tx_buf = cmd,
            .len = sizeof(cmd),
        },
        {
            .rx_buf = buf,
            .len = len,
        },
    };

    struct spi_message msg;
    spi_message_init(&msg);
    spi_message_add_tail(&xfer[0], &msg);
    spi_message_add_tail(&xfer[1], &msg);

    return spi_sync(spi, &msg);
}
```

## 🐛 常見問題

### 1. I2C 設備不存在

**問題**: 無法在 `/sys/bus/i2c/devices/` 中找到設備

**解決方案**:
```bash
# 查看可用的 I2C 總線
ls /sys/bus/i2c/devices/

# 手動創建設備
echo i2c_dummy 0x50 | sudo tee /sys/bus/i2c/devices/i2c-X/new_device
```

### 2. SPI 設備註冊失敗

**問題**: SPI 設備無法註冊

**解決方案**:
- 檢查設備樹配置
- 確認 SPI 控制器已啟用
- 檢查 CS（片選）引腳配置

### 3. I2C 通信失敗

**問題**: `i2c_smbus_read_byte_data` 返回錯誤

**解決方案**:
```bash
# 使用 i2c-tools 檢測設備
sudo i2cdetect -y 1

# 檢查總線時鐘
cat /sys/class/i2c-adapter/i2c-1/of_node/clock-frequency
```

## 📚 I2C vs SPI 比較

| 特性 | I2C | SPI |
|------|-----|-----|
| 線路數 | 2 (SDA, SCL) | 4 (MOSI, MISO, SCK, CS) |
| 速度 | 最高 3.4 Mbps | 可達數十 MHz |
| 地址 | 7/10 位地址 | 片選信號 |
| 從設備數 | 多個（通過地址） | 多個（需要更多 CS） |
| 複雜度 | 較複雜 | 較簡單 |
| 用途 | 低速外設 | 高速存儲、顯示 |

## 📖 延伸閱讀

- [Linux I2C Subsystem Documentation](https://www.kernel.org/doc/html/latest/i2c/index.html)
- [Linux SPI Subsystem Documentation](https://www.kernel.org/doc/html/latest/spi/index.html)
- [Device Tree Specification](https://www.devicetree.org/)
- [Linux Device Drivers, 3rd Edition](https://lwn.net/Kernel/LDD3/)

## 📝 授權

GPL v2

## 👨‍💻 貢獻者

AI-Assisted Development Team
