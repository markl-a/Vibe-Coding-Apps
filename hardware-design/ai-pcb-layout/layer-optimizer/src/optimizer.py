"""
PCB 層疊優化器主模組
"""

from typing import Dict, List


class LayerOptimizer:
    """PCB 層疊優化器"""

    def __init__(self):
        """初始化優化器"""
        self.requirements = {}

    def set_requirements(self, requirements: Dict):
        """設定設計需求"""
        self.requirements = requirements

    def optimize(self) -> Dict:
        """執行層疊優化"""
        print("開始層疊優化...")

        # 簡化實現：根據需求生成標準層疊
        signal_layers = self.requirements.get('signal_layers', 2)
        power_planes = self.requirements.get('power_planes', 1)

        total_layers = signal_layers + power_planes + 1  # +1 for GND

        stackup = self._generate_stackup(total_layers, signal_layers, power_planes)

        print(f"生成 {total_layers} 層板配置")

        return stackup

    def _generate_stackup(self, total: int, signal: int, power: int) -> Dict:
        """生成層疊結構"""
        layers = []

        if total == 4:
            # 標準4層板
            layers = [
                {'name': 'Top', 'type': 'signal', 'thickness': 0.035},
                {'name': 'GND', 'type': 'plane', 'thickness': 0.035},
                {'name': 'Power', 'type': 'plane', 'thickness': 0.035},
                {'name': 'Bottom', 'type': 'signal', 'thickness': 0.035},
            ]
        elif total == 6:
            # 6層板
            layers = [
                {'name': 'Top', 'type': 'signal', 'thickness': 0.035},
                {'name': 'GND', 'type': 'plane', 'thickness': 0.035},
                {'name': 'Signal_1', 'type': 'signal', 'thickness': 0.035},
                {'name': 'Signal_2', 'type': 'signal', 'thickness': 0.035},
                {'name': 'Power', 'type': 'plane', 'thickness': 0.035},
                {'name': 'Bottom', 'type': 'signal', 'thickness': 0.035},
            ]

        return {
            'total_layers': total,
            'layers': layers,
            'total_thickness': 1.6
        }

    def print_stackup(self, stackup: Dict):
        """打印層疊結構"""
        print("\n層疊結構:")
        print("=" * 50)
        for i, layer in enumerate(stackup['layers'], 1):
            print(f"Layer {i}: {layer['name']:12s} ({layer['type']:8s}) "
                  f"{layer['thickness']:.3f} mm")
        print("=" * 50)
        print(f"總厚度: {stackup['total_thickness']} mm")

    def estimate_cost(self, stackup: Dict) -> float:
        """估算成本"""
        # 簡化的成本估算
        base_cost = 10.0  # 基礎成本
        layer_cost = stackup['total_layers'] * 5.0  # 每層 $5
        return base_cost + layer_cost
