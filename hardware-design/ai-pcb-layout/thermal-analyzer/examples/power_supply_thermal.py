"""
PCB 熱分析器範例
展示如何使用 ThermalAnalyzer 分析電源供應器的熱分布
"""

import sys
sys.path.insert(0, '../src')

from analyzer import ThermalAnalyzer
import numpy as np


def main():
    """主函數 - 電源供應器熱分析"""
    print("=" * 60)
    print("PCB 熱分析器 - 電源供應器範例")
    print("=" * 60)

    # 創建分析器
    print("\n[1] 創建熱分析器...")
    board_size = (100, 80)  # mm
    analyzer = ThermalAnalyzer(
        board_size=board_size,
        resolution=2.0,  # 2mm 網格解析度
        thickness=1.6,
        layers=2
    )

    print(f"    板子大小: {board_size[0]} x {board_size[1]} mm")
    print(f"    網格解析度: {analyzer.resolution} mm")
    print(f"    網格大小: {analyzer.grid_width} x {analyzer.grid_height}")
    print(f"    板子厚度: {analyzer.thickness} mm")

    # 設定邊界條件
    print("\n[2] 設定環境條件...")
    analyzer.set_boundary_conditions(
        ambient_temp=25.0,      # 環境溫度 25°C
        convection_coeff=10.0,  # 自然對流
        emissivity=0.9
    )

    print(f"    環境溫度: {analyzer.boundary_conditions['ambient_temp']} °C")
    print(f"    對流係數: {analyzer.boundary_conditions['convection_coeff']} W/(m²·K) (自然對流)")
    print(f"    發射率: {analyzer.boundary_conditions['emissivity']}")

    # 添加熱源 - 典型的電源供應器元件
    print("\n[3] 添加熱源元件...")

    heat_sources = [
        {
            'name': 'DC-DC Converter (Buck)',
            'x': 20, 'y': 40,
            'width': 10, 'height': 10,
            'power': 2.5  # 效率 90%, 25W 輸出 -> 2.5W 損耗
        },
        {
            'name': 'MOSFET Q1',
            'x': 50, 'y': 50,
            'width': 6, 'height': 6,
            'power': 1.2
        },
        {
            'name': 'MOSFET Q2',
            'x': 50, 'y': 35,
            'width': 6, 'height': 6,
            'power': 1.0
        },
        {
            'name': 'Inductor (DCR loss)',
            'x': 70, 'y': 40,
            'width': 8, 'height': 8,
            'power': 0.5
        },
        {
            'name': 'Linear Regulator',
            'x': 35, 'y': 20,
            'width': 5, 'height': 5,
            'power': 1.8  # 5V->3.3V, 0.5A -> 0.85W 損耗
        }
    ]

    total_power = 0
    for hs in heat_sources:
        analyzer.add_heat_source(
            x=hs['x'], y=hs['y'],
            width=hs['width'], height=hs['height'],
            power=hs['power'],
            name=hs['name']
        )
        total_power += hs['power']
        print(f"    添加 {hs['name']}: {hs['power']} W")

    print(f"\n    總功率損耗: {total_power:.1f} W")

    # 執行熱分析
    print("\n[4] 執行熱分析...")
    print("    使用有限差分法（FDM）求解穩態熱傳導方程...")

    result = analyzer.analyze(
        method='fdm',
        max_iterations=1000,
        convergence=0.01
    )

    # 顯示結果
    print(f"\n[5] 分析結果:")
    print(f"    最高溫度: {result['max_temp']:.1f} °C")
    print(f"    最低溫度: {result['min_temp']:.1f} °C")
    print(f"    平均溫度: {result['avg_temp']:.1f} °C")
    print(f"    溫度上升: {result['max_temp'] - 25:.1f} °C")
    print(f"    熱點數量: {result['hotspot_count']}")

    if result['hotspots']:
        print(f"\n    熱點詳情:")
        for i, hotspot in enumerate(result['hotspots'], 1):
            print(f"      熱點 {i}:")
            print(f"        位置: ({hotspot['x']:.1f}, {hotspot['y']:.1f}) mm")
            print(f"        最高溫度: {hotspot['max_temp']:.1f} °C")
            print(f"        面積: {hotspot['area']:.1f} mm²")

    # 溫度評估
    print(f"\n[6] 溫度評估:")
    max_temp = result['max_temp']

    if max_temp < 60:
        print(f"    ✓ 溫度良好 (<60°C)")
    elif max_temp < 75:
        print(f"    ⚠ 溫度偏高 (60-75°C)，建議監控")
    elif max_temp < 85:
        print(f"    ⚠ 溫度較高 (75-85°C)，建議改善散熱")
    else:
        print(f"    ✗ 溫度過高 (>85°C)，必須改善散熱！")

    # 獲取優化建議
    print(f"\n[7] 優化建議:")
    suggestions = analyzer.get_optimization_suggestions(result)

    if not suggestions:
        print("    ✓ 目前散熱設計良好，無需特別優化")
    else:
        for i, sug in enumerate(suggestions, 1):
            type_symbol = "✗" if sug['type'] == 'critical' else "⚠"
            print(f"    {i}. {type_symbol} [{sug['type'].upper()}]")
            print(f"       {sug['description']}")
            if 'improvement' in sug:
                print(f"       預期改善: {sug['improvement']:.1f}°C")

    # 生成報告
    print(f"\n[8] 生成分析報告...")
    analyzer.generate_report(result, output='thermal_report.txt')

    # 視覺化
    print(f"\n[9] 生成熱圖...")
    try:
        fig = analyzer.visualize_heatmap(result, colormap='hot', show=False)
        # 如果要顯示圖形，將 show 設為 True
        # fig.savefig('thermal_heatmap.png', dpi=300)
        print("    ✓ 熱圖生成完成")
    except Exception as e:
        print(f"    視覺化失敗: {e}")

    print("\n" + "=" * 60)
    print("範例執行完成！")
    print("=" * 60)


