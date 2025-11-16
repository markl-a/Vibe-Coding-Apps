"""
運算放大器電路設計範例
"""

import sys
sys.path.insert(0, '../src')

from amplifier_designer import OpAmpAmplifier


def example_non_inverting():
    """非反相放大器範例"""
    print("=== 非反相放大器設計 ===\n")

    amp = OpAmpAmplifier()
    circuit = amp.design_non_inverting(gain=10, input_impedance=10000)

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"運算放大器: {circuit['opamp_model']}")
    print(f"R1: {circuit['R1_formatted']}")
    print(f"R2: {circuit['R2_formatted']}")
    print(f"目標增益: {circuit['target_gain']}")
    print(f"實際增益: {circuit['actual_gain']:.3f}")
    print(f"誤差: {circuit['error_percent']:.2f}%")
    print(f"\nSPICE 網表:\n{circuit['netlist']}")


def example_inverting():
    """反相放大器範例"""
    print("\n=== 反相放大器設計 ===\n")

    amp = OpAmpAmplifier()
    circuit = amp.design_inverting(gain=-5, input_impedance=10000)

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"運算放大器: {circuit['opamp_model']}")
    print(f"R1: {circuit['R1_formatted']}")
    print(f"R2: {circuit['R2_formatted']}")
    print(f"目標增益: {circuit['target_gain']}")
    print(f"實際增益: {circuit['actual_gain']:.3f}")
    print(f"輸入阻抗: {circuit['input_impedance']} Ω")


def example_differential():
    """差動放大器範例"""
    print("\n=== 差動放大器設計 ===\n")

    amp = OpAmpAmplifier()
    circuit = amp.design_differential(gain=10, cmrr_requirement=60)

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"運算放大器: {circuit['opamp_model']}")
    print(f"R1: {circuit['R1_formatted']}")
    print(f"R2: {circuit['R2_formatted']}")
    print(f"R3: {circuit['R1_formatted']}")
    print(f"R4: {circuit['R2_formatted']}")
    print(f"差模增益: {circuit['actual_gain']:.3f}")
    print(f"預期 CMRR: {circuit['expected_cmrr_db']} dB")


def example_summing():
    """加法放大器範例"""
    print("\n=== 加法放大器設計 (3 輸入) ===\n")

    amp = OpAmpAmplifier()
    # 設計一個三輸入加法器: Vout = -(V1*1 + V2*2 + V3*0.5)
    circuit = amp.design_summing(gains=[-1, -2, -0.5])

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"運算放大器: {circuit['opamp_model']}")
    print(f"反饋電阻: {circuit['R_feedback']} Ω")
    print(f"輸入數量: {circuit['num_inputs']}")

    for i, (r, g_target, g_actual) in enumerate(zip(
        circuit['input_resistors'],
        circuit['target_gains'],
        circuit['actual_gains']
    ), 1):
        print(f"\n輸入 {i}:")
        print(f"  電阻: {r} Ω")
        print(f"  目標增益: {g_target}")
        print(f"  實際增益: {g_actual:.3f}")


if __name__ == "__main__":
    example_non_inverting()
    example_inverting()
    example_differential()
    example_summing()

    print("\n" + "="*50)
    print("所有範例執行完成！")
    print("="*50)
