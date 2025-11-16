"""
電壓穩壓器電路設計範例
"""

import sys
sys.path.insert(0, '../src')

from regulator_designer import LinearRegulator, ZenerRegulator


def example_fixed_ldo():
    """固定輸出 LDO 範例"""
    print("=== 固定輸出 LDO 穩壓器 (5V, 500mA) ===\n")

    reg = LinearRegulator()
    circuit = reg.design_ldo(
        input_voltage=12,
        output_voltage=5,
        output_current=0.5
    )

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"LDO IC: {circuit['ic_model']}")
    print(f"輸入電壓: {circuit['input_voltage']} V")
    print(f"輸出電壓: {circuit['output_voltage']} V")
    print(f"輸出電流: {circuit['output_current']} A")
    print(f"壓降: {circuit['dropout_voltage']} V")
    print(f"輸入電容: {circuit['C_in_formatted']}")
    print(f"輸出電容: {circuit['C_out_formatted']}")
    print(f"功耗: {circuit['power_dissipation']:.2f} W")
    print(f"效率: {circuit['efficiency_percent']:.1f}%")
    print(f"需要散熱片: {'是' if circuit['needs_heatsink'] else '否'}")


def example_3v3_ldo():
    """3.3V LDO 範例 (常用於微控制器)"""
    print("\n=== 3.3V LDO 穩壓器 (用於 MCU) ===\n")

    reg = LinearRegulator()
    circuit = reg.design_ldo(
        input_voltage=5,
        output_voltage=3.3,
        output_current=0.3
    )

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"LDO IC: {circuit['ic_model']}")
    print(f"輸入電壓: {circuit['input_voltage']} V (USB)")
    print(f"輸出電壓: {circuit['output_voltage']} V")
    print(f"輸出電流: {circuit['output_current']} A")
    print(f"輸入電容: {circuit['C_in_formatted']}")
    print(f"輸出電容: {circuit['C_out_formatted']}")
    print(f"功耗: {circuit['power_dissipation']:.2f} W")
    print(f"效率: {circuit['efficiency_percent']:.1f}%")


def example_adjustable_ldo():
    """可調式 LDO 範例 (LM317)"""
    print("\n=== 可調式 LDO 穩壓器 (LM317) ===\n")

    reg = LinearRegulator()
    circuit = reg.design_adjustable_ldo(
        input_voltage=15,
        output_voltage=9,
        output_current=0.5
    )

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"IC: {circuit['ic_model']}")
    print(f"R1: {circuit['R1_formatted']}")
    print(f"R2: {circuit['R2_formatted']}")
    print(f"輸入電容: {circuit['C_in']*1e9:.0f} nF")
    print(f"輸出電容: {circuit['C_out']*1e6:.0f} µF")
    print(f"ADJ 電容: {circuit['C_adj']*1e6:.0f} µF")
    print(f"目標輸出電壓: {circuit['target_output_voltage']} V")
    print(f"實際輸出電壓: {circuit['actual_output_voltage']:.2f} V")
    print(f"輸出電流: {circuit['output_current']} A")
    print(f"功耗: {circuit['power_dissipation']:.2f} W")
    print(f"效率: {circuit['efficiency_percent']:.1f}%")


def example_zener_regulator():
    """齊納穩壓器範例"""
    print("\n=== 齊納二極體穩壓器 ===\n")

    zener = ZenerRegulator()
    circuit = zener.design_simple_zener(
        input_voltage=12,
        output_voltage=5.1,
        output_current=0.020  # 20mA
    )

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"齊納二極體: {circuit['zener_model']}")
    print(f"齊納電壓: {circuit['zener_voltage']} V")
    print(f"限流電阻: {circuit['R_formatted']}")
    print(f"目標輸出電壓: {circuit['target_output_voltage']} V")
    print(f"輸出電流: {circuit['output_current']*1000:.1f} mA")
    print(f"齊納電流: {circuit['zener_current']*1000:.1f} mA")
    print(f"電阻功耗: {circuit['resistor_power']:.3f} W")
    print(f"齊納功耗: {circuit['zener_power']:.3f} W")
    print(f"\n⚠️  {circuit['warning']}")


def example_battery_charger():
    """電池充電器穩壓電路"""
    print("\n=== 電池充電器穩壓電路 (Li-ion 4.2V) ===\n")

    reg = LinearRegulator()
    circuit = reg.design_adjustable_ldo(
        input_voltage=5,  # USB 供電
        output_voltage=4.2,  # Li-ion 充電電壓
        output_current=0.5  # 500mA 充電電流
    )

    print(f"應用: 鋰離子電池充電器")
    print(f"IC: {circuit['ic_model']}")
    print(f"R1: {circuit['R1_formatted']}")
    print(f"R2: {circuit['R2_formatted']}")
    print(f"輸入: {circuit['target_output_voltage']} V (USB)")
    print(f"充電電壓: {circuit['actual_output_voltage']:.2f} V")
    print(f"充電電流: {circuit['output_current']} A")
    print(f"效率: {circuit['efficiency_percent']:.1f}%")
    print(f"\n注意: 實際充電器還需要電流限制和充電管理 IC")


if __name__ == "__main__":
    example_fixed_ldo()
    example_3v3_ldo()
    example_adjustable_ldo()
    example_zener_regulator()
    example_battery_charger()

    print("\n" + "="*50)
    print("所有範例執行完成！")
    print("="*50)
