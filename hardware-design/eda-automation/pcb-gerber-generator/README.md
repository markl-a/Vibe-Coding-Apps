# PCB Gerber Generator

> 自動化 PCB Gerber 製造文件生成工具

一鍵生成完整的 PCB 製造文件包,包括 Gerber、鑽孔檔、BOM、組裝圖等,支援多種 EDA 工具。

## 功能特點

- **一鍵生成**: 自動生成所有製造所需文件
- **多 EDA 支援**: KiCAD、Altium Designer、Eagle
- **標準格式**: 符合 PCB 廠商要求的 Gerber X2/RS-274X 格式
- **批次處理**: 同時處理多個 PCB 專案
- **檔案驗證**: 自動檢查生成的 Gerber 檔案
- **配置範本**: 預設多種 PCB 廠商配置

## 支援的輸出格式

### Gerber 檔案
- ✅ 銅箔層 (Top/Bottom/Inner layers)
- ✅ 防焊層 (Solder Mask)
- ✅ 絲印層 (Silkscreen)
- ✅ 助焊層 (Paste)
- ✅ 邊框層 (Board Outline)

### 鑽孔檔案
- ✅ Excellon 格式 (.drl)
- ✅ 鑽孔圖 (.pdf)
- ✅ 非電鍍孔標記

### 其他文件
- ✅ BOM 清單 (.csv, .xlsx)
- ✅ 組裝圖 (.pdf)
- ✅ 3D 視圖 (.step, .wrl)
- ✅ 位置檔 (Pick & Place)

## 快速開始

### 安裝

```bash
cd pcb-gerber-generator
pip install -r requirements.txt
```

### 基本使用

#### KiCAD

```python
from src.generator import GerberGenerator

# 初始化生成器
gen = GerberGenerator(tool='kicad')

# 生成 Gerber 檔案
gen.generate(
    input_file="my_board.kicad_pcb",
    output_dir="gerbers/",
    manufacturer="jlcpcb"  # 使用 JLCPCB 配置
)
```

#### 命令列

```bash
# 生成 Gerber 檔案
python -m src.cli generate -i board.kicad_pcb -o output/ -m jlcpcb

# 批次處理
python -m src.cli batch -i "projects/*.kicad_pcb" -o gerbers/

# 驗證 Gerber 檔案
python -m src.cli validate -i gerbers/
```

## 使用範例

### 範例 1: 基本生成

```python
from src.generator import GerberGenerator

gen = GerberGenerator(tool='kicad')

# 生成所有製造文件
result = gen.generate_all(
    input_file="myboard.kicad_pcb",
    output_dir="manufacturing/",
    options={
        'gerber': True,
        'drill': True,
        'bom': True,
        'position': True,
        'assembly_drawing': True
    }
)

print(f"✅ 生成完成! 檔案位於: {result['output_dir']}")
print(f"📦 包含 {result['file_count']} 個檔案")
```

### 範例 2: 自訂配置

```python
from src.generator import GerberGenerator
from src.config import GerberConfig

# 自訂配置
config = GerberConfig(
    format="4.6",  # 座標格式
    units="mm",    # 單位
    zero_suppression="leading",
    coordinate_format="absolute",
    gerber_precision=6
)

gen = GerberGenerator(tool='kicad', config=config)

gen.generate(
    input_file="board.kicad_pcb",
    output_dir="gerbers/",
    layers=[
        'F.Cu', 'B.Cu',        # 銅層
        'F.SilkS', 'B.SilkS',  # 絲印
        'F.Mask', 'B.Mask',    # 防焊
        'Edge.Cuts'            # 邊框
    ]
)
```

### 範例 3: 批次處理

```python
from src.generator import BatchGerberGenerator
import glob

batch = BatchGerberGenerator(tool='kicad')

# 找出所有 PCB 檔案
pcb_files = glob.glob("projects/**/*.kicad_pcb", recursive=True)

# 批次生成
results = batch.process(
    files=pcb_files,
    output_base_dir="manufacturing/",
    manufacturer="pcbway"
)

# 生成報告
for result in results:
    print(f"{result['file']}: {'✅' if result['success'] else '❌'}")
```

### 範例 4: 使用廠商預設

```python
from src.generator import GerberGenerator

gen = GerberGenerator(tool='kicad')

# 支援的廠商預設
manufacturers = [
    'jlcpcb',      # 嘉立創
    'pcbway',      # PCBWay
    'oshpark',     # OSH Park
    'seeedstudio', # Seeed Studio
    'elecrow',     # Elecrow
    'generic'      # 通用格式
]

# 使用 JLCPCB 預設
gen.generate(
    input_file="board.kicad_pcb",
    output_dir="gerbers_jlc/",
    manufacturer="jlcpcb"
)
```

## 配置文件

### 廠商配置範例 (config/jlcpcb.yaml)

```yaml
manufacturer: JLCPCB
format:
  units: mm
  coordinate_format: "4.6"
  zero_suppression: leading

layers:
  top_copper: F.Cu
  bottom_copper: B.Cu
  top_silkscreen: F.SilkS
  bottom_silkscreen: B.SilkS
  top_mask: F.Mask
  bottom_mask: B.Mask
  outline: Edge.Cuts

drill:
  format: excellon
  units: mm
  precision: "3.3"

naming:
  pattern: "{project}-{layer}.{ext}"
  drill_file: "{project}.drl"

output:
  zip_output: true
  include_readme: true
```

### 自訂配置

```python
from src.config import load_config

# 載入自訂配置
config = load_config("config/my_manufacturer.yaml")

gen = GerberGenerator(tool='kicad', config=config)
gen.generate(...)
```

## 命令列工具

### 生成 Gerber

