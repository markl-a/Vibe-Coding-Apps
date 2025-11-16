# Component Footprint Wizard

> 智能元件封裝 (Footprint) 自動生成工具

使用 AI 和參數化設計自動生成標準和自訂 PCB 元件封裝,支援 KiCAD、Altium 等格式。

## 功能特點

- **AI 驅動生成**: 從自然語言描述或規格書生成封裝
- **參數化設計**: 靈活調整封裝參數
- **標準封裝庫**: 內建常見封裝 (0402, 0603, QFP, BGA 等)
- **規格書解析**: 自動從 PDF 規格書提取封裝資訊
- **3D 模型**: 自動生成或關聯 3D 模型
- **多格式支援**: KiCAD、Altium、Eagle
- **IPC 標準**: 符合 IPC-7351 標準

## 支援的封裝類型

### SMD 封裝
- ✅ 電阻/電容 (0201, 0402, 0603, 0805, 1206, 等)
- ✅ 電感
- ✅ 二極體 (SOD, SOT)
- ✅ 晶體/諧振器

### IC 封裝
- ✅ QFP (Quad Flat Package)
- ✅ QFN (Quad Flat No-lead)
- ✅ BGA (Ball Grid Array)
- ✅ SOIC (Small Outline IC)
- ✅ TSSOP/SSOP
- ✅ DIP (Dual In-line Package)

### 連接器
- ✅ 排針/排母
- ✅ USB (Type-A, Type-C, Micro, Mini)
- ✅ HDMI
- ✅ RJ45
- ✅ 端子台

### 其他
- ✅ LED
- ✅ 開關/按鍵
- ✅ 跳線
- ✅ 測試點

## 快速開始

### 安裝

```bash
cd component-footprint-wizard
pip install -r requirements.txt
```

### 基本使用

```python
from src.wizard import FootprintWizard

# 初始化生成器
wizard = FootprintWizard()

# 生成標準 0603 電阻封裝
footprint = wizard.generate_resistor_0603()
footprint.save("R_0603.kicad_mod")

# 參數化生成 QFP
footprint = wizard.generate_qfp(
    pins=64,
    pitch=0.5,  # mm
    body_size=10.0,
    pad_width=0.3,
    pad_length=1.5
)
footprint.save("QFP64_0.5mm.kicad_mod")
```

### 命令列使用

```bash
# 生成標準封裝
python -m src.cli generate --type 0603 --category resistor

# 參數化生成
python -m src.cli generate --type qfp --pins 64 --pitch 0.5

# 從規格書生成
python -m src.cli from-datasheet --pdf component_datasheet.pdf

# 使用 AI 生成
python -m src.cli ai-generate --prompt "生成 USB Type-C 母座封裝"
```

## 使用範例

### 範例 1: 生成標準 SMD 封裝

```python
from src.wizard import FootprintWizard

wizard = FootprintWizard()

# 生成常見的 SMD 電阻/電容封裝
sizes = ['0402', '0603', '0805', '1206']

for size in sizes:
    # 電阻
    fp = wizard.generate_resistor(size)
    fp.save(f"R_{size}.kicad_mod")

    # 電容
    fp = wizard.generate_capacitor(size)
    fp.save(f"C_{size}.kicad_mod")

print("✅ 生成完成!")
```

### 範例 2: 參數化 IC 封裝

```python
from src.wizard import FootprintWizard

wizard = FootprintWizard()

# 生成 QFP-64, 0.5mm pitch
qfp64 = wizard.generate_qfp(
    pins=64,
    pitch=0.5,
    body_size=10.0,
    pad_width=0.3,
    pad_length=1.5,
    thermal_pad=True,
    thermal_pad_size=5.0
)

qfp64.save("QFP64_0.5mm_EP.kicad_mod")

# 生成 QFN-32, 0.5mm pitch
qfn32 = wizard.generate_qfn(
    pins=32,
    pitch=0.5,
    body_size=5.0,
    pad_width=0.25,
    pad_length=0.8,
    thermal_pad=True,
    thermal_pad_size=3.0
)

qfn32.save("QFN32_0.5mm_EP.kicad_mod")
```

