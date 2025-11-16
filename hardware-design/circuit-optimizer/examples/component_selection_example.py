"""
元件選擇範例
展示如何使用智能元件選擇器
"""

import sys
sys.path.insert(0, '../src')

from component_selector import ComponentSelector, ComponentSpec, ComponentCategory


def main():
    """主函數"""
    print("=" * 60)
    print("智能元件選擇器範例")
    print("=" * 60)
    print()

    # 創建選擇器
    selector = ComponentSelector()

    # 範例 1: 選擇電阻
    print("範例 1: 為 LED 限流選擇電阻")
    print("-" * 60)
    print("需求: 330Ω 電阻，0805 封裝，功率 0.125W\n")

    resistor = selector.recommend_resistor(
        resistance=330,
        power=0.125,
        tolerance=0.01,
        package="0805"
    )

    if resistor:
        print(f"✓ 推薦元件: {resistor.part_number}")
        print(f"  製造商: {resistor.manufacturer}")
        print(f"  描述: {resistor.description}")
        print(f"  阻值: {resistor.value:.0f}Ω")
        print(f"  功率: {resistor.power_rating}W")
        print(f"  價格: ${resistor.unit_price}")
        print(f"  匹配分數: {resistor.score:.1f}/100")
    else:
        print("✗ 找不到符合的元件")

    # 範例 2: 選擇去耦電容
    print("\n" + "=" * 60)
    print("範例 2: 為 MCU 選擇去耦電容")
    print("-" * 60)
    print("需求: 100nF 電容，耐壓 50V，0805 封裝\n")

    capacitor = selector.recommend_capacitor(
        capacitance=100e-9,  # 100nF
        voltage=50,
        package="0805"
    )

    if capacitor:
        print(f"✓ 推薦元件: {capacitor.part_number}")
        print(f"  製造商: {capacitor.manufacturer}")
        print(f"  描述: {capacitor.description}")
        print(f"  容值: {capacitor.value*1e9:.0f}nF")
        print(f"  耐壓: {capacitor.voltage_rating}V")
        print(f"  價格: ${capacitor.unit_price}")
        print(f"  匹配分數: {capacitor.score:.1f}/100")
    else:
        print("✗ 找不到符合的元件")

    # 範例 3: 選擇穩壓器
    print("\n" + "=" * 60)
    print("範例 3: 選擇 3.3V LDO 穩壓器")
    print("-" * 60)
    print("需求: 3.3V 輸出，1A 電流\n")

    regulator = selector.recommend_voltage_regulator(
        output_voltage=3.3,
        output_current=1.0
    )

    if regulator:
        print(f"✓ 推薦元件: {regulator.part_number}")
        print(f"  製造商: {regulator.manufacturer}")
        print(f"  描述: {regulator.description}")
        print(f"  輸出電壓: {regulator.value}V")
        print(f"  輸出電流: {regulator.current_rating}A")
        print(f"  價格: ${regulator.unit_price}")
        print(f"  匹配分數: {regulator.score:.1f}/100")
    else:
        print("✗ 找不到符合的元件")

    # 範例 4: 自定義規格搜尋
    print("\n" + "=" * 60)
    print("範例 4: 自定義規格搜尋")
    print("-" * 60)
    print("需求: 電容 >= 1uF，耐壓 >= 25V，成本 < $0.10\n")

    spec = ComponentSpec(
        category=ComponentCategory.CAPACITOR,
        value=1e-6,  # 1uF
        voltage_rating=25,
        max_cost=0.10
    )

    candidates = selector.select_component(spec, sort_by='score')

    print(f"找到 {len(candidates)} 個符合的元件:\n")
    for i, comp in enumerate(candidates[:5], 1):  # 顯示前 5 個
        print(f"{i}. {comp.part_number}")
        print(f"   容值: {comp.value*1e6:.1f}uF, 耐壓: {comp.voltage_rating}V")
        print(f"   價格: ${comp.unit_price}, 分數: {comp.score:.1f}")
        print()

    # 範例 5: 價格優先排序
    print("\n" + "=" * 60)
    print("範例 5: 以價格優先排序")
    print("-" * 60)
    print("需求: 10kΩ 電阻，按價格排序\n")

    spec = ComponentSpec(
        category=ComponentCategory.RESISTOR,
        value=10000,
        package="0805"
    )

    candidates = selector.select_component(spec, sort_by='price')

    print(f"找到 {len(candidates)} 個元件（按價格排序）:\n")
    for i, comp in enumerate(candidates[:3], 1):
        print(f"{i}. {comp.part_number} - ${comp.unit_price}")

    print("\n" + "=" * 60)
    print("範例執行完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()
