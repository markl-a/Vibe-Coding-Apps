"""
電源供應器設計範例
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from smps_designer import BuckConverter, BoostConverter, BatteryCharger


def example_buck():
    """Buck 降壓轉換器範例"""
    print("=== Buck 降壓轉換器 (12V → 5V, 2A) ===\n")

    converter = BuckConverter()
    circuit = converter.design(
        input_voltage=12,
        output_voltage=5,
        output_current=2
    )

    print(f"轉換器類型: {circuit['converter_type'].upper()}")
    print(f"輸入電壓: {circuit['input_voltage']} V")
    print(f"輸出電壓: {circuit['output_voltage']} V")
    print(f"輸出電流: {circuit['output_current']} A")
    print(f"輸出功率: {circuit['output_power']} W")
    print(f"工作週期: {circuit['duty_cycle_percent']:.1f}%")
    print(f"開關頻率: {circuit['switching_frequency']/1000} kHz")
    print(f"電感值: {circuit['L']*1e6:.1f} µH")
    print(f"電容值: {circuit['C']*1e6:.1f} µF")
    print(f"預估效率: {circuit['efficiency']:.1f}%")
    print(f"推薦 IC: {circuit['recommended_ic']}")


def example_boost():
    """Boost 升壓轉換器範例"""
    print("\n=== Boost 升壓轉換器 (3.3V → 12V, 0.5A) ===\n")

    converter = BoostConverter()
    circuit = converter.design(
        input_voltage=3.3,
        output_voltage=12,
        output_current=0.5
    )

    print(f"轉換器類型: {circuit['converter_type'].upper()}")
    print(f"輸入電壓: {circuit['input_voltage']} V")
    print(f"輸出電壓: {circuit['output_voltage']} V")
    print(f"輸入電流: {circuit['input_current']:.2f} A")
    print(f"輸出電流: {circuit['output_current']} A")
    print(f"工作週期: {circuit['duty_cycle_percent']:.1f}%")
    print(f"電感值: {circuit['L']*1e6:.1f} µH")
    print(f"電容值: {circuit['C']*1e6:.1f} µF")
    print(f"預估效率: {circuit['efficiency']:.1f}%")
    print(f"推薦 IC: {circuit['recommended_ic']}")


def example_liion_charger():
    """鋰離子電池充電器範例"""
    print("\n=== 鋰離子電池充電器 (4.2V, 500mA) ===\n")

    charger = BatteryCharger()
    circuit = charger.design_liion_charger(
        battery_voltage=4.2,
        charge_current=0.5
    )

    print(f"充電器類型: {circuit['charger_type'].upper()}")
    print(f"電池電壓: {circuit['battery_voltage']} V")
    print(f"充電電流: {circuit['charge_current']} A")
    print(f"充電方式: {circuit['charge_method']}")
    print(f"推薦 IC: {circuit['ic_model']}")
    print(f"設定電阻: {circuit['R_prog']:.0f} Ω")
    print(f"截止電流: {circuit['termination_current']*1000:.0f} mA")
    print(f"保護功能:")
    for feature in circuit['protection_features']:
        print(f"  - {feature}")


def example_usb_to_battery():
    """USB 轉電池充電範例"""
    print("\n=== USB 鋰電池充電器 (5V USB → 4.2V Li-ion, 1A) ===\n")

    charger = BatteryCharger()
    circuit = charger.design_liion_charger(
        battery_voltage=4.2,
        charge_current=1.0
    )

    print(f"應用場景: 手機、行動電源充電")
    print(f"輸入: USB 5V")
    print(f"輸出: {circuit['battery_voltage']}V Li-ion")
    print(f"充電 IC: {circuit['ic_model']}")
    print(f"充電電流: {circuit['charge_current']} A")
    print(f"充電方式: {circuit['charge_method']}")
    print(f"充電指示: LED 指示燈")


if __name__ == "__main__":
    example_buck()
    example_boost()
    example_liion_charger()
    example_usb_to_battery()

    print("\n" + "="*50)
    print("所有範例執行完成！")
    print("="*50)
