# UART HAL (Hardware Abstraction Layer)

> 通用 UART 硬體抽象層 - 支援多平台的統一串口通訊介面

## 📋 專案概述

UART HAL 提供統一的串口通訊介面,支援同步/非同步傳輸、中斷、DMA 等多種模式,讓應用程式碼可以在不同的硬體平台之間輕鬆移植。

## ✨ 特性

- **跨平台支援**: STM32, ESP32, NRF52 等多種 MCU
- **多種傳輸模式**: 阻塞、中斷、DMA 傳輸
- **完整配置**: 波特率、資料位、停止位、校驗位
- **流控制**: 支援 RTS/CTS 硬體流控
- **緩衝管理**: 內建接收/發送緩衝區
- **錯誤處理**: 完整的錯誤檢測和恢復機制

## 🎯 支援的平台

- ✅ STM32F4xx 系列
- ✅ ESP32 系列
- 🚧 NRF52 系列 (開發中)
- 🚧 RP2040 (計劃中)

## 🚀 快速開始

### 基本串口通訊

```c
#include "uart_hal.h"
#include <string.h>

int main(void)
{
    // 配置 UART
    uart_config_t uart_config = {
        .baudrate = 115200,
        .word_length = 8,
        .stop_bits = 1,
        .parity = UART_PARITY_NONE,
        .flow_control = UART_FLOW_CTRL_NONE
    };

    // 初始化 UART1
    uart_handle_t uart = uart_init(1, &uart_config);
    if (uart == NULL) {
        return -1;
    }

    // 發送數據
    const char *msg = "Hello UART!\n";
    uart_send(uart, (uint8_t *)msg, strlen(msg));

    // 接收數據
    uint8_t rx_buffer[64];
    int len = uart_receive(uart, rx_buffer, sizeof(rx_buffer), 1000);
    if (len > 0) {
        printf("Received %d bytes\n", len);
    }

    return 0;
}
```

### 中斷模式傳輸

```c
// 發送完成回調
void tx_complete_callback(void)
{
    printf("TX complete!\n");
}

// 接收完成回調
void rx_complete_callback(void)
{
    printf("RX complete!\n");
}

// 設置回調
uart_set_callback(uart, tx_complete_callback, rx_complete_callback);

// 非阻塞發送
uart_send_it(uart, data, length);

// 非阻塞接收
uart_receive_it(uart, buffer, length);
```

### DMA 模式傳輸

```c
// 啟用 DMA
uart_enable_dma(uart, UART_DMA_TX | UART_DMA_RX);

// DMA 發送 (零 CPU 開銷)
uart_send_dma(uart, large_data, large_size);

// DMA 接收
uart_receive_dma(uart, rx_buffer, buffer_size);
```

## 📚 API 參考

### 資料類型

#### uart_config_t
```c
typedef struct {
    uint32_t baudrate;       // 波特率 (9600, 115200 等)
    uint8_t word_length;     // 資料位 (8, 9)
    uint8_t stop_bits;       // 停止位 (1, 2)
    uart_parity_t parity;    // 校驗位
    uart_flow_ctrl_t flow_control; // 流控制
} uart_config_t;
```

### 核心函數

| 函數 | 說明 |
|------|------|
| `uart_init()` | 初始化 UART |
| `uart_deinit()` | 解初始化 UART |
| `uart_send()` | 阻塞發送 |
| `uart_receive()` | 阻塞接收 |
| `uart_send_it()` | 中斷發送 |
| `uart_receive_it()` | 中斷接收 |
| `uart_send_dma()` | DMA 發送 |
| `uart_receive_dma()` | DMA 接收 |
| `uart_set_callback()` | 設置回調函數 |
| `uart_available()` | 檢查可用資料量 |
| `uart_flush()` | 清空緩衝區 |

## 🏗️ 專案結構

```
uart-hal/
├── README.md
├── include/
│   └── uart_hal.h
├── src/
│   ├── uart_hal_stm32.c
│   └── uart_hal_esp32.c
├── examples/
│   ├── echo_server.c
│   ├── dma_transfer.c
│   └── at_command.c
├── tests/
│   └── test_uart.c
└── Makefile
```

## 🔧 編譯和使用

```bash
# 編譯庫
make PLATFORM=stm32

# 編譯範例
make examples

# 運行測試
make test
```

## 📊 效能指標

| 操作 | STM32F4@168MHz | ESP32@240MHz |
|------|----------------|--------------|
| 阻塞發送 1KB | ~8.7 ms @ 115200 | ~8.7 ms @ 115200 |
| DMA 發送 1KB | ~0.1 ms (CPU) | ~0.1 ms (CPU) |
| 最大波特率 | 10.5 Mbps | 5 Mbps |

## 🧪 使用範例

### 1. 簡易串口終端

```c
void uart_terminal(uart_handle_t uart)
{
    uint8_t ch;
    printf("UART Terminal (press ESC to exit)\n");

    while (1) {
        if (uart_receive(uart, &ch, 1, 100) > 0) {
            if (ch == 27) break;  // ESC
            uart_send(uart, &ch, 1);  // Echo
        }
    }
}
```

### 2. AT 指令處理

```c
int send_at_command(uart_handle_t uart, const char *cmd, char *response, int timeout)
{
    // 發送指令
    uart_send(uart, (uint8_t *)cmd, strlen(cmd));
    uart_send(uart, (uint8_t *)"\r\n", 2);

    // 接收回應
    int len = uart_receive(uart, (uint8_t *)response, 256, timeout);
    return len;
}
```

### 3. Modbus RTU 通訊

```c
typedef struct {
    uint8_t slave_id;
    uint8_t function;
    uint16_t address;
    uint16_t data;
} modbus_frame_t;

int modbus_send(uart_handle_t uart, modbus_frame_t *frame)
{
    uint8_t buffer[8];
    buffer[0] = frame->slave_id;
    buffer[1] = frame->function;
    buffer[2] = frame->address >> 8;
    buffer[3] = frame->address & 0xFF;
    buffer[4] = frame->data >> 8;
    buffer[5] = frame->data & 0xFF;

    // 計算 CRC
    uint16_t crc = calculate_crc16(buffer, 6);
    buffer[6] = crc & 0xFF;
    buffer[7] = crc >> 8;

    return uart_send(uart, buffer, 8);
}
```

## 🔬 最佳實踐

### 1. 錯誤處理
```c
int result = uart_send(uart, data, len);
if (result != len) {
    printf("UART send error: sent %d/%d bytes\n", result, len);
    uart_flush(uart);
}
```

### 2. 超時處理
```c
int len = uart_receive(uart, buffer, size, 1000);  // 1秒超時
if (len < 0) {
    printf("UART receive timeout or error\n");
}
```

### 3. 大量數據傳輸
```c
// 使用 DMA 降低 CPU 負載
uart_enable_dma(uart, UART_DMA_TX);
uart_send_dma(uart, large_buffer, buffer_size);
```

## 🐛 故障排除

**Q: 亂碼或通訊異常?**
- 檢查波特率設置
- 確認資料位、停止位、校驗位配置
- 檢查硬體接線 (TX-RX 交叉連接)

**Q: DMA 傳輸不工作?**
- 確認 DMA 時鐘已啟用
- 檢查 DMA 通道配置
- 驗證緩衝區在 DMA 可訪問記憶體

**Q: 數據丟失?**
- 增加接收緩衝區大小
- 使用 DMA 或中斷模式
- 檢查波特率是否過高

## 📄 授權

本專案採用 MIT 授權

---

**最後更新**: 2025-11-16
**版本**: v1.0.0
**狀態**: ✅ 穩定版本
