"""
供應商整合模組
提供元件價格查詢、庫存檢查和成本估算
"""

import requests
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ComponentPrice:
    """元件價格"""
    supplier: str
    sku: str
    mpn: str
    manufacturer: str
    description: str
    stock: int
    moq: int  # Minimum Order Quantity
    pricing: Dict[int, float]  # {qty: price}
    currency: str = "USD"
    datasheet_url: str = ""
    lead_time_days: int = 0

    def get_unit_price(self, quantity: int = 1) -> float:
        """獲取單價（根據數量階梯）"""
        if not self.pricing:
            return 0.0

        # 找到適用的價格階梯
        applicable_qty = 1
        for qty in sorted(self.pricing.keys()):
            if quantity >= qty:
                applicable_qty = qty
            else:
                break

        return self.pricing.get(applicable_qty, 0.0)

    def get_total_price(self, quantity: int) -> float:
        """獲取總價"""
        return self.get_unit_price(quantity) * quantity


class SupplierAPI:
    """供應商 API 基類"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.session = requests.Session()

    def search(self, mpn: str, manufacturer: str = "") -> List[ComponentPrice]:
        """搜尋元件"""
        raise NotImplementedError

    def get_stock(self, sku: str) -> int:
        """獲取庫存"""
        raise NotImplementedError


class DigiKeyAPI(SupplierAPI):
    """Digi-Key API（模擬實現）"""

    BASE_URL = "https://api.digikey.com/v1"

    def search(self, mpn: str, manufacturer: str = "") -> List[ComponentPrice]:
        """
        搜尋元件

        注意：這是模擬實現，實際使用需要 Digi-Key API 金鑰
        """
        logger.info(f"搜尋 Digi-Key: MPN={mpn}, Manufacturer={manufacturer}")

        # 模擬回應
        return [
            ComponentPrice(
                supplier="Digi-Key",
                sku=f"DK-{mpn}-ND",
                mpn=mpn,
                manufacturer=manufacturer or "Generic",
                description=f"Component {mpn}",
                stock=1000,
                moq=1,
                pricing={
                    1: 0.50,
                    10: 0.45,
                    100: 0.40,
                    1000: 0.35
                },
                currency="USD",
                lead_time_days=2
            )
        ]

    def get_stock(self, sku: str) -> int:
        """獲取庫存"""
        logger.info(f"查詢 Digi-Key 庫存: {sku}")
        return 1000  # 模擬


class MouserAPI(SupplierAPI):
    """Mouser API（模擬實現）"""

    BASE_URL = "https://api.mouser.com/api/v1"

    def search(self, mpn: str, manufacturer: str = "") -> List[ComponentPrice]:
        """搜尋元件"""
        logger.info(f"搜尋 Mouser: MPN={mpn}, Manufacturer={manufacturer}")

        return [
            ComponentPrice(
                supplier="Mouser",
                sku=f"MO-{mpn}",
                mpn=mpn,
                manufacturer=manufacturer or "Generic",
                description=f"Component {mpn}",
                stock=500,
                moq=1,
                pricing={
                    1: 0.52,
                    10: 0.47,
                    100: 0.42,
                    1000: 0.37
                },
                currency="USD",
                lead_time_days=3
            )
        ]


class LCSCAPI(SupplierAPI):
    """LCSC API（模擬實現）"""

    BASE_URL = "https://cart.jlcpcb.com/shoppingCart"

    def search(self, mpn: str, manufacturer: str = "") -> List[ComponentPrice]:
        """搜尋元件"""
        logger.info(f"搜尋 LCSC: MPN={mpn}, Manufacturer={manufacturer}")

        return [
            ComponentPrice(
                supplier="LCSC",
                sku=f"C{abs(hash(mpn)) % 100000}",
                mpn=mpn,
                manufacturer=manufacturer or "Generic",
                description=f"Component {mpn}",
                stock=10000,
                moq=10,
                pricing={
                    10: 0.30,
                    100: 0.25,
                    1000: 0.20,
                    5000: 0.15
                },
                currency="USD",
                lead_time_days=7
            )
        ]


class SupplierIntegration:
    """供應商整合管理器"""

    def __init__(self, suppliers: Optional[List[str]] = None):
        """
        初始化供應商整合

        Args:
            suppliers: 供應商列表 ['digikey', 'mouser', 'lcsc']
        """
        self.suppliers = suppliers or ['digikey', 'mouser', 'lcsc']
        self.apis = {}

        # 初始化 API
        if 'digikey' in self.suppliers:
            self.apis['digikey'] = DigiKeyAPI()
        if 'mouser' in self.suppliers:
            self.apis['mouser'] = MouserAPI()
        if 'lcsc' in self.suppliers:
            self.apis['lcsc'] = LCSCAPI()

        logger.info(f"初始化供應商整合: {', '.join(self.suppliers)}")

    def search_component(
        self,
        mpn: str,
        manufacturer: str = "",
        quantity: int = 1
    ) -> Dict[str, List[ComponentPrice]]:
        """
        搜尋元件（多個供應商）

        Args:
            mpn: 製造商料號
            manufacturer: 製造商名稱
            quantity: 需要數量

        Returns:
            {supplier_name: [ComponentPrice, ...]}
        """
        results = {}

        for supplier_name, api in self.apis.items():
            try:
                prices = api.search(mpn, manufacturer)
                results[supplier_name] = prices
            except Exception as e:
                logger.error(f"{supplier_name} 搜尋失敗: {e}")
                results[supplier_name] = []

        return results

    def compare_prices(
        self,
        mpn: str,
        manufacturer: str = "",
        quantity: int = 1
    ) -> List[Tuple[str, ComponentPrice, float]]:
        """
        比較價格

        Args:
            mpn: 製造商料號
            manufacturer: 製造商名稱
            quantity: 需要數量

        Returns:
            [(supplier, ComponentPrice, total_price), ...] 按價格排序
        """
        results = self.search_component(mpn, manufacturer, quantity)

        comparisons = []

        for supplier, prices in results.items():
            for price in prices:
                if price.stock >= quantity:
                    total = price.get_total_price(quantity)
                    comparisons.append((supplier, price, total))

        # 按總價排序
        comparisons.sort(key=lambda x: x[2])

        return comparisons

    def estimate_bom_cost(
        self,
        bom: List[Dict],
        quantity: int = 1,
        preferred_supplier: Optional[str] = None
    ) -> Dict:
        """
        估算 BOM 成本

        Args:
            bom: BOM 清單 [{'mpn': ..., 'manufacturer': ..., 'quantity': ...}, ...]
            quantity: 板子數量
            preferred_supplier: 首選供應商

        Returns:
            成本估算結果
        """
        logger.info(f"估算 BOM 成本: {len(bom)} 項目, 數量 {quantity}")

        total_cost = 0.0
        component_costs = []
        unavailable_components = []

        for item in bom:
            mpn = item.get('mpn', '')
            manufacturer = item.get('manufacturer', '')
            comp_qty = item.get('quantity', 1)

            if not mpn:
                logger.warning(f"跳過沒有 MPN 的元件: {item}")
                continue

            # 搜尋元件
            comparisons = self.compare_prices(mpn, manufacturer, comp_qty * quantity)

            if not comparisons:
                logger.warning(f"找不到元件: {mpn}")
                unavailable_components.append({
                    'mpn': mpn,
                    'manufacturer': manufacturer,
                    'quantity': comp_qty
                })
                continue

            # 選擇供應商
            if preferred_supplier:
                # 嘗試使用首選供應商
                preferred = [c for c in comparisons if c[0] == preferred_supplier]
                if preferred:
                    supplier, price, total = preferred[0]
                else:
                    supplier, price, total = comparisons[0]
            else:
                # 選擇最便宜的
                supplier, price, total = comparisons[0]

            component_costs.append({
                'mpn': mpn,
                'manufacturer': manufacturer,
                'quantity': comp_qty,
                'supplier': supplier,
                'sku': price.sku,
                'unit_price': price.get_unit_price(comp_qty * quantity),
                'total_price': total,
                'stock': price.stock,
                'lead_time_days': price.lead_time_days
            })

            total_cost += total

        result = {
            'board_quantity': quantity,
            'total_cost': total_cost,
            'cost_per_board': total_cost / quantity if quantity > 0 else 0,
            'component_count': len(bom),
            'available_components': len(component_costs),
            'unavailable_components': len(unavailable_components),
            'components': component_costs,
            'unavailable': unavailable_components,
            'currency': 'USD',
            'timestamp': datetime.now().isoformat(),
            'max_lead_time_days': max([c['lead_time_days'] for c in component_costs], default=0)
        }

        logger.info(f"成本估算完成: 總成本 ${total_cost:.2f}, 單板成本 ${result['cost_per_board']:.2f}")

        return result

    def generate_cost_report(
        self,
        estimate: Dict,
        output_file: str,
        format: str = 'html'
    ) -> None:
        """
        生成成本報告

        Args:
            estimate: 成本估算結果
            output_file: 輸出檔案
            format: 格式 (html, csv, json)
        """
        if format == 'html':
            self._generate_html_report(estimate, output_file)
        elif format == 'csv':
            self._generate_csv_report(estimate, output_file)
        elif format == 'json':
            import json
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(estimate, f, indent=2, ensure_ascii=False)
        else:
            raise ValueError(f"不支援的格式: {format}")

    def _generate_html_report(self, estimate: Dict, output_file: str) -> None:
        """生成 HTML 報告"""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>BOM 成本估算報告</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1 {{ color: #333; }}
        .summary {{ background: #f5f5f5; padding: 15px; margin: 20px 0; }}
        .summary-item {{ margin: 8px 0; }}
        .highlight {{ font-size: 1.5em; color: #1976d2; font-weight: bold; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background: #4CAF50; color: white; }}
        tr:nth-child(even) {{ background: #f9f9f9; }}
        .unavailable {{ background: #ffebee; }}
        .footer {{ margin-top: 20px; color: #666; font-size: 0.9em; }}
    </style>
</head>
<body>
    <h1>BOM 成本估算報告</h1>

    <div class="summary">
        <h2>總結</h2>
        <div class="summary-item">板子數量: <strong>{estimate['board_quantity']}</strong></div>
        <div class="summary-item">總成本: <span class="highlight">${estimate['total_cost']:.2f}</span> {estimate['currency']}</div>
        <div class="summary-item">單板成本: <strong>${estimate['cost_per_board']:.2f}</strong> {estimate['currency']}</div>
        <div class="summary-item">元件總數: {estimate['component_count']}</div>
        <div class="summary-item">可用元件: {estimate['available_components']}</div>
        <div class="summary-item">缺貨元件: {estimate['unavailable_components']}</div>
        <div class="summary-item">最長交期: {estimate['max_lead_time_days']} 天</div>
        <div class="summary-item">生成時間: {estimate['timestamp']}</div>
    </div>

    <h2>元件明細</h2>
    <table>
        <tr>
            <th>#</th>
            <th>MPN</th>
            <th>製造商</th>
            <th>數量</th>
            <th>供應商</th>
            <th>SKU</th>
            <th>單價</th>
            <th>總價</th>
            <th>庫存</th>
            <th>交期</th>
        </tr>
"""

        for idx, comp in enumerate(estimate['components'], 1):
            html += f"""        <tr>
            <td>{idx}</td>
            <td>{comp['mpn']}</td>
            <td>{comp['manufacturer']}</td>
            <td>{comp['quantity']}</td>
            <td>{comp['supplier']}</td>
            <td>{comp['sku']}</td>
            <td>${comp['unit_price']:.4f}</td>
            <td>${comp['total_price']:.2f}</td>
            <td>{comp['stock']}</td>
            <td>{comp['lead_time_days']} 天</td>
        </tr>
"""

        html += "    </table>\n"

        if estimate['unavailable']:
            html += """
    <h2>缺貨元件</h2>
    <table>
        <tr>
            <th>#</th>
            <th>MPN</th>
            <th>製造商</th>
            <th>數量</th>
        </tr>
"""
            for idx, comp in enumerate(estimate['unavailable'], 1):
                html += f"""        <tr class="unavailable">
            <td>{idx}</td>
            <td>{comp['mpn']}</td>
            <td>{comp['manufacturer']}</td>
            <td>{comp['quantity']}</td>
        </tr>
"""
            html += "    </table>\n"

        html += """
    <div class="footer">
        <p>注意：價格和庫存資訊會隨時變動，請以供應商網站實時資料為準。</p>
    </div>
</body>
</html>"""

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)

        logger.info(f"成本報告已生成: {output_file}")

    def _generate_csv_report(self, estimate: Dict, output_file: str) -> None:
        """生成 CSV 報告"""
        import csv

        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)

            # 寫入總結
            writer.writerow(['總成本', f"${estimate['total_cost']:.2f}"])
            writer.writerow(['單板成本', f"${estimate['cost_per_board']:.2f}"])
            writer.writerow(['板子數量', estimate['board_quantity']])
            writer.writerow([])

            # 寫入元件明細
            writer.writerow([
                'MPN', '製造商', '數量', '供應商', 'SKU',
                '單價', '總價', '庫存', '交期(天)'
            ])

            for comp in estimate['components']:
                writer.writerow([
                    comp['mpn'],
                    comp['manufacturer'],
                    comp['quantity'],
                    comp['supplier'],
                    comp['sku'],
                    f"${comp['unit_price']:.4f}",
                    f"${comp['total_price']:.2f}",
                    comp['stock'],
                    comp['lead_time_days']
                ])

        logger.info(f"CSV 報告已生成: {output_file}")


if __name__ == "__main__":
    # 測試範例
    print("供應商整合模組")
    print("使用範例:")
    print("""
    integration = SupplierIntegration(suppliers=['digikey', 'mouser', 'lcsc'])

    # 搜尋元件
    results = integration.search_component('STM32F103C8T6', 'STMicroelectronics')

    # 比較價格
    comparisons = integration.compare_prices('STM32F103C8T6', quantity=100)

    # 估算 BOM 成本
    bom = [
        {'mpn': 'STM32F103C8T6', 'manufacturer': 'STMicroelectronics', 'quantity': 1},
        {'mpn': 'TLV1117-33', 'manufacturer': 'Texas Instruments', 'quantity': 1}
    ]
    estimate = integration.estimate_bom_cost(bom, quantity=100)
    integration.generate_cost_report(estimate, 'cost_report.html')
    """)
