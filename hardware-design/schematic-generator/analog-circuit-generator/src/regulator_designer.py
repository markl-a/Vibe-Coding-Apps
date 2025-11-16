"""
電壓穩壓器電路設計器
"""

import math
from typing import Dict, List
from component_library import E_Series, CapacitorLibrary


class LinearRegulator:
    """線性穩壓器設計類別"""

    # 常用 LDO IC 資料庫
    LDO_DATABASE = {
        'LM7805': {'Vout': 5.0, 'Imax': 1.5, 'Vin_max': 35, 'dropout': 2.0},
        'LM7812': {'Vout': 12.0, 'Imax': 1.5, 'Vin_max': 35, 'dropout': 2.0},
        'LM7815': {'Vout': 15.0, 'Imax': 1.5, 'Vin_max': 35, 'dropout': 2.0},
        'LM1117-3.3': {'Vout': 3.3, 'Imax': 0.8, 'Vin_max': 20, 'dropout': 1.2},
        'LM1117-5.0': {'Vout': 5.0, 'Imax': 0.8, 'Vin_max': 20, 'dropout': 1.2},
        'AMS1117-3.3': {'Vout': 3.3, 'Imax': 1.0, 'Vin_max': 15, 'dropout': 1.0},
        'AMS1117-5.0': {'Vout': 5.0, 'Imax': 1.0, 'Vin_max': 15, 'dropout': 1.0},
        'LD1117V33': {'Vout': 3.3, 'Imax': 0.8, 'Vin_max': 15, 'dropout': 1.15},
    }

    def select_ldo(self, input_voltage: float,
                   output_voltage: float,
                   output_current: float) -> Dict:
        """
        選擇合適的 LDO IC

        Args:
            input_voltage: 輸入電壓 (V)
            output_voltage: 輸出電壓 (V)
            output_current: 輸出電流 (A)

        Returns:
            選中的 LDO IC 資訊
        """
        candidates = []

        for model, specs in self.LDO_DATABASE.items():
            # 檢查輸出電壓
            if abs(specs['Vout'] - output_voltage) > 0.1:
                continue

            # 檢查輸入電壓
            min_vin = output_voltage + specs['dropout']
            if input_voltage < min_vin or input_voltage > specs['Vin_max']:
                continue

            # 檢查電流能力
            if output_current > specs['Imax']:
                continue

            candidates.append(model)

        if candidates:
            return candidates[0]
        else:
            return 'LM7805'  # 默認選擇

    def design_ldo(self, input_voltage: float,
                   output_voltage: float,
                   output_current: float) -> Dict:
        """
        設計 LDO 線性穩壓電路

        Args:
            input_voltage: 輸入電壓 (V)
            output_voltage: 輸出電壓 (V)
            output_current: 輸出電流 (A)

        Returns:
            電路參數字典
        """
        # 選擇 LDO IC
        ic_model = self.select_ldo(input_voltage, output_voltage, output_current)
        ic_specs = self.LDO_DATABASE.get(ic_model, self.LDO_DATABASE['LM7805'])

        # 計算功耗
        power_dissipation = (input_voltage - output_voltage) * output_current

        # 檢查是否需要散熱片
        needs_heatsink = power_dissipation > 0.5  # 超過 0.5W 建議散熱片

        # 選擇電容值
        # 輸入電容: 0.33µF - 1µF (陶瓷) 或 10µF (電解)
        C_in = 10e-6  # 10µF

        # 輸出電容: 1µF - 10µF (陶瓷) 或 22µF (電解)
        # 較大的電容提供更好的暫態響應
        if output_current > 0.5:
            C_out = 22e-6  # 22µF for high current
        else:
            C_out = 10e-6  # 10µF for low current

        C_in_std = CapacitorLibrary.nearest_value(C_in)
        C_out_std = CapacitorLibrary.nearest_value(C_out)

        # 計算效率
        efficiency = (output_voltage * output_current) / (input_voltage * output_current) * 100

        return {
            'circuit_type': 'ldo_regulator',
            'ic_model': ic_model,
            'input_voltage': input_voltage,
            'output_voltage': output_voltage,
            'output_current': output_current,
            'C_in': C_in_std,
            'C_out': C_out_std,
            'power_dissipation': power_dissipation,
            'efficiency_percent': efficiency,
            'needs_heatsink': needs_heatsink,
            'dropout_voltage': ic_specs['dropout'],
            'C_in_formatted': CapacitorLibrary.format_value(C_in_std),
            'C_out_formatted': CapacitorLibrary.format_value(C_out_std),
        }

    def design_adjustable_ldo(self, input_voltage: float,
                             output_voltage: float,
                             output_current: float,
                             series: str = 'E24') -> Dict:
        """
        設計可調式 LDO 穩壓電路 (使用 LM317)

        Vout = 1.25 * (1 + R2/R1)

        Args:
            input_voltage: 輸入電壓 (V)
            output_voltage: 輸出電壓 (V)
            output_current: 輸出電流 (A)
            series: E-Series 標準值系列

        Returns:
            電路參數字典
        """
        ic_model = 'LM317'  # 可調式 LDO
        V_ref = 1.25  # LM317 參考電壓

        # 計算電阻值
        # Vout = 1.25 * (1 + R2/R1)
        # 通常選 R1 = 240Ω (推薦值)
        R1 = 240

        # 計算 R2
        # R2 = R1 * (Vout/1.25 - 1)
        R2_ideal = R1 * (output_voltage / V_ref - 1)

        # 使用標準值
        R1_std = E_Series.nearest_value(R1, series)[0]
        R2_std = E_Series.nearest_value(R2_ideal, series)[0]

        # 實際輸出電壓
        actual_vout = V_ref * (1 + R2_std / R1_std)

        # 電容值
        C_in = 100e-9  # 0.1µF 輸入電容
        C_out = 1e-6   # 1µF 輸出電容
        C_adj = 10e-6  # 10µF ADJ pin 電容 (改善暫態響應)

        C_in_std = CapacitorLibrary.nearest_value(C_in)
        C_out_std = CapacitorLibrary.nearest_value(C_out)
        C_adj_std = CapacitorLibrary.nearest_value(C_adj)

        # 功耗和效率
        power_dissipation = (input_voltage - actual_vout) * output_current
        efficiency = (actual_vout * output_current) / (input_voltage * output_current) * 100

        return {
            'circuit_type': 'adjustable_ldo_regulator',
            'ic_model': ic_model,
            'R1': R1_std,
            'R2': R2_std,
            'C_in': C_in_std,
            'C_out': C_out_std,
            'C_adj': C_adj_std,
            'target_output_voltage': output_voltage,
            'actual_output_voltage': actual_vout,
            'output_current': output_current,
            'power_dissipation': power_dissipation,
            'efficiency_percent': efficiency,
            'R1_formatted': E_Series.format_value(R1_std),
            'R2_formatted': E_Series.format_value(R2_std),
        }


