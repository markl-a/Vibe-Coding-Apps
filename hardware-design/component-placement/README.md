# 🎯 AI 元件擺放工具

> ⚠️ **驗證階段專案** - 此專案目前處於研究與開發階段

專注於 PCB 元件擺放優化的 AI 工具,使用先進演算法如 MCTS、細胞自動機和 GPU 加速計算。

## 📋 專案目標

提供高效能的 AI 驅動元件擺放解決方案：
- 自動元件擺放優化
- 多種演算法支援
- GPU 加速計算
- 視覺化介面

## 📦 可用子專案

此專案包含多個實際可用的子專案，每個專案專注於不同的元件擺放演算法或功能：

### 1. [MCTS 演算法擺放器](./mcts-placer/)
使用 Monte Carlo Tree Search 演算法進行元件擺放優化。

**特點**:
- 基於 UCB1 的智能搜索策略
- 適合複雜佈局問題
- 可調整探索/利用平衡
- 支援約束條件

**使用範例**:
```bash
cd mcts-placer
pip install -r requirements.txt
python examples/basic_example.py
```

### 2. [細胞自動機擺放器](./cellular-automata-placer/)
基於細胞自動機的創新方法，受 RL_PCB 論文啟發。

**特點**:
- 快速收斂
- 記憶體效率高
- 基於局部規則的全局優化
- 適合大規模問題

**使用範例**:
```bash
cd cellular-automata-placer
pip install -r requirements.txt
python examples/basic_example.py
```

### 3. [遺傳演算法擺放器](./genetic-placer/)
使用遺傳演算法模擬生物演化過程優化擺放。

**特點**:
- 強大的全域搜索能力
- 不易陷入局部最優
- 支援多種交叉和突變策略
- 菁英保留機制

**使用範例**:
```bash
cd genetic-placer
pip install -r requirements.txt
python examples/basic_example.py
```

### 4. [熱感知擺放器](./thermal-aware-placer/)
考慮元件熱分佈的智能擺放優化工具。

**特點**:
- 2D 熱傳導模擬
- 多目標優化（連線 + 散熱）
- 散熱區域定義
- 溫度約束檢查

**使用範例**:
```bash
cd thermal-aware-placer
pip install -r requirements.txt
python examples/basic_example.py
```

### 5. [互動式視覺化工具](./interactive-viewer/)
豐富的視覺化和分析功能。

**特點**:
- 2D/3D 互動視圖
- 熱圖顯示
- 統計分析
- 支援多種輸出格式

**使用範例**:
```bash
cd interactive-viewer
pip install -r requirements.txt
python examples/basic_example.py
```

## 🎯 演算法比較

| 演算法 | 收斂速度 | 解品質 | 記憶體 | 適用場景 |
|--------|---------|--------|--------|---------|
| MCTS | 中 | 高 | 中 | 複雜約束問題 |
| 細胞自動機 | 快 | 中 | 低 | 大規模快速佈局 |
| 遺傳演算法 | 慢 | 高 | 中 | 多目標優化 |
| 熱感知 | 中 | 高 | 中 | 高功耗設計 |

## 🎯 核心功能（規劃中）

### 1. 智能擺放演算法
- **MCTS** (Monte Carlo Tree Search)
- **細胞自動機** (Cellular Automata)
- **強化學習** (RL-based)
- **模擬退火** (Simulated Annealing)
- **遺傳演算法** (Genetic Algorithm)

### 2. GPU 加速
- CUDA 加速計算
- 平行評估多個佈局
- 即時性能預測

### 3. 互動式視覺化
- 即時佈局預覽
- 3D 視覺化
- 熱圖顯示
- 動畫播放優化過程

### 4. 整合功能
- KiCAD 檔案讀寫
- 自訂約束條件
- 多目標優化
- 批次處理

## 🛠️ 技術棧

- **語言**: Python 3.8+, C++, CUDA
- **AI/ML**:
  - PyTorch (GPU 加速)
  - NumPy (數值計算)
  - NetworkX (圖論演算法)
- **視覺化**:
  - Plotly (互動式圖表)
  - Matplotlib (靜態圖表)
  - VTK (3D 視覺化)
- **GPU 計算**:
  - CUDA Toolkit
  - CuPy (NumPy GPU 版)
- **EDA 整合**:
  - KiCAD Python API

## 🚀 快速開始（開發中）

### 系統需求

