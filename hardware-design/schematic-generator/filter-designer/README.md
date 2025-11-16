# 濾波器設計器 (Filter Designer)

自動設計各種類比和數位濾波器電路，包括低通、高通、帶通、帶阻濾波器。

## 功能特色

- **被動濾波器**
  - RC 低通/高通濾波器
  - LC 濾波器
  - π 型濾波器

- **主動濾波器**
  - Sallen-Key 拓撲
  - Multiple Feedback (MFB)
  - Butterworth 響應
  - Chebyshev 響應

- **濾波器類型**
  - 低通濾波器 (Low-pass)
  - 高通濾波器 (High-pass)
  - 帶通濾波器 (Band-pass)
  - 帶阻濾波器 (Band-stop/Notch)

## 快速開始

```python
from src.active_filter import ActiveFilterDesigner

# 設計一個 1kHz 低通濾波器
designer = ActiveFilterDesigner()
circuit = designer.design_lowpass_butterworth(
    cutoff_frequency=1000,
    order=2,
    gain=1
)

print(f"R1: {circuit['R1']} Ω")
print(f"R2: {circuit['R2']} Ω")
print(f"C1: {circuit['C1']*1e9:.2f} nF")
print(f"C2: {circuit['C2']*1e9:.2f} nF")
```

## 範例

查看 `examples/` 目錄獲取更多範例。
