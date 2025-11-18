"""
全面的PCB热分析示例

展示热分析器的所有功能：
1. FDM数值模拟
2. ML快速预测
3. 2D/3D可视化
4. 温度剖面分析
5. 优化建议
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import numpy as np
import matplotlib.pyplot as plt
from analyzer import ThermalAnalyzer


def create_power_supply_scenario():
    """创建电源模块热分析场景"""
    print("=" * 60)
    print("场景: 电源模块热分析")
    print("=" * 60)

    # 创建分析器（100mm x 80mm 电路板）
    analyzer = ThermalAnalyzer(
        board_size=(100, 80),
        resolution=1.0,  # 1mm 分辨率
        thickness=1.6
    )

    # 设置环境条件
    analyzer.set_boundary_conditions(
        ambient_temp=25,
        convection_coeff=10,
        emissivity=0.9
    )

    # 添加热源
    print("\n添加元件（热源）:")

    # MOSFET（高功耗）
    analyzer.add_heat_source(
        x=20, y=40, width=10, height=10,
        power=5.0, name="MOSFET_Q1"
    )
    print("  ✓ MOSFET Q1: 5.0W @ (20, 40)")

    # 稳压器
    analyzer.add_heat_source(
        x=50, y=50, width=8, height=8,
        power=3.0, name="Regulator_U1"
    )
    print("  ✓ Regulator U1: 3.0W @ (50, 50)")

    # 电感（较低功耗）
    analyzer.add_heat_source(
        x=70, y=30, width=12, height=12,
        power=0.8, name="Inductor_L1"
    )
    print("  ✓ Inductor L1: 0.8W @ (70, 30)")

    # 二极管
    analyzer.add_heat_source(
        x=35, y=20, width=5, height=5,
        power=1.2, name="Diode_D1"
    )
    print("  ✓ Diode D1: 1.2W @ (35, 20)")

    return analyzer


def perform_fdm_analysis(analyzer):
    """执行FDM分析"""
    print("\n" + "=" * 60)
    print("执行 FDM 数值模拟")
    print("=" * 60)

    result_fdm = analyzer.analyze(
        method='fdm',
        max_iterations=1000,
        convergence=0.01
    )

    print(f"\n✓ FDM 分析完成")

    return result_fdm


def visualize_all_results(analyzer, result):
    """生成所有可视化"""
    print("\n" + "=" * 60)
    print("生成可视化图表")
    print("=" * 60)

    # 1. 2D 热图
    print("  [1/4] 生成 2D 热图...")
    fig1 = analyzer.visualize_heatmap(result, show=False)
    fig1.savefig('thermal_2d_heatmap.png', dpi=150)
    print("       ✓ 已保存: thermal_2d_heatmap.png")

    # 2. 3D 温度分布
    print("  [2/4] 生成 3D 温度分布...")
    fig2 = analyzer.visualize_3d(result, elev=30, azim=45, show=False)
    fig2.savefig('thermal_3d_surface.png', dpi=150)
    print("       ✓ 已保存: thermal_3d_surface.png")

    # 3. X方向温度剖面
    print("  [3/4] 生成 X方向温度剖面...")
    fig3 = analyzer.plot_temperature_profile(result, axis='x', show=False)
    fig3.savefig('thermal_profile_x.png', dpi=150)
    print("       ✓ 已保存: thermal_profile_x.png")

    # 4. Y方向温度剖面
    print("  [4/4] 生成 Y方向温度剖面...")
    fig4 = analyzer.plot_temperature_profile(result, axis='y', show=False)
    fig4.savefig('thermal_profile_y.png', dpi=150)
    print("       ✓ 已保存: thermal_profile_y.png")

    print("\n✓ 所有可视化已生成")


def generate_optimization_report(analyzer, result):
    """生成优化建议报告"""
    print("\n" + "=" * 60)
    print("优化分析")
    print("=" * 60)

    suggestions = analyzer.get_optimization_suggestions(result)

    if suggestions:
        print("\n⚠️  发现以下问题:")
        for i, sug in enumerate(suggestions, 1):
            print(f"\n  {i}. [{sug['type'].upper()}]")
            print(f"     {sug['description']}")
            print(f"     预期改善: {sug['improvement']:.1f}°C")
    else:
        print("\n✓ 热设计良好，无需优化")

    # 生成文本报告
    print("\n生成详细报告...")
    analyzer.generate_report(result, output='thermal_analysis_report.txt')


def compare_methods(analyzer):
    """比较不同分析方法"""
    print("\n" + "=" * 60)
    print("方法比较: FDM vs ML")
    print("=" * 60)

    import time

    # FDM分析
    print("\n执行 FDM 分析...")
    start_time = time.time()
    result_fdm = analyzer.analyze(method='fdm', max_iterations=500)
    fdm_time = time.time() - start_time
    print(f"  FDM 时间: {fdm_time:.3f}s")

    # ML分析（如果有训练好的模型）
    try:
        print("\n执行 ML 预测...")
        start_time = time.time()
        result_ml = analyzer.analyze(method='ml')
        ml_time = time.time() - start_time
        print(f"  ML 时间: {ml_time:.3f}s")
        print(f"  加速比: {fdm_time/ml_time:.1f}x")

        # 计算误差
        error = np.abs(result_fdm['temperature_grid'] - result_ml['temperature_grid'])
        print(f"\n  平均误差: {np.mean(error):.3f}°C")
        print(f"  最大误差: {np.max(error):.3f}°C")

        # 可视化比较
        fig, axes = plt.subplots(1, 3, figsize=(18, 5))

        # FDM
        im0 = axes[0].imshow(result_fdm['temperature_grid'], cmap='hot', origin='lower')
        axes[0].set_title(f'FDM ({fdm_time:.2f}s)')
        plt.colorbar(im0, ax=axes[0], label='°C')

        # ML
        im1 = axes[1].imshow(result_ml['temperature_grid'], cmap='hot', origin='lower')
        axes[1].set_title(f'ML ({ml_time:.2f}s)')
        plt.colorbar(im1, ax=axes[1], label='°C')

        # 误差
        im2 = axes[2].imshow(error, cmap='viridis', origin='lower')
        axes[2].set_title(f'Absolute Error (Avg: {np.mean(error):.2f}°C)')
        plt.colorbar(im2, ax=axes[2], label='°C')

        plt.tight_layout()
        plt.savefig('method_comparison.png', dpi=150)
        print("\n  ✓ 已保存比较图: method_comparison.png")

    except Exception as e:
        print(f"\n  ⚠️  ML预测跳过 (需要训练模型): {str(e)}")

    return result_fdm


def analyze_hotspots(result):
    """分析热点详情"""
    print("\n" + "=" * 60)
    print("热点分析")
    print("=" * 60)

    hotspots = result['hotspots']

    if hotspots:
        print(f"\n发现 {len(hotspots)} 个热点:")
        for i, hs in enumerate(hotspots, 1):
            print(f"\n  热点 {i}:")
            print(f"    位置: ({hs['x']:.1f}, {hs['y']:.1f}) mm")
            print(f"    最高温度: {hs['max_temp']:.1f}°C")
            print(f"    面积: {hs['area']:.1f} mm²")

            # 评估严重程度
            if hs['max_temp'] > 100:
                severity = "🔴 严重"
            elif hs['max_temp'] > 85:
                severity = "🟡 警告"
            else:
                severity = "🟢 正常"

            print(f"    状态: {severity}")
    else:
        print("\n✓ 未发现热点")


def create_summary_plot(analyzer, result):
    """创建综合摘要图"""
    print("\n创建综合摘要图...")

    fig = plt.figure(figsize=(16, 10))

    # 2D热图
    ax1 = plt.subplot(2, 2, 1)
    temp_grid = result['temperature_grid']
    im1 = ax1.imshow(temp_grid, cmap='hot', origin='lower',
                    extent=[0, analyzer.board_size[0], 0, analyzer.board_size[1]])
    plt.colorbar(im1, ax=ax1, label='Temperature (°C)')
    ax1.set_title('Temperature Distribution')
    ax1.set_xlabel('X (mm)')
    ax1.set_ylabel('Y (mm)')

    # 温度统计
    ax2 = plt.subplot(2, 2, 2)
    temps = temp_grid.flatten()
    ax2.hist(temps, bins=50, edgecolor='black', alpha=0.7)
    ax2.axvline(result['max_temp'], color='r', linestyle='--', label=f'Max: {result["max_temp"]:.1f}°C')
    ax2.axvline(result['avg_temp'], color='g', linestyle='--', label=f'Avg: {result["avg_temp"]:.1f}°C')
    ax2.set_xlabel('Temperature (°C)')
    ax2.set_ylabel('Pixel Count')
    ax2.set_title('Temperature Distribution')
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    # 元件功率分布
    ax3 = plt.subplot(2, 2, 3)
    heat_sources = analyzer.heat_sources
    names = [hs['name'] for hs in heat_sources]
    powers = [hs['power'] for hs in heat_sources]
    colors = plt.cm.YlOrRd(np.linspace(0.3, 0.9, len(powers)))

    bars = ax3.bar(range(len(names)), powers, color=colors, edgecolor='black')
    ax3.set_xticks(range(len(names)))
    ax3.set_xticklabels(names, rotation=45, ha='right')
    ax3.set_ylabel('Power (W)')
    ax3.set_title('Component Power Distribution')
    ax3.grid(True, alpha=0.3, axis='y')

    # 添加数值标签
    for bar in bars:
        height = bar.get_height()
        ax3.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.1f}W',
                ha='center', va='bottom', fontsize=9)

    # 关键参数摘要
    ax4 = plt.subplot(2, 2, 4)
    ax4.axis('off')

    summary_text = f"""
    PCB 热分析摘要
    {'='*40}

    板子尺寸: {analyzer.board_size[0]} × {analyzer.board_size[1]} mm
    分辨率: {analyzer.resolution} mm

    环境条件:
      • 环境温度: {analyzer.boundary_conditions['ambient_temp']}°C
      • 对流系数: {analyzer.boundary_conditions['convection_coeff']} W/(m²·K)

    分析结果:
      • 最高温度: {result['max_temp']:.1f}°C
      • 最低温度: {result['min_temp']:.1f}°C
      • 平均温度: {result['avg_temp']:.1f}°C
      • 温度范围: {result['max_temp'] - result['min_temp']:.1f}°C

    热源总功率: {sum(hs['power'] for hs in heat_sources):.1f} W
    热源数量: {len(heat_sources)}
    热点数量: {result['hotspot_count']}

    分析方法: {result['method'].upper()}
    """

    ax4.text(0.1, 0.5, summary_text, fontsize=10, family='monospace',
            verticalalignment='center')

    plt.tight_layout()
    plt.savefig('thermal_summary.png', dpi=150, bbox_inches='tight')
    print("  ✓ 已保存: thermal_summary.png")


def main():
    """主函数"""
    print("\n" + "🔥" * 30)
    print("PCB 热分析 - 综合示例")
    print("🔥" * 30 + "\n")

    # 1. 创建场景
    analyzer = create_power_supply_scenario()

    # 2. 执行FDM分析
    result = perform_fdm_analysis(analyzer)

    # 3. 生成可视化
    visualize_all_results(analyzer, result)

    # 4. 分析热点
    analyze_hotspots(result)

    # 5. 优化建议
    generate_optimization_report(analyzer, result)

    # 6. 创建摘要图
    create_summary_plot(analyzer, result)

    # 7. 方法比较（可选）
    # compare_methods(analyzer)

    print("\n" + "=" * 60)
    print("✓ 分析完成！")
    print("=" * 60)

    print("\n生成的文件:")
    files = [
        "thermal_2d_heatmap.png",
        "thermal_3d_surface.png",
        "thermal_profile_x.png",
        "thermal_profile_y.png",
        "thermal_summary.png",
        "thermal_analysis_report.txt"
    ]

    for f in files:
        print(f"  • {f}")

    print("\n" + "=" * 60)


if __name__ == '__main__':
    main()
