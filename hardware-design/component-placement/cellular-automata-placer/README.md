# 細胞自動機元件擺放器

使用細胞自動機 (Cellular Automata) 演算法進行 PCB 元件擺放優化。受 RL_PCB 論文啟發的創新方法。

## 原理

將 PCB 板視為二維網格，每個細胞代表可能的元件位置。通過定義局部規則，讓系統自動演化到最佳佈局：

- **吸引力**: 有連接關係的元件互相吸引
- **排斥力**: 元件之間保持最小間距
- **邊界約束**: 元件保持在板子範圍內

## 功能特點

- 基於網格的快速計算
- 支援並行更新
- 可視化演化過程
- 支援自定義演化規則

## 安裝

```bash
pip install -r requirements.txt
```

## 快速開始

```python
from cellular_placer import CellularAutomataPlacer

# 初始化擺放器
placer = CellularAutomataPlacer(
    board_size=(100, 80),
    grid_resolution=1.0  # 1mm per cell
)

# 添加元件
placer.add_component("U1", size=(10, 8))
placer.add_component("R1", size=(5, 3))

# 添加連接
placer.add_connection("U1", "R1")

# 執行演化
result = placer.evolve(iterations=200)

# 視覺化
placer.visualize(result)
```

## 演算法參數

- `iterations`: 演化迭代次數
- `attraction_strength`: 吸引力強度
- `repulsion_strength`: 排斥力強度
- `grid_resolution`: 網格解析度 (mm)

## 優勢

- 計算速度快
- 記憶體效率高
- 易於並行化
- 直觀的物理意義

## 範例

查看 `examples/` 目錄獲取更多使用範例。
