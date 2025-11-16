"""
數位邏輯電路設計器
"""

from typing import Dict, List


class LogicGateDesigner:
    """數位邏輯閘設計類別"""

    # IC 資料庫
    IC_DATABASE = {
        # TTL 74 系列
        '7400': {'type': 'NAND', 'gates': 4, 'inputs_per_gate': 2},
        '7402': {'type': 'NOR', 'gates': 4, 'inputs_per_gate': 2},
        '7404': {'type': 'NOT', 'gates': 6, 'inputs_per_gate': 1},
        '7408': {'type': 'AND', 'gates': 4, 'inputs_per_gate': 2},
        '7432': {'type': 'OR', 'gates': 4, 'inputs_per_gate': 2},
        '7486': {'type': 'XOR', 'gates': 4, 'inputs_per_gate': 2},

        # 加法器
        '7483': {'type': 'ADDER', 'bits': 4, 'description': '4-bit full adder'},

        # 解碼器
        '7442': {'type': 'DECODER', 'inputs': 4, 'outputs': 10, 'description': 'BCD to decimal'},
        '74138': {'type': 'DECODER', 'inputs': 3, 'outputs': 8, 'description': '3-to-8 decoder'},

        # 多工器
        '74151': {'type': 'MUX', 'inputs': 8, 'outputs': 1, 'description': '8-to-1 multiplexer'},
        '74153': {'type': 'MUX', 'inputs': 4, 'outputs': 1, 'description': 'Dual 4-to-1 multiplexer'},
    }

    def design_adder(self, bits: int = 4) -> Dict:
        """
        設計加法器電路

        Args:
            bits: 位元數

        Returns:
            電路參數字典
        """
        if bits == 4:
            ic_model = '7483'
        elif bits == 8:
            # 使用兩個 4-bit 加法器串接
            ic_model = '7483 x2'
            ic_count = 2
        else:
            ic_model = '7483'
            ic_count = (bits + 3) // 4

        return {
            'circuit_type': 'binary_adder',
            'bits': bits,
            'ic_model': ic_model,
            'ic_count': ic_count if bits > 4 else 1,
            'propagation_delay_ns': 24,  # 典型值
            'power_consumption_mw': 215,  # 典型值
        }

    def design_decoder(self, inputs: int, outputs: int = None) -> Dict:
        """
        設計解碼器電路

        Args:
            inputs: 輸入位元數
            outputs: 輸出數量

        Returns:
            電路參數字典
        """
        if outputs is None:
            outputs = 2 ** inputs

        # 選擇合適的 IC
        if inputs == 3 and outputs == 8:
            ic_model = '74138'
        elif inputs == 4 and outputs == 10:
            ic_model = '7442'
        else:
            ic_model = f'Custom decoder {inputs}-to-{outputs}'

        return {
            'circuit_type': 'decoder',
            'inputs': inputs,
            'outputs': outputs,
            'ic_model': ic_model,
            'active_low': True,  # 大多數解碼器是低電平有效
        }

    def design_multiplexer(self, inputs: int) -> Dict:
        """
        設計多工器電路

        Args:
            inputs: 輸入數量

        Returns:
            電路參數字典
        """
        if inputs == 2:
            # 使用基本邏輯閘
            ic_model = '7408 + 7432 + 7404'
        elif inputs == 4:
            ic_model = '74153'
        elif inputs == 8:
            ic_model = '74151'
        else:
            ic_model = f'Custom MUX {inputs}-to-1'

        select_bits = 0
        temp = inputs
        while temp > 1:
            select_bits += 1
            temp //= 2

        return {
            'circuit_type': 'multiplexer',
            'inputs': inputs,
            'select_bits': select_bits,
            'ic_model': ic_model,
        }


class CounterDesigner:
    """計數器電路設計類別"""

    COUNTER_ICS = {
        '7490': {'type': 'decade', 'modulo': 10, 'description': 'Decade counter'},
        '7493': {'type': 'binary', 'modulo': 16, 'description': '4-bit binary counter'},
        '74192': {'type': 'up_down', 'modulo': 10, 'description': 'Up/down decade counter'},
        '74193': {'type': 'up_down', 'modulo': 16, 'description': 'Up/down binary counter'},
    }

    def design_counter(self, modulo: int, count_up: bool = True) -> Dict:
        """
        設計計數器電路

        Args:
            modulo: 計數模數 (例如 10 進制 = 10, 16 進制 = 16)
            count_up: True 為上數, False 為下數

        Returns:
            電路參數字典
        """
        if modulo == 10:
            if count_up:
                ic_model = '7490'
            else:
                ic_model = '74192'
        elif modulo == 16:
            if count_up:
                ic_model = '7493'
            else:
                ic_model = '74193'
        else:
            # 自定義模數，需要額外的重置邏輯
            base_ic = '7493' if modulo <= 16 else '7493 x2'
            ic_model = f'{base_ic} + reset logic'

        # 計算輸出位元數
        output_bits = 0
        temp = modulo - 1
        while temp > 0:
            output_bits += 1
            temp //= 2

        return {
            'circuit_type': 'counter',
            'modulo': modulo,
            'direction': 'up' if count_up else 'down',
            'ic_model': ic_model,
            'output_bits': output_bits,
            'max_frequency_mhz': 32,  # 典型最大頻率
        }

    def design_frequency_divider(self, division_ratio: int) -> Dict:
        """
        設計分頻器電路

        Args:
            division_ratio: 分頻比例

        Returns:
            電路參數字典
        """
        # 使用計數器實現分頻
        counter = self.design_counter(modulo=division_ratio)

        return {
            'circuit_type': 'frequency_divider',
            'division_ratio': division_ratio,
            'counter_ic': counter['ic_model'],
            'output_bits': counter['output_bits'],
            'description': f'將輸入頻率除以 {division_ratio}',
        }


class FlipFlopDesigner:
    """正反器電路設計類別"""

    def design_d_flipflop(self, num_bits: int = 1) -> Dict:
        """
        設計 D 型正反器

        Args:
            num_bits: 位元數

        Returns:
            電路參數字典
        """
        if num_bits <= 2:
            ic_model = '7474'  # Dual D flip-flop
            ic_count = 1
        elif num_bits <= 4:
            ic_model = '7474'
            ic_count = (num_bits + 1) // 2
        else:
            ic_model = '74174'  # Hex D flip-flop
            ic_count = (num_bits + 5) // 6

        return {
            'circuit_type': 'd_flipflop',
            'bits': num_bits,
            'ic_model': ic_model,
            'ic_count': ic_count,
            'has_preset': True,
            'has_clear': True,
        }

    def design_register(self, bits: int = 8, shift: bool = False) -> Dict:
        """
        設計暫存器

        Args:
            bits: 位元數
            shift: 是否為移位暫存器

        Returns:
            電路參數字典
        """
        if shift:
            # 移位暫存器
            if bits <= 4:
                ic_model = '7495'  # 4-bit shift register
            elif bits <= 8:
                ic_model = '74164'  # 8-bit shift register
            else:
                ic_model = '74164 x2'
                ic_count = (bits + 7) // 8
        else:
            # 一般暫存器 (使用 D flip-flops)
            ic_model = '74174'  # Hex D flip-flop
            ic_count = (bits + 5) // 6

        return {
            'circuit_type': 'shift_register' if shift else 'register',
            'bits': bits,
            'ic_model': ic_model,
            'ic_count': ic_count if bits > 8 else 1,
            'parallel_load': not shift,
            'serial_input': shift,
        }
