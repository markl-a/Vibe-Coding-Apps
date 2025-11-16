# I2C 設備驅動 (I2C Device Driver)

通用 I2C 設備驅動程式框架，支援各種 I2C 感測器和外設。

## 專案概述

本專案提供完整的 I2C 設備驅動實現框架，包含 I2C 主機驅動和設備驅動範例，支援常見的 I2C 感測器如溫濕度感測器、加速度計、陀螺儀等。

## 功能特色

### 🔌 I2C 通訊
- **基本 I2C 操作**
  - 讀取/寫入位元組
  - 讀取/寫入區塊資料
  - SMBus 協議支援
  - 多主機模式

- **進階功能**
  - DMA 傳輸
  - 10-bit 地址支援
  - 時鐘延展
  - 重複起始條件

### 📡 支援的設備
- **溫濕度感測器**
  - DHT11/DHT22
  - SHT31/SHT35
  - BME280/BME680
  - Si7021

- **加速度計/陀螺儀**
  - MPU6050/MPU9250
  - ADXL345
  - LSM6DS3
  - BNO055

- **光感測器**
  - BH1750
  - TSL2561
  - APDS9960

- **其他設備**
  - RTC (DS1307/DS3231)
  - EEPROM (24C02/24C256)
  - I/O 擴展器 (PCF8574)
  - DAC/ADC (MCP4725/ADS1115)

## 專案結構

```
i2c-device-driver/
├── README.md                    # 專案說明
├── driver/                      # 驅動程式
│   ├── i2c_master.c            # I2C 主機驅動
│   ├── i2c_sensor.c            # 感測器驅動範例
│   ├── devices/                # 各類設備驅動
│   │   ├── bme280.c            # BME280 溫濕度氣壓感測器
│   │   ├── mpu6050.c           # MPU6050 六軸感測器
│   │   ├── bh1750.c            # BH1750 光感測器
│   │   └── ds1307.c            # DS1307 RTC
│   └── Makefile                # 編譯配置
├── devicetree/                  # 設備樹範例
│   ├── i2c-master.dts          # I2C 主機節點
│   └── i2c-devices.dts         # I2C 設備節點
├── userspace/                   # 使用者空間程式
│   ├── i2c_test.c              # I2C 測試工具
│   ├── sensor_read.c           # 感測器讀取工具
│   └── Makefile                # 編譯配置
└── docs/                        # 文檔
    ├── i2c-protocol.md         # I2C 協議說明
    ├── device-list.md          # 支援設備列表
    └── examples.md             # 使用範例
```

## 快速開始

### 編譯驅動

```bash
cd driver/
make
```

### 載入驅動

```bash
# 載入 I2C 主機驅動
sudo insmod i2c_master.ko

# 載入設備驅動 (以 BME280 為例)
sudo insmod devices/bme280.ko

# 查看 I2C 總線
i2cdetect -l

# 掃描 I2C 設備
sudo i2cdetect -y 1
```

### 設備樹配置

```dts
/* I2C 主機節點 */
&i2c1 {
    compatible = "custom,i2c-controller";
    reg = <0x30A20000 0x10000>;
    interrupts = <GIC_SPI 35 IRQ_TYPE_LEVEL_HIGH>;
    clock-frequency = <400000>;  /* 400 kHz */
    status = "okay";

    /* BME280 溫濕度氣壓感測器 */
    bme280@76 {
        compatible = "bosch,bme280";
        reg = <0x76>;
        status = "okay";
    };

    /* MPU6050 六軸感測器 */
    mpu6050@68 {
        compatible = "invensense,mpu6050";
        reg = <0x68>;
        interrupt-parent = <&gpio1>;
        interrupts = <12 IRQ_TYPE_EDGE_RISING>;
        status = "okay";
    };

    /* BH1750 光感測器 */
    bh1750@23 {
        compatible = "rohm,bh1750";
        reg = <0x23>;
        status = "okay";
    };
};
```

### 使用者空間訪問

```c
#include <linux/i2c-dev.h>
#include <i2c/smbus.h>

/* 開啟 I2C 設備 */
int fd = open("/dev/i2c-1", O_RDWR);

/* 設定 I2C 從機地址 */
ioctl(fd, I2C_SLAVE, 0x76);

/* 讀取暫存器 */
__u8 reg = 0xD0;  /* ID 暫存器 */
__s32 result = i2c_smbus_read_byte_data(fd, reg);

/* 寫入暫存器 */
i2c_smbus_write_byte_data(fd, 0xF4, 0x27);

/* 讀取區塊資料 */
__u8 buffer[8];
i2c_smbus_read_i2c_block_data(fd, 0xF7, 8, buffer);

close(fd);
```

## BME280 驅動範例

### 讀取溫濕度氣壓

