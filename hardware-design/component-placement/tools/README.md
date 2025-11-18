# 🛠️ 演算法工具

元件擺放演算法的實用工具集。

## 📊 演算法基準測試工具

`algorithm_benchmark.py` - 比較不同演算法的性能

### 功能

- 自動運行所有可用的擺放演算法
- 多次運行取統計平均
- 生成詳細的比較報告
- 視覺化性能指標

### 使用方法

```bash
cd tools
python algorithm_benchmark.py
```

### 互動式選項

運行時會提示您選擇：

1. **測試規模**:
   - Small: 6 元件
   - Medium: 15 元件 (默認)
   - Large: 25 元件

2. **運行次數**: 每個演算法運行的次數 (默認 3 次)

### 輸出

生成以下輸出：

1. **終端摘要**:
```
演算法性能比較摘要 - 測試規模: medium
================================================================================
演算法                     平均成本      標準差    平均時間      運行次數
--------------------------------------------------------------------------------
MCTS                      188.34       4.21      2.15         3
Genetic Algorithm         195.23       5.78      3.02         3
Thermal Aware             192.15       3.45      2.87         3
Cellular Automata         190.45       4.01      1.85         3
Simulated Annealing       185.67       3.12      2.34         3
--------------------------------------------------------------------------------
最佳演算法（最低平均成本）: Simulated Annealing (185.67)
```

2. **視覺化圖表** (`benchmark_{size}.png`):
   - 成本分佈箱形圖
   - 平均成本柱狀圖
   - 運行時間比較
   - 統計摘要表格

### 程式化使用

```python
from algorithm_benchmark import AlgorithmBenchmark

# 創建基準測試
benchmark = AlgorithmBenchmark(test_size='medium')

# 運行所有演算法
results = benchmark.run_all_algorithms(num_runs=5)

# 列印摘要
benchmark.print_summary()

# 視覺化
benchmark.visualize_comparison('my_benchmark.png')

# 或單獨運行某個演算法
mcts_result = benchmark.run_mcts(iterations=1000)
print(f"MCTS 成本: {mcts_result['cost']:.2f}")
```

### 測試電路

工具提供三種預設測試電路：

#### Small (6 元件)
- 2 個 IC, 2 個電容, 2 個電阻
- 板子大小: 80 × 60 mm
- 適合快速測試

#### Medium (15 元件)
- 3 個 IC, 5 個電容, 3 個電阻, 2 個 LED, 1 個開關
- 板子大小: 120 × 90 mm
- 標準測試規模

#### Large (25 元件)
- 5 個 IC, 10 個電容, 10 個電阻
- 板子大小: 150 × 120 mm
- 壓力測試

### 自定義測試電路

修改 `create_test_circuit()` 函數：

```python
def create_test_circuit(size='custom'):
    components = {
        'U1': (12, 10),
        'C1': (3, 2),
        # ... 添加更多元件
    }

    connections = [
        ('U1', 'C1', 1.5),
        # ... 添加連接
    ]

    board_size = (100, 80)

    return components, connections, board_size
```

## 📈 性能指標

### 測量指標

1. **成本 (Cost)**:
   - 總連線長度（加權歐幾里得距離）
   - 越低越好

2. **運行時間 (Time)**:
   - 演算法執行時間（秒）
   - 不包括初始化時間

3. **穩定性 (Stability)**:
   - 標準差
   - 越低表示結果越穩定

### 典型結果

基於 Medium 規模測試（15 元件）：

| 演算法 | 平均成本 | 標準差 | 平均時間 | 特點 |
|--------|---------|--------|---------|------|
| Simulated Annealing | **185** | 3.1 | 2.3s | 最佳成本 |
| MCTS | 188 | 4.2 | 2.2s | 平衡 |
| Cellular Automata | 190 | 4.0 | **1.9s** | 最快 |
| Thermal Aware | 192 | 3.5 | 2.9s | 考慮熱分佈 |
| Genetic Algorithm | 195 | 5.8 | 3.0s | 較慢 |

## 🔧 故障排除

### 導入錯誤

如果遇到導入錯誤：

```
ImportError: No module named 'mcts_placer'
```

確保所有子專案都已正確設置：

```bash
cd hardware-design/component-placement
ls -d */  # 應該看到所有演算法資料夾
```

### 記憶體不足

對於 Large 規模測試，可能需要：

- 減少運行次數
- 使用更粗的網格解析度
- 減少迭代次數

### 運行太慢

- 選擇 Small 規模
- 減少運行次數
- 減少各演算法的迭代次數

## 📚 未來功能

- [ ] 支援自定義成本函數
- [ ] 多線程並行運行
- [ ] 輸出 CSV 結果
- [ ] 統計顯著性檢驗
- [ ] 更多視覺化選項

---

**最後更新**: 2025-11-18
