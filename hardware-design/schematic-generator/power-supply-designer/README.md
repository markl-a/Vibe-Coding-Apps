# 電源供應器設計器 (Power Supply Designer)

自動設計各種電源供應電路，包括線性電源、交換式電源、電池管理等。

## 功能特色

- **線性電源**
  - LDO 穩壓器設計
  - 多輸出電源
  - 低雜訊電源

- **交換式電源 (SMPS)**
  - Buck 降壓轉換器
  - Boost 升壓轉換器
  - Buck-Boost 轉換器

- **電池管理**
  - 充電電路
  - 保護電路
  - 電量監測

## 快速開始

```python
from src.smps_designer import BuckConverter

# 設計一個 Buck 降壓轉換器
converter = BuckConverter()
circuit = converter.design(
    input_voltage=12,
    output_voltage=5,
    output_current=2
)

print(f"開關頻率: {circuit['switching_frequency']/1000} kHz")
print(f"電感值: {circuit['L']*1e6:.1f} µH")
print(f"電容值: {circuit['C']*1e6:.1f} µF")
print(f"效率: {circuit['efficiency']:.1f}%")
```
