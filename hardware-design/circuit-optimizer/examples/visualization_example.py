"""
可视化功能使用示例
展示如何使用可视化模块生成各种图表和报告
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.visualizer import CircuitVisualizer
from src.bom_optimizer import create_sample_bom
from src.power_analyzer import PowerAnalyzer, ComponentPower
from src.multi_objective import MultiObjectiveOptimizer, Individual
import numpy as np


def example_cost_visualization():
    """成本可视化示例"""
    print("=" * 70)
    print("示例 1: BOM 成本可视化")
    print("=" * 70 + "\n")

    # 创建示例 BOM
    bom = create_sample_bom()
    visualizer = CircuitVisualizer(output_dir="examples_output")

    # 获取成本分解
    cost_breakdown = bom.get_cost_breakdown()
    print("成本分解:")
    for category, cost in sorted(cost_breakdown.items(), key=lambda x: x[1], reverse=True):
        print(f"  {category}: ${cost:.2f}")

    # 生成可视化
    print("\n生成成本分解图...")
    visualizer.plot_cost_breakdown(cost_breakdown, title="BOM 成本分析")
    print("✓ 完成\n")


def example_power_visualization():
    """功耗可视化示例"""
    print("=" * 70)
    print("示例 2: 功耗分析可视化")
    print("=" * 70 + "\n")

    # 创建功耗分析器
    analyzer = PowerAnalyzer()

    # 添加元件功耗数据
    components = [
        ComponentPower("STM32F401", "IC", 3.3, 0.050, 1.0),
        ComponentPower("ESP32", "IC", 3.3, 0.160, 0.3),
        ComponentPower("LED_RED", "LED", 3.3, 0.020, 0.5),
        ComponentPower("LED_GREEN", "LED", 3.3, 0.020, 0.5),
        ComponentPower("LDO_3V3", "Power", 5.0, 0.003, 1.0),
        ComponentPower("Sensor", "Sensor", 3.3, 0.001, 0.1),
    ]

    for comp in components:
        analyzer.add_component(comp)

    # 获取功耗分解
    power_breakdown = analyzer.get_power_breakdown()
    print("功耗分解:")
    for category, power in sorted(power_breakdown.items(), key=lambda x: x[1], reverse=True):
        print(f"  {category}: {power*1000:.2f} mW")

    # 生成可视化
    print("\n生成功耗分解图...")
    visualizer = CircuitVisualizer(output_dir="examples_output")
    visualizer.plot_power_breakdown(power_breakdown, title="电路功耗分析")
    print("✓ 完成\n")


def example_pareto_front():
    """Pareto 前沿可视化示例"""
    print("=" * 70)
    print("示例 3: Pareto 最优前沿可视化")
    print("=" * 70 + "\n")

    # 创建模拟的 Pareto 前沿数据
    print("生成 Pareto 前沿数据...")
    individuals = []

    # 生成一些 Pareto 最优解
    np.random.seed(42)
    for i in range(50):
        # 模拟成本和功耗的权衡
        cost = np.random.uniform(5, 15)
        power = 20 - 10 * (cost - 5) / 10 + np.random.normal(0, 1)
        frequency = np.random.uniform(1000, 10000)

        ind = Individual(genes=[cost, power, frequency])
        ind.objectives = {
            'cost': cost,
            'power': power,
            'frequency': -frequency  # 最大化频率，所以取负
        }
        individuals.append(ind)

    print(f"生成了 {len(individuals)} 个解")

    # 可视化 2D Pareto 前沿
    print("\n生成 2D Pareto 前沿图 (成本 vs 功耗)...")
    visualizer = CircuitVisualizer(output_dir="examples_output")
    visualizer.plot_pareto_front(
        individuals,
        ['cost', 'power'],
        title="Pareto 前沿: 成本 vs 功耗",
        save_path="examples_output/pareto_2d.html"
    )

    # 可视化 3D Pareto 前沿
    print("生成 3D Pareto 前沿图 (成本 vs 功耗 vs 频率)...")
    visualizer.plot_pareto_front(
        individuals,
        ['cost', 'power', 'frequency'],
        title="Pareto 前沿: 成本 vs 功耗 vs 频率",
        save_path="examples_output/pareto_3d.html"
    )
    print("✓ 完成\n")


def example_optimization_progress():
    """优化进度可视化示例"""
    print("=" * 70)
    print("示例 4: 优化进度可视化")
    print("=" * 70 + "\n")

    # 模拟优化过程
    print("模拟优化过程...")
    history = []
    np.random.seed(42)

    initial_cost = 15.0
    initial_power = 300.0
    initial_gain = 10.0

    for i in range(100):
        # 模拟成本下降
        cost = initial_cost * np.exp(-i/30) + 5 + np.random.normal(0, 0.2)

        # 模拟功耗下降
        power = initial_power * np.exp(-i/40) + 100 + np.random.normal(0, 5)

        # 模拟增益提升
        gain = initial_gain + 10 * (1 - np.exp(-i/50)) + np.random.normal(0, 0.5)

        history.append({
            'cost': max(cost, 5),
            'power': max(power, 100),
            'gain': min(gain, 20)
        })

    print(f"生成了 {len(history)} 次迭代的数据")

    # 可视化优化进度
    print("\n生成优化进度图...")
    visualizer = CircuitVisualizer(output_dir="examples_output")
    visualizer.plot_optimization_progress(
        history,
        ['cost', 'power', 'gain']
    )
    print("✓ 完成\n")


def example_component_comparison():
    """元件对比可视化示例"""
    print("=" * 70)
    print("示例 5: 元件性能对比")
    print("=" * 70 + "\n")

    # 创建几个元件进行对比
    components = [
        {
            'name': 'LM7805',
            'cost': 0.25,
            'efficiency': 60,
            'current': 1.5,
            'size': 50,
            'availability': 100
        },
        {
            'name': 'AMS1117-5.0',
            'cost': 0.15,
            'efficiency': 70,
            'current': 1.0,
            'size': 30,
            'availability': 95
        },
        {
            'name': 'LM2596',
            'cost': 0.50,
            'efficiency': 90,
            'current': 3.0,
            'size': 80,
            'availability': 90
        }
    ]

    print("对比元件:")
    for comp in components:
        print(f"  - {comp['name']}")

    # 可视化对比
    print("\n生成元件对比雷达图...")
    visualizer = CircuitVisualizer(output_dir="examples_output")

    # 归一化数据以便在雷达图上显示
    normalized_components = []
    for comp in components:
        normalized_components.append({
            'name': comp['name'],
            'cost': (1 - comp['cost'] / 0.5) * 100,  # 成本越低越好
            'efficiency': comp['efficiency'],
            'current': comp['current'] / 3.0 * 100,
            'size': (1 - comp['size'] / 80) * 100,  # 尺寸越小越好
            'availability': comp['availability']
        })

    visualizer.plot_component_comparison(
        normalized_components,
        metrics=['cost', 'efficiency', 'current', 'size', 'availability']
    )
    print("✓ 完成\n")


def example_interactive_dashboard():
    """交互式仪表板示例"""
    print("=" * 70)
    print("示例 6: 创建交互式分析仪表板")
    print("=" * 70 + "\n")

    # 准备数据
    cost_breakdown = {
        'IC': 6.30,
        'Passive': 0.95,
        'Power': 0.30,
        'Connector': 0.50,
        'LED': 0.15
    }

    power_breakdown = {
        'IC': 0.210,
        'LED': 0.060,
        'Power': 0.003,
        'Sensor': 0.0001
    }

    # 生成优化历史
    history = []
    np.random.seed(42)
    for i in range(50):
        history.append({
            'cost': 10 - 2 * np.exp(-i/10) + np.random.normal(0, 0.1),
            'power': 300 - 50 * np.exp(-i/15) + np.random.normal(0, 5)
        })

    # 创建仪表板
    print("生成交互式仪表板...")
    visualizer = CircuitVisualizer(output_dir="examples_output")
    visualizer.create_interactive_dashboard(
        cost_breakdown,
        power_breakdown,
        history
    )
    print("✓ 完成\n")


def example_pdf_report():
    """PDF 报告生成示例"""
    print("=" * 70)
    print("示例 7: 生成优化报告")
    print("=" * 70 + "\n")

    # 准备报告数据
    report_data = {
        'total_cost': 8.20,
        'total_power': 0.273,
        'component_count': 42,
        'cost_breakdown': {
            'IC': 6.30,
            'Passive': 0.95,
            'Power': 0.30,
            'Connector': 0.50,
            'LED': 0.15
        },
        'power_breakdown': {
            'IC': 0.210,
            'LED': 0.060,
            'Power': 0.003,
            'Sensor': 0.0001
        },
        'recommendations': [
            '✓ IC 成本占总成本的 76.8%，是主要成本来源',
            '✓ 考虑使用更高效的 LED 以降低功耗',
            '✓ 功耗主要来自 IC (76.9%)，建议启用低功耗模式',
            '✓ 被动元件成本较低，无需优化',
            '✓ 整体设计已经相当优化，建议进行实际测试验证'
        ]
    }

    # 生成报告
    print("生成 HTML 报告...")
    visualizer = CircuitVisualizer(output_dir="examples_output")
    visualizer.generate_pdf_report(report_data)
    print("✓ 完成\n")


def main():
    """主函数"""
    print("\n")
    print("╔" + "=" * 68 + "╗")
    print("║" + " " * 18 + "电路优化可视化示例" + " " * 18 + "║")
    print("╚" + "=" * 68 + "╝")
    print("\n")

    # 运行所有示例
    example_cost_visualization()
    example_power_visualization()
    example_pareto_front()
    example_optimization_progress()
    example_component_comparison()
    example_interactive_dashboard()
    example_pdf_report()

    print("=" * 70)
    print("所有可视化示例运行完成！")
    print("输出文件保存在 examples_output 目录中")
    print("=" * 70)
    print("\n生成的文件:")
    print("  - cost_breakdown.png        成本分解饼图")
    print("  - power_breakdown.png       功耗分解柱状图")
    print("  - pareto_2d.html            2D Pareto 前沿图")
    print("  - pareto_3d.html            3D Pareto 前沿图")
    print("  - optimization_progress.png 优化进度图")
    print("  - component_comparison.html 元件对比雷达图")
    print("  - dashboard.html            交互式仪表板")
    print("  - report.html               优化报告")
    print()


if __name__ == "__main__":
    main()
