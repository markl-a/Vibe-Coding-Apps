"""
BOM 成本優化器
提供 BOM 成本分析、優化和替代元件建議功能
"""

from typing import List, Dict, Optional, Tuple
import pandas as pd
import numpy as np
from dataclasses import dataclass


@dataclass
class Component:
    """元件資料類別"""
    part_number: str
    description: str
    manufacturer: str
    unit_price: float
    quantity: int
    category: str
    package: str
    availability: float  # 0-1 之間，1 表示完全可用

    @property
    def total_cost(self) -> float:
        """計算總成本"""
        return self.unit_price * self.quantity

    def __repr__(self) -> str:
        return f"{self.part_number} ({self.quantity}x @ ${self.unit_price})"


class BOMOptimizer:
    """BOM 成本優化器"""

    def __init__(self):
        """初始化優化器"""
        self.components: List[Component] = []
        self.alternatives_db: Dict[str, List[Component]] = {}

    def add_component(self, component: Component) -> None:
        """
        添加元件到 BOM

        Args:
            component: 元件物件
        """
        self.components.append(component)

    def load_from_csv(self, filepath: str) -> None:
        """
        從 CSV 載入 BOM

        Args:
            filepath: CSV 檔案路徑
        """
        try:
            df = pd.read_csv(filepath)
            for _, row in df.iterrows():
                component = Component(
                    part_number=row['part_number'],
                    description=row.get('description', ''),
                    manufacturer=row.get('manufacturer', ''),
                    unit_price=float(row['unit_price']),
                    quantity=int(row['quantity']),
                    category=row.get('category', 'other'),
                    package=row.get('package', ''),
                    availability=float(row.get('availability', 1.0))
                )
                self.add_component(component)
            print(f"成功載入 {len(self.components)} 個元件")
        except Exception as e:
            print(f"載入 CSV 失敗: {e}")

    def calculate_total_cost(self) -> float:
        """
        計算 BOM 總成本

        Returns:
            總成本
        """
        return sum(comp.total_cost for comp in self.components)

    def get_cost_breakdown(self) -> Dict[str, float]:
        """
        取得成本分解

        Returns:
            按類別分組的成本字典
        """
        breakdown = {}
        for comp in self.components:
            category = comp.category
            if category not in breakdown:
                breakdown[category] = 0
            breakdown[category] += comp.total_cost
        return breakdown

    def find_expensive_components(self, top_n: int = 5) -> List[Component]:
        """
        找出最貴的元件

        Args:
            top_n: 返回前 N 個

        Returns:
            成本最高的元件列表
        """
        sorted_components = sorted(
            self.components,
            key=lambda c: c.total_cost,
            reverse=True
        )
        return sorted_components[:top_n]

    def optimize_quantities(
        self,
        price_breaks: Optional[Dict[str, List[Tuple[int, float]]]] = None
    ) -> float:
        """
        優化訂購數量以利用價格斷點

        Args:
            price_breaks: 價格斷點字典 {part_number: [(qty, price), ...]}

        Returns:
            優化後的總成本
        """
        if not price_breaks:
            return self.calculate_total_cost()

        total_cost = 0
        for comp in self.components:
            if comp.part_number in price_breaks:
                breaks = sorted(price_breaks[comp.part_number])
                # 找到最優價格斷點
                best_price = comp.unit_price
                for qty_break, price in breaks:
                    if comp.quantity >= qty_break:
                        best_price = price
                total_cost += best_price * comp.quantity
            else:
                total_cost += comp.total_cost

        return total_cost

    def suggest_alternatives(
        self,
        component: Component,
        max_cost_increase: float = 0.1,
        min_availability: float = 0.9
    ) -> List[Component]:
        """
        建議替代元件

        Args:
            component: 原始元件
            max_cost_increase: 最大成本增加比例
            min_availability: 最小可用性要求

        Returns:
            替代元件列表
        """
        alternatives = []

        # 這裡應該查詢實際的元件資料庫
        # 示範用途：生成一些虛擬替代方案
        if component.part_number in self.alternatives_db:
            for alt in self.alternatives_db[component.part_number]:
                cost_ratio = alt.unit_price / component.unit_price
                if (cost_ratio <= 1 + max_cost_increase and
                    alt.availability >= min_availability):
                    alternatives.append(alt)

        return alternatives

    def export_to_csv(self, filepath: str) -> None:
        """
        匯出 BOM 到 CSV

        Args:
            filepath: 輸出檔案路徑
        """
        data = []
        for comp in self.components:
            data.append({
                'part_number': comp.part_number,
                'description': comp.description,
                'manufacturer': comp.manufacturer,
                'unit_price': comp.unit_price,
                'quantity': comp.quantity,
                'total_cost': comp.total_cost,
                'category': comp.category,
                'package': comp.package,
                'availability': comp.availability
            })

        df = pd.DataFrame(data)
        df.to_csv(filepath, index=False)
        print(f"BOM 已匯出到: {filepath}")

    def generate_report(self) -> str:
        """
        生成優化報告

        Returns:
            報告文字
        """
        total_cost = self.calculate_total_cost()
        breakdown = self.get_cost_breakdown()
        expensive = self.find_expensive_components(5)

        report = "=== BOM 成本分析報告 ===\n\n"
        report += f"總元件數: {len(self.components)}\n"
        report += f"總成本: ${total_cost:.2f}\n\n"

        report += "成本分解:\n"
        for category, cost in sorted(breakdown.items(), key=lambda x: x[1], reverse=True):
            percentage = (cost / total_cost) * 100
            report += f"  {category}: ${cost:.2f} ({percentage:.1f}%)\n"

        report += "\n最貴的元件:\n"
        for i, comp in enumerate(expensive, 1):
            percentage = (comp.total_cost / total_cost) * 100
            report += f"  {i}. {comp.part_number}: ${comp.total_cost:.2f} ({percentage:.1f}%)\n"

        return report


def create_sample_bom() -> BOMOptimizer:
    """
    創建範例 BOM

    Returns:
        填充了範例資料的 BOMOptimizer
    """
    bom = BOMOptimizer()

    # 添加一些範例元件
    components = [
        Component("STM32F401CCU6", "ARM Cortex-M4 MCU", "STMicroelectronics",
                 3.50, 1, "IC", "QFN-48", 0.95),
        Component("AMS1117-3.3", "LDO Regulator 3.3V 1A", "Advanced Monolithic Systems",
                 0.15, 2, "Power", "SOT-223", 1.0),
        Component("0805-10K", "Resistor 10K 1% 0805", "Yageo",
                 0.01, 20, "Passive", "0805", 1.0),
        Component("0805-100nF", "Capacitor 100nF 50V X7R 0805", "Murata",
                 0.02, 15, "Passive", "0805", 1.0),
        Component("LED-RED-0805", "LED Red 0805", "Kingbright",
                 0.05, 3, "LED", "0805", 0.98),
        Component("USB-C-16P", "USB Type-C Connector 16-pin", "Korean Hroparts",
                 0.50, 1, "Connector", "SMD", 0.92),
        Component("ESP32-WROOM-32", "WiFi+BT Module", "Espressif",
                 2.80, 1, "IC", "SMD-38", 0.90),
    ]

    for comp in components:
        bom.add_component(comp)

    return bom


if __name__ == "__main__":
    # 測試 BOM 優化器
    print("創建範例 BOM...\n")
    bom = create_sample_bom()

    # 生成報告
    print(bom.generate_report())

    # 匯出到 CSV
    bom.export_to_csv("sample_bom.csv")
