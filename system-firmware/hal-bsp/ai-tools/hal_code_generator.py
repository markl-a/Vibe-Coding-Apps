#!/usr/bin/env python3
"""
HAL 代码生成器 - AI 辅助工具
自动生成 HAL 初始化代码、配置代码和示例代码
"""

import argparse
import json
import sys
from typing import Dict, List, Any

class HALCodeGenerator:
    """HAL 代码生成器"""

    def __init__(self):
        self.templates = {
            'gpio': self._gpio_template,
            'uart': self._uart_template,
            'i2c': self._i2c_template,
            'spi': self._spi_template,
            'timer': self._timer_template,
            'adc': self._adc_template,
        }

    def generate(self, peripheral: str, config: Dict[str, Any]) -> str:
        """生成代码"""
        if peripheral not in self.templates:
            raise ValueError(f"不支持的外设类型: {peripheral}")

        return self.templates[peripheral](config)

    def _gpio_template(self, config: Dict[str, Any]) -> str:
        """GPIO 代码模板"""
        port = config.get('port', 'GPIOA')
        pin = config.get('pin', '5')
        mode = config.get('mode', 'OUTPUT_PP')
        pull = config.get('pull', 'NONE')
        speed = config.get('speed', 'LOW')

        code = f"""/**
 * AI 生成的 GPIO 初始化代码
 * 配置: {port}_PIN_{pin} - {mode}
 */

#include "gpio_hal.h"

void gpio_init_generated(void)
{{
    gpio_config_t config = {{
        .port = GPIO_PORT_{port[-1]},
        .pin = GPIO_PIN_{pin},
        .mode = GPIO_MODE_{mode},
        .pull = GPIO_PULL_{pull},
        .speed = GPIO_SPEED_{speed}
    }};

    if (gpio_init(&config) != 0) {{
        /* 錯誤處理 */
        return;
    }}

    /* GPIO 初始化成功 */
}}

/* 使用示例 */
void example_usage(void)
{{
    gpio_init_generated();

    /* 設置高電平 */
    gpio_set(GPIO_PORT_{port[-1]}, GPIO_PIN_{pin});

    /* 設置低電平 */
    gpio_reset(GPIO_PORT_{port[-1]}, GPIO_PIN_{pin});

    /* 切換電平 */
    gpio_toggle(GPIO_PORT_{port[-1]}, GPIO_PIN_{pin});

    /* 讀取電平 */
    bool state = gpio_read(GPIO_PORT_{port[-1]}, GPIO_PIN_{pin});
}}
"""
        return code

    def _uart_template(self, config: Dict[str, Any]) -> str:
        """UART 代碼模板"""
        uart_num = config.get('uart_num', '2')
        baudrate = config.get('baudrate', '115200')
        word_length = config.get('word_length', '8')
        stop_bits = config.get('stop_bits', '1')
        parity = config.get('parity', 'NONE')

        code = f"""/**
 * AI 生成的 UART 初始化代碼
 * 配置: UART{uart_num} - {baudrate} bps, {word_length}N{stop_bits}
 */

#include "uart_hal.h"
#include <stdio.h>

static uart_handle_t uart_handle = NULL;

int uart_init_generated(void)
{{
    uart_config_t config = {{
        .baudrate = {baudrate},
        .word_length = {word_length},
        .stop_bits = {stop_bits},
        .parity = UART_PARITY_{parity},
        .flow_control = UART_FLOW_CTRL_NONE
    }};

    uart_handle = uart_init({uart_num}, &config);

    if (uart_handle == NULL) {{
        return -1;
    }}

    return 0;
}}

/* 使用示例 */
void uart_send_example(void)
{{
    const char *message = "Hello from UART{uart_num}!\\n";
    uart_send(uart_handle, (uint8_t *)message, strlen(message));
}}

void uart_receive_example(void)
{{
    uint8_t buffer[128];
    int received = uart_receive(uart_handle, buffer, sizeof(buffer), 1000);

    if (received > 0) {{
        printf("Received %d bytes\\n", received);
    }}
}}

void uart_printf_example(void)
{{
    uart_printf(uart_handle, "Temperature: %d C, Humidity: %d %%\\n", 25, 60);
}}
"""
        return code

    def _i2c_template(self, config: Dict[str, Any]) -> str:
        """I2C 代碼模板"""
        i2c_num = config.get('i2c_num', '1')
        clock_speed = config.get('clock_speed', '100000')
        device_addr = config.get('device_addr', '0x50')

        code = f"""/**
 * AI 生成的 I2C 初始化代碼
 * 配置: I2C{i2c_num} - {clock_speed} Hz
 */

#include "i2c_hal.h"

static i2c_handle_t i2c_handle = NULL;

int i2c_init_generated(void)
{{
    i2c_config_t config = {{
        .mode = I2C_MODE_MASTER,
        .clock_speed = {clock_speed},
        .address_mode = I2C_ADDR_7BIT,
        .own_address = 0x00
    }};

    i2c_handle = i2c_init({i2c_num}, &config);

    if (i2c_handle == NULL) {{
        return -1;
    }}

    return 0;
}}

/* 設備地址 */
#define DEVICE_ADDR  {device_addr}

/* 使用示例 - EEPROM 操作 */
int i2c_eeprom_write_example(uint16_t addr, uint8_t data)
{{
    return i2c_mem_write(i2c_handle, DEVICE_ADDR, addr, &data, 1);
}}

int i2c_eeprom_read_example(uint16_t addr, uint8_t *data)
{{
    return i2c_mem_read(i2c_handle, DEVICE_ADDR, addr, data, 1);
}}

/* 使用示例 - 傳感器操作 */
int i2c_sensor_read_register(uint8_t reg_addr, uint8_t *value)
{{
    return i2c_read_register(i2c_handle, DEVICE_ADDR, reg_addr, value);
}}

int i2c_sensor_write_register(uint8_t reg_addr, uint8_t value)
{{
    return i2c_write_register(i2c_handle, DEVICE_ADDR, reg_addr, value);
}}

/* 掃描 I2C 總線 */
void i2c_scan_example(void)
{{
    uint16_t devices[128];
    int count = i2c_scan(i2c_handle, devices, 128);

    printf("Found %d I2C devices:\\n", count);
    for (int i = 0; i < count; i++) {{
        printf("  0x%02X\\n", devices[i]);
    }}
}}
"""
        return code

    def _spi_template(self, config: Dict[str, Any]) -> str:
        """SPI 代碼模板"""
        spi_num = config.get('spi_num', '1')
        mode = config.get('mode', '0')
        prescaler = config.get('prescaler', '16')

        code = f"""/**
 * AI 生成的 SPI 初始化代碼
 * 配置: SPI{spi_num} - Mode {mode}, Prescaler {prescaler}
 */

#include "spi_hal.h"

static spi_handle_t spi_handle = NULL;

int spi_init_generated(void)
{{
    spi_config_t config = {{
        .mode = SPI_MODE_MASTER,
        .clock_polarity = SPI_CPOL_LOW,
        .clock_phase = SPI_CPHA_1EDGE,
        .baudrate_prescaler = SPI_BAUDRATE_PRESCALER_{prescaler},
        .data_size = SPI_DATASIZE_8BIT,
        .first_bit = SPI_FIRSTBIT_MSB
    }};

    spi_handle = spi_init({spi_num}, &config);

    if (spi_handle == NULL) {{
        return -1;
    }}

    return 0;
}}

/* 使用示例 - 全雙工傳輸 */
void spi_transfer_example(void)
{{
    uint8_t tx_data[] = {{0x01, 0x02, 0x03, 0x04}};
    uint8_t rx_data[4];

    spi_transfer(spi_handle, tx_data, rx_data, 4);
}}

/* 使用示例 - 僅發送 */
void spi_transmit_example(void)
{{
    uint8_t data[] = {{0xAA, 0xBB, 0xCC, 0xDD}};

    spi_transmit(spi_handle, data, 4);
}}

/* 使用示例 - 僅接收 */
void spi_receive_example(void)
{{
    uint8_t data[4];

    spi_receive(spi_handle, data, 4);
}}
"""
        return code

    def _timer_template(self, config: Dict[str, Any]) -> str:
        """Timer/PWM 代碼模板"""
        timer_num = config.get('timer_num', '3')
        frequency = config.get('frequency', '1000')
        mode = config.get('mode', 'pwm')

        if mode == 'pwm':
            channel = config.get('channel', '1')
            duty_cycle = config.get('duty_cycle', '50')

            code = f"""/**
 * AI 生成的 PWM 初始化代碼
 * 配置: Timer {timer_num} Channel {channel} - {frequency} Hz, {duty_cycle}% 占空比
 */

#include "timer_hal.h"

static timer_handle_t timer_handle = NULL;

int pwm_init_generated(void)
{{
    pwm_config_t config = {{
        .channel = {channel},
        .frequency = {frequency},
        .duty_cycle = {duty_cycle}.0f,
        .polarity = PWM_POLARITY_HIGH,
        .alignment = PWM_ALIGNMENT_EDGE
    }};

    timer_handle = pwm_init({timer_num}, &config);

    if (timer_handle == NULL) {{
        return -1;
    }}

    /* 啟動 PWM */
    pwm_start(timer_handle, {channel});

    return 0;
}}

/* 動態調整占空比 */
void pwm_set_duty_example(float duty)
{{
    pwm_set_duty_cycle(timer_handle, {channel}, duty);
}}

/* 呼吸燈效果 */
void pwm_breathing_effect(void)
{{
    while (1) {{
        /* 亮度漸增 */
        for (float duty = 0; duty <= 100; duty += 1) {{
            pwm_set_duty_cycle(timer_handle, {channel}, duty);
            HAL_Delay(10);
        }}

        /* 亮度漸減 */
        for (float duty = 100; duty >= 0; duty -= 1) {{
            pwm_set_duty_cycle(timer_handle, {channel}, duty);
            HAL_Delay(10);
        }}
    }}
}}
"""
        else:
            code = f"""/**
 * AI 生成的定時器初始化代碼
 * 配置: Timer {timer_num} - {frequency} Hz
 */

#include "timer_hal.h"

static timer_handle_t timer_handle = NULL;

void timer_callback(void)
{{
    /* 定時器中斷回調 */
    static uint32_t count = 0;
    count++;

    /* 每秒執行一次 */
    if (count >= {frequency}) {{
        count = 0;
        /* 用戶代碼 */
    }}
}}

int timer_init_generated(void)
{{
    timer_config_t config = {{
        .mode = TIMER_MODE_BASE,
        .frequency = {frequency},
        .prescaler = 83,
        .period = 999,
        .auto_reload = true
    }};

    timer_handle = timer_init({timer_num}, &config);

    if (timer_handle == NULL) {{
        return -1;
    }}

    /* 設置回調並啟用中斷 */
    timer_set_callback(timer_handle, timer_callback);
    timer_enable_interrupt(timer_handle);

    return 0;
}}
"""
        return code

    def _adc_template(self, config: Dict[str, Any]) -> str:
        """ADC 代碼模板"""
        adc_num = config.get('adc_num', '1')
        channel = config.get('channel', '0')
        resolution = config.get('resolution', '12BIT')

        code = f"""/**
 * AI 生成的 ADC 初始化代碼
 * 配置: ADC{adc_num} Channel {channel} - {resolution}
 */

#include "adc_hal.h"

static adc_handle_t adc_handle = NULL;

int adc_init_generated(void)
{{
    adc_config_t config = {{
        .resolution = ADC_RESOLUTION_{resolution},
        .sample_time = ADC_SAMPLE_TIME_84_CYCLES,
        .alignment = ADC_ALIGN_RIGHT,
        .continuous_mode = false,
        .dma_mode = false,
        .trigger = ADC_TRIGGER_SOFTWARE,
        .num_channels = 1
    }};

    adc_handle = adc_init({adc_num}, &config);

    if (adc_handle == NULL) {{
        return -1;
    }}

    return 0;
}}

/* 讀取 ADC 值 */
uint32_t adc_read_example(void)
{{
    return adc_read_channel(adc_handle, {channel});
}}

/* 轉換為電壓（毫伏） */
uint32_t adc_read_voltage_mv(void)
{{
    uint32_t adc_value = adc_read_channel(adc_handle, {channel});
    return adc_to_voltage_mv(adc_handle, adc_value, 3300);
}}

/* 讀取平均值 */
uint32_t adc_read_average_example(void)
{{
    return adc_read_average(adc_handle, {channel}, 10);
}}

/* 讀取內部溫度 */
float adc_read_temperature_example(void)
{{
    adc_enable_temperature_sensor(adc_handle);
    return adc_read_temperature(adc_handle);
}}
"""
        return code


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description='HAL 代碼生成器 - AI 輔助工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  生成 GPIO 代碼:
    %(prog)s --peripheral gpio --config '{"port":"GPIOA","pin":"5","mode":"OUTPUT_PP"}'

  生成 UART 代碼:
    %(prog)s --peripheral uart --config '{"uart_num":"2","baudrate":"115200"}'

  生成 PWM 代碼:
    %(prog)s --peripheral timer --config '{"timer_num":"3","mode":"pwm","frequency":"1000","duty_cycle":"50"}'
        """
    )

    parser.add_argument('--peripheral', required=True,
                       choices=['gpio', 'uart', 'i2c', 'spi', 'timer', 'adc'],
                       help='外設類型')

    parser.add_argument('--config', required=True,
                       help='配置參數（JSON 格式）')

    parser.add_argument('--output', '-o',
                       help='輸出文件（默認輸出到標準輸出）')

    args = parser.parse_args()

    try:
        # 解析配置
        config = json.loads(args.config)

        # 生成代碼
        generator = HALCodeGenerator()
        code = generator.generate(args.peripheral, config)

        # 輸出代碼
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(code)
            print(f"代碼已生成到: {args.output}")
        else:
            print(code)

    except json.JSONDecodeError as e:
        print(f"配置解析錯誤: {e}", file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(f"錯誤: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"未知錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
