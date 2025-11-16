# BOM Manager

> 智能 PCB 物料清單 (Bill of Materials) 管理工具

自動從 PCB 設計中提取、管理、優化和輸出 BOM,支援成本估算、庫存檢查和採購清單生成。

## 功能特點

- **自動提取**: 從 KiCAD/Altium/Eagle 自動提取 BOM
- **智能合併**: 自動合併相同元件,減少採購項目
- **成本估算**: 整合常見供應商 API 查詢價格
- **庫存管理**: 追蹤現有庫存,計算需採購數量
- **多格式輸出**: CSV、Excel、PDF、HTML 等
- **供應商整合**: LCSC、Digi-Key、Mouser、Arrow 等
- **替代料建議**: 自動推薦替代元件

## 支援的功能

### BOM 提取
- ✅ 從 PCB 設計檔提取元件清單
- ✅ 自動分組相同元件
- ✅ 提取元件參數 (值、封裝、MPN)
- ✅ 批次處理多個專案

### BOM 優化
- ✅ 合併重複元件
- ✅ 標準化元件命名
- ✅ 檢查缺失的元件參數
- ✅ 建議替代料

### 成本分析
- ✅ 查詢供應商價格
- ✅ 計算不同數量的成本
- ✅ 比較多個供應商
- ✅ 生成成本報告

### 採購管理
- ✅ 生成採購清單
- ✅ 庫存檢查與扣除
- ✅ 需求量計算
- ✅ 供應商分類

## 快速開始

### 安裝

```bash
cd bom-manager
pip install -r requirements.txt
```

### 基本使用

```python
from src.bom_manager import BOMManager

# 初始化 BOM 管理器
bom = BOMManager()

# 從 KiCAD 提取 BOM
bom.extract_from_kicad("myboard.kicad_pcb")

# 優化 BOM (合併、標準化)
bom.optimize()

# 輸出為 CSV
bom.export_csv("bom_output.csv")

# 輸出為 Excel (含成本)
bom.export_excel("bom_with_cost.xlsx", include_cost=True)
```

### 命令列使用

```bash
# 提取 BOM
python -m src.cli extract -i board.kicad_pcb -o bom.csv

# 提取並查詢價格
python -m src.cli extract -i board.kicad_pcb -o bom.xlsx --pricing

# 批次處理
python -m src.cli batch -i "projects/*.kicad_pcb" -o boms/

# 成本分析
python -m src.cli cost-analysis -i bom.csv --quantities 1,10,100
```

## 使用範例

### 範例 1: 基本 BOM 提取

```python
from src.bom_manager import BOMManager

bom = BOMManager()

# 提取 BOM
bom.extract_from_kicad("board.kicad_pcb")

# 顯示統計
print(f"總元件數: {bom.total_components}")
print(f"唯一元件: {bom.unique_components}")
print(f"元件種類: {bom.component_types}")

# 輸出
bom.export_csv("bom.csv")
```

### 範例 2: 帶成本估算的 BOM

```python
from src.bom_manager import BOMManager
from src.pricing import PricingEngine

bom = BOMManager()
bom.extract_from_kicad("board.kicad_pcb")

# 設定定價引擎
pricing = PricingEngine(api_keys={
    'lcsc': 'your-lcsc-api-key',
    'digikey': 'your-digikey-key'
})

# 查詢價格
bom.fetch_pricing(pricing, quantities=[1, 10, 100, 1000])

# 輸出含價格的 Excel
bom.export_excel(
    "bom_with_pricing.xlsx",
    include_pricing=True,
    include_stock=True
)

# 生成成本報告
cost_report = bom.generate_cost_report()
print(f"單板成本 (數量 1): ${cost_report['unit_cost'][1]:.2f}")
print(f"單板成本 (數量 100): ${cost_report['unit_cost'][100]:.2f}")
```

### 範例 3: 庫存管理

