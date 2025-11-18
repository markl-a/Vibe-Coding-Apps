#!/usr/bin/env python3
"""
GPIO 代碼生成器
自動生成常見 MCU 平台的 GPIO 初始化和控制代碼

支援平台：
- STM32 (HAL)
- ESP32 (Arduino)
- Arduino
- Raspberry Pi (Python)
"""

import argparse
import sys
from enum import Enum

class MCU(Enum):
    STM32F4 = "stm32f4"
    ESP32 = "esp32"
    ARDUINO = "arduino"
    RASPBERRY_PI = "raspberry_pi"

class PinMode(Enum):
    OUTPUT = "output"
    INPUT = "input"
    INPUT_PULLUP = "input_pullup"
    INPUT_PULLDOWN = "input_pulldown"

class STM32Generator:
    """STM32 HAL 代碼生成器"""

    def __init__(self, pin, mode):
        self.pin = pin.upper()
        self.mode = mode

        # 解析 GPIO 埠和腳位
        if len(pin) < 2:
            raise ValueError("Invalid pin format. Use format like 'PA5'")

        self.port = self.pin[0:2]  # PA, PB, PC, etc.
        self.pin_num = self.pin[2:]  # 5, 12, etc.

    def generate_init(self):
        """生成初始化代碼"""
        pull_mode = {
            PinMode.OUTPUT: "GPIO_NOPULL",
            PinMode.INPUT: "GPIO_NOPULL",
            PinMode.INPUT_PULLUP: "GPIO_PULLUP",
            PinMode.INPUT_PULLDOWN: "GPIO_PULLDOWN"
        }

        gpio_mode = {
            PinMode.OUTPUT: "GPIO_MODE_OUTPUT_PP",
            PinMode.INPUT: "GPIO_MODE_INPUT",
            PinMode.INPUT_PULLUP: "GPIO_MODE_INPUT",
            PinMode.INPUT_PULLDOWN: "GPIO_MODE_INPUT"
        }

        code = f"""/**
 * GPIO 初始化函數
 * 腳位: {self.pin}
 * 模式: {self.mode.value}
 *
 * 使用 STM32 HAL 庫
 */

#include "stm32f4xx_hal.h"

void GPIO_{self.pin}_Init(void)
{{
    GPIO_InitTypeDef GPIO_InitStruct = {{0}};

    /* 啟用 GPIO{self.port[1]} 時鐘 */
    __HAL_RCC_GPIO{self.port[1]}_CLK_ENABLE();

    /* 配置 GPIO 腳位: {self.pin} */
    GPIO_InitStruct.Pin = GPIO_PIN_{self.pin_num};
    GPIO_InitStruct.Mode = {gpio_mode[self.mode]};
    GPIO_InitStruct.Pull = {pull_mode[self.mode]};
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(GPIO{self.port[1]}, &GPIO_InitStruct);

    /* 如果是輸出模式，設置初始狀態為低電平 */
    {"HAL_GPIO_WritePin(GPIO" + self.port[1] + ", GPIO_PIN_" + self.pin_num + ", GPIO_PIN_RESET);" if self.mode == PinMode.OUTPUT else "/* 輸入模式，無需設置初始狀態 */"}
}}
"""

        if self.mode == PinMode.OUTPUT:
            code += f"""
/**
 * 設置 GPIO 輸出狀態
 * @param state: 1 = 高電平, 0 = 低電平
 */
void GPIO_{self.pin}_Write(uint8_t state)
{{
    HAL_GPIO_WritePin(GPIO{self.port[1]}, GPIO_PIN_{self.pin_num},
                     state ? GPIO_PIN_SET : GPIO_PIN_RESET);
}}

/**
 * 切換 GPIO 輸出狀態
 */
void GPIO_{self.pin}_Toggle(void)
{{
    HAL_GPIO_TogglePin(GPIO{self.port[1]}, GPIO_PIN_{self.pin_num});
}}
"""
        else:
            code += f"""
/**
 * 讀取 GPIO 輸入狀態
 * @return: 1 = 高電平, 0 = 低電平
 */
uint8_t GPIO_{self.pin}_Read(void)
{{
    return HAL_GPIO_ReadPin(GPIO{self.port[1]}, GPIO_PIN_{self.pin_num});
}}
"""

        return code

