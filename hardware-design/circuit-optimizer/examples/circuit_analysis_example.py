"""
电路分析功能使用示例
展示如何使用电路分析器进行各种电路分析
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.circuit_analyzer import CircuitAnalyzer, FrequencyAnalyzer
import numpy as np


def example_filters():
    """滤波器分析示例"""
    print("=" * 70)
    print("示例 1: 各种滤波器分析")
    print("=" * 70 + "\n")

    analyzer = CircuitAnalyzer()
    freq_analyzer = FrequencyAnalyzer()

    # RC 低通滤波器
    print("1.1 RC 低通滤波器")
    print("-" * 70)
    print("设计目标: 1kHz 截止频率")

    # 选择 R=1.6kΩ, C=100nF
    R = 1600
    C = 100e-9
    result = analyzer.analyze_rc_lowpass(R, C)

    print(f"元件: R={R}Ω, C={C*1e9:.0f}nF")
    print(f"实际截止频率: {result['fc']:.2f} Hz")
    print(f"在 100Hz 的衰减: {result['magnitude_db'][np.argmin(np.abs(result['frequencies'] - 100))]:.2f} dB")
    print(f"在 10kHz 的衰减: {result['magnitude_db'][np.argmin(np.abs(result['frequencies'] - 10000))]:.2f} dB")

    freq_analyzer.plot_bode(result, save_path="analysis_output/lowpass_bode.png")
    print("✓ 伯德图已生成\n")

    # RC 高通滤波器
    print("1.2 RC 高通滤波器")
    print("-" * 70)
    print("设计目标: 100Hz 截止频率")

    R = 16000
    C = 100e-9
    result = analyzer.analyze_rc_highpass(R, C)

    print(f"元件: R={R}Ω, C={C*1e9:.0f}nF")
    print(f"实际截止频率: {result['fc']:.2f} Hz")
    print(f"在 10Hz 的衰减: {result['magnitude_db'][np.argmin(np.abs(result['frequencies'] - 10))]:.2f} dB")
    print(f"在 1kHz 的衰减: {result['magnitude_db'][np.argmin(np.abs(result['frequencies'] - 1000))]:.2f} dB")

    freq_analyzer.plot_bode(result, save_path="analysis_output/highpass_bode.png")
    print("✓ 伯德图已生成\n")

    # RLC 带通滤波器
    print("1.3 RLC 带通滤波器")
    print("-" * 70)
    print("设计目标: 1kHz 中心频率, Q=10")

    f0_target = 1000
    Q_target = 10
    R = 100

    # 根据 Q = (1/R) * sqrt(L/C) 和 f0 = 1/(2π√LC) 计算 L 和 C
    L = 100e-3  # 100mH
    C = 1 / ((2 * np.pi * f0_target)**2 * L)

    result = analyzer.analyze_rlc_bandpass(R, L, C)

    print(f"元件: R={R}Ω, L={L*1000:.1f}mH, C={C*1e6:.2f}µF")
    print(f"谐振频率: {result['f0']:.2f} Hz")
    print(f"品质因数 Q: {result['Q']:.2f}")
    print(f"带宽: {result['BW']:.2f} Hz")
    print(f"下限频率: {result['f0'] - result['BW']/2:.2f} Hz")
    print(f"上限频率: {result['f0'] + result['BW']/2:.2f} Hz")

    freq_analyzer.plot_bode(result, save_path="analysis_output/bandpass_bode.png")
    print("✓ 伯德图已生成\n")


def example_opamp_circuits():
    """运放电路分析示例"""
    print("=" * 70)
    print("示例 2: 运放电路分析")
    print("=" * 70 + "\n")

    analyzer = CircuitAnalyzer()

    # 反相放大器
    print("2.1 反相放大器")
    print("-" * 70)
    print("设计目标: 增益 = -10")

    Rin = 1000
    Rf = 10000
    result = analyzer.analyze_opamp_inverting(Rf, Rin)

    print(f"元件: Rin={Rin}Ω, Rf={Rf}Ω")
    print(f"增益: {result['gain']:.2f} ({result['gain_db']:.2f} dB)")
    print(f"输入阻抗: {result['Zin']:.0f} Ω")
    print(f"输入电压 1V 时输出电压: {1 * result['gain']:.2f} V")
    print()

    # 非反相放大器
    print("2.2 非反相放大器")
    print("-" * 70)
    print("设计目标: 增益 = 11")

    Rin = 1000
    Rf = 10000
    result = analyzer.analyze_opamp_noninverting(Rf, Rin)

    print(f"元件: Rin={Rin}Ω, Rf={Rf}Ω")
    print(f"增益: {result['gain']:.2f} ({result['gain_db']:.2f} dB)")
    print(f"输入阻抗: 无穷大（理想运放）")
    print(f"输入电压 1V 时输出电压: {1 * result['gain']:.2f} V")
    print()

    # 电压跟随器
    print("2.3 电压跟随器（缓冲器）")
    print("-" * 70)

    result = analyzer.analyze_opamp_noninverting(Rf=0, Rin=1e10)  # Rf≈0, Rin≈∞
    print(f"增益: {result['gain']:.3f} ({result['gain_db']:.2f} dB)")
    print(f"用途: 高输入阻抗缓冲器，隔离负载")
    print()


def example_transient_analysis():
    """瞬态响应分析示例"""
    print("=" * 70)
    print("示例 3: RC 电路瞬态响应分析")
    print("=" * 70 + "\n")

    analyzer = CircuitAnalyzer()
    freq_analyzer = FrequencyAnalyzer()

    # 充电过程
    print("3.1 电容充电")
    print("-" * 70)
    print("场景: 5V 电源通过 1kΩ 电阻给 100µF 电容充电")

    R = 1000
    C = 100e-6
    result = analyzer.transient_response_rc(R, C, V_initial=0, V_final=5)

    print(f"时间常数 τ = RC = {result['tau']*1000:.2f} ms")
    print(f"到达 63.2% (3.16V) 时间: {result['t_63']*1000:.2f} ms")
    print(f"到达 95% (4.75V) 时间: {result['t_95']*1000:.2f} ms")
    print(f"到达 99% (4.95V) 时间: {result['t_99']*1000:.2f} ms")
    print(f"初始电流: {result['current'][0]*1000:.2f} mA")

    freq_analyzer.plot_transient(result, save_path="analysis_output/charging.png")
    print("✓ 充电曲线已生成\n")

    # 放电过程
    print("3.2 电容放电")
    print("-" * 70)
    print("场景: 5V 充电的 100µF 电容通过 1kΩ 电阻放电")

    result = analyzer.transient_response_rc(R, C, V_initial=5, V_final=0)

    print(f"时间常数 τ = RC = {result['tau']*1000:.2f} ms")
    print(f"下降到 36.8% (1.84V) 时间: {result['t_63']*1000:.2f} ms")
    print(f"下降到 5% (0.25V) 时间: {result['t_95']*1000:.2f} ms")
    print(f"初始放电电流: {abs(result['current'][0])*1000:.2f} mA")

    freq_analyzer.plot_transient(result, save_path="analysis_output/discharging.png")
    print("✓ 放电曲线已生成\n")


def example_power_electronics():
    """电源电路分析示例"""
    print("=" * 70)
    print("示例 4: 电源电路分析")
    print("=" * 70 + "\n")

    analyzer = CircuitAnalyzer()

    # 电压分压器
    print("4.1 电压分压器设计")
    print("-" * 70)
    print("设计目标: 将 5V 分压到 3.3V")

    # 使用 R1 和 R2 计算
    V_in = 5.0
    V_out_target = 3.3

    # 选择 R2 = 10kΩ, 计算 R1
    R2 = 10000
    R1 = R2 * (V_in - V_out_target) / V_out_target

    result = analyzer.analyze_voltage_divider(R1, R2, V_in)

    print(f"输入电压: {V_in}V")
    print(f"目标输出: {V_out_target}V")
    print(f"计算得 R1={R1:.0f}Ω, R2={R2}Ω")
    print(f"实际输出: {result['V_out']:.3f}V")
    print(f"误差: {abs(result['V_out'] - V_out_target)/V_out_target*100:.2f}%")
    print(f"分压器电流: {V_in/(R1+R2)*1000:.3f}mA")
    print()

    # 降压转换器
    print("4.2 降压（Buck）转换器")
    print("-" * 70)
    print("设计: 12V 转 5V")

    result = analyzer.analyze_buck_converter(V_in=12, V_out=5, efficiency=0.90)

    print(f"输入电压: {result['V_in']}V")
    print(f"输出电压: {result['V_out']}V")
    print(f"占空比: {result['duty_cycle_percent']:.1f}%")
    print(f"效率: {result['efficiency']*100:.0f}%")
    print(f"理论效率: {result['theoretical_efficiency']*100:.0f}%")
    print()

    # 功耗计算
    print("4.3 功耗计算")
    print("-" * 70)
    print("场景: LDO 稳压器 12V->5V, 500mA")

    V_in = 12
    V_out = 5
    I_out = 0.5

    input_power = analyzer.calculate_power_dissipation(V_in, I_out)
    output_power = analyzer.calculate_power_dissipation(V_out, I_out)

    loss = input_power['power'] - output_power['power']
    efficiency = output_power['power'] / input_power['power']

    print(f"输入功率: {input_power['power']:.2f}W")
    print(f"输出功率: {output_power['power']:.2f}W")
    print(f"功耗损失: {loss:.2f}W")
    print(f"效率: {efficiency*100:.1f}%")
    print(f"⚠ LDO 需要散热器！")
    print()


def example_design_calculations():
    """实际设计计算示例"""
    print("=" * 70)
    print("示例 5: 完整设计案例 - LED 驱动电路")
    print("=" * 70 + "\n")

    analyzer = CircuitAnalyzer()

    print("设计需求:")
    print("- 电源电压: 5V")
    print("- LED 正向电压: 2.0V")
    print("- LED 正向电流: 20mA")
    print("-" * 70)

    V_supply = 5.0
    V_led = 2.0
    I_led = 0.020

    # 计算限流电阻
    R = (V_supply - V_led) / I_led
    V_r = V_supply - V_led

    print(f"\n计算步骤:")
    print(f"1. 电阻压降: V_R = {V_supply}V - {V_led}V = {V_r}V")
    print(f"2. 限流电阻: R = {V_r}V / {I_led*1000}mA = {R:.0f}Ω")
    print(f"   → 选择标准值: 150Ω")

    # 使用标准值重新计算
    R_actual = 150
    I_actual = V_r / R_actual
    P_r = V_r * I_actual

    print(f"\n使用 {R_actual}Ω 电阻:")
    print(f"- 实际电流: {I_actual*1000:.2f}mA")
    print(f"- 电阻功耗: {P_r*1000:.2f}mW")
    print(f"- 推荐功率等级: {0.125 if P_r < 0.125 else 0.25}W (1/8W or 1/4W)")

    # LED 功耗
    P_led = V_led * I_actual
    print(f"- LED 功耗: {P_led*1000:.2f}mW")

    # 总功耗
    P_total = P_r + P_led
    print(f"- 总功耗: {P_total*1000:.2f}mW")

    # 效率
    efficiency = P_led / P_total
    print(f"- 电路效率: {efficiency*100:.1f}%")

    print("\n✓ 设计完成！元件清单:")
    print(f"  - 电阻: {R_actual}Ω, 1/4W")
    print(f"  - LED: 正向电压 2.0V, 20mA")
    print()


def main():
    """主函数"""
    print("\n")
    print("╔" + "=" * 68 + "╗")
    print("║" + " " * 20 + "电路分析示例" + " " * 20 + "║")
    print("╚" + "=" * 68 + "╝")
    print("\n")

    # 创建输出目录
    os.makedirs("analysis_output", exist_ok=True)

    # 运行所有示例
    example_filters()
    example_opamp_circuits()
    example_transient_analysis()
    example_power_electronics()
    example_design_calculations()

    print("=" * 70)
    print("所有电路分析示例运行完成！")
    print("输出文件保存在 analysis_output 目录中")
    print("=" * 70)
    print("\n生成的文件:")
    print("  - lowpass_bode.png     RC 低通滤波器伯德图")
    print("  - highpass_bode.png    RC 高通滤波器伯德图")
    print("  - bandpass_bode.png    RLC 带通滤波器伯德图")
    print("  - charging.png         电容充电曲线")
    print("  - discharging.png      电容放电曲线")
    print()


if __name__ == "__main__":
    main()
