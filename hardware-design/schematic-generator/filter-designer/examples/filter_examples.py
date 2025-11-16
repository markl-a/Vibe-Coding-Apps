"""
濾波器設計範例
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from active_filter import ActiveFilterDesigner, PassiveFilterDesigner


def example_lowpass():
    """低通濾波器範例"""
    print("=== 1kHz 低通濾波器 (Butterworth, 2階) ===\n")

    designer = ActiveFilterDesigner()
    circuit = designer.design_lowpass_butterworth(cutoff_frequency=1000, order=2, gain=1)

    print(f"濾波器類型: {circuit['filter_type']}")
    print(f"拓撲: {circuit['topology']}")
    print(f"階數: {circuit['order']}")
    print(f"截止頻率: {circuit['cutoff_frequency']} Hz")
    print(f"Q 值: {circuit['Q']:.3f}")
    print(f"R1: {circuit['R1']:.0f} Ω")
    print(f"R2: {circuit['R2']:.0f} Ω")
    print(f"C1: {circuit['C1']*1e9:.2f} nF")
    print(f"C2: {circuit['C2']*1e9:.2f} nF")
    print(f"運算放大器: {circuit['opamp']}")


def example_bandpass():
    """帶通濾波器範例"""
    print("\n=== 帶通濾波器 (中心頻率 1kHz, 帶寬 100Hz) ===\n")

    designer = ActiveFilterDesigner()
    circuit = designer.design_bandpass(center_frequency=1000, bandwidth=100, gain=1)

    print(f"濾波器類型: {circuit['filter_type']}")
    print(f"拓撲: {circuit['topology']}")
    print(f"中心頻率: {circuit['center_frequency']} Hz")
    print(f"帶寬: {circuit['bandwidth']} Hz")
    print(f"Q 值: {circuit['Q']:.2f}")
    print(f"R1: {circuit['R1']:.0f} Ω")
    print(f"R2: {circuit['R2']:.0f} Ω")
    print(f"R3: {circuit['R3']:.0f} Ω")
    print(f"C: {circuit['C']*1e9:.2f} nF")


def example_notch():
    """陷波濾波器範例"""
    print("\n=== 60Hz 陷波濾波器 (去除市電雜訊) ===\n")

    designer = ActiveFilterDesigner()
    circuit = designer.design_notch(notch_frequency=60, Q=10)

    print(f"濾波器類型: {circuit['filter_type']}")
    print(f"拓撲: {circuit['topology']}")
    print(f"陷波頻率: {circuit['notch_frequency']} Hz")
    print(f"Q 值: {circuit['Q']}")
    print(f"R1, R2: {circuit['R1']:.0f} Ω")
    print(f"R3: {circuit['R3']:.0f} Ω")
    print(f"C1, C2: {circuit['C1']*1e6:.2f} µF")
    print(f"C3: {circuit['C3']*1e6:.2f} µF")
    print(f"衰減: {circuit['attenuation_db']} dB")


def example_rc_filter():
    """簡單 RC 濾波器範例"""
    print("\n=== 簡單 RC 低通濾波器 (10kHz) ===\n")

    designer = PassiveFilterDesigner()
    circuit = designer.design_rc_lowpass(cutoff_frequency=10000)

    print(f"濾波器類型: {circuit['filter_type']}")
    print(f"階數: {circuit['order']}")
    print(f"截止頻率: {circuit['cutoff_frequency']} Hz")
    print(f"R: {circuit['R']:.0f} Ω")
    print(f"C: {circuit['C']*1e9:.2f} nF")
    print(f"衰減率: {circuit['attenuation_rate']}")


if __name__ == "__main__":
    example_lowpass()
    example_bandpass()
    example_notch()
    example_rc_filter()

    print("\n" + "="*50)
    print("所有範例執行完成！")
    print("="*50)
