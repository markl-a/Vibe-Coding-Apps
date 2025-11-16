# Batch DRC Checker

> 批次 PCB 設計規則檢查 (Design Rule Check) 自動化工具

自動批次執行 DRC 檢查,生成詳細報告,支援多專案並行檢查和 CI/CD 整合。

## 功能特點

- **批次處理**: 一次檢查多個 PCB 專案
- **自動化 DRC**: 自動執行設計規則檢查
- **詳細報告**: HTML/PDF/JSON 格式報告
- **規則自訂**: 支援自訂 DRC 規則
- **並行處理**: 多專案並行檢查提升效率
- **CI/CD 整合**: 可整合至 GitHub Actions/GitLab CI
- **錯誤分類**: 自動分類和優先級排序
- **趨勢分析**: 追蹤 DRC 錯誤趨勢

## 支援的檢查項目

### 基本檢查
- ✅ 走線間距 (Clearance)
- ✅ 走線寬度 (Track Width)
- ✅ 過孔大小 (Via Size)
- ✅ 焊盤間距 (Pad Clearance)
- ✅ 板邊距離 (Board Edge Clearance)

### 進階檢查
- ✅ 差分對匹配 (Differential Pairs)
- ✅ 走線長度匹配 (Length Matching)
- ✅ 阻抗控制 (Impedance Control)
- ✅ 熱焊盤檢查 (Thermal Relief)
- ✅ 絲印覆蓋檢查 (Silkscreen)

### 製造檢查
- ✅ 最小鑽孔直徑
- ✅ 環形圈 (Annular Ring)
- ✅ 銅箔到板邊距離
- ✅ 最小線寬/間距

## 快速開始

### 安裝

```bash
cd batch-drc-checker
pip install -r requirements.txt
```

### 基本使用

```python
from src.drc_checker import BatchDRCChecker

# 初始化檢查器
checker = BatchDRCChecker()

# 新增要檢查的專案
checker.add_project("project1/board.kicad_pcb")
checker.add_project("project2/board.kicad_pcb")

# 執行批次檢查
results = checker.run()

# 生成報告
checker.generate_report(
    results,
    output="drc_report.html",
    format="html"
)
```

### 命令列使用

```bash
# 檢查單一專案
python -m src.cli check -i board.kicad_pcb -o report.html

# 批次檢查
python -m src.cli batch -i "projects/**/*.kicad_pcb" -o reports/

# 使用自訂規則
python -m src.cli check -i board.kicad_pcb --rules config/strict_rules.yaml

# 並行檢查
python -m src.cli batch -i "projects/*.kicad_pcb" --parallel --workers 4
```

## 使用範例

### 範例 1: 單一專案檢查

```python
from src.drc_checker import DRCChecker

checker = DRCChecker()

# 載入 PCB
checker.load_board("myboard.kicad_pcb")

# 執行 DRC
result = checker.run_drc()

# 顯示結果
print(f"DRC 狀態: {'✅ 通過' if result.passed else '❌ 失敗'}")
print(f"錯誤數: {result.error_count}")
print(f"警告數: {result.warning_count}")

# 列出錯誤
for error in result.errors:
    print(f"  ❌ {error.type}: {error.message}")
    print(f"     位置: ({error.x}, {error.y})")
```

### 範例 2: 批次檢查多個專案

```python
from src.drc_checker import BatchDRCChecker
import glob

checker = BatchDRCChecker()

# 找出所有 PCB 檔案
pcb_files = glob.glob("projects/**/*.kicad_pcb", recursive=True)

# 批次檢查
results = checker.run_batch(
    files=pcb_files,
    parallel=True,
    workers=4
)

# 生成匯總報告
summary = checker.generate_summary(results)

print(f"檢查了 {summary.total_projects} 個專案")
print(f"通過: {summary.passed_count}")
print(f"失敗: {summary.failed_count}")
print(f"總錯誤: {summary.total_errors}")
```

### 範例 3: 自訂 DRC 規則

