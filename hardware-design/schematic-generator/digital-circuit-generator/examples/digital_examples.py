"""
數位電路設計範例
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from logic_designer import LogicGateDesigner, CounterDesigner, FlipFlopDesigner


def example_adder():
    """加法器範例"""
    print("=== 4-bit 加法器設計 ===\n")

    designer = LogicGateDesigner()
    circuit = designer.design_adder(bits=4)

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"位元數: {circuit['bits']}")
    print(f"IC 型號: {circuit['ic_model']}")
    print(f"IC 數量: {circuit['ic_count']}")
    print(f"傳播延遲: {circuit['propagation_delay_ns']} ns")


def example_decoder():
    """解碼器範例"""
    print("\n=== 3-to-8 解碼器設計 ===\n")

    designer = LogicGateDesigner()
    circuit = designer.design_decoder(inputs=3, outputs=8)

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"輸入: {circuit['inputs']} bits")
    print(f"輸出: {circuit['outputs']} 條線")
    print(f"IC 型號: {circuit['ic_model']}")
    print(f"低電平有效: {circuit['active_low']}")


def example_counter():
    """計數器範例"""
    print("\n=== 十進制計數器設計 ===\n")

    designer = CounterDesigner()
    circuit = designer.design_counter(modulo=10, count_up=True)

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"計數模數: {circuit['modulo']}")
    print(f"方向: {circuit['direction']}")
    print(f"IC 型號: {circuit['ic_model']}")
    print(f"輸出位元數: {circuit['output_bits']}")
    print(f"最大頻率: {circuit['max_frequency_mhz']} MHz")


def example_frequency_divider():
    """分頻器範例"""
    print("\n=== 除 100 分頻器設計 ===\n")

    designer = CounterDesigner()
    circuit = designer.design_frequency_divider(division_ratio=100)

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"分頻比: {circuit['division_ratio']}")
    print(f"使用計數器: {circuit['counter_ic']}")
    print(f"說明: {circuit['description']}")


def example_register():
    """暫存器範例"""
    print("\n=== 8-bit 移位暫存器設計 ===\n")

    designer = FlipFlopDesigner()
    circuit = designer.design_register(bits=8, shift=True)

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"位元數: {circuit['bits']}")
    print(f"IC 型號: {circuit['ic_model']}")
    print(f"串列輸入: {circuit['serial_input']}")


if __name__ == "__main__":
    example_adder()
    example_decoder()
    example_counter()
    example_frequency_divider()
    example_register()

    print("\n" + "="*50)
    print("所有範例執行完成！")
    print("="*50)