```c
/* BME280 設備結構 */
struct bme280_data {
    struct i2c_client *client;
    struct mutex lock;

    /* 校準參數 */
    u16 dig_T1;
    s16 dig_T2, dig_T3;
    u16 dig_P1;
    s16 dig_P2, dig_P3, dig_P4, dig_P5;
    s16 dig_P6, dig_P7, dig_P8, dig_P9;
    u8  dig_H1, dig_H3;
    s16 dig_H2, dig_H4, dig_H5;
    s8  dig_H6;

    /* 測量值 */
    s32 temperature;
    u32 pressure;
    u32 humidity;
};

/* 讀取溫度 */
static int bme280_read_temperature(struct bme280_data *data)
{
    struct i2c_client *client = data->client;
    u8 buf[3];
    s32 adc_T;

    /* 讀取溫度暫存器 */
    i2c_smbus_read_i2c_block_data(client, 0xFA, 3, buf);

    adc_T = (buf[0] << 12) | (buf[1] << 4) | (buf[2] >> 4);

    /* 使用校準參數計算實際溫度 */
    /* ... 補償計算 ... */

    return data->temperature;
}
```

## MPU6050 驅動範例

### 讀取加速度和陀螺儀資料

```c
/* MPU6050 設備結構 */
struct mpu6050_data {
    struct i2c_client *client;
    struct iio_dev *indio_dev;

    /* 測量值 */
    s16 accel_x, accel_y, accel_z;
    s16 gyro_x, gyro_y, gyro_z;
    s16 temperature;
};

/* 讀取所有感測器資料 */
static int mpu6050_read_sensors(struct mpu6050_data *data)
{
    struct i2c_client *client = data->client;
    u8 buf[14];

    /* 一次讀取所有資料 */
    i2c_smbus_read_i2c_block_data(client, 0x3B, 14, buf);

    data->accel_x = (buf[0] << 8) | buf[1];
    data->accel_y = (buf[2] << 8) | buf[3];
    data->accel_z = (buf[4] << 8) | buf[5];
    data->temperature = (buf[6] << 8) | buf[7];
    data->gyro_x = (buf[8] << 8) | buf[9];
    data->gyro_y = (buf[10] << 8) | buf[11];
    data->gyro_z = (buf[12] << 8) | buf[13];

    return 0;
}
```

## sysfs 介面

### 讀取感測器資料

```bash
# BME280 溫濕度氣壓
cat /sys/bus/i2c/devices/1-0076/temp1_input    # 溫度 (單位: 0.001°C)
cat /sys/bus/i2c/devices/1-0076/humidity1_input # 濕度 (單位: 0.001%)
cat /sys/bus/i2c/devices/1-0076/pressure1_input # 氣壓 (單位: Pa)

# MPU6050 加速度計
cat /sys/bus/i2c/devices/1-0068/in_accel_x_raw
cat /sys/bus/i2c/devices/1-0068/in_accel_y_raw
cat /sys/bus/i2c/devices/1-0068/in_accel_z_raw

# BH1750 光感測器
cat /sys/bus/i2c/devices/1-0023/illuminance0_input  # 照度 (lux)
```

## I2C 工具使用

### i2c-tools 工具集

```bash
# 安裝 i2c-tools
sudo apt-get install i2c-tools

# 列出所有 I2C 總線
i2cdetect -l

# 掃描 I2C 總線 1
sudo i2cdetect -y 1

# 讀取暫存器
sudo i2cget -y 1 0x76 0xD0

# 寫入暫存器
sudo i2cset -y 1 0x76 0xF4 0x27

# 讀取區塊
sudo i2cdump -y 1 0x76
```

## 常見問題

### Q1: I2C 設備無法檢測

**檢查步驟**：
```bash
# 1. 確認 I2C 模組已載入
lsmod | grep i2c

# 2. 檢查設備樹配置
dtc -I fs /sys/firmware/devicetree/base | grep -A 10 i2c

# 3. 檢查硬體連接
# - SDA/SCL 是否正確連接
# - 上拉電阻是否存在 (通常 4.7kΩ)
# - 電源供應是否正常

# 4. 降低時鐘頻率測試
echo 100000 > /sys/class/i2c-adapter/i2c-1/of_node/clock-frequency
```

### Q2: 讀取資料錯誤

**可能原因**：
- 時序不正確
- 位址錯誤
- 暫存器地址錯誤
- 設備未正確初始化

### Q3: 通訊超時

**解決方法**：
```bash
# 增加超時時間
echo 2000 > /sys/class/i2c-adapter/i2c-1/timeout

# 檢查中斷狀態
cat /proc/interrupts | grep i2c
```

## 效能特性

### 通訊速度
- **標準模式**: 100 kbit/s
- **快速模式**: 400 kbit/s
- **快速模式+**: 1 Mbit/s
- **高速模式**: 3.4 Mbit/s

### DMA 傳輸
- 支援大數據量傳輸
- 降低 CPU 負載
- 提高傳輸效率

## 授權

MIT License

## 參考資源

- [I2C Specification](https://www.nxp.com/docs/en/user-guide/UM10204.pdf)
- [Linux I2C Subsystem](https://www.kernel.org/doc/html/latest/i2c/)
- [Device Tree Bindings](https://www.kernel.org/doc/Documentation/devicetree/bindings/i2c/)

---

**最後更新**: 2025-11-16
**維護者**: AI-Assisted Development Team
