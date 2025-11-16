# SPI 設備驅動 (SPI Device Driver)

通用 SPI (Serial Peripheral Interface) 設備驅動程式框架，支援各種 SPI 設備。

## 專案概述

本專案提供完整的 SPI 設備驅動實現框架，包含 SPI 主機驅動和設備驅動範例，支援常見的 SPI 設備如 Flash 記憶體、顯示器、ADC/DAC 等。

## 功能特色

### 🔌 SPI 通訊
- **基本 SPI 操作**
  - 全雙工通訊
  - 半雙工通訊
  - 可配置時鐘頻率
  - 可配置時鐘相位和極性 (CPOL/CPHA)

- **進階功能**
  - DMA 傳輸
  - 多片選支援
  - 雙線/四線模式
  - 可變位元長度

### 📡 支援的設備
- **Flash 記憶體**
  - W25Q32/W25Q64/W25Q128
  - MX25L128
  - AT25DF641

- **顯示器**
  - ST7789 TFT LCD
  - ILI9341 TFT LCD
  - SSD1306 OLED
  - EPD (電子紙)

- **ADC/DAC**
  - MCP3008 (8通道 ADC)
  - MCP4922 (雙通道 DAC)
  - ADS1256 (高精度 ADC)

- **其他設備**
  - NRF24L01 (2.4GHz 無線模組)
  - MFRC522 (RFID 讀卡器)
  - CAN 控制器 (MCP2515)
  - SD 卡讀卡器

## 專案結構

```
spi-device-driver/
├── README.md                    # 專案說明
├── driver/                      # 驅動程式
│   ├── spi_master.c            # SPI 主機驅動
│   ├── devices/                # 各類設備驅動
│   │   ├── w25qxx.c            # W25Qxx SPI Flash
│   │   ├── st7789.c            # ST7789 TFT LCD
│   │   ├── mcp3008.c           # MCP3008 ADC
│   │   └── nrf24l01.c          # NRF24L01 無線模組
│   └── Makefile                # 編譯配置
├── devicetree/                  # 設備樹範例
│   ├── spi-master.dts          # SPI 主機節點
│   └── spi-devices.dts         # SPI 設備節點
├── userspace/                   # 使用者空間程式
│   ├── spidev_test.c           # SPI 測試工具
│   ├── flash_tool.c            # Flash 讀寫工具
│   └── Makefile                # 編譯配置
└── docs/                        # 文檔
    ├── spi-protocol.md         # SPI 協議說明
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
# 載入 SPI 主機驅動
sudo insmod spi_master.ko

# 載入設備驅動 (以 W25Q128 為例)
sudo insmod devices/w25qxx.ko

# 查看 SPI 總線
ls /dev/spi*
```

### 設備樹配置

```dts
/* SPI 主機節點 */
&spi1 {
    compatible = "custom,spi-controller";
    reg = <0x30830000 0x10000>;
    interrupts = <GIC_SPI 31 IRQ_TYPE_LEVEL_HIGH>;
    #address-cells = <1>;
    #size-cells = <0>;
    status = "okay";

    /* W25Q128 SPI Flash */
    flash@0 {
        compatible = "winbond,w25q128";
        reg = <0>;  /* CS0 */
        spi-max-frequency = <50000000>;  /* 50 MHz */
        status = "okay";
    };

    /* ST7789 TFT LCD */
    display@1 {
        compatible = "sitronix,st7789v";
        reg = <1>;  /* CS1 */
        spi-max-frequency = <40000000>;
        dc-gpios = <&gpio1 10 GPIO_ACTIVE_HIGH>;
        reset-gpios = <&gpio1 11 GPIO_ACTIVE_LOW>;
        status = "okay";
    };

    /* MCP3008 ADC */
    adc@2 {
        compatible = "microchip,mcp3008";
        reg = <2>;  /* CS2 */
        spi-max-frequency = <1000000>;
        vref-supply = <&vref_3v3>;
        status = "okay";
    };
};
```

### 使用者空間訪問 (spidev)

