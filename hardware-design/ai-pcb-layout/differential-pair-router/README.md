# 🔀 Differential Pair Router

專業的差分對自動走線工具，確保高速訊號的完整性和阻抗匹配。

## 📋 專案簡介

Differential Pair Router 專注於差分對走線的自動化，提供：
- 自動差分對走線
- 阻抗控制
- 長度匹配
- 間距保持
- 耦合分析

### 核心特性

- ⚡ **高速訊號支援**：USB, HDMI, PCIe, LVDS等
- 📏 **精確等長**：自動計算並匹配長度
- 🎯 **阻抗控制**：目標阻抗 ±5%
- 🔄 **自動蛇形**：智能長度調整
- 📊 **SI 分析**：訊號完整性預分析

## 🚀 快速開始

```python
from differential_pair_router import DiffPairRouter

# 創建路由器
router = DiffPairRouter(board_size=(100, 80))

# 添加差分對
router.add_diff_pair(
    pos_start=(10, 40),
    pos_end=(90, 40),
    neg_start=(10, 42),
    neg_end=(90, 42),
    target_impedance=100,  # 歐姆
    spacing=0.2,           # mm
    width=0.15             # mm
)

# 執行走線
result = router.route(
    length_matching=True,
    max_length_diff=0.5  # mm
)

# 顯示結果
print(f"正極長度: {result['positive_length']:.2f} mm")
print(f"負極長度: {result['negative_length']:.2f} mm")
print(f"長度差: {result['length_diff']:.2f} mm")
print(f"阻抗: {result['impedance']:.1f} Ω")
```

## 🎯 功能特性

### 1. 自動長度匹配

```python
# 使用蛇形線匹配長度
router.enable_meander(
    amplitude=2.0,  # 蛇形幅度 mm
    min_segment=5.0  # 最小線段長度 mm
)
```

### 2. 阻抗計算

支援多種疊層結構的阻抗計算：
- 微帶線（Microstrip）
- 帶狀線（Stripline）
- 嵌入式微帶線

### 3. Via 換層

```python
# 自動處理差分對換層
router.add_layer_change(
    position=(50, 40),
    from_layer=0,
    to_layer=2,
    via_spacing=0.3  # mm
)
```

## 📊 阻抗計算公式

### 微帶線差分阻抗

```
Z_diff = (2 * Z0) * (1 - 0.48 * exp(-0.96 * S/H))

其中:
  Z0 = 單端阻抗
  S = 差分對間距
  H = 介電層厚度
```

## 📁 專案結構

```
differential-pair-router/
├── README.md
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── router.py           # 主路由器
│   ├── impedance.py        # 阻抗計算
│   ├── length_matcher.py   # 長度匹配
│   └── meander.py          # 蛇形線生成
├── examples/
│   ├── usb_routing.py
│   ├── pcie_routing.py
│   └── lvds_routing.py
└── tests/
    └── test_router.py
```

## 📄 授權

MIT License

---

**最後更新**: 2025-11-16
**狀態**: ✅ 可用
