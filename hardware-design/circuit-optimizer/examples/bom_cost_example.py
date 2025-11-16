"""
BOM 成本優化範例
展示如何使用 BOM 優化器進行成本分析和優化
"""

import sys
sys.path.insert(0, '../src')

from bom_optimizer import BOMOptimizer, Component, create_sample_bom


def main():
    """主函數"""
    print("=" * 60)
    print("BOM 成本優化範例")
    print("=" * 60)
    print()

    # 方法 1: 使用範例 BOM
    print("方法 1: 使用預設範例 BOM\n")
    bom = create_sample_bom()
    print(bom.generate_report())

    # 方法 2: 手動創建 BOM
    print("\n" + "=" * 60)
    print("方法 2: 手動創建自訂 BOM\n")

    custom_bom = BOMOptimizer()

    # 添加元件
    components = [
        Component("ATmega328P", "8-bit AVR MCU", "Microchip", 1.50, 1, "IC", "TQFP-32", 0.98),
        Component("16MHz-Crystal", "16MHz Crystal", "Generic", 0.20, 1, "Passive", "HC-49S", 1.0),
        Component("0805-22pF", "Capacitor 22pF 0805", "Yageo", 0.01, 2, "Passive", "0805", 1.0),
        Component("0805-10uF", "Capacitor 10uF 0805", "Samsung", 0.05, 3, "Passive", "0805", 0.95),
        Component("0805-1K", "Resistor 1K 0805", "Yageo", 0.01, 5, "Passive", "0805", 1.0),
        Component("USB-Mini-B", "USB Mini-B Connector", "Korean Hroparts", 0.30, 1, "Connector", "SMD", 0.90),
    ]

    for comp in components:
        custom_bom.add_component(comp)

    # 生成報告
    print(custom_bom.generate_report())

    # 找出最貴的元件
    print("\n詳細分析:")
    expensive = custom_bom.find_expensive_components(3)
    print(f"\n前 3 個最貴的元件:")
    for i, comp in enumerate(expensive, 1):
        print(f"  {i}. {comp.part_number}: ${comp.total_cost:.2f}")
        print(f"     ({comp.quantity} x ${comp.unit_price:.2f})")

    # 價格斷點優化示範
    print("\n" + "=" * 60)
    print("價格斷點優化示範\n")

    # 假設的價格斷點
    price_breaks = {
        "0805-1K": [
            (1, 0.01),
            (100, 0.008),
            (1000, 0.005),
        ],
        "0805-10uF": [
            (1, 0.05),
            (100, 0.04),
            (500, 0.03),
        ]
    }

    original_cost = custom_bom.calculate_total_cost()
    optimized_cost = custom_bom.optimize_quantities(price_breaks)

    print(f"原始成本: ${original_cost:.2f}")
    print(f"優化後成本（考慮價格斷點）: ${optimized_cost:.2f}")
    print(f"節省: ${original_cost - optimized_cost:.2f} ({(1-optimized_cost/original_cost)*100:.1f}%)")

    # 匯出 BOM
    print("\n" + "=" * 60)
    print("匯出 BOM 到 CSV\n")
    custom_bom.export_to_csv("custom_bom_output.csv")

    print("\n範例執行完成！")


if __name__ == "__main__":
    main()
