# 🤖 EDA 自動化工具

> ⚠️ **驗證階段專案** - 此專案目前處於研究與開發階段

自動化 EDA 工作流程的腳本和工具集，使用 AI 生成和優化 KiCAD、Altium、Eagle 等工具的自動化腳本。

## 📋 專案目標

提供全面的 EDA 自動化解決方案：
- AI 生成 EDA 腳本
- 批次處理 PCB 設計
- 自動化設計規則檢查 (DRC)
- 輸出文件生成自動化

## 🎯 核心功能（規劃中）

### 1. AI 腳本生成
使用 ChatGPT/Claude 生成 EDA 工具腳本：
- KiCAD Python 腳本
- Altium Scripts (Delphi/JS)
- Eagle ULP (User Language Program)

### 2. 批次處理工具
- 批次元件擺放
- 批次走線處理
- 批次 DRC 檢查
- 批次文件輸出

### 3. 自動化 DRC
- 自訂規則腳本
- 自動修復簡單違規
- 報告生成

### 4. 製造文件生成
- Gerber 檔案
- BOM (Bill of Materials)
- 組裝圖
- 測試點文件

## 🛠️ 技術棧

- **語言**: Python, Lua, JavaScript, Delphi
- **AI 整合**:
  - OpenAI API
  - Claude API
- **EDA APIs**:
  - KiCAD Python (pcbnew)
  - Altium Designer Scripting
  - Eagle ULP API
- **自動化**:
  - Python-based workflows
  - Shell scripting
  - CI/CD 整合

## 🚀 快速開始（開發中）

### 安裝

```bash
pip install -r requirements.txt

# 設定 EDA 工具路徑
export KICAD_PATH="/usr/bin/kicad"
export ALTIUM_PATH="C:/Program Files/Altium"
```

### 基本使用

#### 使用 AI 生成 KiCAD 腳本

```python
from eda_automation import ScriptGenerator

gen = ScriptGenerator(tool="kicad", model="gpt-4")

# 自然語言描述任務
task = """
將所有去耦電容放置在對應 IC 的附近,
距離不超過 5mm, 並連接到最近的電源和地層
"""

# 生成腳本
script = gen.generate(task)

# 查看生成的腳本
print(script.code)

# 儲存並執行
script.save("place_decoupling_caps.py")
script.execute()  # 需要 KiCAD 環境
```

#### 批次 DRC 檢查

```python
from eda_automation import BatchDRC

drc = BatchDRC()

# 新增要檢查的專案
projects = [
    "project1/design.kicad_pcb",
    "project2/design.kicad_pcb",
    "project3/design.kicad_pcb"
]

# 執行批次 DRC
results = drc.run(projects)

# 生成報告
drc.generate_report(results, output="drc_report.html")
```

## 📜 腳本範例

### KiCAD Python 腳本

#### 範例 1: 自動擺放元件

```python
import pcbnew

board = pcbnew.GetBoard()

# 取得所有電阻
resistors = [fp for fp in board.GetFootprints()
             if fp.GetReference().startswith('R')]

# 在網格上排列
x, y = 50, 50  # 起始位置 (mm)
spacing = 5    # 間距 (mm)

for i, r in enumerate(resistors):
    col = i % 10
    row = i // 10
    pos_x = x + col * spacing
    pos_y = y + row * spacing
    r.SetPosition(pcbnew.wxPointMM(pos_x, pos_y))
    r.SetOrientation(0)  # 水平方向

pcbnew.Refresh()
print(f"已擺放 {len(resistors)} 個電阻")
```

#### 範例 2: 批次修改走線寬度

```python
import pcbnew

board = pcbnew.GetBoard()

# 根據網路修改走線寬度
net_widths = {
    'VCC': 0.5,      # 0.5mm
    'GND': 0.5,
    '+5V': 0.4,
    'USB_D+': 0.2,   # 差分訊號
    'USB_D-': 0.2
}

for track in board.GetTracks():
    net_name = track.GetNetname()
    if net_name in net_widths:
        track.SetWidth(pcbnew.FromMM(net_widths[net_name]))

pcbnew.Refresh()
```

#### 範例 3: 自動產生製造文件