### 範例 3: AI 驅動生成

```python
from src.wizard import FootprintWizard

wizard = FootprintWizard(ai_model="gpt-4")

# 從自然語言描述生成
description = """
生成 USB Type-C 母座的封裝:
- 24 個訊號腳
- 4 個固定腳
- 腳間距 0.5mm
- 底部有 2 個大的固定孔
- 符合 USB-IF 規範
"""

footprint = wizard.ai_generate(description)
footprint.save("USB_Type_C_Receptacle.kicad_mod")

# 查看生成的封裝資訊
print(footprint.info())
```

### 範例 4: 從規格書生成

```python
from src.wizard import FootprintWizard

wizard = FootprintWizard()

# 從 PDF 規格書自動提取封裝資訊
footprint = wizard.from_datasheet(
    pdf_file="atmega328p_datasheet.pdf",
    package_type="TQFP-32"
)

# 微調參數
footprint.set_pad_length(1.6)
footprint.set_clearance(0.2)

# 儲存
footprint.save("ATmega328P_TQFP32.kicad_mod")
```

### 範例 5: 批次生成封裝庫

```python
from src.wizard import FootprintWizard
from src.library import LibraryBuilder

wizard = FootprintWizard()
library = LibraryBuilder("MyComponents")

# 電阻系列
for size in ['0402', '0603', '0805', '1206', '1210']:
    fp = wizard.generate_resistor(size)
    library.add(fp)

# 電容系列
for size in ['0402', '0603', '0805', '1206']:
    fp = wizard.generate_capacitor(size)
    library.add(fp)

# QFP 系列
for pins in [32, 44, 64, 100]:
    for pitch in [0.4, 0.5, 0.65, 0.8]:
        fp = wizard.generate_qfp(pins=pins, pitch=pitch)
        library.add(fp)

# 匯出整個庫
library.export("MyComponents.pretty/")

print(f"✅ 生成了 {library.count()} 個封裝")
```

## 封裝參數

### 基本參數

```python
# 通用參數
params = {
    'name': 'R_0603',
    'description': '0603 Resistor',
    'tags': ['resistor', '0603', 'smd'],
    'reference': 'R',
    'value': '10K',
}
```

### SMD 元件參數

```python
# 0603 電阻/電容
smd_params = {
    'body_length': 1.6,    # mm
    'body_width': 0.8,
    'pad_length': 0.9,
    'pad_width': 0.9,
    'pad_spacing': 1.5,
    'paste_ratio': 1.0,    # 助焊層比例
    'mask_margin': 0.05,   # 防焊層邊界
}
```

### QFP 參數

```python
qfp_params = {
    'pins': 64,
    'pitch': 0.5,          # 腳間距
    'body_size': 10.0,     # 本體尺寸
    'pad_width': 0.3,
    'pad_length': 1.5,
    'thermal_pad': True,
    'thermal_pad_size': 5.0,
    'thermal_vias': True,  # 熱焊盤過孔
    'via_diameter': 0.3,
    'via_spacing': 1.0,
}
```

### BGA 參數

```python
bga_params = {
    'rows': 10,
    'cols': 10,
    'pitch': 0.8,
    'ball_diameter': 0.4,
    'pad_diameter': 0.35,
    'mask_margin': 0.05,
    'solder_mask_defined': True,
}
```

## IPC-7351 標準

支援 IPC-7351 標準的三種焊盤等級:

- **N (Nominal)**: 標準等級,適合大多數情況
- **M (Maximum)**: 最大焊盤,提供最大焊接強度
- **L (Least)**: 最小焊盤,用於高密度設計

```python
# 使用 IPC 標準
footprint = wizard.generate_resistor(
    '0603',
    ipc_level='N'  # Nominal
)

footprint = wizard.generate_qfp(
    pins=64,
    pitch=0.5,
    ipc_level='M'  # Maximum
)
```

## API 參考

### FootprintWizard

