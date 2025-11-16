# 感測器介面生成器 (Sensor Interface Generator)

自動生成各種感測器介面電路，包括類比感測器、數位感測器、信號調理電路等。

## 功能特色

- **類比感測器介面**
  - 溫度感測器 (LM35, NTC, PT100)
  - 壓力感測器
  - 光感測器 (光敏電阻、光電二極體)
  - 麥克風前置放大器

- **數位感測器介面**
  - I2C 感測器介面
  - SPI 感測器介面
  - UART 感測器介面

- **信號調理**
  - 放大電路
  - 濾波電路
  - ADC 介面

## 快速開始

```python
from src.sensor_interface import TemperatureSensor

# 設計 LM35 溫度感測器介面
sensor = TemperatureSensor()
circuit = sensor.design_lm35_interface(
    mcu_adc_voltage=3.3,
    temp_range=(-50, 150)
)

print(f"放大倍數: {circuit['gain']}")
print(f"輸出電壓範圍: {circuit['output_voltage_range']}")
```