```python
import pcbnew
import os

def generate_gerbers(board_file, output_dir):
    board = pcbnew.LoadBoard(board_file)

    # 設定繪圖選項
    plot_controller = pcbnew.PLOT_CONTROLLER(board)
    plot_options = plot_controller.GetPlotOptions()

    plot_options.SetOutputDirectory(output_dir)
    plot_options.SetPlotFrameRef(False)
    plot_options.SetSketchPadLineWidth(pcbnew.FromMM(0.1))
    plot_options.SetAutoScale(False)
    plot_options.SetScale(1)
    plot_options.SetMirror(False)
    plot_options.SetUseGerberAttributes(True)

    # 繪製各層
    layers = [
        ("F.Cu", pcbnew.F_Cu, "Top Layer"),
        ("B.Cu", pcbnew.B_Cu, "Bottom Layer"),
        ("F.SilkS", pcbnew.F_SilkS, "Top Silkscreen"),
        ("B.SilkS", pcbnew.B_SilkS, "Bottom Silkscreen"),
        ("F.Mask", pcbnew.F_Mask, "Top Soldermask"),
        ("B.Mask", pcbnew.B_Mask, "Bottom Soldermask"),
        ("Edge.Cuts", pcbnew.Edge_Cuts, "Board Outline")
    ]

    for layer_name, layer_id, description in layers:
        plot_controller.SetLayer(layer_id)
        plot_controller.OpenPlotfile(layer_name, pcbnew.PLOT_FORMAT_GERBER, description)
        plot_controller.PlotLayer()

    # 生成鑽孔檔
    drill_writer = pcbnew.EXCELLON_WRITER(board)
    drill_writer.SetFormat(False)
    drill_writer.CreateDrillandMapFilesSet(output_dir, True, False)

    plot_controller.ClosePlot()
    print(f"Gerber 檔案已生成至: {output_dir}")

# 使用
generate_gerbers("my_board.kicad_pcb", "gerbers/")
```

### AI 生成腳本

#### 使用 ChatGPT API

```python
import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_kicad_script(task_description):
    """使用 GPT-4 生成 KiCAD 腳本"""

    system_prompt = """
    你是 KiCAD Python 腳本專家。根據用戶描述生成 pcbnew Python 腳本。

    規則:
    1. 使用 pcbnew 模組
    2. 包含錯誤處理
    3. 添加註解說明
    4. 使用 wxPointMM 處理座標
    5. 最後呼叫 pcbnew.Refresh()

    輸出純 Python 程式碼，不要 markdown 標記。
    """

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"任務: {task_description}"}
        ],
        temperature=0.3
    )

    return response.choices[0].message.content

# 範例使用
task = "將所有 LED 的陽極連接到標記為 'LED_VCC' 的網路"
script = generate_kicad_script(task)

with open("connect_leds.py", "w") as f:
    f.write(script)

print("腳本已生成: connect_leds.py")
```

### Altium Scripts

#### DelphiScript 範例

```delphi
Procedure AlignComponentsInGrid;
Var
    Board : IPCB_Board;
    Component : IPCB_Component;
    I : Integer;
    X, Y : TCoord;
    Spacing : TCoord;
Begin
    Board := PCBServer.GetCurrentPCBBoard;
    If Board = Nil Then Exit;

    X := MilsToCoord(1000);  // 起始位置
    Y := MilsToCoord(1000);
    Spacing := MilsToCoord(500);  // 間距

    // 選取所有元件
    Board.SelectAll;

    I := 0;
    Component := Board.GetFirstComponentSelected;
    While Component <> Nil Do
    Begin
        Component.MoveToXY(X + (I mod 10) * Spacing, Y + (I div 10) * Spacing);
        Inc(I);
        Component := Board.GetNextComponentSelected;
    End;

    Board.DeselectAll;
    PCBServer.PostProcess;
End;
```

## 📁 專案結構（規劃）

```
eda-automation/
├── README.md
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── script_generator.py   # AI 腳本生成器
│   ├── batch_processor.py    # 批次處理
│   ├── drc_automation.py     # DRC 自動化
│   ├── kicad/
│   │   ├── __init__.py
│   │   ├── component_tools.py
│   │   ├── routing_tools.py
│   │   ├── gerber_tools.py
│   │   └── templates/        # 腳本範本
│   ├── altium/
│   │   ├── delphi_scripts/
│   │   └── js_scripts/
│   └── eagle/
│       └── ulp_scripts/
├── scripts/                  # 預建腳本庫
│   ├── kicad/
│   ├── altium/
│   └── eagle/
├── examples/
│   ├── ai_script_generation.py
│   ├── batch_drc.py
│   └── gerber_generation.py
└── tests/
```

## 🔧 實用工具

### BOM 生成器

