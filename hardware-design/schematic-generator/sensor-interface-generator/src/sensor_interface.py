"""
感測器介面電路設計器
"""

import math
from typing import Dict, Tuple


class TemperatureSensor:
    """溫度感測器介面設計類別"""

    def design_lm35_interface(self, mcu_adc_voltage: float = 3.3,
                             temp_range: Tuple[float, float] = (-50, 150)) -> Dict:
        """
        設計 LM35 溫度感測器介面電路

        LM35 輸出: 10mV/°C
        例如: 25°C → 250mV, 100°C → 1000mV

        Args:
            mcu_adc_voltage: MCU ADC 參考電壓 (V)
            temp_range: 溫度範圍 (°C)

        Returns:
            電路參數字典
        """
        # LM35 輸出電壓範圍
        v_out_min = temp_range[0] * 0.01  # 10mV/°C
        v_out_max = temp_range[1] * 0.01

        # 計算需要的放大倍數
        # 使輸出電壓範圍匹配 ADC 範圍
        gain = mcu_adc_voltage / v_out_max

        # 如果不需要放大，直接連接
        if gain >= 1:
            gain = 1
            R1 = 0
            R2 = 0
        else:
            # 使用非反相放大器
            R1 = 10000  # 10kΩ
            R2 = R1 * (gain - 1)

        # 濾波電容 (抗干擾)
        C_filter = 100e-9  # 100nF

        return {
            'sensor_type': 'LM35',
            'interface_type': 'analog',
            'output_characteristic': '10mV/°C',
            'temp_range': temp_range,
            'gain': gain,
            'amplifier_needed': gain > 1,
            'R1': R1,
            'R2': R2,
            'C_filter': C_filter,
            'mcu_adc_voltage': mcu_adc_voltage,
            'output_voltage_range': (v_out_min * gain, v_out_max * gain),
            'resolution_per_degree': 0.01 * gain,  # V/°C
        }

    def design_ntc_interface(self, r_ntc_25c: float = 10000,
                            beta: float = 3950,
                            mcu_adc_voltage: float = 3.3) -> Dict:
        """
        設計 NTC 熱敏電阻介面電路

        使用分壓電路讀取 NTC

        Args:
            r_ntc_25c: NTC 在 25°C 時的電阻值 (Ω)
            beta: NTC Beta 係數
            mcu_adc_voltage: ADC 參考電壓 (V)

        Returns:
            電路參數字典
        """
        # 分壓電路的固定電阻
        # 選擇與 NTC 25°C 電阻值相同
        R_fixed = r_ntc_25c

        # 在 25°C 時的輸出電壓
        v_out_25c = mcu_adc_voltage * R_fixed / (r_ntc_25c + R_fixed)

        return {
            'sensor_type': 'NTC',
            'interface_type': 'voltage_divider',
            'r_ntc_25c': r_ntc_25c,
            'beta': beta,
            'R_fixed': R_fixed,
            'supply_voltage': mcu_adc_voltage,
            'v_out_25c': v_out_25c,
            'circuit_description': 'Voltage divider: Vcc - R_fixed - NTC - GND',
            'calculation_method': 'Steinhart-Hart equation',
        }

    def design_pt100_interface(self, excitation_current: float = 0.001) -> Dict:
        """
        設計 PT100 RTD 介面電路

        PT100: 100Ω @ 0°C, ~0.385Ω/°C

        Args:
            excitation_current: 激勵電流 (A), 典型 1mA

        Returns:
            電路參數字典
        """
        # PT100 電阻溫度係數
        alpha = 0.00385  # Ω/Ω/°C

        # 0°C 時的電壓
        r_0c = 100  # Ω
        v_0c = excitation_current * r_0c

        # 100°C 時的電壓
        r_100c = r_0c * (1 + alpha * 100)
        v_100c = excitation_current * r_100c

        # 恆流源電路 (使用 OpAmp)
        # I = V_ref / R_set
        v_ref = 2.5  # 參考電壓
        r_set = v_ref / excitation_current

        return {
            'sensor_type': 'PT100',
            'interface_type': '4_wire',
            'excitation_current': excitation_current,
            'excitation_current_ma': excitation_current * 1000,
            'r_0c': r_0c,
            'r_100c': r_100c,
            'v_0c': v_0c,
            'v_100c': v_100c,
            'voltage_range': (v_0c, v_100c),
            'r_set': r_set,
            'current_source': 'OpAmp constant current',
            'amplifier_needed': True,
            'amplifier_gain': 10,  # 建議放大 10 倍
        }