class ESP32Generator:
    """ESP32 Arduino 代碼生成器"""

    def __init__(self, pin, mode):
        try:
            self.pin = int(pin)
        except ValueError:
            raise ValueError("ESP32 pin must be a number (e.g., 2, 4, 5)")
        self.mode = mode

    def generate_init(self):
        """生成初始化代碼"""
        mode_map = {
            PinMode.OUTPUT: "OUTPUT",
            PinMode.INPUT: "INPUT",
            PinMode.INPUT_PULLUP: "INPUT_PULLUP",
            PinMode.INPUT_PULLDOWN: "INPUT_PULLDOWN"
        }

        code = f"""/**
 * GPIO 初始化函數
 * 腳位: GPIO{self.pin}
 * 模式: {self.mode.value}
 *
 * 使用 ESP32 Arduino 框架
 */

#define GPIO_PIN {self.pin}

void setup() {{
    // 初始化序列埠（用於調試）
    Serial.begin(115200);

    // 配置 GPIO 腳位
    pinMode(GPIO_PIN, {mode_map[self.mode]});

    {"// 設置初始狀態為低電平" if self.mode == PinMode.OUTPUT else "// 輸入模式"}
    {"digitalWrite(GPIO_PIN, LOW);" if self.mode == PinMode.OUTPUT else ""}

    Serial.println("GPIO {self.pin} initialized as {self.mode.value}");
}}
"""

        if self.mode == PinMode.OUTPUT:
            code += f"""
/**
 * 設置 GPIO 輸出狀態
 */
void setGPIO(bool state) {{
    digitalWrite(GPIO_PIN, state ? HIGH : LOW);
    Serial.printf("GPIO {self.pin} set to %s\\n", state ? "HIGH" : "LOW");
}}

/**
 * 切換 GPIO 輸出狀態
 */
void toggleGPIO() {{
    static bool state = false;
    state = !state;
    digitalWrite(GPIO_PIN, state);
    Serial.printf("GPIO {self.pin} toggled to %s\\n", state ? "HIGH" : "LOW");
}}

void loop() {{
    // LED 閃爍範例
    toggleGPIO();
    delay(1000);
}}
"""
        else:
            code += f"""
/**
 * 讀取 GPIO 輸入狀態
 */
bool readGPIO() {{
    return digitalRead(GPIO_PIN);
}}

void loop() {{
    // 讀取並顯示 GPIO 狀態
    bool state = readGPIO();
    Serial.printf("GPIO {self.pin} state: %s\\n", state ? "HIGH" : "LOW");
    delay(500);
}}
"""

        return code

class ArduinoGenerator:
    """Arduino 代碼生成器"""

    def __init__(self, pin, mode):
        try:
            self.pin = int(pin)
        except ValueError:
            raise ValueError("Arduino pin must be a number")
        self.mode = mode

    def generate_init(self):
        """生成初始化代碼"""
        mode_map = {
            PinMode.OUTPUT: "OUTPUT",
            PinMode.INPUT: "INPUT",
            PinMode.INPUT_PULLUP: "INPUT_PULLUP",
            PinMode.INPUT_PULLDOWN: "INPUT_PULLUP"  # Arduino 沒有 pulldown
        }

        code = f"""/**
 * Arduino GPIO 控制
 * 腳位: {self.pin}
 * 模式: {self.mode.value}
 */

const int GPIO_PIN = {self.pin};

void setup() {{
    // 初始化序列埠
    Serial.begin(9600);

    // 配置 GPIO 腳位
    pinMode(GPIO_PIN, {mode_map[self.mode]});

    {"digitalWrite(GPIO_PIN, LOW);" if self.mode == PinMode.OUTPUT else ""}

    Serial.println("Arduino GPIO initialized");
}}
"""

        if self.mode == PinMode.OUTPUT:
            code += f"""
void loop() {{
    // LED 閃爍
    digitalWrite(GPIO_PIN, HIGH);
    Serial.println("LED ON");
    delay(1000);

    digitalWrite(GPIO_PIN, LOW);
    Serial.println("LED OFF");
    delay(1000);
}}
"""
        else:
            code += f"""
void loop() {{
    // 讀取並顯示狀態
    int state = digitalRead(GPIO_PIN);
    Serial.print("Pin state: ");
    Serial.println(state);
    delay(500);
}}
"""

        return code