```python
def generate_bom(board_file, output_csv):
    """生成 BOM 清單"""
    import pcbnew
    import csv

    board = pcbnew.LoadBoard(board_file)
    components = {}

    for fp in board.GetFootprints():
        ref = fp.GetReference()
        value = fp.GetValue()
        footprint = str(fp.GetFPID().GetLibItemName())

        key = (value, footprint)
        if key not in components:
            components[key] = {
                'value': value,
                'footprint': footprint,
                'references': [],
                'quantity': 0
            }

        components[key]['references'].append(ref)
        components[key]['quantity'] += 1

    # 輸出 CSV
    with open(output_csv, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Item', 'Quantity', 'References', 'Value', 'Footprint'])

        for i, (key, data) in enumerate(components.items(), 1):
            refs = ', '.join(sorted(data['references']))
            writer.writerow([
                i,
                data['quantity'],
                refs,
                data['value'],
                data['footprint']
            ])

    print(f"BOM 已生成: {output_csv}")
```

### 自動化測試點添加

```python
def add_test_points(board, nets_to_test):
    """為指定網路添加測試點"""
    import pcbnew

    testpoint_footprint = "TestPoint:TestPoint_Pad_D1.0mm"

    for net_name in nets_to_test:
        net = board.FindNet(net_name)
        if not net:
            continue

        # 找到該網路的走線
        tracks = [t for t in board.GetTracks()
                  if t.GetNetname() == net_name]

        if not tracks:
            continue

        # 在第一條走線上添加測試點
        track = tracks[0]
        pos = track.GetStart()

        # 建立測試點
        tp = pcbnew.FOOTPRINT(board)
        tp.SetFPID(pcbnew.LIB_ID(testpoint_footprint))
        tp.SetReference(f"TP_{net_name}")
        tp.SetValue(net_name)
        tp.SetPosition(pos)

        board.Add(tp)

        print(f"已添加測試點: TP_{net_name}")

    pcbnew.Refresh()
```

## 🧪 開發路線圖

### Phase 1: 基礎工具
- [ ] KiCAD 腳本庫
- [ ] BOM 生成器
- [ ] Gerber 生成工具
- [ ] 基本批次處理

### Phase 2: AI 整合
- [ ] GPT-4 腳本生成
- [ ] Claude 腳本生成
- [ ] 腳本驗證與測試
- [ ] 錯誤修正建議

### Phase 3: 進階自動化
- [ ] DRC 自動修復
- [ ] 智能走線建議
- [ ] 參數優化
- [ ] 多 EDA 工具支援

### Phase 4: CI/CD 整合
- [ ] Git hooks
- [ ] 自動化測試
- [ ] 製造文件自動生成
- [ ] 版本控制整合

## 📚 腳本庫

### 預建腳本

#### 1. component_alignment.py
```python
"""將選定的元件對齊到網格"""
```

#### 2. net_colorizer.py
```python
"""根據網路類型為走線著色"""
```

#### 3. silkscreen_optimizer.py
```python
"""自動優化絲印位置,避免遮擋焊盤"""
```

#### 4. via_optimizer.py
```python
"""優化過孔大小和位置"""
```

#### 5. differential_pair_router.py
```python
"""差分對自動等長走線"""
```

## 💡 使用技巧

### 1. 使用範本加速開發

```python
from eda_automation import TemplateManager

tm = TemplateManager()

# 列出可用範本
templates = tm.list_templates()

# 使用範本
script = tm.use_template(
    "component_grid_layout",
    parameters={
        'spacing': 5,  # mm
        'columns': 10
    }
)
```

### 2. 批次處理多個專案

```bash
# Shell 腳本
for project in projects/*.kicad_pcb; do
    python3 run_drc.py "$project"
    python3 generate_gerbers.py "$project"
done
```

### 3. CI/CD 整合

```yaml
# .github/workflows/pcb-check.yml
name: PCB Design Check

on: [push, pull_request]

jobs:
  drc-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install KiCAD
        run: |
          sudo add-apt-repository --yes ppa:kicad/kicad-6.0-releases
          sudo apt update
          sudo apt install -y kicad
      - name: Run DRC
        run: python3 scripts/automated_drc.py *.kicad_pcb
      - name: Upload Report
        uses: actions/upload-artifact@v2
        with:
          name: drc-report
          path: drc_report.html
```

## ⚠️ 注意事項

1. **備份**: 執行腳本前務必備份設計檔案
2. **測試**: 在測試專案上先驗證腳本
3. **版本**: 確認 EDA 工具版本相容性
4. **權限**: 某些操作需要管理員權限
5. **AI 輸出**: AI 生成的腳本需人工審查

## 📖 參考資源

- [KiCAD Python Scripting Guide](https://docs.kicad.org/doxygen-python/)
- [Altium Scripting Reference](https://www.altium.com/documentation/altium-designer/scripting)
- [Eagle ULP Manual](https://www.autodesk.com/products/eagle/blog/introduction-user-language-programs-ulps/)

## 📄 授權

MIT License

---

**最後更新**: 2025-11-15
**狀態**: 🚧 開發中