class I2CSensorInterface:
    """I2C 感測器介面設計類別"""

    def design_i2c_pullup(self, bus_voltage: float = 3.3,
                         bus_capacitance: float = 100e-12,
                         max_frequency: float = 400000) -> Dict:
        """
        設計 I2C 上拉電阻

        Args:
            bus_voltage: 匯流排電壓 (V)
            bus_capacitance: 匯流排電容 (F), 典型 100pF
            max_frequency: 最大頻率 (Hz), 標準 100kHz, 快速 400kHz

        Returns:
            電路參數字典
        """
        # I2C 上升時間要求
        if max_frequency == 100000:
            t_rise_max = 1000e-9  # 1000ns for standard mode
        elif max_frequency == 400000:
            t_rise_max = 300e-9  # 300ns for fast mode
        else:
            t_rise_max = 1000e-9

        # 最小上拉電阻 (確保上升時間)
        # R_min = t_rise / (0.8473 * C_bus)
        r_min = t_rise_max / (0.8473 * bus_capacitance)

        # 最大上拉電阻 (確保足夠的電流)
        # 典型 I2C 需要至少 3mA
        i_min = 0.003  # 3mA
        r_max = bus_voltage / i_min

        # 推薦值 (在範圍內選擇標準值)
        r_recommended = 4700  # 4.7kΩ 是常用值

        if r_recommended < r_min:
            r_recommended = int(r_min / 1000) * 1000 + 1000
        elif r_recommended > r_max:
            r_recommended = int(r_max / 1000) * 1000

        return {
            'interface_type': 'I2C',
            'bus_voltage': bus_voltage,
            'max_frequency': max_frequency,
            'max_frequency_khz': max_frequency / 1000,
            'bus_capacitance': bus_capacitance,
            'bus_capacitance_pf': bus_capacitance * 1e12,
            'r_pullup_min': r_min,
            'r_pullup_max': r_max,
            'r_pullup_recommended': r_recommended,
            'pull_up_resistor_sda': r_recommended,
            'pull_up_resistor_scl': r_recommended,
            'note': 'Both SDA and SCL need pull-up resistors',
        }


class AnalogSensorConditioning:
    """類比感測器信號調理類別"""

    def design_instrumentation_amp(self, differential_input: Tuple[float, float],
                                   output_range: Tuple[float, float],
                                   common_mode_voltage: float = 2.5) -> Dict:
        """
        設計儀表放大器電路

        用於差動感測器信號 (如壓力感測器、應變規等)

        Args:
            differential_input: 差動輸入電壓範圍 (V)
            output_range: 期望輸出電壓範圍 (V)
            common_mode_voltage: 共模電壓 (V)

        Returns:
            電路參數字典
        """
        # 計算增益
        v_diff_in = differential_input[1] - differential_input[0]
        v_out_span = output_range[1] - output_range[0]

        gain = v_out_span / v_diff_in

        # 儀表放大器 IC 選擇
        if gain <= 100:
            ic_model = 'INA128'
        elif gain <= 1000:
            ic_model = 'AD620'
        else:
            ic_model = 'AD8221'

        # 增益設定電阻 (對於 INA128)
        # G = 1 + 50kΩ / Rg
        r_gain = 50000 / (gain - 1)

        return {
            'circuit_type': 'instrumentation_amplifier',
            'ic_model': ic_model,
            'gain': gain,
            'differential_input_range': differential_input,
            'output_range': output_range,
            'common_mode_voltage': common_mode_voltage,
            'r_gain': r_gain,
            'cmrr_db': 100,  # 典型共模抑制比
            'applications': ['Strain gauge', 'Pressure sensor', 'Thermocouple', 'Load cell'],
        }

    def design_current_loop_receiver(self, loop_current_range: Tuple[float, float] = (0.004, 0.020),
                                    output_voltage_range: Tuple[float, float] = (0, 5)) -> Dict:
        """
        設計 4-20mA 電流迴路接收器

        Args:
            loop_current_range: 電流範圍 (A), 標準 4-20mA
            output_voltage_range: 輸出電壓範圍 (V)

        Returns:
            電路參數字典
        """
        # 轉換電阻
        # V_out = I_loop * R_sense
        i_min, i_max = loop_current_range
        v_min, v_max = output_voltage_range

        # 計算感測電阻
        r_sense = (v_max - v_min) / (i_max - i_min)

        # 功率消耗
        power_max = i_max ** 2 * r_sense

        return {
            'interface_type': '4-20mA_current_loop',
            'current_range': loop_current_range,
            'current_range_ma': (i_min * 1000, i_max * 1000),
            'output_voltage_range': output_voltage_range,
            'r_sense': r_sense,
            'power_dissipation': power_max,
            'resistor_rating': '0.5W' if power_max < 0.25 else '1W',
            'applications': ['Industrial sensors', 'Remote sensors', 'Process control'],
        }