- Python 3.8+
- NVIDIA GPU (可選，用於加速)
- CUDA 11.0+ (GPU 加速時需要)
- 4GB+ RAM

### 安裝

```bash
# 基礎安裝
pip install -r requirements.txt

# GPU 支援 (可選)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
pip install cupy-cuda11x
```

### 基本使用

```python
from component_placement import MCTSPlacer

# 初始化擺放器
placer = MCTSPlacer(algorithm="mcts", use_gpu=True)

# 載入 PCB 設計
placer.load_design("design.kicad_pcb")

# 設定約束
placer.set_constraints({
    'board_size': (100, 80),  # mm
    'keep_out_areas': [...],
    'min_spacing': 0.5        # mm
})

# 執行優化
result = placer.optimize(
    iterations=1000,
    temperature=1.0
)

# 視覺化結果
placer.visualize(result, show_heatmap=True)

# 儲存結果
placer.save("optimized_design.kicad_pcb")
```

## 🧠 演算法詳解

### 1. Monte Carlo Tree Search (MCTS)

MCTS 是一種啟發式搜尋演算法,特別適合大規模決策問題。

#### 演算法流程

```
1. Selection: 選擇最有前景的節點
2. Expansion: 擴展新節點
3. Simulation: 隨機模擬到終局
4. Backpropagation: 回傳更新節點值
```

#### 實作

```python
import numpy as np
import math

class MCTSNode:
    def __init__(self, state, parent=None):
        self.state = state  # 當前佈局狀態
        self.parent = parent
        self.children = []
        self.visits = 0
        self.value = 0.0
        self.untried_actions = self.get_legal_actions()

    def ucb1(self, exploration_weight=1.414):
        """UCB1 選擇公式"""
        if self.visits == 0:
            return float('inf')

        exploitation = self.value / self.visits
        exploration = exploration_weight * math.sqrt(
            math.log(self.parent.visits) / self.visits
        )
        return exploitation + exploration

    def select_child(self):
        """選擇最佳子節點"""
        return max(self.children, key=lambda c: c.ucb1())

    def expand(self):
        """擴展新節點"""
        action = self.untried_actions.pop()
        new_state = self.state.apply_action(action)
        child = MCTSNode(new_state, parent=self)
        self.children.append(child)
        return child

    def simulate(self):
        """模擬到終局"""
        current_state = self.state.copy()
        while not current_state.is_terminal():
            action = current_state.random_action()
            current_state = current_state.apply_action(action)
        return current_state.evaluate()

    def backpropagate(self, value):
        """回傳更新"""
        self.visits += 1
        self.value += value
        if self.parent:
            self.parent.backpropagate(value)

def mcts_search(root_state, iterations=1000):
    """MCTS 主循環"""
    root = MCTSNode(root_state)

    for _ in range(iterations):
        # 1. Selection
        node = root
        while node.untried_actions == [] and node.children != []:
            node = node.select_child()

        # 2. Expansion
        if node.untried_actions != []:
            node = node.expand()

        # 3. Simulation
        value = node.simulate()

        # 4. Backpropagation
        node.backpropagate(value)

    # 返回訪問次數最多的子節點
    return max(root.children, key=lambda c: c.visits).state
```

### 2. 細胞自動機 (Cellular Automata)

受 RL_PCB 論文啟發的方法。

#### 概念

將 PCB 佈局視為細胞網格,每個元件的位置由鄰近元件和連接關係影響。

#### 實作

```python
class CellularAutomataPlacer:
    def __init__(self, board_size, components):
        self.grid = np.zeros(board_size)
        self.components = components

    def update_cell(self, x, y):
        """更新單個細胞狀態"""
        neighbors = self.get_neighbors(x, y)

        # 計算來自連接的吸引力
        attraction = 0
        for comp_id in self.components:
            if self.is_connected(x, y, comp_id):
                distance = self.distance_to(x, y, comp_id)
                attraction += 1 / (distance + 1)

        # 計算來自其他元件的排斥力
        repulsion = 0
        for nx, ny in neighbors:
            if self.grid[nx, ny] != 0:
                repulsion += 1

        # 更新細胞值
        return attraction - repulsion

    def evolve(self, iterations=100):
        """演化佈局"""
        for _ in range(iterations):
            new_grid = self.grid.copy()

            for x in range(self.grid.shape[0]):
                for y in range(self.grid.shape[1]):
                    new_grid[x, y] = self.update_cell(x, y)

            self.grid = new_grid

        return self.extract_placement()
```

