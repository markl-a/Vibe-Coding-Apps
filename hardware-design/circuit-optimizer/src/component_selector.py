"""
智能元件選擇器
基於需求規格推薦最適合的電子元件
"""

from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import numpy as np


class ComponentCategory(Enum):
    """元件類別"""
    RESISTOR = "resistor"
    CAPACITOR = "capacitor"
    INDUCTOR = "inductor"
    DIODE = "diode"
    TRANSISTOR = "transistor"
    IC = "ic"
    CONNECTOR = "connector"
    LED = "led"
    CRYSTAL = "crystal"
    OTHER = "other"


@dataclass
class ComponentSpec:
    """元件規格"""
    category: ComponentCategory
    value: Optional[float] = None  # 阻值、容值等
    voltage_rating: Optional[float] = None  # 額定電壓
    current_rating: Optional[float] = None  # 額定電流
    power_rating: Optional[float] = None  # 額定功率
    tolerance: Optional[float] = None  # 容差 (例如 0.01 代表 1%)
    package: Optional[str] = None  # 封裝類型
    temperature_range: Optional[Tuple[float, float]] = None  # 溫度範圍
    max_cost: Optional[float] = None  # 最大成本


@dataclass
class ComponentCandidate:
    """候選元件"""
    part_number: str
    manufacturer: str
    description: str
    value: float
    voltage_rating: float
    current_rating: float
    power_rating: float
    tolerance: float
    package: str
    unit_price: float
    availability: float
    score: float = 0.0  # 匹配分數

    def __repr__(self) -> str:
        return f"{self.part_number} (Score: {self.score:.2f}, ${self.unit_price})"


class ComponentSelector:
    """元件選擇器"""

    def __init__(self):
        """初始化選擇器"""
        self.component_database: List[ComponentCandidate] = []
        self._load_default_database()

    def _load_default_database(self) -> None:
        """載入預設元件資料庫"""
        # 電阻資料庫
        resistor_values = [100, 220, 330, 470, 1000, 2200, 4700, 10000, 22000, 47000, 100000]
        for value in resistor_values:
            self.component_database.append(ComponentCandidate(
                part_number=f"RES-0805-{value}",
                manufacturer="Yageo",
                description=f"Resistor {value}Ω 1% 0805",
                value=value,
                voltage_rating=150,
                current_rating=0.1,
                power_rating=0.125,
                tolerance=0.01,
                package="0805",
                unit_price=0.01,
                availability=1.0
            ))

        # 電容資料庫
        capacitor_values = [1e-12, 10e-12, 100e-12, 1e-9, 10e-9, 100e-9, 1e-6, 10e-6, 100e-6]
        for value in capacitor_values:
            self.component_database.append(ComponentCandidate(
                part_number=f"CAP-0805-{self._format_capacitance(value)}",
                manufacturer="Murata",
                description=f"Capacitor {self._format_capacitance(value)} 50V X7R 0805",
                value=value,
                voltage_rating=50,
                current_rating=1.0,
                power_rating=0.1,
                tolerance=0.10,
                package="0805",
                unit_price=0.02,
                availability=0.95
            ))

        # LDO 穩壓器
        ldo_voltages = [1.8, 3.3, 5.0]
        for voltage in ldo_voltages:
            self.component_database.append(ComponentCandidate(
                part_number=f"AMS1117-{voltage}",
                manufacturer="Advanced Monolithic Systems",
                description=f"LDO Regulator {voltage}V 1A",
                value=voltage,
                voltage_rating=15,
                current_rating=1.0,
                power_rating=1.0,
                tolerance=0.01,
                package="SOT-223",
                unit_price=0.15,
                availability=1.0
            ))

    def _format_capacitance(self, value: float) -> str:
        """格式化電容值為可讀字串"""
        if value >= 1e-6:
            return f"{value*1e6:.0f}uF"
        elif value >= 1e-9:
            return f"{value*1e9:.0f}nF"
        else:
            return f"{value*1e12:.0f}pF"

    def select_component(
        self,
        spec: ComponentSpec,
        sort_by: str = 'score'
    ) -> List[ComponentCandidate]:
        """
        根據規格選擇元件

        Args:
            spec: 元件規格要求
            sort_by: 排序依據 ('score', 'price', 'availability')

        Returns:
            候選元件列表，按匹配度排序
        """
        candidates = []

        for component in self.component_database:
            # 檢查基本匹配
            if not self._matches_category(component, spec):
                continue

            # 計算匹配分數
            score = self._calculate_match_score(component, spec)
            if score > 0:
                component.score = score
                candidates.append(component)

        # 排序
        if sort_by == 'score':
            candidates.sort(key=lambda c: c.score, reverse=True)
        elif sort_by == 'price':
            candidates.sort(key=lambda c: c.unit_price)
        elif sort_by == 'availability':
            candidates.sort(key=lambda c: c.availability, reverse=True)

        return candidates

    def _matches_category(
        self,
        component: ComponentCandidate,
        spec: ComponentSpec
    ) -> bool:
        """檢查元件是否符合類別"""
        # 簡單的關鍵字匹配
        category_keywords = {
            ComponentCategory.RESISTOR: ['RES', 'RESISTOR'],
            ComponentCategory.CAPACITOR: ['CAP', 'CAPACITOR'],
            ComponentCategory.IC: ['AMS', 'LM', 'STM', 'TI'],
        }

        if spec.category in category_keywords:
            keywords = category_keywords[spec.category]
            return any(kw in component.part_number.upper() for kw in keywords)

        return True

    def _calculate_match_score(
        self,
        component: ComponentCandidate,
        spec: ComponentSpec
    ) -> float:
        """
        計算元件與規格的匹配分數

        Args:
            component: 候選元件
            spec: 需求規格

        Returns:
            匹配分數 (0-100)
        """
        score = 100.0

        # 檢查值匹配
        if spec.value is not None:
            if component.value < spec.value:
                return 0  # 不符合基本要求
            # 值越接近越好
            value_ratio = component.value / spec.value
            if value_ratio > 1.5:
                score -= 20  # 值過大扣分

        # 檢查電壓等級
        if spec.voltage_rating is not None:
            if component.voltage_rating < spec.voltage_rating:
                return 0  # 不符合基本要求
            # 電壓餘裕適中最好
            voltage_margin = component.voltage_rating / spec.voltage_rating
            if voltage_margin < 1.5:
                score -= 10  # 餘裕不足
            elif voltage_margin > 3:
                score -= 5   # 過度設計

        # 檢查電流等級
        if spec.current_rating is not None:
            if component.current_rating < spec.current_rating:
                return 0
            current_ratio = component.current_rating / spec.current_rating
            if current_ratio > 2:
                score -= 5

        # 檢查功率等級
        if spec.power_rating is not None:
            if component.power_rating < spec.power_rating:
                return 0
            power_ratio = component.power_rating / spec.power_rating
            if power_ratio > 2:
                score -= 5

        # 檢查封裝
        if spec.package is not None:
            if component.package != spec.package:
                score -= 15

        # 檢查成本
        if spec.max_cost is not None:
            if component.unit_price > spec.max_cost:
                score -= 30
            else:
                # 成本越低越好
                cost_ratio = component.unit_price / spec.max_cost
                score += (1 - cost_ratio) * 10

        # 可用性加分
        score += component.availability * 10

        return max(0, score)

    def recommend_resistor(
        self,
        resistance: float,
        power: float = 0.125,
        tolerance: float = 0.01,
        package: str = "0805"
    ) -> Optional[ComponentCandidate]:
        """
        推薦電阻

        Args:
            resistance: 阻值 (Ω)
            power: 功率等級 (W)
            tolerance: 容差
            package: 封裝

        Returns:
            推薦的電阻元件
        """
        spec = ComponentSpec(
            category=ComponentCategory.RESISTOR,
            value=resistance,
            power_rating=power,
            tolerance=tolerance,
            package=package
        )

        candidates = self.select_component(spec)
        return candidates[0] if candidates else None

    def recommend_capacitor(
        self,
        capacitance: float,
        voltage: float,
        package: str = "0805"
    ) -> Optional[ComponentCandidate]:
        """
        推薦電容

        Args:
            capacitance: 容值 (F)
            voltage: 額定電壓 (V)
            package: 封裝

        Returns:
            推薦的電容元件
        """
        spec = ComponentSpec(
            category=ComponentCategory.CAPACITOR,
            value=capacitance,
            voltage_rating=voltage,
            package=package
        )

        candidates = self.select_component(spec)
        return candidates[0] if candidates else None

    def recommend_voltage_regulator(
        self,
        output_voltage: float,
        output_current: float
    ) -> Optional[ComponentCandidate]:
        """
        推薦穩壓器

        Args:
            output_voltage: 輸出電壓 (V)
            output_current: 輸出電流 (A)

        Returns:
            推薦的穩壓器
        """
        spec = ComponentSpec(
            category=ComponentCategory.IC,
            value=output_voltage,
            current_rating=output_current
        )

        candidates = self.select_component(spec)
        return candidates[0] if candidates else None