```python
from src.bom_manager import BOMManager
from src.inventory import InventoryManager

bom = BOMManager()
bom.extract_from_kicad("board.kicad_pcb")

# 載入庫存
inventory = InventoryManager()
inventory.load("inventory.csv")

# 檢查庫存
availability = bom.check_inventory(inventory)

# 生成採購清單 (只包含庫存不足的元件)
purchase_list = bom.generate_purchase_list(
    inventory=inventory,
    build_quantity=10  # 要生產 10 片板子
)

# 輸出採購清單
purchase_list.export("purchase_order.csv")

print(f"需要採購 {len(purchase_list)} 種元件")
print(f"預估成本: ${purchase_list.total_cost:.2f}")
```

### 範例 4: BOM 比較

```python
from src.bom_manager import BOMManager
from src.compare import BOMCompare

# 載入兩個版本的 BOM
bom_v1 = BOMManager()
bom_v1.extract_from_kicad("board_v1.kicad_pcb")

bom_v2 = BOMManager()
bom_v2.extract_from_kicad("board_v2.kicad_pcb")

# 比較
compare = BOMCompare()
diff = compare.compare(bom_v1, bom_v2)

# 顯示差異
print("新增的元件:")
for item in diff.added:
    print(f"  + {item}")

print("\n移除的元件:")
for item in diff.removed:
    print(f"  - {item}")

print("\n修改的元件:")
for item in diff.modified:
    print(f"  ~ {item}")

# 輸出差異報告
diff.export_report("bom_diff.html")
```

### 範例 5: 批次處理多個專案

```python
from src.bom_manager import BatchBOMProcessor
import glob

processor = BatchBOMProcessor()

# 找出所有專案
projects = glob.glob("projects/**/*.kicad_pcb", recursive=True)

# 批次處理
results = processor.process(
    files=projects,
    output_dir="boms/",
    export_format="excel",
    include_pricing=True
)

# 生成匯總報告
summary = processor.generate_summary(results)
summary.export("bom_summary.xlsx")

print(f"處理了 {len(results)} 個專案")
print(f"總元件種類: {summary.total_unique_parts}")
print(f"總成本: ${summary.total_cost:.2f}")
```

## BOM 輸出格式

### CSV 格式

```csv
Item,Quantity,References,Value,Footprint,MPN,Manufacturer,Supplier,SKU,Unit Price,Total Price
1,10,"C1,C2,C3,C4,C5,C6,C7,C8,C9,C10",100nF,C_0603,CL10B104KB8NNNC,Samsung,LCSC,C1591,$0.005,$0.05
2,2,"U1,U2",ATmega328P,TQFP-32,ATMEGA328P-AU,Microchip,LCSC,C14877,$2.15,$4.30
3,5,"R1,R2,R3,R4,R5",10K,R_0603,RC0603FR-0710KL,Yageo,LCSC,C25804,$0.001,$0.005
```

### Excel 格式

包含多個工作表:
- **BOM**: 主要物料清單
- **Pricing**: 價格階梯
- **Summary**: 成本匯總
- **By Manufacturer**: 按製造商分組
- **By Supplier**: 按供應商分組

### HTML 格式

互動式網頁報告,包含:
- 可排序、可篩選的表格
- 成本圖表
- 元件分類統計
- 庫存狀態視覺化

### PDF 格式

專業的 PDF 報告,適合打印和存檔。

## 供應商整合

### 支援的供應商

| 供應商 | 代碼 | API 支援 | 說明 |
|--------|------|----------|------|
| LCSC | `lcsc` | ✅ | 立創商城 (嘉立創) |
| Digi-Key | `digikey` | ✅ | Digi-Key Electronics |
| Mouser | `mouser` | ✅ | Mouser Electronics |
| Arrow | `arrow` | ✅ | Arrow Electronics |
| Newark | `newark` | ❌ | Newark (需要手動) |
| TME | `tme` | ⚠️ | 部分支援 |

### 配置供應商 API

```python
from src.pricing import PricingEngine

pricing = PricingEngine(api_keys={
    'lcsc': 'your-lcsc-api-key',
    'digikey': {
        'client_id': 'your-client-id',
        'client_secret': 'your-client-secret'
    },
    'mouser': 'your-mouser-api-key'
})

# 設定偏好供應商
pricing.set_preferred_suppliers(['lcsc', 'digikey'])

# 查詢價格
pricing.fetch_prices(mpn='ATMEGA328P-AU', quantity=100)
```