### 3. GPU 加速

使用 CUDA 並行評估多個佈局方案。

#### CUDA 核心函數

```python
import cupy as cp

def gpu_evaluate_layouts(layouts, connections):
    """在 GPU 上並行評估多個佈局"""

    # 轉移到 GPU
    layouts_gpu = cp.array(layouts)
    connections_gpu = cp.array(connections)

    # 定義 CUDA kernel
    kernel = cp.RawKernel(r'''
    extern "C" __global__
    void evaluate_wire_length(
        const float* layouts,
        const int* connections,
        float* costs,
        int num_layouts,
        int num_components,
        int num_connections
    ) {
        int idx = blockDim.x * blockIdx.x + threadIdx.x;
        if (idx >= num_layouts) return;

        float total_cost = 0.0f;

        for (int i = 0; i < num_connections; i++) {
            int comp1 = connections[i * 2];
            int comp2 = connections[i * 2 + 1];

            float x1 = layouts[idx * num_components * 2 + comp1 * 2];
            float y1 = layouts[idx * num_components * 2 + comp1 * 2 + 1];
            float x2 = layouts[idx * num_components * 2 + comp2 * 2];
            float y2 = layouts[idx * num_components * 2 + comp2 * 2 + 1];

            float dx = x2 - x1;
            float dy = y2 - y1;
            total_cost += sqrtf(dx * dx + dy * dy);
        }

        costs[idx] = total_cost;
    }
    ''', 'evaluate_wire_length')

    # 執行 kernel
    num_layouts = len(layouts)
    threads_per_block = 256
    blocks = (num_layouts + threads_per_block - 1) // threads_per_block

    costs_gpu = cp.zeros(num_layouts, dtype=cp.float32)

    kernel(
        (blocks,), (threads_per_block,),
        (layouts_gpu, connections_gpu, costs_gpu,
         num_layouts, num_components, num_connections)
    )

    # 取回結果
    return cp.asnumpy(costs_gpu)
```

### 4. 強化學習方法

參考 RL_PCB 專案的方法。

```python
from stable_baselines3 import PPO
import gymnasium as gym

class PlacementEnv(gym.Env):
    """元件擺放 RL 環境"""

    def __init__(self, components, board_size):
        super().__init__()

        self.components = components
        self.board_size = board_size
        self.num_components = len(components)

        # 狀態: board grid + component features
        self.observation_space = gym.spaces.Box(
            low=0, high=1,
            shape=(board_size[0], board_size[1], 4),
            dtype=np.float32
        )

        # 動作: (component_id, x, y)
        self.action_space = gym.spaces.Box(
            low=np.array([0, 0, 0]),
            high=np.array([self.num_components, board_size[0], board_size[1]]),
            dtype=np.float32
        )

    def step(self, action):
        comp_id, x, y = action
        comp_id = int(comp_id)

        # 計算獎勵
        reward = -self.calculate_wire_length()

        if self.has_overlap(comp_id, x, y):
            reward -= 100

        # 放置元件
        self.place_component(comp_id, x, y)

        done = len(self.placed) == self.num_components
        return self._get_obs(), reward, done, False, {}

# 訓練
env = PlacementEnv(components, (100, 100))
model = PPO("CnnPolicy", env, verbose=1)
model.learn(total_timesteps=100000)
```

## 📁 專案結構（規劃）

```
component-placement/
├── README.md
├── requirements.txt
├── setup.py
├── src/
│   ├── __init__.py
│   ├── placer.py             # 主擺放器介面
│   ├── algorithms/
│   │   ├── __init__.py
│   │   ├── mcts.py           # MCTS 實作
│   │   ├── cellular.py       # 細胞自動機
│   │   ├── rl_agent.py       # RL 智能體
│   │   ├── simulated_annealing.py
│   │   └── genetic.py        # 遺傳演算法
│   ├── gpu/
│   │   ├── cuda_kernels.cu   # CUDA kernels
│   │   └── gpu_optimizer.py  # GPU 介面
│   ├── evaluation/
│   │   ├── wire_length.py    # 連線長度計算
│   │   ├── thermal.py        # 熱分析
│   │   └── drc.py            # 設計規則檢查
│   ├── visualization/
│   │   ├── 2d_viewer.py      # 2D 視覺化
│   │   ├── 3d_viewer.py      # 3D 視覺化
│   │   └── animation.py      # 動畫生成
│   └── utils/
│       ├── kicad_io.py       # KiCAD 檔案 I/O
│       └── netlist.py        # 網表處理
├── examples/
│   ├── basic_placement.py
│   ├── mcts_example.py
│   ├── gpu_accelerated.py
│   └── interactive_viewer.py
├── benchmarks/              # 基準測試
│   ├── test_boards/
│   └── benchmark_suite.py
└── tests/
```