def high_power_led_example():
    """高功率 LED 驅動器熱分析範例"""
    print("\n" + "=" * 60)
    print("進階範例：高功率 LED 驅動器熱分析")
    print("=" * 60)

    # 創建分析器
    analyzer = ThermalAnalyzer(
        board_size=(80, 60),
        resolution=1.0,
        thickness=1.6,
        layers=2
    )

    print("\n場景：100W LED 驅動器")
    print("  - 輸入: 230VAC")
    print("  - 輸出: 30-36V, 2.8A")
    print("  - 效率: 92%")
    print("  - 功率損耗: 8W")

    # 添加熱源
    components = [
        {'name': 'Bridge Rectifier', 'x': 10, 'y': 30, 'w': 8, 'h': 8, 'power': 1.5},
        {'name': 'PFC Controller', 'x': 25, 'y': 30, 'w': 10, 'h': 10, 'power': 2.0},
        {'name': 'DC-DC Converter', 'x': 45, 'y': 30, 'w': 12, 'h': 12, 'power': 3.0},
        {'name': 'Output Diode', 'x': 65, 'y': 35, 'w': 6, 'h': 6, 'power': 0.8},
        {'name': 'Output Capacitor (ESR)', 'x': 65, 'y': 20, 'w': 5, 'h': 5, 'power': 0.3},
    ]

    print("\n添加元件:")
    for comp in components:
        analyzer.add_heat_source(
            x=comp['x'], y=comp['y'],
            width=comp['w'], height=comp['h'],
            power=comp['power'],
            name=comp['name']
        )
        print(f"  - {comp['name']}: {comp['power']} W")

    # 分析
    print("\n執行分析...")
    result = analyzer.analyze(method='fdm', max_iterations=1000)

    print(f"\n結果:")
    print(f"  最高溫度: {result['max_temp']:.1f} °C")
    print(f"  平均溫度: {result['avg_temp']:.1f} °C")

    # 建議
    suggestions = analyzer.get_optimization_suggestions(result)
    if suggestions:
        print(f"\n優化建議:")
        for sug in suggestions:
            print(f"  - {sug['description']}")


