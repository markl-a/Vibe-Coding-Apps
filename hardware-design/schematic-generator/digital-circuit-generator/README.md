# 數位電路生成器 (Digital Circuit Generator)

自動生成各種數位邏輯電路設計，包括組合邏輯、時序電路、計數器等。

## 功能特色

- **組合邏輯電路**
  - 邏輯閘組合 (AND, OR, NOT, NAND, NOR, XOR)
  - 多工器 (Multiplexer)
  - 解多工器 (Demultiplexer)
  - 編碼器/解碼器

- **時序電路**
  - D 正反器
  - JK 正反器
  - T 正反器
  - 暫存器

- **計數器**
  - 上數計數器
  - 下數計數器
  - 環形計數器
  - 任意進制計數器

## 快速開始

```python
from src.logic_designer import LogicGateDesigner

# 設計一個 4 位元加法器
designer = LogicGateDesigner()
circuit = designer.design_adder(bits=4)

print(f"IC 型號: {circuit['ic_model']}")
print(f"位元數: {circuit['bits']}")
```

## 範例

查看 `examples/` 目錄獲取更多範例：
- `counter_examples.py` - 各種計數器設計
- `logic_examples.py` - 邏輯電路設計
- `register_examples.py` - 暫存器電路設計
