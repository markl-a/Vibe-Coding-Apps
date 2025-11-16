# KiCAD Script Generator

> AI 驅動的 KiCAD Python 腳本自動生成工具

使用 AI (ChatGPT/Claude) 從自然語言描述生成 KiCAD pcbnew Python 腳本,加速 PCB 設計自動化工作流程。

## 功能特點

- **自然語言轉腳本**: 使用簡單的中文/英文描述自動生成 KiCAD 腳本
- **多種範本**: 內建常用腳本範本(元件擺放、走線、DRC 等)
- **AI 模型支援**: 支援 OpenAI GPT-4/GPT-3.5、Claude 3 系列
- **腳本驗證**: 自動檢查生成的腳本語法和 API 使用
- **互動式編輯**: 生成後可進行微調和參數調整

## 快速開始

### 安裝

```bash
cd kicad-script-generator
pip install -r requirements.txt
```

### 設定 API Key

```bash
# OpenAI
export OPENAI_API_KEY="your-api-key-here"

# 或 Anthropic Claude
export ANTHROPIC_API_KEY="your-api-key-here"
```

### 基本使用

```python
from src.generator import KiCADScriptGenerator

# 初始化生成器
gen = KiCADScriptGenerator(model="gpt-4")

# 從自然語言生成腳本
task = """
將所有去耦電容(C1-C10)放置在對應 IC 的附近,
距離不超過 3mm,並確保它們連接到最近的電源層和地層
"""

script = gen.generate(task)

# 儲存腳本
script.save("place_decoupling_caps.py")

# 查看生成的程式碼
print(script.code)
```

### 命令列使用

```bash
# 從提示生成腳本
python src/cli.py generate "將所有 LED 對齊到網格" -o align_leds.py

# 使用範本
python src/cli.py template component_grid -o grid_layout.py

# 列出所有範本
python src/cli.py list-templates
```

## 使用範例

### 範例 1: 元件對齊

```python
from src.generator import KiCADScriptGenerator

gen = KiCADScriptGenerator()

# 生成元件對齊腳本
script = gen.generate("""
將所有電阻按照 10x10 的網格排列,
起始位置 (50, 50) mm,間距 5mm
""")

script.execute()  # 直接執行(需要 KiCAD 環境)
```

### 範例 2: 批次修改走線寬度

```python
script = gen.generate("""
將所有電源網路(VCC, +5V, +3V3)的走線寬度設為 0.5mm,
訊號線設為 0.2mm,差分對設為 0.15mm
""")

script.save("update_track_widths.py")
```

### 範例 3: 使用範本

```python
from src.templates import TemplateManager

tm = TemplateManager()

# 列出可用範本
templates = tm.list()
print(templates)

# 使用範本並自訂參數
script = tm.use_template(
    "component_grid_layout",
    params={
        "component_prefix": "R",  # 只處理電阻
        "grid_cols": 8,
        "grid_rows": 5,
        "spacing_x": 5.0,  # mm
        "spacing_y": 5.0,
        "start_x": 30.0,
        "start_y": 30.0
    }
)

script.save("layout_resistors.py")
```

## 內建範本

### 元件相關
- `component_grid_layout` - 網格佈局
- `component_alignment` - 對齊元件
- `component_rotation` - 批次旋轉
- `decoupling_placement` - 去耦電容擺放

### 走線相關
- `track_width_update` - 更新走線寬度
- `differential_pair_routing` - 差分對走線
- `via_placement` - 過孔放置

### 製造相關
- `gerber_generation` - Gerber 文件生成
- `bom_generation` - BOM 清單生成
- `drc_check` - DRC 檢查

### 其他
- `net_highlighter` - 網路高亮
- `testpoint_placement` - 測試點放置
- `silkscreen_cleanup` - 絲印優化

## 進階功能

### 自訂 AI 提示詞