class ZenerRegulator:
    """齊納二極體穩壓器設計類別"""

    def design_simple_zener(self, input_voltage: float,
                           output_voltage: float,
                           output_current: float,
                           series: str = 'E24') -> Dict:
        """
        設計簡單的齊納穩壓電路

        Args:
            input_voltage: 輸入電壓 (V)
            output_voltage: 輸出電壓 (V)
            output_current: 負載電流 (A)
            series: E-Series 標準值系列

        Returns:
            電路參數字典
        """
        # 齊納電流通常選擇額定值的 20-80%
        # 假設齊納額定電流為 20mA，選擇 10mA
        I_zener = 0.010  # 10mA

        # 總電流 = 齊納電流 + 負載電流
        I_total = I_zener + output_current

        # 計算限流電阻
        # R = (Vin - Vout) / I_total
        R_ideal = (input_voltage - output_voltage) / I_total

        # 使用標準值
        R_std = E_Series.nearest_value(R_ideal, series)[0]

        # 實際電流
        actual_I_total = (input_voltage - output_voltage) / R_std
        actual_I_zener = actual_I_total - output_current

        # 電阻功耗
        P_resistor = (input_voltage - output_voltage) * actual_I_total

        # 齊納功耗
        P_zener = output_voltage * actual_I_zener

        # 選擇齊納二極體
        zener_models = {
            3.3: 'BZX55C3V3',
            5.0: 'BZX55C5V1',
            5.1: 'BZX55C5V1',
            6.2: 'BZX55C6V2',
            9.1: 'BZX55C9V1',
            12: 'BZX55C12',
        }

        # 找最接近的齊納電壓
        zener_voltage = min(zener_models.keys(), key=lambda x: abs(x - output_voltage))
        zener_model = zener_models[zener_voltage]

        return {
            'circuit_type': 'zener_regulator',
            'zener_model': zener_model,
            'zener_voltage': zener_voltage,
            'R_series': R_std,
            'target_output_voltage': output_voltage,
            'output_current': output_current,
            'zener_current': actual_I_zener,
            'resistor_power': P_resistor,
            'zener_power': P_zener,
            'R_formatted': E_Series.format_value(R_std),
            'warning': 'Zener regulator is only suitable for low current applications (<50mA)'
        }
