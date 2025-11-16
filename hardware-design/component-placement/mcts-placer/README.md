# MCTS 元件擺放器

使用 Monte Carlo Tree Search (MCTS) 演算法進行 PCB 元件擺放優化。

## 功能特點

- 基於 UCB1 的選擇策略
- 支援多種評估指標（連線長度、擁擠度等）
- 可調整的探索/利用平衡
- 支援約束條件（禁止區域、最小間距等）

## 安裝

```bash
pip install -r requirements.txt
```

## 快速開始

```python
from mcts_placer import MCTSComponentPlacer

# 初始化擺放器
placer = MCTSComponentPlacer(
    board_size=(100, 80),
    exploration_weight=1.414
)

# 添加元件
placer.add_component("R1", size=(5, 3))
placer.add_component("C1", size=(3, 3))

# 添加連接
placer.add_connection("R1", "C1")

# 執行優化
result = placer.optimize(iterations=1000)

# 查看結果
print(f"最佳成本: {result['cost']:.2f}")
print(f"擺放位置: {result['layout']}")
```

## 演算法參數

- `iterations`: 搜索迭代次數（預設: 1000）
- `exploration_weight`: UCB1 探索權重（預設: 1.414）
- `max_depth`: 搜索樹最大深度（預設: 無限制）
- `simulation_depth`: 模擬深度（預設: 10）

## 範例

查看 `examples/` 目錄獲取更多使用範例。