```c
#include <linux/spi/spidev.h>

/* 開啟 SPI 設備 */
int fd = open("/dev/spidev0.0", O_RDWR);

/* 配置 SPI 模式 */
uint8_t mode = SPI_MODE_0;
ioctl(fd, SPI_IOC_WR_MODE, &mode);

/* 配置時鐘頻率 */
uint32_t speed = 1000000;  /* 1 MHz */
ioctl(fd, SPI_IOC_WR_MAX_SPEED_HZ, &speed);

/* 配置位元數 */
uint8_t bits = 8;
ioctl(fd, SPI_IOC_WR_BITS_PER_WORD, &bits);

/* 傳輸資料 */
uint8_t tx_buf[] = {0x03, 0x00, 0x00, 0x00};  /* Read command */
uint8_t rx_buf[4];

struct spi_ioc_transfer tr = {
    .tx_buf = (unsigned long)tx_buf,
    .rx_buf = (unsigned long)rx_buf,
    .len = sizeof(tx_buf),
    .speed_hz = speed,
    .delay_usecs = 0,
    .bits_per_word = bits,
};

ioctl(fd, SPI_IOC_MESSAGE(1), &tr);

close(fd);
```

## W25Q128 Flash 驅動範例

### 讀寫 Flash

```c
/* W25Q128 設備結構 */
struct w25qxx_data {
    struct spi_device *spi;
    struct mtd_info mtd;
    struct mutex lock;
};

/* 讀取 Flash ID */
static int w25qxx_read_id(struct w25qxx_data *data)
{
    u8 tx_buf[4] = {0x9F, 0x00, 0x00, 0x00};
    u8 rx_buf[4];
    struct spi_transfer t = {
        .tx_buf = tx_buf,
        .rx_buf = rx_buf,
        .len = 4,
    };
    struct spi_message m;

    spi_message_init(&m);
    spi_message_add_tail(&t, &m);
    spi_sync(data->spi, &m);

    /* Manufacturer ID: rx_buf[1]
       Device ID: (rx_buf[2] << 8) | rx_buf[3] */
    return (rx_buf[1] << 16) | (rx_buf[2] << 8) | rx_buf[3];
}

/* 讀取資料 */
static int w25qxx_read(struct w25qxx_data *data, u32 addr,
                      u8 *buf, size_t len)
{
    u8 cmd[4] = {
        0x03,  /* Read command */
        (addr >> 16) & 0xFF,
        (addr >> 8) & 0xFF,
        addr & 0xFF
    };

    struct spi_transfer t[2] = {
        {
            .tx_buf = cmd,
            .len = 4,
        },
        {
            .rx_buf = buf,
            .len = len,
        },
    };
    struct spi_message m;

    spi_message_init(&m);
    spi_message_add_tail(&t[0], &m);
    spi_message_add_tail(&t[1], &m);

    return spi_sync(data->spi, &m);
}

/* 寫入資料 */
static int w25qxx_write(struct w25qxx_data *data, u32 addr,
                       const u8 *buf, size_t len)
{
    /* 1. 寫使能 */
    u8 cmd_we = 0x06;
    spi_write(data->spi, &cmd_we, 1);

    /* 2. 頁編程 */
    u8 cmd[4 + 256];  /* 最大 256 位元組 */
    cmd[0] = 0x02;  /* Page Program */
    cmd[1] = (addr >> 16) & 0xFF;
    cmd[2] = (addr >> 8) & 0xFF;
    cmd[3] = addr & 0xFF;
    memcpy(&cmd[4], buf, len);

    spi_write(data->spi, cmd, 4 + len);

    /* 3. 等待完成 */
    w25qxx_wait_ready(data);

    return 0;
}
```

## ST7789 LCD 驅動範例

### 顯示控制

