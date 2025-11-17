#!/usr/bin/env python3
"""
Raspberry Pi GPIO LED 控制範例

功能：
- 控制 LED 閃爍
- 按鈕輸入檢測
- PWM 調光

硬體連接：
- LED: GPIO17 (Pin 11)
- Button: GPIO27 (Pin 13)
- PWM LED: GPIO18 (Pin 12)
"""

import RPi.GPIO as GPIO
import time

# GPIO 腳位定義
LED_PIN = 17
BUTTON_PIN = 27
PWM_LED_PIN = 18

# PWM 設定
PWM_FREQ = 1000  # 1kHz

def setup():
    """初始化 GPIO"""
    print("=== Raspberry Pi LED 控制範例 ===\n")

    # 設定模式為 BCM
    GPIO.setmode(GPIO.BCM)

    # 設定警告
    GPIO.setwarnings(False)

    # 配置 LED 腳位
    GPIO.setup(LED_PIN, GPIO.OUT)
    GPIO.setup(PWM_LED_PIN, GPIO.OUT)

    # 配置按鈕腳位（使用內部上拉電阻）
    GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

    # 初始化 PWM
    global pwm
    pwm = GPIO.PWM(PWM_LED_PIN, PWM_FREQ)
    pwm.start(0)  # 初始占空比 0%

    print("GPIO 初始化完成")
    print(f"LED 腳位: GPIO{LED_PIN}")
    print(f"按鈕腳位: GPIO{BUTTON_PIN}")
    print(f"PWM LED 腳位: GPIO{PWM_LED_PIN}\n")

def blink_test():
    """LED 閃爍測試"""
    print("LED 閃爍測試（5次）...")

    for i in range(5):
        GPIO.output(LED_PIN, GPIO.HIGH)
        print(f"  閃爍 {i+1}: LED ON")
        time.sleep(0.5)

        GPIO.output(LED_PIN, GPIO.LOW)
        print(f"  閃爍 {i+1}: LED OFF")
        time.sleep(0.5)

    print("閃爍測試完成\n")

def pwm_test():
    """PWM 呼吸燈測試"""
    print("PWM 呼吸燈測試...")

    # 漸亮
    print("  LED 漸亮...")
    for duty_cycle in range(0, 101, 5):
        pwm.ChangeDutyCycle(duty_cycle)
        time.sleep(0.05)

    time.sleep(0.5)

    # 漸暗
    print("  LED 漸暗...")
    for duty_cycle in range(100, -1, -5):
        pwm.ChangeDutyCycle(duty_cycle)
        time.sleep(0.05)

    print("PWM 測試完成\n")

def button_test():
    """按鈕輸入測試"""
    print("按鈕測試（按 5 次或 10 秒後結束）...")

    count = 0
    last_state = GPIO.HIGH
    start_time = time.time()

    while count < 5 and (time.time() - start_time) < 10:
        current_state = GPIO.input(BUTTON_PIN)

        # 檢測按鈕按下（下降沿）
        if current_state == GPIO.LOW and last_state == GPIO.HIGH:
            count += 1
            print(f"  按鈕被按下 #{count}")

            # 切換 LED
            GPIO.output(LED_PIN, GPIO.HIGH)
            time.sleep(0.1)
            GPIO.output(LED_PIN, GPIO.LOW)

            # 消抖動
            time.sleep(0.2)

        last_state = current_state
        time.sleep(0.01)

    print(f"按鈕測試完成（共按下 {count} 次）\n")

def interactive_mode():
    """互動模式"""
    print("進入互動模式...")
    print("按鈕控制：")
    print("  - 單擊：切換 LED")
    print("  - 長按：PWM 調光")
    print("按 Ctrl+C 退出\n")

    led_state = False
    pwm_brightness = 0

    try:
        while True:
            # 檢測按鈕
            if GPIO.input(BUTTON_PIN) == GPIO.LOW:
                press_time = time.time()

                # 等待按鈕釋放或 1 秒
                while GPIO.input(BUTTON_PIN) == GPIO.LOW:
                    if time.time() - press_time > 1.0:
                        # 長按 - PWM 調光
                        pwm_brightness = (pwm_brightness + 25) % 125
                        pwm.ChangeDutyCycle(pwm_brightness)
                        print(f"PWM 亮度: {pwm_brightness}%")
                        break
                    time.sleep(0.01)

                # 短按 - 切換 LED
                if time.time() - press_time < 1.0:
                    led_state = not led_state
                    GPIO.output(LED_PIN, led_state)
                    print(f"LED: {'ON' if led_state else 'OFF'}")

                # 消抖動
                time.sleep(0.3)

            time.sleep(0.01)

    except KeyboardInterrupt:
        print("\n\n退出互動模式")

def cleanup():
    """清理 GPIO"""
    pwm.stop()
    GPIO.cleanup()
    print("\nGPIO 已清理")

def main():
    """主程式"""
    try:
        setup()
        blink_test()
        pwm_test()
        button_test()
        interactive_mode()

    except KeyboardInterrupt:
        print("\n\n程式被中斷")

    finally:
        cleanup()

if __name__ == "__main__":
    main()
