# 🎨 AI PCB 佈局優化器

> ⚠️ **驗證階段專案** - 此專案目前處於研究與開發階段

使用機器學習和強化學習技術優化 PCB 元件佈局和走線的工具。

## 📋 專案目標

自動化 PCB 佈局過程，透過 AI 演算法優化：
- 元件擺放位置
- 走線路徑
- 熱分布
- 訊號完整性
- 製造可行性

## 🎯 核心功能（規劃中）

### 1. 智能元件擺放
- 使用強化學習自動擺放元件
- 考慮電氣連接關係
- 最小化連線長度
- 避免元件重疊

### 2. 自動走線優化
- AI 輔助的自動走線
- 差分對等長控制
- 阻抗匹配優化
- 訊號完整性分析

### 3. 熱分析與優化
- 預測熱分布
- 優化散熱佈局
- 高功耗元件間距調整

### 4. KiCAD 整合
- 讀取 KiCAD PCB 檔案
- 優化後輸出 KiCAD 格式
- Python API 整合

## 🛠️ 技術棧

- **語言**: Python 3.8+
- **ML 框架**:
  - TensorFlow / PyTorch
  - Stable-Baselines3 (強化學習)
  - Gymnasium (RL 環境)
- **EDA 整合**:
  - KiCAD Python API (pcbnew)
  - KiUtils (檔案解析)
- **資料處理**: NumPy, Pandas
- **視覺化**: Matplotlib, Plotly

## 🚀 快速開始（開發中）

### 安裝依賴

```bash
# 建立虛擬環境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 安裝依賴
pip install -r requirements.txt
```

### 基本使用

```python
from ai_pcb_layout import PCBOptimizer

# 載入 PCB 設計
optimizer = PCBOptimizer("design.kicad_pcb")

# 訓練 AI 模型
optimizer.train(episodes=1000)

# 執行優化
optimized_layout = optimizer.optimize()

# 儲存結果
optimizer.save("optimized_design.kicad_pcb")
```

## 📚 演算法參考

### 強化學習方法

#### PPO (Proximal Policy Optimization)
- 主要演算法，用於元件擺放
- 穩定訓練，適合連續動作空間
- 參考: "Proximal Policy Optimization Algorithms" (Schulman et al., 2017)

#### DQN (Deep Q-Network)
- 備選方案，用於離散決策
- 適合固定網格擺放
- 參考: "Playing Atari with Deep RL" (Mnih et al., 2013)

### 獎勵函數設計

```python
def calculate_reward(layout):
    reward = 0

    # 1. 連線長度（負獎勵）
    wire_length = calculate_total_wire_length(layout)
    reward -= wire_length * 0.01

    # 2. 元件重疊（大懲罰）
    if has_overlap(layout):
        reward -= 100

    # 3. 熱分布（獎勵均勻分布）
    heat_uniformity = calculate_heat_uniformity(layout)
    reward += heat_uniformity * 10

    # 4. 設計規則違反
    drc_violations = check_design_rules(layout)
    reward -= len(drc_violations) * 20

    return reward
```

## 📊 專案結構（規劃）

```
ai-pcb-layout/
├── README.md
├── requirements.txt
├── setup.py
├── src/
│   ├── __init__.py
│   ├── optimizer.py          # 主優化器
│   ├── environment.py        # RL 環境定義
│   ├── models/
│   │   ├── ppo_agent.py      # PPO 智能體
│   │   └── dqn_agent.py      # DQN 智能體
│   ├── reward.py             # 獎勵函數
│   ├── kicad_interface.py    # KiCAD 整合
│   └── utils.py              # 工具函數
├── tests/
│   ├── test_optimizer.py
│   └── test_environment.py
├── examples/
│   ├── basic_optimization.py
│   └── advanced_tuning.py
├── notebooks/
│   └── training_visualization.ipynb
└── data/
    ├── sample_boards/        # 範例 PCB
    └── trained_models/       # 訓練好的模型
```

## 🧪 開發路線圖

### Phase 1: 基礎框架 (開發中)
- [ ] 設置專案結構
- [ ] 實作 KiCAD 檔案讀取
- [ ] 建立基本 RL 環境
- [ ] 簡單的獎勵函數

### Phase 2: 核心功能
- [ ] 實作 PPO 智能體
- [ ] 元件擺放優化
- [ ] 走線長度優化
- [ ] 基本的 DRC 檢查

### Phase 3: 進階功能
- [ ] 熱分析整合
- [ ] 訊號完整性考量
- [ ] 多目標優化
- [ ] 進階獎勵函數

### Phase 4: 完善與部署
- [ ] 完整測試套件
- [ ] 文檔完善
- [ ] 性能優化
- [ ] 使用者介面

## 🔬 研究參考

### 相關論文
1. **RL_PCB**: "A Learning-based Method for PCB Component Placement"
   - 強化學習應用於 PCB 佈局
   - 細胞自動機啟發的方法

2. **Cypress**: "VLSI-Inspired PCB Placement with GPU Acceleration"
   - GPU 加速的佈局優化
   - VLSI 技術應用於 PCB

3. **DeepPCB**: "Cloud-Native Printed Circuit Board Routing"
   - 深度學習走線優化
   - 雲端計算架構

### 開源專案參考
- [RL_PCB](https://github.com/LukeVassallo/RL_PCB) - 強化學習 PCB 擺放
- [pcbflow](https://github.com/michaelgale/pcbflow) - 程式化 PCB 生成
- [FreeRouting](https://github.com/freerouting/freerouting) - 自動走線工具

## ⚙️ 配置範例

```yaml
# config.yaml
training:
  algorithm: PPO
  total_timesteps: 1000000
  learning_rate: 0.0003
  n_steps: 2048
  batch_size: 64

environment:
  board_size: [100, 100]  # mm
  grid_resolution: 0.1    # mm

reward_weights:
  wire_length: -0.01
  overlap_penalty: -100
  heat_uniformity: 10
  drc_violation: -20

optimization:
  max_iterations: 1000
  convergence_threshold: 0.01
```

## 🤝 貢獻指南

此專案歡迎貢獻！可以協助的方向：

- 🐛 回報 Bug
- 💡 提出新功能建議
- 📝 改進文檔
- 🧪 新增測試案例
- 🎨 優化演算法

## ⚠️ 限制與注意事項

1. **實驗性質**：此工具處於早期開發階段
2. **需要驗證**：AI 生成的佈局需要工程師審查
3. **計算資源**：訓練模型需要較長時間和 GPU 資源
4. **學習曲線**：需要理解 RL 基本概念
5. **不保證最優**：AI 結果不一定優於人工設計

## 📄 授權

MIT License - 詳見 LICENSE 檔案

## 📞 聯絡

- 問題回報: GitHub Issues
- 討論: GitHub Discussions

---

**最後更新**: 2025-11-15
**狀態**: 🚧 開發中
