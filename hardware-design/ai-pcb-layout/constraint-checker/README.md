# ✅ PCB Constraint Checker

智能 PCB 設計規則檢查器，自動驗證 PCB 設計是否符合製造和電氣規範。

## 📋 專案簡介

Constraint Checker 是一個全面的 PCB 設計規則檢查（DRC）工具，能夠：
- 自動檢查設計規則違規
- 驗證電氣特性
- 檢查製造可行性
- 生成詳細的違規報告
- 提供修復建議

### 核心特性

- 🔍 **全面檢查**：覆蓋間距、線寬、過孔、銅皮等
- ⚡ **快速掃描**：優化算法，支援大型設計
- 📊 **詳細報告**：違規位置、類型、嚴重程度
- 🎯 **可配置規則**：支援自訂設計規則
- 🤖 **AI 建議**：智能修復建議

## 🚀 快速開始

### 基本使用

```python
from constraint_checker import PCBChecker

# 創建檢查器
checker = PCBChecker()

# 載入設計規則
checker.load_rules('standard_rules.yaml')

# 或手動設定規則
checker.set_rules({
    'min_trace_width': 0.15,        # mm
    'min_trace_spacing': 0.15,      # mm
    'min_via_diameter': 0.3,        # mm
    'min_via_drill': 0.2,           # mm
    'min_annular_ring': 0.1,        # mm
    'min_copper_to_edge': 0.5,      # mm
})

# 添加走線
checker.add_trace(
    start=(10, 10),
    end=(50, 50),
    width=0.2,
    layer=0
)

checker.add_via(x=30, y=30, diameter=0.4, drill=0.25)

# 執行檢查
violations = checker.check_all()

# 顯示結果
print(f"發現 {len(violations)} 個違規")
for v in violations:
    print(f"  - [{v['severity']}] {v['type']}: {v['description']}")
    print(f"    位置: ({v['x']:.2f}, {v['y']:.2f})")

# 生成報告
checker.generate_report(violations, 'drc_report.html')
```

## 📊 檢查項目

### 1. 走線規則

- **最小線寬**：確保可製造性
- **最小間距**：防止短路
- **最大長度**：訊號完整性
- **阻抗控制**：差分對、高速訊號

### 2. 過孔規則

- **最小直徑**：機械鑽孔限制
- **最小鑽孔**：製造能力
- **環狀環**：可靠性
- **過孔間距**：避免弱化PCB

### 3. 銅皮規則

- **最小銅皮面積**：防止浮銅
- **板邊間距**：製造要求
- **散熱設計**：熱管理

### 4. 電氣規則

- **電源網路**：線寬要求
- **差分對**：間距匹配、等長
- **阻抗匹配**：特定走線
- **串擾**：平行走線

### 5. 製造規則

- **最小特徵尺寸**
- **鑽孔位置**
- **工藝能力**
- **層壓對齊**

## 🎯 進階功能

### 自訂規則

```python
# 定義自訂規則
def custom_power_trace_rule(trace):
    """電源走線必須 >= 0.5mm"""
    if trace['net_class'] == 'power':
        if trace['width'] < 0.5:
            return {
                'pass': False,
                'message': f'電源走線寬度 {trace["width"]} < 0.5mm'
            }
    return {'pass': True}

# 註冊規則
checker.register_custom_rule(
    name='power_trace_width',
    function=custom_power_trace_rule,
    severity='error'
)
```

### 批次檢查

```python
# 檢查多個設計
results = checker.batch_check([
    'board1.kicad_pcb',
    'board2.kicad_pcb',
    'board3.kicad_pcb'
])

# 彙總報告
checker.generate_summary_report(results)
```

### 差分對檢查

```python
# 添加差分對
checker.add_differential_pair(
    positive_trace=trace1,
    negative_trace=trace2,
    target_impedance=100,  # 歐姆
    tolerance=10           # %
)

# 檢查差分對規則
diff_violations = checker.check_differential_pairs()
```

## 📁 專案結構

```
constraint-checker/
├── README.md
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── checker.py          # 主檢查器
│   ├── rules/
│   │   ├── trace_rules.py  # 走線規則
│   │   ├── via_rules.py    # 過孔規則
│   │   ├── copper_rules.py # 銅皮規則
│   │   └── electrical.py   # 電氣規則
│   ├── analyzer.py         # 分析工具
│   ├── reporter.py         # 報告生成
│   └── utils.py
├── examples/
│   ├── basic_check.py
│   ├── custom_rules.py
│   └── batch_check.py
├── tests/
│   └── test_checker.py
└── rules/
    ├── standard.yaml       # 標準規則
    ├── ipc_class_2.yaml   # IPC Class 2
    └── ipc_class_3.yaml   # IPC Class 3
```

## 🔬 規則配置

```yaml
# standard_rules.yaml
traces:
  min_width: 0.15          # mm
  min_spacing: 0.15        # mm
  max_length: 500          # mm

vias:
  min_diameter: 0.3        # mm
  min_drill: 0.2           # mm
  min_annular_ring: 0.1    # mm
  min_spacing: 0.3         # mm

copper:
  min_area: 1.0            # mm²
  min_to_edge: 0.5         # mm
  min_clearance: 0.2       # mm

electrical:
  power_min_width: 0.5     # mm
  diff_pair_spacing: 0.2   # mm
  diff_pair_tolerance: 0.1 # mm
  impedance_tolerance: 10  # %
```

## 📊 報告範例

生成的 HTML 報告包含：
- 違規統計圖表
- 按嚴重程度分類
- 互動式位置標記
- 修復建議清單
- 設計品質評分

## ⚙️ API 參考

```python
# 初始化
checker = PCBChecker()

# 設定規則
checker.set_rules(rules_dict)
checker.load_rules('rules.yaml')

# 添加物件
checker.add_trace(start, end, width, layer, net_class)
checker.add_via(x, y, diameter, drill, layer_start, layer_end)
checker.add_pad(x, y, width, height, shape)

# 執行檢查
violations = checker.check_all()
violations = checker.check_traces()
violations = checker.check_vias()
violations = checker.check_clearance()

# 報告
checker.generate_report(violations, 'report.html')
checker.export_violations('violations.csv')
```

## 📄 授權

MIT License

---

**最後更新**: 2025-11-16
**狀態**: ✅ 可用
