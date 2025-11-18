"""
電路優化器主模組
整合 BOM 優化、元件選擇、多目標優化和功耗分析功能
"""

from typing import Dict, List, Optional
import numpy as np

# 導入子模組
from .bom_optimizer import BOMOptimizer, Component
from .component_selector import ComponentSelector, ComponentSpec
from .multi_objective import MultiObjectiveOptimizer
from .power_analyzer import PowerAnalyzer, ComponentPower


class CircuitOptimizer:
    """
    電路優化器主類別
    整合多個優化工具提供完整的電路優化解決方案
    """

    def __init__(self):
        """初始化優化器"""
        self.objectives = {}
        self.constraints = {}
        self.circuit = None

        # 初始化子模組
        self.bom_optimizer = BOMOptimizer()
        self.component_selector = ComponentSelector()
        self.multi_objective_optimizer = MultiObjectiveOptimizer()
        self.power_analyzer = PowerAnalyzer()

    def load_circuit(self, filepath: str) -> None:
        """
        載入電路設計

        Args:
            filepath: 電路網表檔案路徑
        """
        print(f"載入電路: {filepath}")
        # TODO: 實作電路網表解析
        self.circuit = filepath

    def set_objectives(self, objectives: Dict[str, str]) -> None:
        """
        設定優化目標

        Args:
            objectives: 目標字典，例如 {'cost': 'minimize', 'power': 'minimize'}
        """
        self.objectives = objectives
        print(f"設定優化目標: {objectives}")

    def add_constraints(self, constraints: Dict) -> None:
        """
        添加約束條件

        Args:
            constraints: 約束字典
        """
        self.constraints = constraints
        print(f"添加約束: {constraints}")

    def optimize(self, iterations: int = 100) -> 'OptimizationResult':
        """
        執行綜合優化

        Args:
            iterations: 優化迭代次數

        Returns:
            優化結果物件
        """
        print(f"執行優化，迭代 {iterations} 次...")

        # 示範：整合各項優化
        result = OptimizationResult()

        # BOM 成本優化
        if 'cost' in self.objectives:
            result.cost = self.bom_optimizer.calculate_total_cost()

        # 功耗分析
        if 'power' in self.objectives:
            result.power = self.power_analyzer.calculate_total_power() * 1000  # 轉換為 mW

        # 設定範例值
        result.gain = 20.0

        return result

    def analyze_bom_cost(self) -> Dict:
        """
        分析 BOM 成本

        Returns:
            成本分析結果
        """
        return {
            'total_cost': self.bom_optimizer.calculate_total_cost(),
            'breakdown': self.bom_optimizer.get_cost_breakdown(),
            'expensive_components': self.bom_optimizer.find_expensive_components(5)
        }

    def analyze_power(self) -> Dict:
        """
        分析功耗

        Returns:
            功耗分析結果
        """
        return {
            'total_power': self.power_analyzer.calculate_total_power(),
            'average_power': self.power_analyzer.calculate_average_power(),
            'breakdown': self.power_analyzer.get_power_breakdown(),
            'power_hungry_components': self.power_analyzer.find_power_hungry_components(5)
        }

    def recommend_component(self, spec: ComponentSpec):
        """
        推薦元件

        Args:
            spec: 元件規格

        Returns:
            推薦的元件
        """
        candidates = self.component_selector.select_component(spec)
        return candidates[0] if candidates else None

    def generate_optimization_report(self) -> str:
        """
        生成綜合優化報告

        Returns:
            報告文字
        """
        report = "=" * 60 + "\n"
        report += "電路優化綜合報告\n"
        report += "=" * 60 + "\n\n"

        # BOM 成本分析
        if self.bom_optimizer.components:
            report += "--- BOM 成本分析 ---\n"
            report += self.bom_optimizer.generate_report() + "\n"

        # 功耗分析
        if self.power_analyzer.components:
            report += "\n--- 功耗分析 ---\n"
            report += self.power_analyzer.generate_report() + "\n"

        return report


class OptimizationResult:
    """優化結果類別"""

    def __init__(self, cost: float = 0.0, power: float = 0.0, gain: float = 0.0):
        self.cost = cost
        self.power = power
        self.gain = gain

    def get_bom(self) -> BOMOptimizer:
        """取得 BOM 清單"""
        return BOMOptimizer()

    def __repr__(self) -> str:
        return f"OptimizationResult(cost=${self.cost:.2f}, power={self.power:.2f}mW, gain={self.gain:.1f}dB)"