## API 參考

### BOMManager

```python
class BOMManager:
    def extract_from_kicad(
        self,
        pcb_file: str
    ) -> None

    def extract_from_csv(
        self,
        csv_file: str
    ) -> None

    def optimize(
        self,
        merge_duplicates: bool = True,
        standardize_names: bool = True
    ) -> None

    def fetch_pricing(
        self,
        pricing_engine: PricingEngine,
        quantities: List[int] = [1, 10, 100]
    ) -> None

    def export_csv(
        self,
        output_file: str,
        include_pricing: bool = False
    ) -> None

    def export_excel(
        self,
        output_file: str,
        include_pricing: bool = False,
        include_stock: bool = False
    ) -> None

    def export_html(
        self,
        output_file: str,
        template: str = None
    ) -> None

    @property
    def total_components(self) -> int

    @property
    def unique_components(self) -> int

    @property
    def estimated_cost(self) -> float
```

### PricingEngine

```python
class PricingEngine:
    def __init__(
        self,
        api_keys: Dict[str, str]
    )

    def fetch_price(
        self,
        mpn: str,
        quantity: int,
        supplier: str = None
    ) -> Optional[PriceInfo]

    def fetch_prices_batch(
        self,
        mpns: List[str],
        quantities: List[int]
    ) -> Dict[str, List[PriceInfo]]

    def compare_suppliers(
        self,
        mpn: str,
        quantity: int
    ) -> List[SupplierComparison]
```

## 專案結構

```
bom-manager/
├── README.md
├── requirements.txt
├── .env.example
├── src/
│   ├── __init__.py
│   ├── bom_manager.py      # 主要 BOM 管理器
│   ├── extractor.py        # BOM 提取器
│   ├── optimizer.py        # BOM 優化器
│   ├── pricing.py          # 價格查詢引擎
│   ├── inventory.py        # 庫存管理
│   ├── compare.py          # BOM 比較
│   ├── export.py           # 輸出處理器
│   └── cli.py              # 命令列介面
├── templates/
│   ├── bom_html.jinja2     # HTML 範本
│   ├── bom_pdf.jinja2      # PDF 範本
│   └── cost_report.jinja2  # 成本報告範本
├── examples/
│   ├── basic_extraction.py
│   ├── pricing_example.py
│   ├── inventory_example.py
│   └── batch_processing.py
└── tests/
    ├── test_extractor.py
    ├── test_optimizer.py
    └── test_pricing.py
```

## BOM 數據結構

```python
{
    "items": [
        {
            "item": 1,
            "quantity": 10,
            "references": ["C1", "C2", "C3", ...],
            "value": "100nF",
            "footprint": "C_0603",
            "mpn": "CL10B104KB8NNNC",
            "manufacturer": "Samsung",
            "description": "Multilayer Ceramic Capacitor",
            "supplier": "LCSC",
            "sku": "C1591",
            "pricing": {
                "1": 0.005,
                "10": 0.004,
                "100": 0.003
            },
            "stock": 15000,
            "datasheet": "https://..."
        }
    ],
    "summary": {
        "total_components": 150,
        "unique_parts": 25,
        "cost": {
            "1": 15.50,
            "10": 145.00,
            "100": 1380.00
        }
    }
}
```

## 最佳實踐

1. **完整的元件資訊**: 確保每個元件都有 MPN 和製造商
2. **定期更新價格**: 供應商價格會變動,定期更新
3. **庫存管理**: 維護準確的庫存記錄
4. **版本控制**: 保存每個版本的 BOM
5. **供應商多樣化**: 不要依賴單一供應商

## 疑難排解

### API 限制

```python
# 使用緩存減少 API 呼叫
pricing = PricingEngine(
    api_keys={...},
    cache_enabled=True,
    cache_ttl=3600  # 1 小時
)
```

### 元件未找到

```python
# 啟用模糊搜尋
bom.fetch_pricing(
    pricing_engine,
    fuzzy_search=True,
    similarity_threshold=0.8
)
```

## 授權

MIT License

---

**最後更新**: 2025-11-16