```python
from src.drc_checker import DRCChecker
from src.rules import DRCRules

# 建立自訂規則
rules = DRCRules()
rules.set_clearance(0.2)  # 0.2mm 間距
rules.set_track_width(min=0.15, max=5.0)  # 走線寬度
rules.set_via_diameter(min=0.4, max=2.0)  # 過孔直徑
rules.set_drill_diameter(min=0.3)  # 最小鑽孔

# 使用自訂規則
checker = DRCChecker(rules=rules)
checker.load_board("board.kicad_pcb")
result = checker.run_drc()
```

### 範例 4: 生成詳細報告

```python
from src.drc_checker import BatchDRCChecker

checker = BatchDRCChecker()
results = checker.run_batch(["board1.kicad_pcb", "board2.kicad_pcb"])

# HTML 報告
checker.generate_report(
    results,
    output="drc_report.html",
    format="html",
    include_images=True
)

# PDF 報告
checker.generate_report(
    results,
    output="drc_report.pdf",
    format="pdf"
)

# JSON 報告 (供程式處理)
checker.generate_report(
    results,
    output="drc_report.json",
    format="json"
)
```

### 範例 5: CI/CD 整合

```python
from src.drc_checker import DRCChecker
import sys

checker = DRCChecker()
checker.load_board("board.kicad_pcb")
result = checker.run_drc()

# 生成報告
checker.generate_report(result, "drc_report.html")

# 根據結果設定退出碼
if not result.passed:
    print(f"❌ DRC 檢查失敗: {result.error_count} 個錯誤")
    sys.exit(1)
else:
    print("✅ DRC 檢查通過")
    sys.exit(0)
```

## DRC 規則配置

### YAML 配置檔範例 (config/rules.yaml)

```yaml
# DRC 規則配置

clearance:
  track_to_track: 0.2      # mm
  track_to_pad: 0.2
  pad_to_pad: 0.2
  track_to_copper: 0.2
  hole_to_hole: 0.5

track:
  width:
    min: 0.15              # mm
    max: 5.0
  length:
    max: 500               # mm (警告)

via:
  diameter:
    min: 0.4               # mm
    max: 2.0
  drill:
    min: 0.3
    max: 1.5
  annular_ring:
    min: 0.15              # mm

pad:
  to_edge:
    min: 0.5               # mm
  size:
    min: 0.4

board:
  edge_clearance: 0.3      # mm
  min_copper_area: 0.1     # mm²

drill:
  min_diameter: 0.3        # mm
  max_diameter: 6.35

silkscreen:
  to_pad_clearance: 0.15   # mm
  min_width: 0.15

manufacturing:
  jlcpcb:
    min_track_width: 0.09
    min_spacing: 0.09
    min_hole: 0.2
  pcbway:
    min_track_width: 0.1
    min_spacing: 0.1
    min_hole: 0.2
```

### 載入自訂規則

```python
from src.rules import load_rules

# 從 YAML 載入
rules = load_rules("config/custom_rules.yaml")

checker = DRCChecker(rules=rules)
```

## 報告格式

### HTML 報告

互動式 HTML 報告,包含:
- 專案概覽
- 錯誤統計圖表
- 詳細錯誤清單 (可排序、篩選)
- 錯誤位置圖示
- 建議修復方案

### PDF 報告

專業 PDF 報告,適合存檔和打印:
- 封面頁
- 執行摘要
- 詳細錯誤清單
- 統計圖表

### JSON 報告

機器可讀格式,供程式處理:

```json
{
  "project": "myboard.kicad_pcb",
  "timestamp": "2025-11-16T10:30:00",
  "summary": {
    "passed": false,
    "error_count": 5,
    "warning_count": 12
  },
  "errors": [
    {
      "type": "clearance",
      "severity": "error",
      "message": "Track to track clearance violation",
      "location": {"x": 125.5, "y": 87.3},
      "layer": "F.Cu",
      "required": 0.2,
      "actual": 0.15
    }
  ],
  "warnings": [...]
}
```

## 錯誤類型

