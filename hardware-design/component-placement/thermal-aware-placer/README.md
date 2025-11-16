# 熱感知元件擺放器

考慮熱分佈的智能 PCB 元件擺放優化工具。

## 原理

在元件擺放時同時考慮：
- **熱源分佈**: 識別高功耗元件（CPU、電源模組等）
- **熱傳導**: 模擬 PCB 上的熱傳導過程
- **熱點避免**: 防止多個熱源過度集中
- **散熱優化**: 將熱源分散或靠近散熱區域

## 功能特點

- 元件熱特性定義（功耗、熱阻等）
- 2D 熱傳導模擬
- 熱圖視覺化
- 多目標優化（連線長度 + 熱分佈）
- 散熱區域定義
- 溫度約束檢查

## 安裝

```bash
pip install -r requirements.txt
```

## 快速開始

```python
from thermal_placer import ThermalAwarePlacer

# 初始化擺放器
placer = ThermalAwarePlacer(
    board_size=(100, 80),
    ambient_temp=25.0  # °C
)

# 添加元件（含熱特性）
placer.add_component("CPU", size=(15, 15), power=5.0)  # 5W
placer.add_component("VREG", size=(8, 6), power=2.0)   # 2W
placer.add_component("R1", size=(5, 3), power=0.1)     # 0.1W

# 定義散熱區域
placer.add_heatsink_area((80, 0), (20, 30))

# 執行優化
result = placer.optimize(iterations=100)

# 視覺化熱圖
placer.visualize_thermal(result)
```

## 熱模型

使用有限差分法求解 2D 熱傳導方程：

```
∂T/∂t = α∇²T + Q
```

其中：
- T: 溫度
- α: 熱擴散係數
- Q: 熱源項

## 優化目標

多目標優化權衡：
- 最小化連線長度
- 最小化最高溫度
- 最小化溫度梯度
- 滿足溫度約束

## 範例

查看 `examples/` 目錄獲取更多使用範例。
