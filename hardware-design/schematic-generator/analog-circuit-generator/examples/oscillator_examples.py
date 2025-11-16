"""
振盪器電路設計範例
"""

import sys
sys.path.insert(0, '../src')

from oscillator_designer import RC_Oscillator, Timer555


def example_wien_bridge():
    """Wien Bridge 振盪器範例"""
    print("=== Wien Bridge 振盪器設計 ===\n")

    osc = RC_Oscillator()
    circuit = osc.design_wien_bridge(frequency=1000)  # 1kHz

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"運算放大器: {circuit['opamp_model']}")
    print(f"R: {circuit['R_formatted']}")
    print(f"C: {circuit['C_formatted']}")
    print(f"R1 (增益): {circuit['R1_gain']} Ω")
    print(f"R2 (增益): {circuit['R2_gain']} Ω")
    print(f"目標頻率: {circuit['target_frequency']} Hz")
    print(f"實際頻率: {circuit['actual_frequency']:.2f} Hz")
    print(f"實際增益: {circuit['actual_gain']:.3f} (需要 ≈ 3)")
    print(f"頻率誤差: {circuit['error_percent']:.2f}%")


def example_phase_shift():
    """相位移振盪器範例"""
    print("\n=== RC 相位移振盪器設計 ===\n")

    osc = RC_Oscillator()
    circuit = osc.design_phase_shift(frequency=5000)  # 5kHz

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"級數: {circuit['num_stages']}")
    print(f"運算放大器: {circuit['opamp_model']}")
    print(f"R: {circuit['R_formatted']}")
    print(f"C: {circuit['C_formatted']}")
    print(f"R1 (增益): {circuit['R1_gain']} Ω")
    print(f"R2 (增益): {circuit['R2_gain']} Ω")
    print(f"目標頻率: {circuit['target_frequency']} Hz")
    print(f"實際頻率: {circuit['actual_frequency']:.2f} Hz")
    print(f"實際增益: {circuit['actual_gain']:.3f} (需要 ≈ {circuit['required_gain']})")


def example_555_astable():
    """555 非穩態模式範例"""
    print("\n=== 555 定時器 Astable 模式 ===\n")

    timer = Timer555()
    circuit = timer.design_astable(frequency=1000, duty_cycle=0.6)

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"R1: {circuit['R1_formatted']}")
    print(f"R2: {circuit['R2_formatted']}")
    print(f"C: {circuit['C_formatted']}")
    print(f"目標頻率: {circuit['target_frequency']} Hz")
    print(f"實際頻率: {circuit['actual_frequency']:.2f} Hz")
    print(f"目標工作週期: {circuit['target_duty_cycle']*100:.1f}%")
    print(f"實際工作週期: {circuit['actual_duty_cycle']*100:.1f}%")
    print(f"頻率誤差: {circuit['freq_error_percent']:.2f}%")


def example_555_monostable():
    """555 單穩態模式範例"""
    print("\n=== 555 定時器 Monostable 模式 ===\n")

    timer = Timer555()
    circuit = timer.design_monostable(pulse_width=0.001)  # 1ms 脈衝

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"R: {circuit['R_formatted']}")
    print(f"C: {circuit['C_formatted']}")
    print(f"目標脈衝寬度: {circuit['target_pulse_width']*1000:.3f} ms")
    print(f"實際脈衝寬度: {circuit['actual_pulse_width']*1000:.3f} ms")
    print(f"誤差: {circuit['error_percent']:.2f}%")


def example_led_blinker():
    """LED 閃爍電路範例 (1Hz)"""
    print("\n=== LED 閃爍電路設計 (1Hz) ===\n")

    timer = Timer555()
    circuit = timer.design_astable(frequency=1, duty_cycle=0.5)

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"R1: {circuit['R1_formatted']}")
    print(f"R2: {circuit['R2_formatted']}")
    print(f"C: {circuit['C_formatted']}")
    print(f"頻率: {circuit['actual_frequency']:.3f} Hz")
    print(f"工作週期: {circuit['actual_duty_cycle']*100:.1f}%")
    print(f"\n這個電路可以讓 LED 每秒閃爍一次")


if __name__ == "__main__":
    example_wien_bridge()
    example_phase_shift()
    example_555_astable()
    example_555_monostable()
    example_led_blinker()

    print("\n" + "="*50)
    print("所有範例執行完成！")
    print("="*50)