| 類型 | 嚴重性 | 說明 |
|------|--------|------|
| Clearance | Error | 間距違規 |
| Track Width | Error | 走線寬度違規 |
| Via Size | Error | 過孔尺寸違規 |
| Drill Size | Error | 鑽孔尺寸違規 |
| Annular Ring | Error | 環形圈不足 |
| Board Edge | Error | 到板邊距離不足 |
| Silkscreen | Warning | 絲印問題 |
| Unconnected | Warning | 未連接網路 |
| Length Mismatch | Warning | 長度不匹配 |

## API 參考

### DRCChecker

```python
class DRCChecker:
    def __init__(
        self,
        rules: DRCRules = None
    )

    def load_board(
        self,
        pcb_file: str
    ) -> None

    def run_drc(self) -> DRCResult

    def generate_report(
        self,
        result: DRCResult,
        output: str,
        format: str = "html"
    ) -> None
```

### BatchDRCChecker

```python
class BatchDRCChecker:
    def run_batch(
        self,
        files: List[str],
        parallel: bool = False,
        workers: int = 4
    ) -> List[DRCResult]

    def generate_summary(
        self,
        results: List[DRCResult]
    ) -> DRCSummary

    def generate_report(
        self,
        results: List[DRCResult],
        output: str,
        format: str = "html"
    ) -> None
```

### DRCResult

```python
class DRCResult:
    @property
    def passed(self) -> bool

    @property
    def error_count(self) -> int

    @property
    def warning_count(self) -> int

    @property
    def errors(self) -> List[DRCError]

    @property
    def warnings(self) -> List[DRCWarning]
```

## CI/CD 整合

### GitHub Actions

```yaml
# .github/workflows/drc-check.yml
name: DRC Check

on: [push, pull_request]

jobs:
  drc:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install KiCAD
        run: |
          sudo add-apt-repository --yes ppa:kicad/kicad-6.0-releases
          sudo apt update
          sudo apt install -y kicad

      - name: Install dependencies
        run: |
          pip install -r batch-drc-checker/requirements.txt

      - name: Run DRC
        run: |
          python -m src.cli check -i board.kicad_pcb -o drc_report.html

      - name: Upload Report
        uses: actions/upload-artifact@v2
        with:
          name: drc-report
          path: drc_report.html
```

### GitLab CI

```yaml
# .gitlab-ci.yml
drc-check:
  image: kicad/kicad:latest
  script:
    - pip install -r batch-drc-checker/requirements.txt
    - python -m src.cli check -i board.kicad_pcb -o drc_report.html
  artifacts:
    paths:
      - drc_report.html
    expire_in: 1 week
```

## 專案結構

```
batch-drc-checker/
├── README.md
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── drc_checker.py    # 主要檢查器
│   ├── batch_checker.py  # 批次檢查器
│   ├── rules.py          # DRC 規則
│   ├── reporter.py       # 報告生成器
│   ├── cli.py            # 命令列介面
│   └── utils.py          # 工具函數
├── config/
│   ├── default_rules.yaml
│   ├── jlcpcb_rules.yaml
│   └── strict_rules.yaml
├── examples/
│   ├── single_check.py
│   ├── batch_check.py
│   └── ci_integration.py
├── reports/
│   └── templates/
│       ├── report.html.j2
│       └── summary.html.j2
└── tests/
    ├── test_checker.py
    └── test_rules.py
```

## 最佳實踐

1. **定期檢查**: 每次提交前執行 DRC
2. **CI/CD 整合**: 在 CI 流程中自動檢查
3. **規則版本控制**: 將 DRC 規則納入版本控制
4. **修復優先級**: 先修復錯誤,再處理警告
5. **文檔化**: 記錄接受的警告和例外

## 疑難排解

### KiCAD 版本問題

```bash
# 檢查 KiCAD 版本
kicad-cli version
python -c "import pcbnew; print(pcbnew.Version())"
```

### 並行處理失敗

```python
# 減少工作程序數
checker.run_batch(files, parallel=True, workers=2)
```

### 記憶體問題

```python
# 分批處理
for batch in chunks(pcb_files, 10):
    results = checker.run_batch(batch)
    process_results(results)
```

## 授權

MIT License

---

**最後更新**: 2025-11-16
