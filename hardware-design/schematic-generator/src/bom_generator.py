"""
BOM (Bill of Materials) 生成器
自動生成物料清單和成本估算
"""

import json
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import csv


@dataclass
class Component:
    """電子元件"""
    reference: str  # 參考編號 (如 R1, C1, U1)
    type: str  # 元件類型 (resistor, capacitor, ic, etc.)
    value: str  # 值 (如 10kΩ, 100nF)
    part_number: Optional[str] = None  # 料號
    manufacturer: Optional[str] = None  # 製造商
    description: str = ""  # 描述
    quantity: int = 1  # 數量
    unit_price: float = 0.0  # 單價 (USD)
    supplier: Optional[str] = None  # 供應商
    supplier_pn: Optional[str] = None  # 供應商料號
    footprint: Optional[str] = None  # 封裝
    datasheet: Optional[str] = None  # 數據手冊連結
    notes: str = ""  # 備註


@dataclass
class BOM:
    """物料清單"""
    project_name: str
    revision: str = "A"
    date: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    components: List[Component] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)

    def add_component(self, component: Component):
        """添加元件"""
        # 檢查是否已存在相同元件，如果是則增加數量
        for existing in self.components:
            if (existing.type == component.type and
                existing.value == component.value and
                existing.part_number == component.part_number):
                existing.quantity += component.quantity
                return

        self.components.append(component)

    def get_total_cost(self) -> float:
        """計算總成本"""
        return sum(c.unit_price * c.quantity for c in self.components)

    def get_component_count(self) -> int:
        """獲取元件總數"""
        return sum(c.quantity for c in self.components)

    def get_unique_parts(self) -> int:
        """獲取不同元件種類數"""
        return len(self.components)

    def group_by_type(self) -> Dict[str, List[Component]]:
        """按類型分組"""
        groups = {}
        for component in self.components:
            if component.type not in groups:
                groups[component.type] = []
            groups[component.type].append(component)
        return groups

    def export_csv(self, filename: str):
        """匯出為 CSV"""
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)

            # 標題
            writer.writerow([
                'Reference', 'Type', 'Value', 'Part Number',
                'Manufacturer', 'Description', 'Quantity',
                'Unit Price', 'Total Price', 'Supplier', 'Footprint'
            ])

            # 數據
            for c in self.components:
                writer.writerow([
                    c.reference, c.type, c.value, c.part_number or '',
                    c.manufacturer or '', c.description, c.quantity,
                    f'${c.unit_price:.2f}', f'${c.unit_price * c.quantity:.2f}',
                    c.supplier or '', c.footprint or ''
                ])

            # 總計
            writer.writerow([])
            writer.writerow(['', '', '', '', '', 'Total', self.get_component_count(),
                           '', f'${self.get_total_cost():.2f}', '', ''])

        print(f"✓ BOM 已匯出到 {filename}")

    def export_json(self, filename: str):
        """匯出為 JSON"""
        data = {
            'project_name': self.project_name,
            'revision': self.revision,
            'date': self.date,
            'summary': {
                'total_components': self.get_component_count(),
                'unique_parts': self.get_unique_parts(),
                'total_cost': self.get_total_cost()
            },
            'components': [
                {
                    'reference': c.reference,
                    'type': c.type,
                    'value': c.value,
                    'part_number': c.part_number,
                    'manufacturer': c.manufacturer,
                    'description': c.description,
                    'quantity': c.quantity,
                    'unit_price': c.unit_price,
                    'total_price': c.unit_price * c.quantity,
                    'supplier': c.supplier,
                    'footprint': c.footprint,
                    'datasheet': c.datasheet,
                    'notes': c.notes
                }
                for c in self.components
            ],
            'metadata': self.metadata
        }

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"✓ BOM 已匯出到 {filename}")

    def export_html(self, filename: str):
        """匯出為 HTML"""
        html = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOM - {self.project_name}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }}
        .header-info {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }}
        .info-item {{
            display: flex;
            flex-direction: column;
        }}
        .info-label {{
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }}
        .info-value {{
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }}
        th {{
            background-color: #4CAF50;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }}
        td {{
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }}
        tr:hover {{
            background-color: #f5f5f5;
        }}
        .summary {{
            margin-top: 30px;
            padding: 20px;
            background-color: #e8f5e9;
            border-radius: 5px;
            border-left: 4px solid #4CAF50;
        }}
        .summary-grid {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 15px;
        }}
        .summary-item {{
            text-align: center;
        }}
        .summary-label {{
            font-size: 14px;
            color: #666;
        }}
        .summary-value {{
            font-size: 24px;
            font-weight: bold;
            color: #2e7d32;
        }}
        .price {{
            color: #2e7d32;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 物料清單 (BOM)</h1>

        <div class="header-info">
            <div class="info-item">
                <span class="info-label">專案名稱</span>
                <span class="info-value">{self.project_name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">版本</span>
                <span class="info-value">{self.revision}</span>
            </div>
            <div class="info-item">
                <span class="info-label">日期</span>
                <span class="info-value">{self.date}</span>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>參考編號</th>
                    <th>類型</th>
                    <th>值</th>
                    <th>料號</th>
                    <th>製造商</th>
                    <th>數量</th>
                    <th>單價</th>
                    <th>小計</th>
                </tr>
            </thead>
            <tbody>
"""

        for c in self.components:
            html += f"""
                <tr>
                    <td>{c.reference}</td>
                    <td>{c.type}</td>
                    <td>{c.value}</td>
                    <td>{c.part_number or '-'}</td>
                    <td>{c.manufacturer or '-'}</td>
                    <td>{c.quantity}</td>
                    <td class="price">${c.unit_price:.2f}</td>
                    <td class="price">${c.unit_price * c.quantity:.2f}</td>
                </tr>
"""

        html += f"""
            </tbody>
        </table>

        <div class="summary">
            <h2>📊 總覽</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">元件總數</div>
                    <div class="summary-value">{self.get_component_count()}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">不同元件</div>
                    <div class="summary-value">{self.get_unique_parts()}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">總成本</div>
                    <div class="summary-value">${self.get_total_cost():.2f}</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
"""

        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html)

        print(f"✓ BOM 已匯出到 {filename}")

    def print_summary(self):
        """列印摘要"""
        print(f"\n{'='*60}")
        print(f"📋 BOM 摘要 - {self.project_name}")
        print(f"{'='*60}")
        print(f"版本: {self.revision}")
        print(f"日期: {self.date}")
        print(f"元件總數: {self.get_component_count()}")
        print(f"不同元件: {self.get_unique_parts()}")
        print(f"總成本: ${self.get_total_cost():.2f}")
        print(f"{'='*60}\n")

        # 按類型分組顯示
        groups = self.group_by_type()
        for comp_type, components in sorted(groups.items()):
            count = sum(c.quantity for c in components)
            print(f"{comp_type.upper()}: {count} 個")
            for c in components:
                print(f"  {c.reference}: {c.value} x{c.quantity}")
        print()


class ComponentPriceDatabase:
    """元件價格資料庫（模擬）"""

    # 模擬價格資料
    PRICES = {
        'resistor': {
            'default': 0.01,  # $0.01 per resistor
            'precision': 0.05  # Precision resistors
        },
        'capacitor': {
            'ceramic': 0.02,
            'electrolytic': 0.10,
            'tantalum': 0.30
        },
        'ic': {
            'opamp': {
                'LM358': 0.25,
                'TL072': 0.35,
                'OPA2134': 2.50
            },
            'regulator': {
                'LM7805': 0.50,
                'AMS1117': 0.15
            }
        },
        'diode': 0.05,
        'led': 0.10,
        'transistor': 0.20,
        'inductor': 0.30
    }

    @staticmethod
    def get_price(component_type: str, part_number: Optional[str] = None) -> float:
        """
        獲取元件價格

        Args:
            component_type: 元件類型
            part_number: 料號

        Returns:
            價格 (USD)
        """
        # 簡化的價格查詢
        if component_type in ComponentPriceDatabase.PRICES:
            price_data = ComponentPriceDatabase.PRICES[component_type]

            if isinstance(price_data, dict):
                # 如果有料號，嘗試精確匹配
                if part_number:
                    for key, value in price_data.items():
                        if isinstance(value, dict) and part_number in value:
                            return value[part_number]
                        elif key == part_number and isinstance(value, (int, float)):
                            return value
                    # 如果在子字典中
                    for key, value in price_data.items():
                        if isinstance(value, dict) and part_number in value:
                            return value[part_number]

                # 返回第一個數值
                for value in price_data.values():
                    if isinstance(value, (int, float)):
                        return value
                    elif isinstance(value, dict):
                        for v in value.values():
                            if isinstance(v, (int, float)):
                                return v

                return 0.10

            return price_data

        return 0.10  # 默認價格


class BOMBuilder:
    """BOM 建構器 - 從電路參數生成 BOM"""

    def __init__(self, project_name: str):
        """
        初始化 BOM 建構器

        Args:
            project_name: 專案名稱
        """
        self.bom = BOM(project_name=project_name)
        self.ref_counters = {}  # 參考編號計數器

    def add_resistor(self, value: str, quantity: int = 1, **kwargs) -> Component:
        """添加電阻"""
        ref = self._get_next_ref('R')
        price = ComponentPriceDatabase.get_price('resistor')

        component = Component(
            reference=ref,
            type='resistor',
            value=value,
            quantity=quantity,
            unit_price=price,
            **kwargs
        )
        self.bom.add_component(component)
        return component

    def add_capacitor(self, value: str, cap_type: str = 'ceramic',
                     quantity: int = 1, **kwargs) -> Component:
        """添加電容"""
        ref = self._get_next_ref('C')
        price = ComponentPriceDatabase.get_price('capacitor')

        component = Component(
            reference=ref,
            type='capacitor',
            value=value,
            quantity=quantity,
            unit_price=price,
            **kwargs
        )
        self.bom.add_component(component)
        return component

    def add_ic(self, part_number: str, description: str = '',
              quantity: int = 1, **kwargs) -> Component:
        """添加 IC"""
        ref = self._get_next_ref('U')
        price = ComponentPriceDatabase.get_price('ic', part_number)

        component = Component(
            reference=ref,
            type='ic',
            value=part_number,
            part_number=part_number,
            description=description,
            quantity=quantity,
            unit_price=price,
            **kwargs
        )
        self.bom.add_component(component)
        return component

    def add_diode(self, part_number: str, quantity: int = 1, **kwargs) -> Component:
        """添加二極體"""
        ref = self._get_next_ref('D')
        price = ComponentPriceDatabase.get_price('diode')

        component = Component(
            reference=ref,
            type='diode',
            value=part_number,
            part_number=part_number,
            quantity=quantity,
            unit_price=price,
            **kwargs
        )
        self.bom.add_component(component)
        return component

    def add_inductor(self, value: str, quantity: int = 1, **kwargs) -> Component:
        """添加電感"""
        ref = self._get_next_ref('L')
        price = ComponentPriceDatabase.get_price('inductor')

        component = Component(
            reference=ref,
            type='inductor',
            value=value,
            quantity=quantity,
            unit_price=price,
            **kwargs
        )
        self.bom.add_component(component)
        return component

    def _get_next_ref(self, prefix: str) -> str:
        """獲取下一個參考編號"""
        if prefix not in self.ref_counters:
            self.ref_counters[prefix] = 0

        self.ref_counters[prefix] += 1
        return f"{prefix}{self.ref_counters[prefix]}"

    def get_bom(self) -> BOM:
        """獲取 BOM"""
        return self.bom
