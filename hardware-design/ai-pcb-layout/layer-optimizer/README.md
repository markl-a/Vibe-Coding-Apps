# 📚 PCB Layer Optimizer

PCB 層疊結構優化工具，幫助設計最佳的多層板配置。

## 📋 專案簡介

Layer Optimizer 提供智能的 PCB 層疊優化，包括：
- 自動層疊設計
- 阻抗控制
- EMI/EMC 優化
- 成本分析
- 製造可行性

### 核心特性

- 🎯 **智能配置**：根據需求自動生成層疊
- 📊 **阻抗計算**：精確計算各層阻抗
- 💰 **成本優化**：平衡性能與成本
- ⚡ **訊號完整性**：最佳化訊號層配置
- 🛡️ **EMI 控制**：有效的屏蔽設計

## 🚀 快速開始

```python
from layer_optimizer import LayerOptimizer

# 創建優化器
optimizer = LayerOptimizer()

# 設定需求
optimizer.set_requirements({
    'signal_layers': 4,      # 需要4層訊號層
    'power_planes': 2,       # 2層電源層
    'impedance_control': True,
    'target_impedance': 50,  # 歐姆
    'max_layers': 8,         # 最多8層
    'budget': 'medium'       # 成本預算
})

# 執行優化
stackup = optimizer.optimize()

# 查看結果
optimizer.print_stackup(stackup)
optimizer.plot_stackup(stackup)

# 計算成本
cost = optimizer.estimate_cost(stackup)
print(f"預估成本: ${cost:.2f}")
```

## 🎯 層疊配置範例

### 4層板標準配置

```
Layer 1 (Top):     Signal + Components
Layer 2 (Inner):   GND Plane
Layer 3 (Inner):   Power Plane (3.3V/5V)
Layer 4 (Bottom):  Signal + Components
```

### 6層板高速設計

```
Layer 1 (Top):     High-speed signals
Layer 2 (Inner):   GND Plane
Layer 3 (Inner):   Signal (Stripline)
Layer 4 (Inner):   Signal (Stripline)
Layer 5 (Inner):   Power Planes
Layer 6 (Bottom):   Signal + Components
```

## 📊 優化目標

1. **阻抗匹配**：確保特定阻抗
2. **EMI 抑制**：電源/地平面配置
3. **成本控制**：最少層數
4. **製造性**：符合工藝能力
5. **散熱**：良好的熱管理

## 📁 專案結構

```
layer-optimizer/
├── README.md
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── optimizer.py        # 主優化器
│   ├── impedance.py        # 阻抗計算
│   ├── cost_estimator.py   # 成本估算
│   └── visualizer.py       # 視覺化
├── examples/
│   ├── 4layer_design.py
│   ├── 6layer_hdi.py
│   └── cost_comparison.py
├── templates/
│   ├── 4layer_standard.yaml
│   ├── 6layer_highspeed.yaml
│   └── 8layer_complex.yaml
└── tests/
    └── test_optimizer.py
```

## ⚙️ 配置範例

```yaml
# 6layer_highspeed.yaml
stackup:
  total_thickness: 1.6  # mm

layers:
  - name: Top
    type: signal
    copper_weight: 1    # oz
    thickness: 0.035    # mm

  - name: Prepreg1
    type: dielectric
    material: fr4
    thickness: 0.2      # mm
    dielectric_constant: 4.5

  - name: GND
    type: plane
    copper_weight: 1
    thickness: 0.035

  # ... 其他層
```

## 📄 授權

MIT License

---

**最後更新**: 2025-11-16
**狀態**: ✅ 可用