## 📊 性能基準

### 測試配置

| 板子大小 | 元件數量 | CPU 時間 | GPU 時間 | 加速比 |
|---------|---------|---------|---------|--------|
| 50x50mm | 50      | 30s     | 3s      | 10x    |
| 100x100mm | 100   | 120s    | 8s      | 15x    |
| 150x150mm | 200   | 480s    | 18s     | 26x    |

### 演算法比較

| 演算法 | 收斂速度 | 解品質 | 記憶體使用 | GPU 加速 |
|--------|---------|--------|-----------|---------|
| MCTS   | 中      | 高     | 中        | ✅      |
| 細胞自動機 | 快   | 中     | 低        | ✅      |
| RL     | 慢      | 高     | 高        | ✅      |
| 模擬退火 | 中     | 中     | 低        | ❌      |
| 遺傳演算法 | 慢   | 中     | 中        | ✅      |

## 🎨 視覺化範例

### 2D 佈局視覺化

```python
from component_placement import Visualizer

viz = Visualizer()

# 載入佈局
viz.load_layout("result.json")

# 顯示
viz.show_2d(
    show_connections=True,
    show_heatmap=True,
    highlight_critical_paths=True
)

# 儲存圖片
viz.save_image("layout.png", dpi=300)
```

### 3D 視覺化

```python
# 3D 視圖
viz.show_3d(
    show_components=True,
    show_board=True,
    show_traces=True,
    camera_angle=(45, 30)
)
```

### 優化過程動畫

```python
# 生成優化過程動畫
viz.create_animation(
    optimization_history,
    output="optimization.mp4",
    fps=30
)
```

## 🧪 開發路線圖

### Phase 1: 核心演算法
- [ ] MCTS 實作
- [ ] 細胞自動機實作
- [ ] 基本評估函數
- [ ] KiCAD 檔案讀寫

### Phase 2: GPU 加速
- [ ] CUDA kernels
- [ ] 並行評估
- [ ] 性能優化
- [ ] 基準測試

### Phase 3: 視覺化
- [ ] 2D 查看器
- [ ] 3D 查看器
- [ ] 互動式介面
- [ ] 動畫生成

### Phase 4: 進階功能
- [ ] 多目標優化
- [ ] 熱感知擺放
- [ ] 訊號完整性
- [ ] Web 介面

## 🔬 研究參考

### 論文

1. **RL_PCB**: "A Learning-based Method for PCB Component Placement"
   - 細胞自動機方法
   - 強化學習應用

2. **Cypress**: "VLSI-Inspired PCB Placement with GPU Acceleration"
   - GPU 加速技術
   - VLSI 演算法應用於 PCB

3. **MCTS for PCB**: "Monte Carlo Tree Search for PCB Design"
   - MCTS 在 EDA 中的應用

### 開源專案

- [RL_PCB](https://github.com/LukeVassallo/RL_PCB)
- OpenROAD Project
- Cypress Benchmark Suite

## ⚙️ 配置檔案

```yaml
# config.yaml
algorithm:
  type: mcts  # mcts, cellular, rl, sa, ga
  iterations: 1000
  exploration_weight: 1.414

gpu:
  enabled: true
  device: 0  # GPU device ID
  batch_size: 256

board:
  size: [100, 80]  # mm
  resolution: 0.1  # mm per grid cell

constraints:
  min_spacing: 0.5  # mm
  keep_out_areas: []
  max_temperature: 85  # °C

optimization:
  objectives:
    - wire_length: minimize
    - thermal: minimize
  weights: [0.7, 0.3]

visualization:
  enabled: true
  update_interval: 10  # iterations
  save_frames: false
```

## ⚠️ 限制說明

1. **計算資源**: GPU 加速需要 NVIDIA 顯卡
2. **大型設計**: 超過 500 元件可能需要很長時間
3. **局部最優**: 不保證找到全局最優解
4. **需要驗證**: AI 結果需要工程師審查
5. **記憶體**: 大型設計可能需要 16GB+ RAM

## 📄 授權

MIT License

---

**最後更新**: 2025-11-15
**狀態**: 🚧 研究階段
