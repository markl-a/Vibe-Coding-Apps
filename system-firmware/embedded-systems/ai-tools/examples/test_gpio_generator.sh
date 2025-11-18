#!/bin/bash
# GPIO 生成器測試腳本

echo "======================================"
echo "GPIO 代碼生成器測試"
echo "======================================"

# 確保腳本可執行
chmod +x ../code-generator/gpio_generator.py

echo ""
echo "測試 1: 生成 STM32 輸出腳位代碼"
echo "--------------------------------------"
python3 ../code-generator/gpio_generator.py --mcu stm32f4 --pin PA5 --mode output

echo ""
echo "測試 2: 生成 ESP32 輸出腳位代碼並保存到文件"
echo "--------------------------------------"
python3 ../code-generator/gpio_generator.py --mcu esp32 --pin 2 --mode output --output esp32_led.ino
if [ -f "esp32_led.ino" ]; then
    echo "✅ 文件生成成功: esp32_led.ino"
    head -20 esp32_led.ino
else
    echo "❌ 文件生成失敗"
fi

echo ""
echo "測試 3: 生成 Arduino 輸入腳位代碼"
echo "--------------------------------------"
python3 ../code-generator/gpio_generator.py --mcu arduino --pin 13 --mode input_pullup

echo ""
echo "測試 4: 生成 Raspberry Pi GPIO 代碼"
echo "--------------------------------------"
python3 ../code-generator/gpio_generator.py --mcu raspberry_pi --pin 17 --mode output --output rpi_gpio.py
if [ -f "rpi_gpio.py" ]; then
    echo "✅ 文件生成成功: rpi_gpio.py"
    chmod +x rpi_gpio.py
fi

echo ""
echo "======================================"
echo "測試完成！"
echo "======================================"