```python
gen = KiCADScriptGenerator(
    model="gpt-4",
    system_prompt="""
    你是 KiCAD 專家,專門生成高效且安全的 pcbnew 腳本。
    遵循 IPC 標準,並包含詳細的錯誤處理。
    """
)
```

### 腳本驗證

```python
from src.validator import ScriptValidator

validator = ScriptValidator()

# 驗證腳本
is_valid, errors = validator.validate(script.code)

if not is_valid:
    print("發現問題:")
    for error in errors:
        print(f"  - {error}")
```

### 批次生成

```python
tasks = [
    "將所有 IC 對齊到中心",
    "添加測試點到所有電源網路",
    "優化絲印位置避免遮擋焊盤"
]

for i, task in enumerate(tasks):
    script = gen.generate(task)
    script.save(f"auto_task_{i+1}.py")
```

## 專案結構

```
kicad-script-generator/
├── README.md
├── requirements.txt
├── .env.example
├── src/
│   ├── __init__.py
│   ├── generator.py       # 主要生成器類別
│   ├── cli.py             # 命令列介面
│   ├── validator.py       # 腳本驗證器
│   ├── executor.py        # 腳本執行器
│   └── config.py          # 設定管理
├── templates/
│   ├── component/         # 元件相關範本
│   ├── routing/           # 走線相關範本
│   ├── manufacturing/     # 製造相關範本
│   └── utility/           # 工具類範本
├── examples/
│   ├── basic_usage.py
│   ├── advanced_usage.py
│   └── template_usage.py
└── tests/
    ├── test_generator.py
    ├── test_validator.py
    └── test_templates.py
```

## API 參考

### KiCADScriptGenerator

```python
class KiCADScriptGenerator:
    def __init__(
        self,
        model: str = "gpt-4",
        api_key: str = None,
        system_prompt: str = None
    )

    def generate(
        self,
        task: str,
        language: str = "zh-TW",
        temperature: float = 0.3
    ) -> GeneratedScript

    def generate_from_template(
        self,
        template_name: str,
        **params
    ) -> GeneratedScript
```

### GeneratedScript

```python
class GeneratedScript:
    @property
    def code(self) -> str
        """生成的腳本程式碼"""

    def save(self, filepath: str) -> None
        """儲存腳本到檔案"""

    def execute(self, board_file: str = None) -> dict
        """執行腳本(需要 KiCAD 環境)"""

    def validate(self) -> Tuple[bool, List[str]]
        """驗證腳本"""
```

## 支援的 AI 模型

### OpenAI
- `gpt-4` (推薦)
- `gpt-4-turbo`
- `gpt-3.5-turbo`

### Anthropic
- `claude-3-opus`
- `claude-3-sonnet`
- `claude-3-haiku`

## 最佳實踐

1. **明確的任務描述**: 提供清晰、具體的需求描述
2. **先驗證後執行**: 生成腳本後先驗證再執行
3. **備份設計檔**: 執行腳本前務必備份 .kicad_pcb 檔案
4. **逐步測試**: 在測試專案上先驗證腳本功能
5. **檢查 AI 輸出**: AI 生成的程式碼需要人工審查

## 限制與注意事項

- 需要 KiCAD 6.0+ 和 Python 3.7+
- AI 生成的腳本可能需要微調
- 某些複雜任務可能需要人工介入
- 執行腳本前務必備份設計檔案

## 疑難排解

### API Key 錯誤
```bash
export OPENAI_API_KEY="sk-..."
# 或在 .env 檔案中設定
```

### KiCAD 環境問題
```bash
# 確認 pcbnew 可用
python -c "import pcbnew; print(pcbnew.Version())"
```

### 腳本執行錯誤
- 檢查 KiCAD 版本相容性
- 確認板子檔案路徑正確
- 查看錯誤訊息並調整腳本

## 貢獻

歡迎提交 Issue 和 Pull Request!

## 授權

MIT License

---

**最後更新**: 2025-11-16
