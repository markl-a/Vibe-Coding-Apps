# 🧠 AI 模型與演算法

> ⚠️ **研究與驗證階段聲明**
>
> 本文檔介紹的 AI 模型和演算法均基於學術研究和公開文獻。這些技術目前處於**研究與驗證階段**，在實際硬體設計中的應用效果需要進一步驗證。
>
> **重要提醒**：
> - 📚 所有演算法描述均基於已發表的研究論文
> - 🧪 程式碼範例僅供學習和研究用途
> - ⚠️ 實際應用前需要大量測試和驗證
> - ⚠️ AI 模型可能產生不可預測的結果
> - 🔬 建議在模擬環境中先行測試
> - 👨‍🔬 關鍵設計仍需專業工程師審查
> - 📝 不建議在生產環境中直接使用未經驗證的 AI 工具

這個文檔介紹用於硬體設計的 AI 模型、演算法和技術。

## 📋 目錄

- [強化學習方法](#強化學習方法)
- [監督學習模型](#監督學習模型)
- [非監督學習](#非監督學習)
- [優化演算法](#優化演算法)
- [大型語言模型應用](#大型語言模型應用)
- [實作範例](#實作範例)

---

## 🎮 強化學習方法

強化學習在 PCB 設計優化中特別有效，因為設計過程可以建模為序列決策問題。

### Deep Q-Network (DQN)
- **應用**：元件擺放優化
- **原理**：學習 Q 值函數來選擇最佳擺放動作
- **優勢**：
  - 處理高維狀態空間
  - 無需環境模型
  - 離線學習能力

**實作框架**：
```python
# 使用 Stable-Baselines3
from stable_baselines3 import DQN
from pcb_env import PCBPlacementEnv

env = PCBPlacementEnv()
model = DQN("MlpPolicy", env, verbose=1)
model.learn(total_timesteps=100000)
```

**論文參考**：
- "Playing Atari with Deep Reinforcement Learning" (Mnih et al., 2013)
- 應用於 PCB：調整狀態空間為 PCB 佈局特徵

---

### Proximal Policy Optimization (PPO)
- **應用**：連續動作空間的元件擺放
- **原理**：策略梯度方法，限制更新幅度
- **優勢**：
  - 穩定訓練
  - 樣本效率高
  - 易於調參

**實作框架**：
```python
from stable_baselines3 import PPO

model = PPO(
    "MlpPolicy",
    env,
    learning_rate=3e-4,
    n_steps=2048,
    batch_size=64,
    n_epochs=10,
    verbose=1
)
model.learn(total_timesteps=1000000)
```

**適用場景**：
- 大型 PCB 佈局
- 多目標優化
- 需要穩定訓練的場景

**論文參考**：
- "Proximal Policy Optimization Algorithms" (Schulman et al., 2017)

---

### Monte Carlo Tree Search (MCTS)
- **應用**：PCB 佈局決策（Cadence Allegro X AI 使用）
- **原理**：樹狀搜索 + 隨機模擬
- **優勢**：
  - 不需要領域知識編碼
  - 可處理大規模狀態空間
  - 平衡探索與利用

**演算法步驟**：
1. **選擇 (Selection)**：從根節點選擇最有前景的子節點
2. **擴展 (Expansion)**：新增新的子節點
3. **模擬 (Simulation)**：隨機模擬到終局
4. **回傳 (Backpropagation)**：更新路徑上的節點值

**實作框架**：
```python
class MCTSNode:
    def __init__(self, state, parent=None):
        self.state = state
        self.parent = parent
        self.children = []
        self.visits = 0
        self.value = 0

    def select_child(self):
        # UCB1 公式
        return max(self.children, key=lambda c:
                   c.value/c.visits +
                   np.sqrt(2*np.log(self.visits)/c.visits))
```

**適用場景**：
- 離散決策問題
- 需要規劃多步驟
- 計算資源充足

---

### Actor-Critic 方法
- **應用**：同時優化元件擺放和走線
- **原理**：Actor 學習策略，Critic 評估價值
- **優勢**：
  - 低方差
  - 在線學習
  - 適合連續動作

**實作範例**：
```python
from stable_baselines3 import A2C

model = A2C(
    "MlpPolicy",
    env,
    learning_rate=7e-4,
    n_steps=5,
    gamma=0.99,
    verbose=1
)
```

---

### 環境設計要點

為 PCB 設計建立 RL 環境：

```python
import gymnasium as gym
from gymnasium import spaces
import numpy as np

class PCBPlacementEnv(gym.Env):
    def __init__(self, board_size=(100, 100), num_components=50):
        super().__init__()

        self.board_size = board_size
        self.num_components = num_components

        # 狀態空間：PCB 佈局 + 元件特徵
        self.observation_space = spaces.Box(
            low=0, high=1,
            shape=(board_size[0], board_size[1], 4),
            dtype=np.float32
        )

        # 動作空間：(component_id, x, y, rotation)
        self.action_space = spaces.Box(
            low=np.array([0, 0, 0, 0]),
            high=np.array([num_components, board_size[0], board_size[1], 360]),
            dtype=np.float32
        )

    def reset(self, seed=None):
        super().reset(seed=seed)
        self.board = np.zeros(self.board_size + (4,))
        self.placed_components = set()
        return self.board, {}

    def step(self, action):
        component_id, x, y, rotation = action

        # 執行擺放動作
        reward = self._calculate_reward(component_id, x, y, rotation)
        self._place_component(component_id, x, y, rotation)

        # 檢查是否完成
        done = len(self.placed_components) == self.num_components

        return self.board, reward, done, False, {}

    def _calculate_reward(self, component_id, x, y, rotation):
        # 獎勵函數設計
        reward = 0

        # 1. 連線長度最小化
        wire_length = self._calculate_wire_length()
        reward -= wire_length * 0.1

        # 2. 重疊懲罰
        if self._check_overlap(x, y):
            reward -= 100

        # 3. 熱分布優化
        heat_score = self._calculate_heat_distribution()
        reward += heat_score

        # 4. 邊界外懲罰
        if not self._within_bounds(x, y):
            reward -= 50

        return reward
```

**獎勵函數設計原則**：
- 連線長度最小化
- 避免元件重疊
- 熱分布均勻
- 符合設計規則
- 製造可行性

---

## 📊 監督學習模型

### 卷積神經網路 (CNN)
- **應用**：PCB 佈局品質評估、異常檢測
- **原理**：學習空間特徵
- **優勢**：
  - 自動特徵提取
  - 平移不變性
  - 適合影像數據

**架構範例**：
```python
import tensorflow as tf

def build_pcb_classifier():
    model = tf.keras.Sequential([
        # 輸入：PCB 佈局影像
        tf.keras.layers.Conv2D(32, 3, activation='relu', input_shape=(224, 224, 3)),
        tf.keras.layers.MaxPooling2D(),
        tf.keras.layers.Conv2D(64, 3, activation='relu'),
        tf.keras.layers.MaxPooling2D(),
        tf.keras.layers.Conv2D(128, 3, activation='relu'),
        tf.keras.layers.MaxPooling2D(),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(256, activation='relu'),
        tf.keras.layers.Dropout(0.5),
        # 輸出：品質評分 (0-100)
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    return model

model = build_pcb_classifier()
model.compile(optimizer='adam', loss='mse', metrics=['mae'])
```

**應用場景**：
- 設計規則檢查 (DRC)
- 佈局品質評估
- 異常檢測
- 自動化審查

**資料集需求**：
- 大量標註的 PCB 佈局
- 好/壞設計範例
- 多樣化的設計案例

---

### 圖神經網路 (GNN)
- **應用**：電路網路分析、元件關係建模
- **原理**：處理圖結構數據
- **優勢**：
  - 保留拓撲資訊
  - 可處理變長輸入
  - 適合電路網表

**架構範例**：
```python
import torch
import torch.nn as nn
from torch_geometric.nn import GCNConv

class CircuitGNN(nn.Module):
    def __init__(self, num_features, num_classes):
        super().__init__()
        self.conv1 = GCNConv(num_features, 128)
        self.conv2 = GCNConv(128, 64)
        self.conv3 = GCNConv(64, num_classes)

    def forward(self, x, edge_index):
        # x: 節點特徵 (元件屬性)
        # edge_index: 連接關係 (網表)
        x = self.conv1(x, edge_index).relu()
        x = self.conv2(x, edge_index).relu()
        x = self.conv3(x, edge_index)
        return x
```

**電路表示**：
- **節點**：元件（電阻、電容、IC 等）
- **邊**：電氣連接
- **特徵**：元件參數、功耗、面積等

**應用**：
- 功耗預測
- 時序分析
- 可製造性分析
- 元件聚類

---

### Transformer 模型
- **應用**：序列設計任務、程式碼生成
- **原理**：自注意力機制
- **優勢**：
  - 捕捉長距離依賴
  - 並行計算
  - 遷移學習

**應用場景**：
- 網表生成
- 設計模式識別
- 自動化佈線順序
- 腳本生成

---

## 🔍 非監督學習

### 異常檢測 (Anomaly Detection)
- **應用**：識別不尋常的設計模式（AnoPCB）
- **方法**：
  1. **Isolation Forest**
  2. **One-Class SVM**
  3. **Autoencoder**

**Autoencoder 範例**：
```python
# 訓練在正常佈局上
class PCBAutoencoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(10000, 512),
            nn.ReLU(),
            nn.Linear(512, 128),
            nn.ReLU(),
            nn.Linear(128, 32)
        )
        self.decoder = nn.Sequential(
            nn.Linear(32, 128),
            nn.ReLU(),
            nn.Linear(128, 512),
            nn.ReLU(),
            nn.Linear(512, 10000)
        )

    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

# 重建誤差大 = 異常
reconstruction_error = F.mse_loss(output, input)
is_anomaly = reconstruction_error > threshold
```

**AnoPCB 方法**：
1. 在良好佈局上訓練
2. 新設計通過模型
3. 高重建誤差 = 可能異常
4. 標記供人工審查

---

### 聚類分析
- **應用**：元件分組、設計模式發現
- **方法**：K-Means, DBSCAN, Hierarchical Clustering

**應用範例**：
```python
from sklearn.cluster import KMeans

# 基於連接關係聚類元件
features = extract_component_features(pcb_design)
kmeans = KMeans(n_clusters=5)
clusters = kmeans.fit_predict(features)

# 同一群組的元件應該放在一起
for cluster_id in range(5):
    components = [c for i, c in enumerate(all_components)
                  if clusters[i] == cluster_id]
    place_components_together(components)
```

---

## ⚙️ 優化演算法

### 遺傳演算法 (Genetic Algorithm)
- **應用**：全局優化 PCB 佈局
- **原理**：模擬自然演化
- **優勢**：
  - 不需梯度
  - 全局搜索
  - 易於並行化

**實作範例**：
```python
import numpy as np

class GeneticPCBOptimizer:
    def __init__(self, population_size=100, mutation_rate=0.01):
        self.population_size = population_size
        self.mutation_rate = mutation_rate

    def initialize_population(self):
        # 隨機生成初始佈局
        return [random_layout() for _ in range(self.population_size)]

    def fitness(self, layout):
        # 評估佈局品質
        wire_length = calculate_wire_length(layout)
        overlap_penalty = check_overlaps(layout)
        return 1 / (wire_length + overlap_penalty + 1)

    def selection(self, population):
        # 輪盤選擇
        fitnesses = [self.fitness(ind) for ind in population]
        return random.choices(population, weights=fitnesses, k=len(population))

    def crossover(self, parent1, parent2):
        # 單點交叉
        point = random.randint(0, len(parent1))
        child = parent1[:point] + parent2[point:]
        return child

    def mutate(self, individual):
        # 隨機移動元件
        if random.random() < self.mutation_rate:
            idx = random.randint(0, len(individual)-1)
            individual[idx] = random_position()
        return individual

    def evolve(self, generations=100):
        population = self.initialize_population()

        for gen in range(generations):
            # 選擇
            parents = self.selection(population)

            # 交叉
            offspring = []
            for i in range(0, len(parents), 2):
                child = self.crossover(parents[i], parents[i+1])
                offspring.append(child)

            # 突變
            population = [self.mutate(ind) for ind in offspring]

            # 記錄最佳
            best = max(population, key=self.fitness)
            print(f"Gen {gen}: Best fitness = {self.fitness(best)}")

        return max(population, key=self.fitness)
```

---

### 模擬退火 (Simulated Annealing)
- **應用**：PCB 佈局優化（OpenROAD 使用）
- **原理**：模擬金屬退火過程
- **優勢**：
  - 簡單有效
  - 避免局部最優
  - 可調節探索程度

**實作範例**：
```python
def simulated_annealing(initial_layout, temp=1000, cooling_rate=0.95):
    current = initial_layout
    current_cost = cost_function(current)

    while temp > 1:
        # 生成鄰居解
        neighbor = generate_neighbor(current)
        neighbor_cost = cost_function(neighbor)

        # 計算成本差
        delta = neighbor_cost - current_cost

        # 決定是否接受
        if delta < 0 or random.random() < np.exp(-delta / temp):
            current = neighbor
            current_cost = neighbor_cost

        # 降溫
        temp *= cooling_rate

    return current

def generate_neighbor(layout):
    # 隨機移動一個元件
    new_layout = layout.copy()
    component = random.choice(range(len(layout)))
    new_layout[component] = random_position()
    return new_layout
```

---

### 粒子群優化 (PSO)
- **應用**：連續參數優化
- **原理**：模擬鳥群行為
- **優勢**：
  - 少量參數
  - 收斂快速
  - 適合連續空間

**應用場景**：
- 元件擺放坐標優化
- 走線寬度優化
- 阻抗匹配

---

## 🗣️ 大型語言模型應用

### ChatGPT / GPT-4
- **應用**：腳本生成、設計建議、問題解答
- **能力**：
  - 生成 Python/Lua 腳本
  - 解釋設計規則
  - 建議元件選擇
  - 除錯協助

**範例應用**：

#### 1. 腳本生成
```python
# 提示詞
"""
生成一個 KiCAD Python 腳本，將所有去耦電容放置在對應 IC 的旁邊，
距離不超過 5mm。
"""

# GPT 生成的腳本
import pcbnew

board = pcbnew.GetBoard()

# 找到所有 IC 和去耦電容
ics = [m for m in board.GetFootprints() if 'U' in m.GetReference()]
caps = [m for m in board.GetFootprints() if 'C' in m.GetReference()
        and 'decoupling' in m.GetValue().lower()]

for ic in ics:
    ic_pos = ic.GetPosition()
    # 找到對應的去耦電容
    for cap in caps:
        if ic.GetReference() in cap.GetReference():
            # 放在 IC 旁邊
            offset = pcbnew.wxPointMM(5, 0)
            cap.SetPosition(ic_pos + offset)
```

#### 2. 設計建議
```
Q: 高速差分訊號 PCB 佈線應該注意什麼？

A: 高速差分訊號 PCB 佈線要點：
1. 保持差分對等長，長度差 < 5mil
2. 保持恆定阻抗（通常 90Ω 或 100Ω）
3. 最小化轉角，使用 45° 或圓弧
4. 差分對緊密耦合，間距恆定
5. 避免跨層，必要時使用過孔對
6. 遠離電源和地層邊緣
7. 最小化 stub 長度
```

#### 3. 元件選擇
```python
# API 整合範例
import openai

def suggest_component(requirements):
    prompt = f"""
    根據以下需求建議合適的電子元件：
    {requirements}

    請提供：
    1. 零件編號
    2. 製造商
    3. 關鍵規格
    4. 預估價格
    """

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content
```

---

### Claude (Anthropic)
- **優勢**：
  - 長上下文（100K+ tokens）
  - 詳細推理
  - 程式碼理解強
  - 技術文檔分析

**應用場景**：
- 分析大型網表
- 審查複雜設計
- 生成詳細文檔
- 多檔案專案理解

---

### 專用模型微調

**針對 EDA 任務微調 LLM**：

```python
# 使用 KiCAD 腳本資料集微調
from transformers import GPT2LMHeadModel, GPT2Tokenizer, Trainer

# 準備資料集
dataset = load_kicad_scripts_dataset()

# 載入預訓練模型
model = GPT2LMHeadModel.from_pretrained("gpt2")
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

# 微調
trainer = Trainer(
    model=model,
    train_dataset=dataset,
    args=training_args
)
trainer.train()

# 使用微調模型生成腳本
prompt = "# Generate a script to place all resistors in a grid"
generated = model.generate(tokenizer.encode(prompt))
```

**微調資料來源**：
- KiCAD 論壇腳本
- GitHub 開源專案
- EDA 工具文檔
- 設計規則資料庫

---

## 🛠️ 實作範例

### 完整的 RL PCB 佈局系統

```python
import gymnasium as gym
import numpy as np
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv

# 1. 定義環境
class PCBEnv(gym.Env):
    def __init__(self):
        super().__init__()
        self.board_size = (100, 100)
        self.num_components = 20

        # 狀態：board + component features
        self.observation_space = gym.spaces.Box(
            low=0, high=1,
            shape=(100, 100, 3),
            dtype=np.float32
        )

        # 動作：(component_id, x, y)
        self.action_space = gym.spaces.Box(
            low=np.array([0, 0, 0]),
            high=np.array([self.num_components, 100, 100]),
            dtype=np.float32
        )

    def reset(self, seed=None):
        self.board = np.zeros((100, 100, 3))
        self.components = self._load_components()
        self.placed = set()
        return self._get_observation(), {}

    def step(self, action):
        comp_id, x, y = action
        comp_id = int(comp_id)

        # 放置元件
        reward = self._place_and_reward(comp_id, x, y)
        self.placed.add(comp_id)

        # 檢查完成
        done = len(self.placed) == self.num_components

        return self._get_observation(), reward, done, False, {}

    def _place_and_reward(self, comp_id, x, y):
        # 獎勵計算
        reward = 0

        # 連線長度
        wire_length = self._calc_wire_length(comp_id, x, y)
        reward -= wire_length * 0.01

        # 重疊檢查
        if self._check_overlap(comp_id, x, y):
            reward -= 100
            return reward

        # 實際放置
        self._place_component(comp_id, x, y)

        # 熱分布
        heat_penalty = self._calc_heat_penalty()
        reward -= heat_penalty * 0.1

        return reward

    def _get_observation(self):
        return self.board

# 2. 訓練模型
env = DummyVecEnv([lambda: PCBEnv()])

model = PPO(
    "CnnPolicy",  # 使用 CNN 處理 board 影像
    env,
    learning_rate=3e-4,
    n_steps=2048,
    batch_size=64,
    n_epochs=10,
    verbose=1,
    tensorboard_log="./pcb_tensorboard/"
)

# 訓練
model.learn(total_timesteps=1000000)
model.save("pcb_placement_model")

# 3. 使用模型
model = PPO.load("pcb_placement_model")
obs, info = env.reset()

for _ in range(20):  # 20 個元件
    action, _states = model.predict(obs, deterministic=True)
    obs, reward, done, truncated, info = env.step(action)
    if done:
        break

# 4. 輸出到 KiCAD
def export_to_kicad(placements):
    import pcbnew
    board = pcbnew.LoadBoard("design.kicad_pcb")

    for comp_id, (x, y, rotation) in placements.items():
        footprint = board.FindFootprintByReference(f"U{comp_id}")
        footprint.SetPosition(pcbnew.wxPointMM(x, y))
        footprint.SetOrientation(rotation * 10)  # KiCAD 使用 0.1 度

    board.Save("optimized_design.kicad_pcb")
```

---

### 異常檢測系統

```python
import numpy as np
from sklearn.ensemble import IsolationForest

# 1. 特徵提取
def extract_features(pcb_layout):
    features = []

    # 密度特徵
    density = calculate_component_density(pcb_layout)
    features.extend(density)

    # 間距特徵
    spacings = calculate_spacings(pcb_layout)
    features.extend([np.mean(spacings), np.std(spacings)])

    # 走線特徵
    wire_lengths = calculate_wire_lengths(pcb_layout)
    features.extend([np.mean(wire_lengths), np.max(wire_lengths)])

    # 對稱性
    symmetry = calculate_symmetry(pcb_layout)
    features.append(symmetry)

    return np.array(features)

# 2. 訓練異常檢測模型
good_layouts = load_good_layouts()
features = [extract_features(layout) for layout in good_layouts]

clf = IsolationForest(contamination=0.1, random_state=42)
clf.fit(features)

# 3. 檢測新設計
new_layout = load_layout("new_design.kicad_pcb")
new_features = extract_features(new_layout)
is_anomaly = clf.predict([new_features])[0] == -1

if is_anomaly:
    print("⚠️ 發現異常設計模式，建議人工審查")
    # 找出異常區域
    anomaly_score = clf.score_samples([new_features])[0]
    print(f"異常分數: {anomaly_score:.3f}")
```

---

## 📚 學習路徑

### 初學者
1. **基礎 ML**：scikit-learn 教程
2. **深度學習**：TensorFlow/PyTorch 入門
3. **強化學習**：Sutton & Barto 書籍
4. **實作**：簡單的元件擺放優化

### 中級
1. **進階 RL**：PPO, DQN 實作
2. **GNN**：圖神經網路基礎
3. **專案**：完整的 PCB 優化系統
4. **論文閱讀**：最新 EDA AI 研究

### 進階
1. **自訂演算法**：設計新的 RL 方法
2. **大規模訓練**：分散式訓練
3. **產業應用**：商業化考量
4. **發表研究**：貢獻學術界

---

## 📖 推薦資源

### 書籍
- "Reinforcement Learning: An Introduction" - Sutton & Barto
- "Deep Learning" - Goodfellow, Bengio, Courville
- "Hands-On Machine Learning" - Aurélien Géron

### 線上課程
- Coursera: Deep Learning Specialization
- Udacity: Deep Reinforcement Learning
- Stanford CS231n: CNN
- Stanford CS224W: GNN

### 論文
- RL_PCB: Learning-based PCB Placement
- DeepPCB: Cloud-Native PCB Routing
- Cypress: VLSI-Inspired PCB Placement
- RouteNet: Deep Learning for Network Performance

### 實作資源
- Stable-Baselines3 文檔
- PyTorch Geometric 教程
- OpenAI Spinning Up in RL
- Hugging Face Transformers

---

**最後更新**：2025-11-15

**貢獻**：歡迎分享新的模型和演算法！
