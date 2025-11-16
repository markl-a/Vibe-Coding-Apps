"""
綜合範例
展示電路優化工具的完整功能
"""

import sys
sys.path.insert(0, '../src')

from optimizer import CircuitOptimizer
from bom_optimizer import Component
from component_selector import ComponentSpec, ComponentCategory
from power_analyzer import ComponentPower, PowerProfile, PowerMode


def main():
    """主函數"""
    print("=" * 70)
    print(" " * 20 + "電路優化工具 - 綜合示範")
    print("=" * 70)
    print()

    # 創建主優化器
    optimizer = CircuitOptimizer()

    # === 場景：優化一個物聯網感測器節點 ===
    print("場景：優化 IoT 環境監測節點")
    print("-" * 70)
    print()

    # 1. 添加 BOM 元件
    print("步驟 1: 建立 BOM")
    print("-" * 70)

    bom_components = [
        Component("STM32L072", "超低功耗 MCU", "STMicroelectronics", 2.80, 1, "IC", "LQFP-64", 0.95),
        Component("BME680", "環境感測器 (溫濕度/氣壓/VOC)", "Bosch", 4.50, 1, "Sensor", "LGA-8", 0.90),
        Component("NRF24L01+", "2.4GHz 無線模組", "Nordic", 1.20, 1, "IC", "QFN-20", 0.92),
        Component("MCP1700-33", "LDO 3.3V 250mA", "Microchip", 0.25, 1, "Power", "SOT-23", 1.0),
        Component("0805-10uF", "電容 10uF X7R", "Samsung", 0.05, 5, "Passive", "0805", 1.0),
        Component("0805-100nF", "電容 100nF X7R", "Murata", 0.02, 10, "Passive", "0805", 1.0),
        Component("0805-10K", "電阻 10K 1%", "Yageo", 0.01, 8, "Passive", "0805", 1.0),
        Component("LED-GREEN", "LED 綠色 0805", "Kingbright", 0.05, 1, "LED", "0805", 0.98),
    ]

    for comp in bom_components:
        optimizer.bom_optimizer.add_component(comp)

    print(f"✓ 已添加 {len(bom_components)} 個元件到 BOM")
    print()

    # 2. BOM 成本分析
    print("步驟 2: BOM 成本分析")
    print("-" * 70)

    cost_analysis = optimizer.analyze_bom_cost()
    print(f"總成本: ${cost_analysis['total_cost']:.2f}")
    print(f"\n成本分解:")
    for category, cost in sorted(cost_analysis['breakdown'].items(), key=lambda x: x[1], reverse=True):
        percentage = (cost / cost_analysis['total_cost']) * 100
        print(f"  {category:15} ${cost:6.2f} ({percentage:5.1f}%)")

    print(f"\n最貴的元件:")
    for i, comp in enumerate(cost_analysis['expensive_components'][:3], 1):
        print(f"  {i}. {comp.part_number:20} ${comp.total_cost:.2f}")
    print()

    # 3. 元件選擇建議
    print("步驟 3: 元件選擇建議")
    print("-" * 70)

    # 為電源去耦選擇電容
    print("需求: 選擇電源去耦電容 (100nF, 50V)")
    decoupling_cap = optimizer.recommend_component(
        ComponentSpec(
            category=ComponentCategory.CAPACITOR,
            value=100e-9,
            voltage_rating=50,
            package="0805"
        )
    )
    if decoupling_cap:
        print(f"✓ 推薦: {decoupling_cap.part_number}")
        print(f"  規格: {decoupling_cap.description}")
        print(f"  價格: ${decoupling_cap.unit_price}")
        print(f"  匹配分數: {decoupling_cap.score:.1f}/100")
    print()

    # 4. 功耗分析
    print("步驟 4: 功耗分析")
    print("-" * 70)

    power_components = [
        ComponentPower("STM32L072", "IC", 3.3, 0.003, 0.3),  # 3mA，30% 時間
        ComponentPower("BME680", "Sensor", 3.3, 0.012, 0.1),  # 12mA 測量時，10% 時間
        ComponentPower("NRF24L01+", "IC", 3.3, 0.013, 0.05),  # 13mA 傳輸時，5% 時間
        ComponentPower("MCP1700", "Power", 5.0, 0.002, 1.0),  # 靜態電流 2uA
        ComponentPower("LED", "LED", 3.3, 0.002, 0.1),  # 2mA，10% 時間
    ]

    for comp in power_components:
        optimizer.power_analyzer.add_component(comp)

    # 添加功耗模式
    power_profiles = [
        PowerProfile(PowerMode.ACTIVE, 3.3, 0.030, 0.05),  # 主動 5%
        PowerProfile(PowerMode.SLEEP, 3.3, 0.003, 0.90),   # 睡眠 90%
        PowerProfile(PowerMode.DEEP_SLEEP, 3.3, 0.0001, 0.05),  # 深度睡眠 5%
    ]

    for profile in power_profiles:
        optimizer.power_analyzer.add_power_profile(profile)

    power_analysis = optimizer.analyze_power()
    print(f"總功耗: {power_analysis['total_power']*1000:.2f} mW")
    print(f"平均功耗: {power_analysis['average_power']*1000:.2f} mW")

    print(f"\n功耗分解:")
    for category, power in sorted(power_analysis['breakdown'].items(), key=lambda x: x[1], reverse=True):
        percentage = (power / power_analysis['total_power']) * 100 if power_analysis['total_power'] > 0 else 0
        print(f"  {category:15} {power*1000:6.2f} mW ({percentage:5.1f}%)")

    # 電池續航估算
    print(f"\n電池續航估算:")
    battery_configs = [
        (1000, 3.7, "小型鋰電池"),
        (2500, 3.7, "18650 電池"),
    ]

    for capacity, voltage, name in battery_configs:
        hours, readable = optimizer.power_analyzer.estimate_battery_life(capacity, voltage)
        print(f"  {name:15} ({capacity}mAh): {readable}")

    print()

    # 5. 優化建議
    print("步驟 5: 優化建議")
    print("-" * 70)

    # 成本優化建議
    print("成本優化:")
    if cost_analysis['total_cost'] > 10:
        print("  • 總成本較高，建議:")
        print("    - 尋找 BME680 的替代感測器（如 DHT22 + BMP280）")
        print("    - 批量採購以獲得價格優惠")

    # 功耗優化建議
    print("\n功耗優化:")
    suggestions = optimizer.power_analyzer.suggest_power_optimizations()
    for suggestion in suggestions:
        lines = suggestion.split('\n')
        for line in lines:
            if line.strip():
                print(f"  {line}")

    print()

    # 6. 綜合報告
    print("步驟 6: 生成綜合報告")
    print("-" * 70)

    report = optimizer.generate_optimization_report()
    print(report)

    # 7. 設定優化目標並執行
    print("\n步驟 7: 執行多目標優化")
    print("-" * 70)

    optimizer.set_objectives({
        'cost': 'minimize',
        'power': 'minimize',
        'performance': 'maximize'
    })

    optimizer.add_constraints({
        'cost': {'max': 15},      # 最大成本 $15
        'power': {'max': 50},     # 最大功耗 50mW
    })

    result = optimizer.optimize(iterations=50)
    print(f"\n優化結果:")
    print(f"  成本: ${result.cost:.2f}")
    print(f"  功耗: {result.power:.2f} mW")
    print(f"  增益: {result.gain:.1f} dB")

    # 8. 總結
    print("\n" + "=" * 70)
    print("總結")
    print("=" * 70)
    print(f"✓ BOM 成本: ${cost_analysis['total_cost']:.2f}")
    print(f"✓ 平均功耗: {power_analysis['average_power']*1000:.2f} mW")
    print(f"✓ 預估續航 (1000mAh): {optimizer.power_analyzer.estimate_battery_life(1000, 3.7)[1]}")
    print(f"✓ 元件數量: {len(bom_components)}")
    print()
    print("專案已準備好進行原型製作！")
    print("=" * 70)


if __name__ == "__main__":
    main()