def thermal_relief_comparison():
    """熱散逸設計比較"""
    print("\n" + "=" * 60)
    print("進階範例：不同散熱設計比較")
    print("=" * 60)

    print("\n場景：同一顆 5W 功率 IC，不同散熱方案")

    scenarios = [
        {
            'name': '無散熱片',
            'convection': 10.0,  # 自然對流
            'note': '僅依靠 PCB 銅箔散熱'
        },
        {
            'name': '小型散熱片',
            'convection': 15.0,
            'note': '15x15x10mm 鋁擠散熱片'
        },
        {
            'name': '大型散熱片',
            'convection': 25.0,
            'note': '25x25x15mm 鋁擠散熱片'
        },
        {
            'name': '強制對流',
            'convection': 50.0,
            'note': '小型風扇，1 m/s 風速'
        }
    ]

    print("\n比較結果:")
    print(f"{'方案':<15} {'對流係數':<15} {'預估最高溫度':<15} {'說明':<30}")
    print("-" * 80)

    for scenario in scenarios:
        # 簡化計算（實際應該運行完整分析）
        # ΔT = P / (h * A)
        # 假設有效散熱面積 400 mm² = 0.0004 m²
        area = 0.0004
        power = 5.0
        delta_t = power / (scenario['convection'] * area)
        max_temp = 25 + delta_t

        print(f"{scenario['name']:<15} {scenario['convection']:<15.1f} "
              f"{max_temp:<15.1f} {scenario['note']:<30}")

    print("\n結論:")
    print("  • 適當的散熱設計可以顯著降低元件溫度")
    print("  • 高功率元件應優先考慮使用散熱片")
    print("  • 風扇可以大幅提升散熱效果")


def via_thermal_design():
    """熱過孔設計指南"""
    print("\n" + "=" * 60)
    print("進階範例：熱過孔設計指南")
    print("=" * 60)

    print("\n熱過孔（Thermal Via）的作用:")
    print("  • 將熱量從元件傳導到內層銅箔或背面")
    print("  • 增加有效散熱面積")
    print("  • 對於 QFN、DFN 等底部有散熱墊的封裝特別重要")

    print("\n設計建議:")
    print("  1. 過孔直徑: 0.3-0.5 mm")
    print("  2. 過孔間距: 0.8-1.2 mm")
    print("  3. 排列方式: 陣列排列")
    print("  4. 數量: 根據功率而定")

    print("\n熱過孔數量建議:")
    power_levels = [
        {'power': '< 1W', 'vias': '4-9', 'pattern': '2x2 或 3x3'},
        {'power': '1-3W', 'vias': '9-16', 'pattern': '3x3 或 4x4'},
        {'power': '3-5W', 'vias': '16-25', 'pattern': '4x4 或 5x5'},
        {'power': '> 5W', 'vias': '25+', 'pattern': '5x5 或更多'}
    ]

    print(f"\n{'功率範圍':<12} {'過孔數量':<12} {'建議排列':<15}")
    print("-" * 40)
    for level in power_levels:
        print(f"{level['power']:<12} {level['vias']:<12} {level['pattern']:<15}")

    print("\n注意事項:")
    print("  • 過孔應盡可能靠近熱源")
    print("  • 避免在過孔中填錫（會降低熱傳導）")
    print("  • 內層和背面應有足夠的銅箔面積")
    print("  • 考慮使用熱散逸焊盤設計")


if __name__ == "__main__":
    main()

    # 取消註解以執行進階範例
    # print("\n")
    # high_power_led_example()
    # print("\n")
    # thermal_relief_comparison()
    # print("\n")
    # via_thermal_design()