```python
class FootprintWizard:
    def __init__(
        self,
        ai_model: str = None,
        ipc_level: str = 'N'
    )

    def generate_resistor(
        self,
        size: str,
        **params
    ) -> Footprint

    def generate_capacitor(
        self,
        size: str,
        **params
    ) -> Footprint

    def generate_qfp(
        self,
        pins: int,
        pitch: float,
        **params
    ) -> Footprint

    def generate_qfn(
        self,
        pins: int,
        pitch: float,
        **params
    ) -> Footprint

    def generate_bga(
        self,
        rows: int,
        cols: int,
        pitch: float,
        **params
    ) -> Footprint

    def ai_generate(
        self,
        description: str
    ) -> Footprint

    def from_datasheet(
        self,
        pdf_file: str,
        package_type: str = None
    ) -> Footprint
```

### Footprint

```python
class Footprint:
    @property
    def name(self) -> str

    @property
    def pads(self) -> List[Pad]

    def save(
        self,
        filepath: str,
        format: str = 'kicad'
    ) -> None

    def to_kicad(self) -> str

    def to_altium(self) -> str

    def add_3d_model(
        self,
        model_path: str
    ) -> None

    def info(self) -> str
```

## 專案結構

```
component-footprint-wizard/
├── README.md
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── wizard.py          # 主要封裝生成器
│   ├── footprint.py       # 封裝類別
│   ├── generators/
│   │   ├── smd.py         # SMD 封裝生成器
│   │   ├── ic.py          # IC 封裝生成器
│   │   ├── connector.py   # 連接器生成器
│   │   └── custom.py      # 自訂封裝
│   ├── ai_generator.py    # AI 生成器
│   ├── datasheet_parser.py # 規格書解析器
│   ├── ipc_standards.py   # IPC 標準
│   ├── library.py         # 封裝庫管理
│   └── cli.py             # 命令列介面
├── templates/
│   ├── smd_templates/
│   ├── ic_templates/
│   └── connector_templates/
├── examples/
│   ├── generate_smd.py
│   ├── generate_ic.py
│   ├── ai_generation.py
│   └── batch_library.py
├── library/
│   └── generated/         # 生成的封裝庫
└── tests/
    ├── test_generators.py
    └── test_ipc.py
```

## 封裝命名規則

遵循 KiCAD 命名慣例:

```
類型_封裝_參數_特殊標記

範例:
- R_0603_1608Metric
- C_0805_2012Metric_Pad1.18x1.45mm
- QFP-64-1EP_10x10mm_P0.5mm
- QFN-32-1EP_5x5mm_P0.5mm_EP3.0x3.0mm
- USB_C_Receptacle_HRO_TYPE-C-31-M-12
- BGA-100_10x10_P0.8mm
```

## 3D 模型整合

```python
# 自動關聯 3D 模型
footprint = wizard.generate_qfp(pins=64, pitch=0.5)

# 從模型庫關聯
footprint.add_3d_model("${KISYS3DMOD}/Package_QFP.3dshapes/QFP-64_10x10mm.wrl")

# 或自動搜尋匹配的模型
footprint.auto_link_3d_model()
```

## 驗證與檢查

```python
from src.validator import FootprintValidator

validator = FootprintValidator()

# 驗證封裝
result = validator.validate(footprint)

if not result.passed:
    print("發現問題:")
    for issue in result.issues:
        print(f"  - {issue}")
```

## 最佳實踐

1. **使用 IPC 標準**: 優先使用 IPC-7351 標準
2. **3D 模型**: 盡可能提供 3D 模型
3. **命名規範**: 遵循統一的命名規則
4. **文檔完整**: 包含完整的描述和標籤
5. **驗證封裝**: 生成後務必驗證

## 疑難排解

### KiCAD 格式問題

```python
# 確認 KiCAD 版本
footprint.save("test.kicad_mod", kicad_version=6)
```

### 焊盤尺寸問題

```python
# 使用 IPC 計算器
from src.ipc_standards import IPCCalculator

calc = IPCCalculator()
pad_size = calc.calculate_pad_size(
    component_size=(1.6, 0.8),
    level='N'
)
```

## 授權

MIT License

---

**最後更新**: 2025-11-16
