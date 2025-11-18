#!/usr/bin/env python3
"""
HAL 配置向导 - 交互式 AI 辅助工具
帮助用户快速配置 HAL 外设
"""

import json
import sys
from typing import Dict, Any, List, Optional


class ConfigWizard:
    """配置向导"""

    def __init__(self):
        self.config = {}

    def run(self) -> Dict[str, Any]:
        """运行向导"""
        print("=" * 60)
        print("HAL 配置向导 - AI 辅助工具")
        print("=" * 60)
        print()

        # 选择外设类型
        peripheral = self._select_peripheral()

        # 根据外设类型配置
        if peripheral == 'gpio':
            self.config = self._configure_gpio()
        elif peripheral == 'uart':
            self.config = self._configure_uart()
        elif peripheral == 'i2c':
            self.config = self._configure_i2c()
        elif peripheral == 'spi':
            self.config = self._configure_spi()
        elif peripheral == 'timer':
            self.config = self._configure_timer()
        elif peripheral == 'adc':
            self.config = self._configure_adc()

        return {
            'peripheral': peripheral,
            'config': self.config
        }

    def _select_peripheral(self) -> str:
        """选择外设类型"""
        print("請選擇外設類型:")
        print("1. GPIO    - 通用輸入輸出")
        print("2. UART    - 串口通訊")
        print("3. I2C     - I2C 總線")
        print("4. SPI     - SPI 總線")
        print("5. Timer   - 定時器/PWM")
        print("6. ADC     - 模數轉換器")
        print()

        choice = self._get_choice("請輸入選項 (1-6): ", ['1', '2', '3', '4', '5', '6'])

        peripheral_map = {
            '1': 'gpio',
            '2': 'uart',
            '3': 'i2c',
            '4': 'spi',
            '5': 'timer',
            '6': 'adc'
        }

        return peripheral_map[choice]

    def _configure_gpio(self) -> Dict[str, Any]:
        """配置 GPIO"""
        print("\n--- GPIO 配置 ---\n")

        port = self._get_choice("選擇端口 (A/B/C/D): ", ['A', 'B', 'C', 'D'])
        pin = self._get_input("引腳編號 (0-15): ", default='5')

        print("\n模式:")
        print("1. INPUT       - 輸入")
        print("2. OUTPUT_PP   - 推挽輸出")
        print("3. OUTPUT_OD   - 開漏輸出")
        mode_choice = self._get_choice("選擇模式 (1-3): ", ['1', '2', '3'])
        mode_map = {'1': 'INPUT', '2': 'OUTPUT_PP', '3': 'OUTPUT_OD'}
        mode = mode_map[mode_choice]

        print("\n上拉/下拉:")
        print("1. NONE   - 無")
        print("2. UP     - 上拉")
        print("3. DOWN   - 下拉")
        pull_choice = self._get_choice("選擇選項 (1-3): ", ['1', '2', '3'])
        pull_map = {'1': 'NONE', '2': 'UP', '3': 'DOWN'}
        pull = pull_map[pull_choice]

        speed = 'LOW'  # 默認低速

        return {
            'port': f'GPIO{port}',
            'pin': pin,
            'mode': mode,
            'pull': pull,
            'speed': speed
        }

    def _configure_uart(self) -> Dict[str, Any]:
        """配置 UART"""
        print("\n--- UART 配置 ---\n")

        uart_num = self._get_input("UART 編號 (1-6): ", default='2')

        print("\n波特率:")
        print("1. 9600")
        print("2. 115200")
        print("3. 921600")
        print("4. 自定義")
        baud_choice = self._get_choice("選擇波特率 (1-4): ", ['1', '2', '3', '4'])

        if baud_choice == '4':
            baudrate = self._get_input("輸入波特率: ")
        else:
            baud_map = {'1': '9600', '2': '115200', '3': '921600'}
            baudrate = baud_map[baud_choice]

        word_length = self._get_choice("數據位 (8/9): ", ['8', '9'], default='8')
        stop_bits = self._get_choice("停止位 (1/2): ", ['1', '2'], default='1')

        print("\n校驗位:")
        print("1. NONE - 無")
        print("2. EVEN - 偶校驗")
        print("3. ODD  - 奇校驗")
        parity_choice = self._get_choice("選擇校驗 (1-3): ", ['1', '2', '3'])
        parity_map = {'1': 'NONE', '2': 'EVEN', '3': 'ODD'}
        parity = parity_map[parity_choice]

        return {
            'uart_num': uart_num,
            'baudrate': baudrate,
            'word_length': word_length,
            'stop_bits': stop_bits,
            'parity': parity
        }

    def _configure_i2c(self) -> Dict[str, Any]:
        """配置 I2C"""
        print("\n--- I2C 配置 ---\n")

        i2c_num = self._get_input("I2C 編號 (1-3): ", default='1')

        print("\n時鐘速度:")
        print("1. 100 kHz - 標準模式")
        print("2. 400 kHz - 快速模式")
        speed_choice = self._get_choice("選擇速度 (1-2): ", ['1', '2'])
        speed_map = {'1': '100000', '2': '400000'}
        clock_speed = speed_map[speed_choice]

        device_addr = self._get_input("設備地址 (十六進制，例如 0x50): ", default='0x50')

        return {
            'i2c_num': i2c_num,
            'clock_speed': clock_speed,
            'device_addr': device_addr
        }

    def _configure_spi(self) -> Dict[str, Any]:
        """配置 SPI"""
        print("\n--- SPI 配置 ---\n")

        spi_num = self._get_input("SPI 編號 (1-6): ", default='1')

        print("\nSPI 模式:")
        print("0. CPOL=0, CPHA=0")
        print("1. CPOL=0, CPHA=1")
        print("2. CPOL=1, CPHA=0")
        print("3. CPOL=1, CPHA=1")
        mode = self._get_choice("選擇模式 (0-3): ", ['0', '1', '2', '3'])

        print("\n波特率分頻:")
        print("1. 2")
        print("2. 4")
        print("3. 8")
        print("4. 16")
        print("5. 32")
        prescaler_choice = self._get_choice("選擇分頻 (1-5): ", ['1', '2', '3', '4', '5'])
        prescaler_map = {'1': '2', '2': '4', '3': '8', '4': '16', '5': '32'}
        prescaler = prescaler_map[prescaler_choice]

        return {
            'spi_num': spi_num,
            'mode': mode,
            'prescaler': prescaler
        }

    def _configure_timer(self) -> Dict[str, Any]:
        """配置 Timer"""
        print("\n--- Timer/PWM 配置 ---\n")

        timer_num = self._get_input("Timer 編號 (1-14): ", default='3')

        print("\n模式:")
        print("1. 基本定時器")
        print("2. PWM 輸出")
        mode_choice = self._get_choice("選擇模式 (1-2): ", ['1', '2'])

        if mode_choice == '2':
            mode = 'pwm'
            channel = self._get_input("PWM 通道 (1-4): ", default='1')
            frequency = self._get_input("頻率 (Hz): ", default='1000')
            duty_cycle = self._get_input("占空比 (0-100): ", default='50')

            return {
                'timer_num': timer_num,
                'mode': mode,
                'channel': channel,
                'frequency': frequency,
                'duty_cycle': duty_cycle
            }
        else:
            mode = 'timer'
            frequency = self._get_input("頻率 (Hz): ", default='1000')

            return {
                'timer_num': timer_num,
                'mode': mode,
                'frequency': frequency
            }

    def _configure_adc(self) -> Dict[str, Any]:
        """配置 ADC"""
        print("\n--- ADC 配置 ---\n")

        adc_num = self._get_input("ADC 編號 (1-3): ", default='1')
        channel = self._get_input("通道編號 (0-18): ", default='0')

        print("\n解析度:")
        print("1. 12 位")
        print("2. 10 位")
        print("3. 8 位")
        resolution_choice = self._get_choice("選擇解析度 (1-3): ", ['1', '2', '3'])
        resolution_map = {'1': '12BIT', '2': '10BIT', '3': '8BIT'}
        resolution = resolution_map[resolution_choice]

        return {
            'adc_num': adc_num,
            'channel': channel,
            'resolution': resolution
        }

    def _get_input(self, prompt: str, default: Optional[str] = None) -> str:
        """獲取用戶輸入"""
        if default:
            prompt = f"{prompt}[默認: {default}] "

        value = input(prompt).strip()

        if not value and default:
            return default

        return value

    def _get_choice(self, prompt: str, choices: List[str],
                   default: Optional[str] = None) -> str:
        """獲取用戶選擇"""
        while True:
            value = self._get_input(prompt, default)

            if value in choices:
                return value

            print(f"無效的選擇，請輸入 {'/'.join(choices)}")


def main():
    """主函數"""
    wizard = ConfigWizard()

    try:
        result = wizard.run()

        print("\n" + "=" * 60)
        print("配置完成！")
        print("=" * 60)
        print()
        print("生成的配置:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print()

        # 詢問是否生成代碼
        generate = input("是否生成代碼？(y/n) [y]: ").strip().lower()

        if generate in ['', 'y', 'yes']:
            config_json = json.dumps(result['config'])
            print()
            print("運行以下命令生成代碼:")
            print(f"python3 hal_code_generator.py --peripheral {result['peripheral']} --config '{config_json}'")

    except KeyboardInterrupt:
        print("\n\n配置已取消")
        sys.exit(0)
    except Exception as e:
        print(f"\n錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
