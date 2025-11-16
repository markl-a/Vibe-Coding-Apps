# 遺傳演算法元件擺放器

使用遺傳演算法 (Genetic Algorithm) 進行 PCB 元件擺放優化。

## 原理

遺傳演算法模擬生物演化過程：
- **個體**: 每個個體代表一個完整的元件佈局方案
- **適應度**: 基於連線長度、擁擠度等指標評估
- **選擇**: 優秀個體有更高機率被選中繁殖
- **交叉**: 兩個父代個體交換部分基因產生子代
- **突變**: 隨機改變部分元件位置增加多樣性

## 功能特點

- 支援多種交叉策略（單點、兩點、均勻交叉）
- 自適應突變率
- 菁英保留策略
- 多目標優化支援
- 族群多樣性維護

## 安裝

```bash
pip install -r requirements.txt
```

## 快速開始

```python
from genetic_placer import GeneticPlacer

# 初始化擺放器
placer = GeneticPlacer(
    board_size=(100, 80),
    population_size=50,
    mutation_rate=0.1
)

# 添加元件
placer.add_component("U1", size=(10, 8))
placer.add_component("R1", size=(5, 3))

# 添加連接
placer.add_connection("U1", "R1")

# 執行演化
result = placer.evolve(generations=100)

# 視覺化
placer.visualize(result)
```

## 演算法參數

- `population_size`: 族群大小（預設: 50）
- `generations`: 演化代數（預設: 100）
- `mutation_rate`: 突變率（預設: 0.1）
- `crossover_rate`: 交叉率（預設: 0.8）
- `elitism_rate`: 菁英保留比例（預設: 0.1）

## 優勢

- 全域搜索能力強
- 不易陷入局部最優
- 可處理複雜約束
- 並行化潛力大

## 範例

查看 `examples/` 目錄獲取更多使用範例。
