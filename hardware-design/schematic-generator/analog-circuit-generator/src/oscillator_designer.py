"""
振盪器電路設計器
"""

import math
from typing import Dict
from component_library import E_Series, CapacitorLibrary, OpAmpLibrary


class RC_Oscillator:
    """RC 振盪器設計類別"""

    def design_wien_bridge(self, frequency: float,
                          series: str = 'E24') -> Dict:
        """
        設計 Wien Bridge 振盪器

        振盪頻率: f = 1 / (2π * R * C)
        增益要求: Av = 3 (for oscillation)

        Args:
            frequency: 目標頻率 (Hz)
            series: E-Series 標準值系列

        Returns:
            電路參數字典
        """
        # 選擇電容值 (通常選擇 10nF - 100nF)
        if frequency > 10000:
            C_ideal = 10e-9  # 10nF for high freq
        elif frequency > 1000:
            C_ideal = 100e-9  # 100nF for mid freq
        else:
            C_ideal = 1e-6  # 1µF for low freq

        # 計算電阻值
        # f = 1 / (2π * R * C)
        # R = 1 / (2π * f * C)
        R_ideal = 1 / (2 * math.pi * frequency * C_ideal)

        # 使用標準值
        C_std = CapacitorLibrary.nearest_value(C_ideal)
        R_std = E_Series.nearest_value(R_ideal, series)[0]

        # 實際頻率
        actual_frequency = 1 / (2 * math.pi * R_std * C_std)

        # Wien Bridge 需要增益 = 3
        # 使用非反相放大器: Av = 1 + (R2/R1)
        # 所以 R2/R1 = 2
        R1_gain = 10000  # 10kΩ
        R2_gain = 20000  # 20kΩ

        R1_gain_std = E_Series.nearest_value(R1_gain, series)[0]
        R2_gain_std = E_Series.nearest_value(R2_gain, series)[0]

        actual_gain = 1 + (R2_gain_std / R1_gain_std)

        opamp = OpAmpLibrary.select_opamp(
            min_gbw=frequency * 100,  # GBW 至少要頻率的 100 倍
            supply_voltage=15
        )

        return {
            'circuit_type': 'wien_bridge_oscillator',
            'R': R_std,
            'C': C_std,
            'R1_gain': R1_gain_std,
            'R2_gain': R2_gain_std,
            'target_frequency': frequency,
            'actual_frequency': actual_frequency,
            'actual_gain': actual_gain,
            'error_percent': abs(actual_frequency - frequency) / frequency * 100,
            'opamp_model': opamp,
            'R_formatted': E_Series.format_value(R_std),
            'C_formatted': CapacitorLibrary.format_value(C_std),
        }

    def design_phase_shift(self, frequency: float,
                          num_stages: int = 3,
                          series: str = 'E24') -> Dict:
        """
        設計 RC 相位移振盪器

        3-stage: f = 1 / (2π * R * C * √6)
        gain requirement: Av = 29

        Args:
            frequency: 目標頻率 (Hz)
            num_stages: RC 級數 (通常是 3)
            series: E-Series 標準值系列

        Returns:
            電路參數字典
        """
        if num_stages != 3:
            raise ValueError("目前只支援 3-stage 相位移振盪器")

        # 選擇電容值
        if frequency > 10000:
            C_ideal = 10e-9  # 10nF
        elif frequency > 1000:
            C_ideal = 100e-9  # 100nF
        else:
            C_ideal = 1e-6  # 1µF

        # 3-stage 公式: f = 1 / (2π * R * C * √6)
        R_ideal = 1 / (2 * math.pi * frequency * C_ideal * math.sqrt(6))

        # 使用標準值
        C_std = CapacitorLibrary.nearest_value(C_ideal)
        R_std = E_Series.nearest_value(R_ideal, series)[0]

        # 實際頻率
        actual_frequency = 1 / (2 * math.pi * R_std * C_std * math.sqrt(6))

        # 增益要求: Av = 29 for 3-stage
        R1_gain = 1000  # 1kΩ
        R2_gain = 28000  # 28kΩ (Av ≈ 29)

        R1_gain_std = E_Series.nearest_value(R1_gain, series)[0]
        R2_gain_std = E_Series.nearest_value(R2_gain, series)[0]

        actual_gain = 1 + (R2_gain_std / R1_gain_std)

        opamp = OpAmpLibrary.select_opamp(
            min_gbw=frequency * 100,
            supply_voltage=15
        )

        return {
            'circuit_type': 'phase_shift_oscillator',
            'num_stages': num_stages,
            'R': R_std,
            'C': C_std,
            'R1_gain': R1_gain_std,
            'R2_gain': R2_gain_std,
            'target_frequency': frequency,
            'actual_frequency': actual_frequency,
            'actual_gain': actual_gain,
            'required_gain': 29,
            'error_percent': abs(actual_frequency - frequency) / frequency * 100,
            'opamp_model': opamp,
            'R_formatted': E_Series.format_value(R_std),
            'C_formatted': CapacitorLibrary.format_value(C_std),
        }


