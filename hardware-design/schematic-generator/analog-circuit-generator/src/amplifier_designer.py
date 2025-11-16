"""
運算放大器電路設計器
"""

import math
from typing import Dict, Optional
from component_library import E_Series, OpAmpLibrary


class OpAmpAmplifier:
    """運算放大器電路設計類別"""

    def __init__(self, supply_voltage: float = 15):
        """
        初始化放大器設計器

        Args:
            supply_voltage: 電源電壓 (V)
        """
        self.supply_voltage = supply_voltage

    def design_non_inverting(self, gain: float,
                           input_impedance: float = 10000,
                           series: str = 'E24') -> Dict:
        """
        設計非反相放大器

        非反相放大器增益公式: Av = 1 + (R2/R1)

        Args:
            gain: 目標增益
            input_impedance: 輸入阻抗 (Ω)
            series: E-Series 標準值系列

        Returns:
            電路參數字典
        """
        if gain < 1:
            raise ValueError("非反相放大器增益必須 ≥ 1")

        # 選擇 R1 (通常選擇 10kΩ)
        R1 = 10000

        # 計算 R2
        R2_ideal = R1 * (gain - 1)

        # 使用標準值
        R1_std = E_Series.nearest_value(R1, series)[0]
        R2_std = E_Series.nearest_value(R2_ideal, series)[0]

        # 實際增益
        actual_gain = 1 + (R2_std / R1_std)

        # 選擇合適的 OpAmp
        opamp = OpAmpLibrary.select_opamp(supply_voltage=self.supply_voltage)

        # 生成 SPICE 網表
        netlist = self._generate_spice_netlist(
            circuit_type='non_inverting',
            opamp_model=opamp,
            R1=R1_std,
            R2=R2_std
        )

        return {
            'circuit_type': 'non_inverting_amplifier',
            'R1': R1_std,
            'R2': R2_std,
            'target_gain': gain,
            'actual_gain': actual_gain,
            'error_percent': abs(actual_gain - gain) / gain * 100,
            'opamp_model': opamp,
            'input_impedance': input_impedance,
            'R1_formatted': E_Series.format_value(R1_std),
            'R2_formatted': E_Series.format_value(R2_std),
            'netlist': netlist
        }

    def design_inverting(self, gain: float,
                        input_impedance: float = 10000,
                        series: str = 'E24') -> Dict:
        """
        設計反相放大器

        反相放大器增益公式: Av = -(R2/R1)

        Args:
            gain: 目標增益 (負值)
            input_impedance: 輸入阻抗 (Ω)
            series: E-Series 標準值系列

        Returns:
            電路參數字典
        """
        gain_magnitude = abs(gain)

        # R1 決定輸入阻抗
        R1 = input_impedance

        # 計算 R2
        R2_ideal = R1 * gain_magnitude

        # 使用標準值
        R1_std = E_Series.nearest_value(R1, series)[0]
        R2_std = E_Series.nearest_value(R2_ideal, series)[0]

        # 實際增益
        actual_gain = -(R2_std / R1_std)

        # 選擇合適的 OpAmp
        opamp = OpAmpLibrary.select_opamp(supply_voltage=self.supply_voltage)

        # 生成 SPICE 網表
        netlist = self._generate_spice_netlist(
            circuit_type='inverting',
            opamp_model=opamp,
            R1=R1_std,
            R2=R2_std
        )

        return {
            'circuit_type': 'inverting_amplifier',
            'R1': R1_std,
            'R2': R2_std,
            'target_gain': gain,
            'actual_gain': actual_gain,
            'error_percent': abs(abs(actual_gain) - gain_magnitude) / gain_magnitude * 100,
            'opamp_model': opamp,
            'input_impedance': R1_std,
            'R1_formatted': E_Series.format_value(R1_std),
            'R2_formatted': E_Series.format_value(R2_std),
            'netlist': netlist
        }

    def design_differential(self, gain: float,
                          cmrr_requirement: float = 60,
                          series: str = 'E24') -> Dict:
        """
        設計差動放大器

        Args:
            gain: 差模增益
            cmrr_requirement: 共模抑制比要求 (dB)
            series: E-Series 標準值系列

        Returns:
            電路參數字典
        """
        # 基本差動放大器需要 4 個電阻
        # Av = R2/R1 (當 R3=R1, R4=R2 時)

        R1 = 10000  # 輸入電阻
        R2_ideal = R1 * gain

        # 使用標準值
        R1_std = E_Series.nearest_value(R1, series)[0]
        R2_std = E_Series.nearest_value(R2_ideal, series)[0]

        # 為了良好的 CMRR，R3=R1, R4=R2
        R3_std = R1_std
        R4_std = R2_std

        actual_gain = R2_std / R1_std

        opamp = OpAmpLibrary.select_opamp(supply_voltage=self.supply_voltage)

        return {
            'circuit_type': 'differential_amplifier',
            'R1': R1_std,
            'R2': R2_std,
            'R3': R3_std,
            'R4': R4_std,
            'target_gain': gain,
            'actual_gain': actual_gain,
            'opamp_model': opamp,
            'R1_formatted': E_Series.format_value(R1_std),
            'R2_formatted': E_Series.format_value(R2_std),
            'expected_cmrr_db': cmrr_requirement
        }

    def design_summing(self, gains: list,
                      series: str = 'E24') -> Dict:
        """
        設計加法放大器

        Vout = -(V1*R_f/R1 + V2*R_f/R2 + ...)

        Args:
            gains: 各輸入的增益列表
            series: E-Series 標準值系列

        Returns:
            電路參數字典
        """
        # 選擇反饋電阻 R_f
        R_f = 100000  # 100kΩ

        input_resistors = []
        for gain in gains:
            if gain == 0:
                continue
            R_in_ideal = R_f / abs(gain)
            R_in_std = E_Series.nearest_value(R_in_ideal, series)[0]
            input_resistors.append(R_in_std)

        R_f_std = E_Series.nearest_value(R_f, series)[0]

        opamp = OpAmpLibrary.select_opamp(supply_voltage=self.supply_voltage)

        return {
            'circuit_type': 'summing_amplifier',
            'R_feedback': R_f_std,
            'input_resistors': input_resistors,
            'target_gains': gains,
            'actual_gains': [-R_f_std/R for R in input_resistors],
            'opamp_model': opamp,
            'num_inputs': len(input_resistors)
        }

    def _generate_spice_netlist(self, circuit_type: str,
                               opamp_model: str,
                               **components) -> str:
        """生成 SPICE 網表"""

        if circuit_type == 'non_inverting':
            netlist = f"""* Non-Inverting Amplifier
* Using {opamp_model}
.include {opamp_model}.lib

V_supply 1 0 DC {self.supply_voltage}
V_input 2 0 AC 1
R1 3 0 {components['R1']}
R2 3 4 {components['R2']}
X1 2 3 1 0 4 {opamp_model}

.ac dec 100 1 1MEG
.print ac v(4)
.end
"""
        elif circuit_type == 'inverting':
            netlist = f"""* Inverting Amplifier
* Using {opamp_model}
.include {opamp_model}.lib

V_supply 1 0 DC {self.supply_voltage}
V_input 2 0 AC 1
R1 2 3 {components['R1']}
R2 3 4 {components['R2']}
X1 0 3 1 0 4 {opamp_model}

.ac dec 100 1 1MEG
.print ac v(4)
.end
"""
        else:
            netlist = f"* {circuit_type} - SPICE netlist generation not implemented"

        return netlist
