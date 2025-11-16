"""
功耗分析範例
展示如何使用功耗分析器進行電路功耗分析和優化
"""

import sys
sys.path.insert(0, '../src')

from power_analyzer import PowerAnalyzer, ComponentPower, PowerProfile, PowerMode


def main():
    """主函數"""
    print("=" * 60)
    print("功耗分析範例")
    print("=" * 60)
    print()

    # === 範例 1: 簡單 IoT 設備功耗分析 ===
    print("範例 1: IoT 感測器節點功耗分析")
    print("-" * 60)
    print()

    analyzer1 = PowerAnalyzer()

    # 添加元件
    components = [
        ComponentPower("STM32L0", "IC", 3.3, 0.003, 1.0),  # 低功耗 MCU，3mA
        ComponentPower("BME280", "Sensor", 3.3, 0.003, 0.1),  # 溫濕度感測器，3mA，10% 工作週期
        ComponentPower("NRF24L01", "IC", 3.3, 0.013, 0.05),  # 無線模組，13mA，5% 工作週期
        ComponentPower("LDO", "Power", 5.0, 0.001, 1.0),  # LDO 靜態電流 1mA
    ]

    for comp in components:
        analyzer1.add_component(comp)

    # 生成報告
    print(analyzer1.generate_report())

    # 電池續航估算
    print("\n電池續航分析:")
    print("-" * 60)

    battery_configs = [
        (500, 3.7, "CR2032 等效"),
        (1000, 3.7, "小型鋰電池"),
        (2500, 3.7, "18650 電池"),
    ]

    for capacity, voltage, name in battery_configs:
        hours, readable = analyzer1.estimate_battery_life(capacity, voltage)
        print(f"{name:20} ({capacity}mAh): {readable}")

    # === 範例 2: 可穿戴設備功耗分析 ===
    print("\n" + "=" * 60)
    print("範例 2: 智能手環功耗分析（考慮工作模式）")
    print("-" * 60)
    print()

    analyzer2 = PowerAnalyzer()

    # 添加元件
    smartband_components = [
        ComponentPower("MCU", "IC", 3.3, 0.010, 0.3),  # MCU 10mA，30% 時間
        ComponentPower("HR_Sensor", "Sensor", 3.3, 0.002, 0.2),  # 心率感測器 2mA，20% 時間
        ComponentPower("Accelerometer", "Sensor", 3.3, 0.002, 0.5),  # 加速度計 2mA，50% 時間
        ComponentPower("OLED", "Display", 3.3, 0.015, 0.05),  # OLED 15mA，5% 時間
        ComponentPower("BLE", "IC", 3.3, 0.008, 0.1),  # 藍牙 8mA，10% 時間
        ComponentPower("Vibrator", "Actuator", 3.3, 0.050, 0.01),  # 震動馬達 50mA，1% 時間
    ]

    for comp in smartband_components:
        analyzer2.add_component(comp)

    # 添加功耗模式
    profiles = [
        PowerProfile(PowerMode.ACTIVE, 3.3, 0.050, 0.20),  # 主動模式 20%
        PowerProfile(PowerMode.SLEEP, 3.3, 0.005, 0.75),   # 睡眠模式 75%
        PowerProfile(PowerMode.DEEP_SLEEP, 3.3, 0.0005, 0.05),  # 深度睡眠 5%
    ]

    for profile in profiles:
        analyzer2.add_power_profile(profile)

    # 生成報告
    print(analyzer2.generate_report())

    # === 範例 3: 功耗模式優化 ===
    print("\n" + "=" * 60)
    print("範例 3: 功耗模式優化分析")
    print("-" * 60)
    print()

    analyzer3 = PowerAnalyzer()

    # 典型的嵌入式系統
    system_components = [
        ComponentPower("MainMCU", "IC", 3.3, 0.080, 1.0),
        ComponentPower("Flash", "Memory", 3.3, 0.010, 0.1),
        ComponentPower("Sensor", "Sensor", 3.3, 0.005, 0.1),
    ]

    for comp in system_components:
        analyzer3.add_component(comp)

    print("情境分析：設備每小時只需主動工作 1 分鐘\n")

    active_percentages = [1.67, 5, 10, 50, 100]  # 不同的主動時間百分比

    print(f"{'主動時間%':<12} {'無優化 (mW)':<15} {'睡眠模式 (mW)':<18} {'深度睡眠 (mW)':<18} {'節省%':<10}")
    print("-" * 75)

    for active_pct in active_percentages:
        scenarios = analyzer3.optimize_power_modes(active_time_percent=active_pct/100)
        no_opt = scenarios["無優化"] * 1000
        with_sleep = scenarios["使用睡眠模式"] * 1000
        with_deep = scenarios["使用深度睡眠"] * 1000
        savings = (1 - with_deep/no_opt) * 100

        print(f"{active_pct:<12.1f} {no_opt:<15.2f} {with_sleep:<18.2f} {with_deep:<18.2f} {savings:<10.1f}")

    # === 範例 4: 實際應用 - WiFi 設備優化 ===
    print("\n" + "=" * 60)
    print("範例 4: WiFi 感測器設備優化建議")
    print("-" * 60)
    print()

    analyzer4 = PowerAnalyzer()

    # WiFi 設備元件
    wifi_components = [
        ComponentPower("ESP32", "IC", 3.3, 0.160, 0.1),  # WiFi 傳輸時 160mA
        ComponentPower("ESP32_Idle", "IC", 3.3, 0.040, 0.9),  # 待機時 40mA
        ComponentPower("Sensor", "Sensor", 3.3, 0.010, 1.0),  # 感測器持續運行
        ComponentPower("LDO", "Power", 5.0, 0.003, 1.0),
    ]

    for comp in wifi_components:
        analyzer4.add_component(comp)

    print("當前配置:")
    print(f"  總功耗: {analyzer4.calculate_total_power()*1000:.2f} mW")

    print("\n優化建議:")
    suggestions = analyzer4.suggest_power_optimizations()
    for i, suggestion in enumerate(suggestions, 1):
        print(f"\n{i}. {suggestion}")

    # 計算優化效果
    print("\n優化效果預估:")
    print("-" * 60)

    # 原始功耗
    original = analyzer4.calculate_total_power()

    # 使用深度睡眠後的功耗
    # 假設可以將 90% 的時間進入深度睡眠 (10uA)
    optimized = (
        0.1 * (0.160 + 0.010 + 0.003) * 3.3 +  # 10% 主動傳輸
        0.9 * (0.00001 + 0.010 + 0.003) * 3.3  # 90% 深度睡眠
    )

    print(f"原始平均功耗: {original*1000:.2f} mW")
    print(f"優化後功耗: {optimized*1000:.2f} mW")
    print(f"節省: {(1-optimized/original)*100:.1f}%")

    # 電池續航對比
    battery_mah = 2000
    battery_v = 3.7

    _, orig_life = analyzer4.estimate_battery_life(battery_mah, battery_v)

    # 計算優化後的續航
    battery_wh = (battery_mah / 1000) * battery_v
    opt_hours = battery_wh / optimized
    if opt_hours < 24:
        opt_life = f"{opt_hours:.1f} 小時"
    else:
        opt_life = f"{opt_hours/24:.1f} 天"

    print(f"\n電池續航 (2000mAh):")
    print(f"  優化前: {orig_life}")
    print(f"  優化後: {opt_life}")

    print("\n" + "=" * 60)
    print("範例執行完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()