class RaspberryPiGenerator:
    """Raspberry Pi GPIO 代碼生成器（Python）"""

    def __init__(self, pin, mode):
        try:
            self.pin = int(pin)
        except ValueError:
            raise ValueError("Pin must be a BCM number")
        self.mode = mode

    def generate_init(self):
        """生成初始化代碼"""
        mode_map = {
            PinMode.OUTPUT: "GPIO.OUT",
            PinMode.INPUT: "GPIO.IN",
            PinMode.INPUT_PULLUP: "GPIO.IN, pull_up_down=GPIO.PUD_UP",
            PinMode.INPUT_PULLDOWN: "GPIO.IN, pull_up_down=GPIO.PUD_DOWN"
        }

        setup_mode = mode_map[self.mode]

        code = f'''#!/usr/bin/env python3
"""
Raspberry Pi GPIO 控制
腳位: GPIO{self.pin} (BCM 編號)
模式: {self.mode.value}
"""

import RPi.GPIO as GPIO
import time

# GPIO 腳位（BCM 編號）
GPIO_PIN = {self.pin}

def setup():
    """初始化 GPIO"""
    # 使用 BCM 編號模式
    GPIO.setmode(GPIO.BCM)

    # 配置 GPIO 腳位
    GPIO.setup(GPIO_PIN, {setup_mode})

    {"GPIO.output(GPIO_PIN, GPIO.LOW)" if self.mode == PinMode.OUTPUT else "# 輸入模式"}

    print(f"GPIO {{GPIO_PIN}} initialized as {self.mode.value}")
'''

        if self.mode == PinMode.OUTPUT:
            code += f'''

def set_gpio(state):
    """設置 GPIO 輸出狀態"""
    GPIO.output(GPIO_PIN, GPIO.HIGH if state else GPIO.LOW)
    print(f"GPIO {{GPIO_PIN}} set to {{'HIGH' if state else 'LOW'}}")

def toggle_gpio():
    """切換 GPIO 狀態"""
    current = GPIO.input(GPIO_PIN)
    GPIO.output(GPIO_PIN, not current)
    print(f"GPIO {{GPIO_PIN}} toggled to {{'HIGH' if not current else 'LOW'}}")

def main():
    """主函數"""
    setup()

    try:
        while True:
            # LED 閃爍
            set_gpio(True)
            time.sleep(1)

            set_gpio(False)
            time.sleep(1)

    except KeyboardInterrupt:
        print("\\nProgram stopped by user")
    finally:
        # 清理 GPIO
        GPIO.cleanup()
        print("GPIO cleanup done")

if __name__ == "__main__":
    main()
'''
        else:
            code += f'''

def read_gpio():
    """讀取 GPIO 輸入狀態"""
    state = GPIO.input(GPIO_PIN)
    return state

def main():
    """主函數"""
    setup()

    try:
        while True:
            # 讀取並顯示狀態
            state = read_gpio()
            print(f"GPIO {{GPIO_PIN}} state: {{'HIGH' if state else 'LOW'}}")
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\\nProgram stopped by user")
    finally:
        GPIO.cleanup()
        print("GPIO cleanup done")

if __name__ == "__main__":
    main()
'''

        return code

def main():
    parser = argparse.ArgumentParser(
        description='GPIO 代碼生成器 - 自動生成 GPIO 初始化和控制代碼',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s --mcu stm32f4 --pin PA5 --mode output
  %(prog)s --mcu esp32 --pin 2 --mode output
  %(prog)s --mcu arduino --pin 13 --mode output
  %(prog)s --mcu raspberry_pi --pin 17 --mode input_pullup
        """
    )

    parser.add_argument('--mcu', required=True,
                       choices=[e.value for e in MCU],
                       help='目標 MCU 平台')
    parser.add_argument('--pin', required=True,
                       help='GPIO 腳位（格式依平台而定）')
    parser.add_argument('--mode', required=True,
                       choices=[e.value for e in PinMode],
                       help='GPIO 模式')
    parser.add_argument('--output', '-o',
                       help='輸出檔案名稱（可選）')

    args = parser.parse_args()

    # 轉換枚舉
    mcu = MCU(args.mcu)
    mode = PinMode(args.mode)

    # 生成代碼
    try:
        if mcu == MCU.STM32F4:
            generator = STM32Generator(args.pin, mode)
            extension = '.c'
        elif mcu == MCU.ESP32:
            generator = ESP32Generator(args.pin, mode)
            extension = '.ino'
        elif mcu == MCU.ARDUINO:
            generator = ArduinoGenerator(args.pin, mode)
            extension = '.ino'
        elif mcu == MCU.RASPBERRY_PI:
            generator = RaspberryPiGenerator(args.pin, mode)
            extension = '.py'
        else:
            print(f"不支援的 MCU: {mcu}")
            return 1

        code = generator.generate_init()

        # 輸出代碼
        if args.output:
            output_file = args.output
            if not output_file.endswith(extension):
                output_file += extension

            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(code)
            print(f"✅ 代碼已生成: {output_file}")
        else:
            print("=" * 60)
            print(f"生成的代碼 ({mcu.value} - GPIO {args.pin} - {mode.value})")
            print("=" * 60)
            print(code)
            print("=" * 60)

        return 0

    except Exception as e:
        print(f"❌ 錯誤: {e}", file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())