def demonstrate_selector():
    """展示元件選擇器功能"""
    print("=== 智能元件選擇器示範 ===\n")

    selector = ComponentSelector()

    # 範例 1: 選擇電阻
    print("1. 選擇 10kΩ 電阻:")
    resistor = selector.recommend_resistor(resistance=10000)
    if resistor:
        print(f"   推薦: {resistor.part_number}")
        print(f"   規格: {resistor.description}")
        print(f"   價格: ${resistor.unit_price}\n")

    # 範例 2: 選擇電容
    print("2. 選擇 100nF 50V 電容:")
    capacitor = selector.recommend_capacitor(capacitance=100e-9, voltage=50)
    if capacitor:
        print(f"   推薦: {capacitor.part_number}")
        print(f"   規格: {capacitor.description}")
        print(f"   價格: ${capacitor.unit_price}\n")

    # 範例 3: 選擇穩壓器
    print("3. 選擇 3.3V 1A 穩壓器:")
    regulator = selector.recommend_voltage_regulator(
        output_voltage=3.3,
        output_current=1.0
    )
    if regulator:
        print(f"   推薦: {regulator.part_number}")
        print(f"   規格: {regulator.description}")
        print(f"   價格: ${regulator.unit_price}\n")

    # 範例 4: 自定義規格搜尋
    print("4. 搜尋所有符合的電阻 (>= 1kΩ, 0805 封裝):")
    spec = ComponentSpec(
        category=ComponentCategory.RESISTOR,
        value=1000,
        package="0805"
    )
    candidates = selector.select_component(spec)
    print(f"   找到 {len(candidates)} 個候選元件")
    for i, comp in enumerate(candidates[:5], 1):
        print(f"   {i}. {comp}")


if __name__ == "__main__":
    demonstrate_selector()
