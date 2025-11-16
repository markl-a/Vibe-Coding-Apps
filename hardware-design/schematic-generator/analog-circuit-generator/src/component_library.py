"""
電子元件庫 - 標準值和元件選擇
"""

import math
from typing import List, Tuple


class E_Series:
    """E-Series 標準電阻值"""

    # E12 系列 (10% 容差)
    E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82]

    # E24 系列 (5% 容差)
    E24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30,
           33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91]

    # E96 系列 (1% 容差)
    E96 = [100, 102, 105, 107, 110, 113, 115, 118, 121, 124, 127, 130,
           133, 137, 140, 143, 147, 150, 154, 158, 162, 165, 169, 174,
           178, 182, 187, 191, 196, 200, 205, 210, 215, 221, 227, 232,
           237, 243, 249, 255, 261, 267, 274, 280, 287, 294, 301, 309,
           316, 324, 332, 340, 348, 357, 365, 374, 383, 392, 402, 412,
           422, 432, 442, 453, 464, 475, 487, 499, 511, 523, 536, 549,
           562, 576, 590, 604, 619, 634, 649, 665, 681, 698, 715, 732,
           750, 768, 787, 806, 825, 845, 866, 887, 909, 931, 953, 976]

    @staticmethod
    def nearest_value(target: float, series: str = 'E24',
                     min_value: float = 1, max_value: float = 10e6) -> Tuple[float, int]:
        """
        找到最接近的標準電阻值

        Args:
            target: 目標電阻值 (Ω)
            series: E-Series 系列 ('E12', 'E24', 'E96')
            min_value: 最小值
            max_value: 最大值

        Returns:
            (標準值, 倍數)
        """
        if series == 'E12':
            base_values = E_Series.E12
        elif series == 'E24':
            base_values = E_Series.E24
        elif series == 'E96':
            base_values = [v / 100 for v in E_Series.E96]
        else:
            raise ValueError(f"未知的系列: {series}")

        # 計算數量級
        if target <= 0:
            return base_values[0], 0

        magnitude = 10 ** math.floor(math.log10(target))
        normalized = target / magnitude

        # 找最接近的值
        closest = min(base_values, key=lambda x: abs(x - normalized))
        result = closest * magnitude

        # 確保在範圍內
        if result < min_value:
            result = min_value
        elif result > max_value:
            result = max_value

        return result, int(math.log10(magnitude))

    @staticmethod
    def format_value(value: float, unit: str = 'Ω') -> str:
        """
        格式化電阻值顯示

        Args:
            value: 數值
            unit: 單位

        Returns:
            格式化的字符串
        """
        if value >= 1e6:
            return f"{value/1e6:.2f} M{unit}"
        elif value >= 1e3:
            return f"{value/1e3:.2f} k{unit}"
        else:
            return f"{value:.2f} {unit}"


class CapacitorLibrary:
    """電容器標準值庫"""

    # 常用電容值 (法拉)
    COMMON_VALUES = [
        1e-12, 2.2e-12, 4.7e-12, 10e-12, 22e-12, 47e-12, 100e-12,  # pF
        220e-12, 470e-12, 1e-9, 2.2e-9, 4.7e-9, 10e-9, 22e-9,      # nF
        47e-9, 100e-9, 220e-9, 470e-9, 1e-6, 2.2e-6, 4.7e-6,       # µF
        10e-6, 22e-6, 47e-6, 100e-6, 220e-6, 470e-6, 1000e-6       # µF
    ]

    @staticmethod
    def nearest_value(target: float) -> float:
        """找到最接近的標準電容值"""
        return min(CapacitorLibrary.COMMON_VALUES,
                  key=lambda x: abs(x - target))

    @staticmethod
    def format_value(value: float) -> str:
        """格式化電容值顯示"""
        if value >= 1e-3:
            return f"{value*1e3:.2f} mF"
        elif value >= 1e-6:
            return f"{value*1e6:.2f} µF"
        elif value >= 1e-9:
            return f"{value*1e9:.2f} nF"
        else:
            return f"{value*1e12:.2f} pF"


class OpAmpLibrary:
    """運算放大器庫"""

    COMMON_OPAMPS = {
        'LM358': {
            'type': 'dual',
            'supply_voltage': (3, 32),
            'gbw': 1e6,  # 1 MHz
            'slew_rate': 0.5e6,  # 0.5 V/µs
            'input_bias_current': 45e-9,
            'cost': 'low'
        },
        'TL072': {
            'type': 'dual',
            'supply_voltage': (7, 36),
            'gbw': 3e6,  # 3 MHz
            'slew_rate': 13e6,  # 13 V/µs
            'input_bias_current': 65e-12,
            'cost': 'low'
        },
        'OP07': {
            'type': 'single',
            'supply_voltage': (4, 36),
            'gbw': 0.6e6,  # 600 kHz
            'slew_rate': 0.3e6,  # 0.3 V/µs
            'input_bias_current': 2e-9,
            'cost': 'medium'
        },
        'OPA2134': {
            'type': 'dual',
            'supply_voltage': (4.5, 36),
            'gbw': 8e6,  # 8 MHz
            'slew_rate': 20e6,  # 20 V/µs
            'input_bias_current': 5e-12,
            'cost': 'high'
        }
    }

    @staticmethod
    def select_opamp(min_gbw: float = None, min_slew_rate: float = None,
                    supply_voltage: float = 15) -> str:
        """
        根據規格選擇運算放大器

        Args:
            min_gbw: 最小增益頻寬積 (Hz)
            min_slew_rate: 最小轉換率 (V/s)
            supply_voltage: 電源電壓 (V)

        Returns:
            推薦的 OpAmp 型號
        """
        candidates = []

        for model, specs in OpAmpLibrary.COMMON_OPAMPS.items():
            # 檢查電源電壓範圍
            if not (specs['supply_voltage'][0] <= supply_voltage <= specs['supply_voltage'][1]):
                continue

            # 檢查 GBW
            if min_gbw and specs['gbw'] < min_gbw:
                continue

            # 檢查轉換率
            if min_slew_rate and specs['slew_rate'] < min_slew_rate:
                continue

            candidates.append(model)

        # 優先選擇低成本的
        if 'LM358' in candidates:
            return 'LM358'
        elif candidates:
            return candidates[0]
        else:
            return 'LM358'  # 默認選擇