class Timer555:
    """555 定時器電路設計類別"""

    def design_astable(self, frequency: float,
                      duty_cycle: float = 0.5,
                      series: str = 'E24') -> Dict:
        """
        設計 555 非穩態模式 (Astable) 電路

        f = 1.44 / ((R1 + 2*R2) * C)
        duty_cycle = (R1 + R2) / (R1 + 2*R2)

        Args:
            frequency: 目標頻率 (Hz)
            duty_cycle: 工作週期 (0-1)
            series: E-Series 標準值系列

        Returns:
            電路參數字典
        """
        if not 0.5 <= duty_cycle <= 1.0:
            raise ValueError("555 astable 工作週期必須在 0.5-1.0 之間")

        # 選擇電容值
        if frequency > 100000:
            C_ideal = 1e-9  # 1nF
        elif frequency > 10000:
            C_ideal = 10e-9  # 10nF
        elif frequency > 1000:
            C_ideal = 100e-9  # 100nF
        else:
            C_ideal = 1e-6  # 1µF

        # 從工作週期計算 R1/R2 比例
        # duty_cycle = (R1 + R2) / (R1 + 2*R2)
        # 解得: R1 = R2 * (2*duty_cycle - 1) / (1 - duty_cycle)

        # 先選 R2
        R2_ideal = 10000  # 10kΩ

        if duty_cycle > 0.5:
            R1_ideal = R2_ideal * (2 * duty_cycle - 1) / (1 - duty_cycle)
        else:
            R1_ideal = 1000  # 最小值

        # 從頻率調整總電阻
        # f = 1.44 / ((R1 + 2*R2) * C)
        total_R_needed = 1.44 / (frequency * C_ideal)

        # 按比例縮放
        scale = total_R_needed / (R1_ideal + 2 * R2_ideal)
        R1_ideal *= scale
        R2_ideal *= scale

        # 使用標準值
        C_std = CapacitorLibrary.nearest_value(C_ideal)
        R1_std = E_Series.nearest_value(R1_ideal, series)[0]
        R2_std = E_Series.nearest_value(R2_ideal, series)[0]

        # 實際頻率和工作週期
        actual_frequency = 1.44 / ((R1_std + 2 * R2_std) * C_std)
        actual_duty_cycle = (R1_std + R2_std) / (R1_std + 2 * R2_std)

        return {
            'circuit_type': '555_astable',
            'R1': R1_std,
            'R2': R2_std,
            'C': C_std,
            'target_frequency': frequency,
            'actual_frequency': actual_frequency,
            'target_duty_cycle': duty_cycle,
            'actual_duty_cycle': actual_duty_cycle,
            'freq_error_percent': abs(actual_frequency - frequency) / frequency * 100,
            'R1_formatted': E_Series.format_value(R1_std),
            'R2_formatted': E_Series.format_value(R2_std),
            'C_formatted': CapacitorLibrary.format_value(C_std),
        }

    def design_monostable(self, pulse_width: float,
                         series: str = 'E24') -> Dict:
        """
        設計 555 單穩態模式 (Monostable) 電路

        T = 1.1 * R * C

        Args:
            pulse_width: 脈衝寬度 (秒)
            series: E-Series 標準值系列

        Returns:
            電路參數字典
        """
        # 選擇電容值
        if pulse_width < 0.001:
            C_ideal = 1e-9  # 1nF
        elif pulse_width < 0.01:
            C_ideal = 10e-9  # 10nF
        elif pulse_width < 0.1:
            C_ideal = 100e-9  # 100nF
        else:
            C_ideal = 1e-6  # 1µF

        # 計算電阻: T = 1.1 * R * C
        R_ideal = pulse_width / (1.1 * C_ideal)

        # 使用標準值
        C_std = CapacitorLibrary.nearest_value(C_ideal)
        R_std = E_Series.nearest_value(R_ideal, series)[0]

        # 實際脈衝寬度
        actual_pulse_width = 1.1 * R_std * C_std

        return {
            'circuit_type': '555_monostable',
            'R': R_std,
            'C': C_std,
            'target_pulse_width': pulse_width,
            'actual_pulse_width': actual_pulse_width,
            'error_percent': abs(actual_pulse_width - pulse_width) / pulse_width * 100,
            'R_formatted': E_Series.format_value(R_std),
            'C_formatted': CapacitorLibrary.format_value(C_std),
        }
