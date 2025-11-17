#!/usr/bin/env python3
"""
Raspberry Pi DHT11 溫濕度感測器範例

功能：
- 讀取 DHT11 溫濕度數據
- 數據記錄
- 警告提示

硬體連接：
- DHT11 Data: GPIO4 (Pin 7)
- DHT11 VCC: 3.3V (Pin 1)
- DHT11 GND: GND (Pin 6)

安裝依賴：
sudo pip3 install Adafruit_DHT
"""

import Adafruit_DHT
import time
from datetime import datetime

# DHT11 設定
DHT_SENSOR = Adafruit_DHT.DHT11
DHT_PIN = 4

# 警告閾值
TEMP_HIGH = 30.0
TEMP_LOW = 15.0
HUMIDITY_HIGH = 80.0
HUMIDITY_LOW = 30.0

def read_sensor():
    """讀取 DHT11 感測器"""
    humidity, temperature = Adafruit_DHT.read_retry(DHT_SENSOR, DHT_PIN)

    if humidity is not None and temperature is not None:
        return temperature, humidity
    else:
        return None, None

def check_warnings(temp, humidity):
    """檢查警告條件"""
    warnings = []

    if temp > TEMP_HIGH:
        warnings.append(f"⚠️  溫度過高: {temp:.1f}°C")
    elif temp < TEMP_LOW:
        warnings.append(f"⚠️  溫度過低: {temp:.1f}°C")

    if humidity > HUMIDITY_HIGH:
        warnings.append(f"⚠️  濕度過高: {humidity:.1f}%")
    elif humidity < HUMIDITY_LOW:
        warnings.append(f"⚠️  濕度過低: {humidity:.1f}%")

    return warnings

def format_output(temp, humidity, timestamp):
    """格式化輸出"""
    print("━" * 40)
    print(f"時間: {timestamp}")
    print(f"溫度: {temp:.1f}°C")
    print(f"濕度: {humidity:.1f}%")

    # 舒適度評估
    comfort = assess_comfort(temp, humidity)
    print(f"舒適度: {comfort}")

    # 檢查警告
    warnings = check_warnings(temp, humidity)
    if warnings:
        print("\n警告：")
        for warning in warnings:
            print(f"  {warning}")

    print()

def assess_comfort(temp, humidity):
    """評估舒適度"""
    if 20 <= temp <= 26 and 40 <= humidity <= 60:
        return "非常舒適 😊"
    elif 18 <= temp <= 28 and 30 <= humidity <= 70:
        return "舒適 🙂"
    elif temp > 28 or humidity > 70:
        return "悶熱 😓"
    elif temp < 18 or humidity < 30:
        return "乾冷 🥶"
    else:
        return "一般 😐"

def log_data(temp, humidity, filename="sensor_log.csv"):
    """記錄數據到 CSV 檔案"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        # 檢查檔案是否存在
        try:
            with open(filename, 'r') as f:
                pass
        except FileNotFoundError:
            # 建立新檔案並寫入標題
            with open(filename, 'w') as f:
                f.write("時間,溫度(°C),濕度(%)\n")

        # 附加數據
        with open(filename, 'a') as f:
            f.write(f"{timestamp},{temp:.1f},{humidity:.1f}\n")

    except Exception as e:
        print(f"記錄數據失敗: {e}")

def main():
    """主程式"""
    print("=" * 40)
    print("  Raspberry Pi DHT11 溫濕度監控")
    print("=" * 40)
    print(f"\n感測器腳位: GPIO{DHT_PIN}")
    print(f"採樣間隔: 2 秒")
    print(f"數據記錄: sensor_log.csv")
    print("\n按 Ctrl+C 停止監控\n")

    sample_count = 0
    error_count = 0

    try:
        while True:
            # 讀取感測器
            temp, humidity = read_sensor()

            if temp is not None and humidity is not None:
                sample_count += 1
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                # 顯示數據
                format_output(temp, humidity, timestamp)

                # 記錄數據
                log_data(temp, humidity)

            else:
                error_count += 1
                print(f"❌ 讀取失敗 (錯誤次數: {error_count})")

                if error_count > 5:
                    print("\n連續多次讀取失敗，請檢查：")
                    print("  1. DHT11 接線是否正確")
                    print("  2. 感測器是否損壞")
                    print("  3. 電源是否穩定\n")
                    error_count = 0

            # 等待 2 秒（DHT11 最小採樣間隔）
            time.sleep(2)

    except KeyboardInterrupt:
        print("\n\n監控已停止")
        print(f"總採樣次數: {sample_count}")
        print(f"數據已儲存至: sensor_log.csv")

if __name__ == "__main__":
    main()
