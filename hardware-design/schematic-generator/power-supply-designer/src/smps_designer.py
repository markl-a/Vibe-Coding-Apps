"""
交換式電源供應器 (SMPS) 設計器
"""

import math
from typing import Dict


class BuckConverter:
    """Buck 降壓轉換器設計類別"""

    def design(self, input_voltage: float,
              output_voltage: float,
              output_current: float,
              switching_frequency: float = 100000) -> Dict:
        """
        設計 Buck 降壓轉換器

        Args:
            input_voltage: 輸入電壓 (V)
            output_voltage: 輸出電壓 (V)
            output_current: 輸出電流 (A)
            switching_frequency: 開關頻率 (Hz), 默認 100kHz

        Returns:
            電路參數字典
        """
        # 工作週期
        duty_cycle = output_voltage / input_voltage

        # 電感值計算
        # L = (Vin - Vout) * D / (f * ΔI_L)
        # 選擇電感電流漣波為 30% 的輸出電流
        delta_I_L = 0.3 * output_current
        L = (input_voltage - output_voltage) * duty_cycle / (switching_frequency * delta_I_L)

        # 輸出電容計算
        # C = ΔI_L / (8 * f * ΔV_out)
        # 選擇輸出電壓漣波為 1% 的輸出電壓
        delta_V_out = 0.01 * output_voltage
        C = delta_I_L / (8 * switching_frequency * delta_V_out)

        # 二極體/同步整流 MOSFET
        diode_current = output_current
        diode_voltage = input_voltage

        # 主開關 MOSFET
        mosfet_voltage = input_voltage * 1.5  # 安全裕度
        mosfet_current = output_current * 1.5

        # 效率估算 (簡化計算)
        # 實際效率取決於元件選擇
        efficiency = 85 + (10 * duty_cycle)  # 粗略估計
        if efficiency > 95:
            efficiency = 95

        return {
            'converter_type': 'buck',
            'input_voltage': input_voltage,
            'output_voltage': output_voltage,
            'output_current': output_current,
            'output_power': output_voltage * output_current,
            'duty_cycle': duty_cycle,
            'duty_cycle_percent': duty_cycle * 100,
            'switching_frequency': switching_frequency,
            'L': L,
            'C': C,
            'delta_I_L': delta_I_L,
            'delta_V_out': delta_V_out,
            'mosfet_voltage_rating': mosfet_voltage,
            'mosfet_current_rating': mosfet_current,
            'diode_voltage_rating': diode_voltage,
            'diode_current_rating': diode_current,
            'efficiency': efficiency,
            'recommended_ic': 'LM2596' if output_current <= 3 else 'LM2678',
        }


class BoostConverter:
    """Boost 升壓轉換器設計類別"""

    def design(self, input_voltage: float,
              output_voltage: float,
              output_current: float,
              switching_frequency: float = 100000) -> Dict:
        """
        設計 Boost 升壓轉換器

        Args:
            input_voltage: 輸入電壓 (V)
            output_voltage: 輸出電壓 (V)
            output_current: 輸出電流 (A)
            switching_frequency: 開關頻率 (Hz)

        Returns:
            電路參數字典
        """
        if output_voltage <= input_voltage:
            raise ValueError("Boost converter 輸出電壓必須大於輸入電壓")

        # 工作週期
        duty_cycle = 1 - (input_voltage / output_voltage)

        # 輸入電流
        # Iin = Iout * Vout / (Vin * efficiency)
        efficiency_est = 0.85
        input_current = output_current * output_voltage / (input_voltage * efficiency_est)

        # 電感值
        # L = Vin * D / (f * ΔI_L)
        delta_I_L = 0.3 * input_current
        L = input_voltage * duty_cycle / (switching_frequency * delta_I_L)

        # 輸出電容
        # C = Iout * D / (f * ΔV_out)
        delta_V_out = 0.01 * output_voltage
        C = output_current * duty_cycle / (switching_frequency * delta_V_out)

        # 二極體規格
        diode_voltage = output_voltage * 1.2
        diode_current = input_current

        # MOSFET 規格
        mosfet_voltage = output_voltage * 1.5
        mosfet_current = input_current * 1.5

        return {
            'converter_type': 'boost',
            'input_voltage': input_voltage,
            'output_voltage': output_voltage,
            'input_current': input_current,
            'output_current': output_current,
            'output_power': output_voltage * output_current,
            'duty_cycle': duty_cycle,
            'duty_cycle_percent': duty_cycle * 100,
            'switching_frequency': switching_frequency,
            'L': L,
            'C': C,
            'delta_I_L': delta_I_L,
            'delta_V_out': delta_V_out,
            'mosfet_voltage_rating': mosfet_voltage,
            'mosfet_current_rating': mosfet_current,
            'diode_voltage_rating': diode_voltage,
            'diode_current_rating': diode_current,
            'efficiency': efficiency_est * 100,
            'recommended_ic': 'LM2587' if output_current <= 3 else 'LM2733',
        }


class BatteryCharger:
    """電池充電器設計類別"""

    def design_liion_charger(self, battery_voltage: float = 4.2,
                            charge_current: float = 0.5) -> Dict:
        """
        設計鋰離子電池充電器

        Args:
            battery_voltage: 電池充電電壓 (V), Li-ion 典型為 4.2V
            charge_current: 充電電流 (A)

        Returns:
            電路參數字典
        """
        # 充電階段
        # 1. CC (恆流) 階段
        # 2. CV (恆壓) 階段
        # 3. 充滿截止

        # 推薦 IC
        if charge_current <= 1:
            ic_model = 'TP4056'  # 常用的 1A 充電 IC
            max_current = 1.0
        elif charge_current <= 2:
            ic_model = 'MCP73831'
            max_current = 2.0
        else:
            ic_model = 'LTC4054'
            max_current = charge_current

        # 充電電流設定電阻
        # 依據 IC 規格，通常由單一電阻設定
        # 以 TP4056 為例: Icharge = 1200V / Rprog
        R_prog = 1200 / charge_current  # Ω

        # 保護功能
        protection_features = [
            '過充保護 (OVP)',
            '過溫保護 (OTP)',
            '反向放電保護',
            '短路保護'
        ]

        return {
            'charger_type': 'li_ion',
            'battery_voltage': battery_voltage,
            'charge_current': charge_current,
            'ic_model': ic_model,
            'max_current': max_current,
            'R_prog': R_prog,
            'charge_method': 'CC/CV',
            'protection_features': protection_features,
            'indicator_led': True,
            'termination_current': charge_current * 0.1,  # 10% 截止電流
        }

    def design_nimh_charger(self, cell_count: int = 4,
                           charge_current: float = 0.5) -> Dict:
        """
        設計鎳氫電池充電器

        Args:
            cell_count: 電池串聯數量
            charge_current: 充電電流 (A)

        Returns:
            電路參數字典
        """
        # NiMH 單顆電池電壓約 1.2V
        battery_voltage = cell_count * 1.2

        # 充電電壓需要略高
        charge_voltage = cell_count * 1.5

        return {
            'charger_type': 'nimh',
            'cell_count': cell_count,
            'battery_voltage': battery_voltage,
            'charge_voltage': charge_voltage,
            'charge_current': charge_current,
            'charge_method': 'Constant Current',
            'termination_method': 'Delta V or Temperature',
            'recommended_ic': 'MAX712/713',
        }