```bash
# 基本生成
python -m src.cli generate -i board.kicad_pcb -o output/

# 指定廠商
python -m src.cli generate -i board.kicad_pcb -o output/ -m jlcpcb

# 只生成特定層
python -m src.cli generate -i board.kicad_pcb -o output/ --layers F.Cu,B.Cu,Edge.Cuts

# 生成並壓縮
python -m src.cli generate -i board.kicad_pcb -o output/ --zip
```

### 批次處理

```bash
# 處理資料夾中所有 PCB
python -m src.cli batch -i "projects/*.kicad_pcb" -o gerbers/

# 使用萬用字元
python -m src.cli batch -i "**/*.kicad_pcb" -o gerbers/ -m pcbway
```

### 驗證 Gerber

```bash
# 驗證 Gerber 檔案
python -m src.cli validate -i gerbers/

# 詳細報告
python -m src.cli validate -i gerbers/ --verbose

# 生成 HTML 報告
python -m src.cli validate -i gerbers/ --report validation_report.html
```

## API 參考

### GerberGenerator

```python
class GerberGenerator:
    def __init__(
        self,
        tool: str = 'kicad',
        config: GerberConfig = None
    )

    def generate(
        self,
        input_file: str,
        output_dir: str,
        manufacturer: str = None,
        layers: List[str] = None
    ) -> dict

    def generate_all(
        self,
        input_file: str,
        output_dir: str,
        options: dict = None
    ) -> dict

    def validate_output(
        self,
        output_dir: str
    ) -> Tuple[bool, List[str]]
```

### BatchGerberGenerator

```python
class BatchGerberGenerator:
    def __init__(
        self,
        tool: str = 'kicad',
        config: GerberConfig = None
    )

    def process(
        self,
        files: List[str],
        output_base_dir: str,
        manufacturer: str = None,
        parallel: bool = True
    ) -> List[dict]
```

## 專案結構

```
pcb-gerber-generator/
├── README.md
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── generator.py       # 主要生成器
│   ├── cli.py             # 命令列介面
│   ├── config.py          # 配置管理
│   ├── validator.py       # Gerber 驗證器
│   ├── kicad_backend.py   # KiCAD 後端
│   ├── altium_backend.py  # Altium 後端
│   └── utils.py           # 工具函數
├── config/
│   ├── jlcpcb.yaml       # JLCPCB 配置
│   ├── pcbway.yaml       # PCBWay 配置
│   ├── oshpark.yaml      # OSH Park 配置
│   └── generic.yaml      # 通用配置
├── examples/
│   ├── basic_usage.py
│   ├── batch_processing.py
│   └── custom_config.py
└── tests/
    ├── test_generator.py
    ├── test_validator.py
    └── fixtures/
```

## 支援的 PCB 廠商

| 廠商 | 配置檔 | 說明 |
|------|--------|------|
| JLCPCB | jlcpcb.yaml | 嘉立創 PCB |
| PCBWay | pcbway.yaml | PCBWay |
| OSH Park | oshpark.yaml | OSH Park |
| Seeed Studio | seeedstudio.yaml | Seeed Studio |
| Elecrow | elecrow.yaml | Elecrow |
| Generic | generic.yaml | 通用配置 |

## Gerber 檔案命名規則

### JLCPCB
```
project-F_Cu.gtl      # 頂層銅箔
project-B_Cu.gbl      # 底層銅箔
project-F_SilkS.gto   # 頂層絲印
project-B_SilkS.gbo   # 底層絲印
project-F_Mask.gts    # 頂層防焊
project-B_Mask.gbs    # 底層防焊
project-Edge_Cuts.gm1 # 板邊
project.drl           # 鑽孔檔
```

### PCBWay
```
project.GTL           # 頂層銅箔
project.GBL           # 底層銅箔
project.GTO           # 頂層絲印
project.GBO           # 底層絲印
project.GTS           # 頂層防焊
project.GBS           # 底層防焊
project.GKO           # 板邊
project.TXT           # 鑽孔檔
```

## 進階功能

### Gerber 預覽

```python
from src.viewer import GerberViewer

viewer = GerberViewer()

# 載入 Gerber 檔案
viewer.load("gerbers/")

# 生成預覽圖
viewer.render(
    output="preview.png",
    dpi=300,
    show_layers=['F.Cu', 'B.Cu', 'Edge.Cuts']
)
```

### Gerber 比較

```python
from src.compare import GerberCompare

compare = GerberCompare()

# 比較兩個版本
diff = compare.compare(
    "gerbers_v1/",
    "gerbers_v2/"
)

if diff.has_changes:
    print("發現差異:")
    for change in diff.changes:
        print(f"  {change}")
```

## 疑難排解

### KiCAD 版本問題

```python
# 檢查 KiCAD 版本
import pcbnew
print(pcbnew.Version())

# 如果版本不相容,請更新 KiCAD 或使用相容的 API
```

### 層名稱問題

```bash
# 列出板子中的所有層
python -m src.cli list-layers -i board.kicad_pcb
```

### Gerber 驗證失敗

```bash
# 詳細驗證
python -m src.cli validate -i gerbers/ --verbose

# 檢查特定問題
python -m src.cli validate -i gerbers/ --check apertures,drill
```

## 最佳實踐

1. **使用廠商預設**: 優先使用預設的廠商配置
2. **驗證輸出**: 生成後務必驗證 Gerber 檔案
3. **保留原始檔**: 不要刪除原始 PCB 設計檔
4. **版本控制**: 為每個版本生成獨立的 Gerber
5. **預覽檢查**: 提交前使用 Gerber 查看器檢查

## 授權

MIT License

---

**最後更新**: 2025-11-16
