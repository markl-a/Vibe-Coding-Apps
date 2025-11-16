# 類比電路生成器 (Analog Circuit Generator)

自動生成各種類比電路設計，包括放大器、振盪器、穩壓器等。

## 功能特色

- **運算放大器電路設計**
  - 反相/非反相放大器
  - 差動放大器
  - 儀表放大器
  - 主動濾波器

- **振盪器電路**
  - RC 振盪器
  - LC 振盪器
  - 晶體振盪器
  - 555 定時器電路

- **穩壓電路**
  - 線性穩壓器 (LDO)
  - 齊納二極體穩壓
  - 基準電壓源

## 快速開始

### 安裝依賴

```bash
cd analog-circuit-generator
pip install -r requirements.txt
```

### 基本使用

```python
from src.amplifier_designer import OpAmpAmplifier

# 設計一個非反相放大器，增益為 10
amp = OpAmpAmplifier()
circuit = amp.design_non_inverting(gain=10, input_impedance=10000)

print(f"R1: {circuit['R1']} Ω")
print(f"R2: {circuit['R2']} Ω")
print(f"實際增益: {circuit['actual_gain']:.2f}")

# 生成 SPICE 網表
netlist = circuit['netlist']
print(netlist)
```

### 振盪器設計

```python
from src.oscillator_designer import RC_Oscillator

# 設計一個 1kHz RC 振盪器
osc = RC_Oscillator()
circuit = osc.design_wien_bridge(frequency=1000)

print(f"R: {circuit['R']} Ω")
print(f"C: {circuit['C']*1e9:.2f} nF")
print(f"實際頻率: {circuit['actual_frequency']:.2f} Hz")
```

### 穩壓器設計

```python
from src.regulator_designer import LinearRegulator

# 設計一個 5V 穩壓器
reg = LinearRegulator()
circuit = reg.design_ldo(input_voltage=12, output_voltage=5, output_current=0.5)

print(f"LDO IC: {circuit['ic_model']}")
print(f"輸入電容: {circuit['C_in']*1e6:.2f} µF")
print(f"輸出電容: {circuit['C_out']*1e6:.2f} µF")
```

## 範例

查看 `examples/` 目錄以獲取更多使用範例：

- `amplifier_examples.py` - 各種放大器電路設計
- `oscillator_examples.py` - 振盪器電路設計
- `regulator_examples.py` - 穩壓器電路設計
- `filter_examples.py` - 主動濾波器設計

## 電路計算公式

### 運算放大器

**非反相放大器增益:**
```
Gain = 1 + (R2/R1)
```

**反相放大器增益:**
```
Gain = -(R2/R1)
```

### RC 振盪器 (Wien Bridge)

**振盪頻率:**
```
f = 1 / (2πRC)
```

### LDO 穩壓器

**輸出電容:**
```
C_out ≥ 10 µF (典型值)
需考慮 ESR 和負載暫態響應
```

## 技術規格

- Python 3.8+
- NumPy (數值計算)
- SciPy (電路分析)
- 支援 E-Series 標準電阻值 (E12, E24, E96)

## 授權

MIT License