```c
/* ST7789 設備結構 */
struct st7789_data {
    struct spi_device *spi;
    struct fb_info *info;
    struct gpio_desc *dc_gpio;   /* Data/Command */
    struct gpio_desc *reset_gpio;

    u16 width;
    u16 height;
};

/* 發送命令 */
static int st7789_write_cmd(struct st7789_data *data, u8 cmd)
{
    gpiod_set_value(data->dc_gpio, 0);  /* Command mode */
    return spi_write(data->spi, &cmd, 1);
}

/* 發送資料 */
static int st7789_write_data(struct st7789_data *data, u8 *buf, size_t len)
{
    gpiod_set_value(data->dc_gpio, 1);  /* Data mode */
    return spi_write(data->spi, buf, len);
}

/* 初始化 LCD */
static int st7789_init_display(struct st7789_data *data)
{
    /* 硬體複位 */
    gpiod_set_value(data->reset_gpio, 1);
    msleep(10);
    gpiod_set_value(data->reset_gpio, 0);
    msleep(10);
    gpiod_set_value(data->reset_gpio, 1);
    msleep(120);

    /* 軟體複位 */
    st7789_write_cmd(data, 0x01);
    msleep(120);

    /* 退出睡眠模式 */
    st7789_write_cmd(data, 0x11);
    msleep(120);

    /* 顯示開啟 */
    st7789_write_cmd(data, 0x29);

    return 0;
}
```

## MCP3008 ADC 驅動範例

### 讀取 ADC 值

```c
/* MCP3008 設備結構 */
struct mcp3008_data {
    struct spi_device *spi;
    struct iio_dev *indio_dev;
};

/* 讀取單個通道 */
static int mcp3008_read_channel(struct mcp3008_data *data, int channel)
{
    u8 tx_buf[3];
    u8 rx_buf[3];
    struct spi_transfer t = {
        .tx_buf = tx_buf,
        .rx_buf = rx_buf,
        .len = 3,
    };
    struct spi_message m;

    /* 構建命令 */
    tx_buf[0] = 0x01;  /* Start bit */
    tx_buf[1] = (0x08 | channel) << 4;  /* Single-ended, channel select */
    tx_buf[2] = 0x00;

    spi_message_init(&m);
    spi_message_add_tail(&t, &m);
    spi_sync(data->spi, &m);

    /* 解析結果 (10-bit ADC) */
    return ((rx_buf[1] & 0x03) << 8) | rx_buf[2];
}
```

## spidev 測試工具

### 基本測試

```bash
cd userspace/
make

# 讀取 SPI Flash ID
sudo ./flash_tool /dev/spidev0.0 read_id

# 讀取 Flash 資料
sudo ./flash_tool /dev/spidev0.0 read 0x0 256 output.bin

# 寫入 Flash 資料
sudo ./flash_tool /dev/spidev0.0 write 0x0 input.bin

# SPI 迴路測試
sudo ./spidev_test -D /dev/spidev0.0 -v
```

## 常見問題

### Q1: SPI 通訊失敗

**檢查步驟**：
```bash
# 1. 確認 SPI 模組已載入
lsmod | grep spi

# 2. 檢查設備節點
ls -l /dev/spi*

# 3. 檢查硬體連接
# - MOSI/MISO/SCLK/CS 是否正確
# - 時鐘頻率是否在設備支援範圍內
# - 電源供應是否穩定

# 4. 檢查 SPI 模式 (CPOL/CPHA)
cat /sys/bus/spi/devices/spi0.0/mode
```

### Q2: 資料錯誤

**可能原因**：
- SPI 模式不正確
- 時鐘頻率太高
- 訊號完整性問題
- 片選時序錯誤

### Q3: 效能問題

**優化方法**：
```c
/* 使用 DMA 傳輸 */
struct spi_transfer t = {
    .tx_buf = tx_dma_buf,
    .rx_buf = rx_dma_buf,
    .len = large_size,
    .speed_hz = 50000000,
    .bits_per_word = 8,
};

/* 批次傳輸 */
struct spi_message m;
spi_message_init(&m);
spi_message_add_tail(&t1, &m);
spi_message_add_tail(&t2, &m);
spi_sync(spi, &m);
```

## 效能特性

### 通訊速度
- **標準速度**: 1-10 MHz
- **高速模式**: 20-50 MHz
- **超高速**: 100+ MHz (特定設備)

### DMA 傳輸
- 支援大數據量傳輸
- CPU 負載低
- 適合 Flash、顯示器等應用

## 授權

MIT License

## 參考資源

- [SPI Specification](https://www.nxp.com/docs/en/data-sheet/SPI.pdf)
- [Linux SPI Subsystem](https://www.kernel.org/doc/html/latest/spi/)
- [spidev Documentation](https://www.kernel.org/doc/Documentation/spi/spidev)

---

**最後更新**: 2025-11-16
**維護者**: AI-Assisted Development Team
