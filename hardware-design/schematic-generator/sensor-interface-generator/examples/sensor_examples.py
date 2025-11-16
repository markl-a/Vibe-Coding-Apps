"""
感測器介面設計範例
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from sensor_interface import TemperatureSensor, I2CSensorInterface, AnalogSensorConditioning


def example_lm35():
    """LM35 溫度感測器範例"""
    print("=== LM35 溫度感測器介面 (Arduino 3.3V ADC) ===\n")

    sensor = TemperatureSensor()
    circuit = sensor.design_lm35_interface(
        mcu_adc_voltage=3.3,
        temp_range=(0, 100)
    )

    print(f"感測器: {circuit['sensor_type']}")
    print(f"介面類型: {circuit['interface_type']}")
    print(f"輸出特性: {circuit['output_characteristic']}")
    print(f"溫度範圍: {circuit['temp_range']} °C")
    print(f"需要放大器: {circuit['amplifier_needed']}")
    print(f"濾波電容: {circuit['C_filter']*1e9:.0f} nF")
    print(f"輸出電壓範圍: {circuit['output_voltage_range'][0]:.2f}V ~ {circuit['output_voltage_range'][1]:.2f}V")
    print(f"解析度: {circuit['resolution_per_degree']*1000:.0f} mV/°C")


def example_ntc():
    """NTC 熱敏電阻範例"""
    print("\n=== NTC 熱敏電阻介面 (10kΩ @ 25°C) ===\n")

    sensor = TemperatureSensor()
    circuit = sensor.design_ntc_interface(
        r_ntc_25c=10000,
        beta=3950,
        mcu_adc_voltage=3.3
    )

    print(f"感測器: {circuit['sensor_type']}")
    print(f"介面: {circuit['interface_type']}")
    print(f"NTC 電阻 (25°C): {circuit['r_ntc_25c']} Ω")
    print(f"Beta 係數: {circuit['beta']}")
    print(f"固定電阻: {circuit['R_fixed']} Ω")
    print(f"供電電壓: {circuit['supply_voltage']} V")
    print(f"輸出電壓 (25°C): {circuit['v_out_25c']:.2f} V")
    print(f"電路描述: {circuit['circuit_description']}")
    print(f"溫度計算: {circuit['calculation_method']}")


def example_pt100():
    """PT100 RTD 範例"""
    print("\n=== PT100 RTD 介面 (4-wire, 1mA) ===\n")

    sensor = TemperatureSensor()
    circuit = sensor.design_pt100_interface(excitation_current=0.001)

    print(f"感測器: {circuit['sensor_type']}")
    print(f"介面: {circuit['interface_type']}")
    print(f"激勵電流: {circuit['excitation_current_ma']:.1f} mA")
    print(f"電阻 (0°C): {circuit['r_0c']} Ω")
    print(f"電阻 (100°C): {circuit['r_100c']:.2f} Ω")
    print(f"電壓範圍: {circuit['voltage_range'][0]:.3f}V ~ {circuit['voltage_range'][1]:.3f}V")
    print(f"設定電阻: {circuit['r_set']:.0f} Ω")
    print(f"電流源: {circuit['current_source']}")
    print(f"建議放大倍數: {circuit['amplifier_gain']}x")


def example_i2c_pullup():
    """I2C 上拉電阻範例"""
    print("\n=== I2C 上拉電阻設計 (400kHz, 3.3V) ===\n")

    interface = I2CSensorInterface()
    circuit = interface.design_i2c_pullup(
        bus_voltage=3.3,
        bus_capacitance=100e-12,
        max_frequency=400000
    )

    print(f"介面: {circuit['interface_type']}")
    print(f"匯流排電壓: {circuit['bus_voltage']} V")
    print(f"最大頻率: {circuit['max_frequency_khz']} kHz")
    print(f"匯流排電容: {circuit['bus_capacitance_pf']:.0f} pF")
    print(f"上拉電阻最小值: {circuit['r_pullup_min']:.0f} Ω")
    print(f"上拉電阻最大值: {circuit['r_pullup_max']:.0f} Ω")
    print(f"推薦值: {circuit['r_pullup_recommended']} Ω")
    print(f"SDA 上拉: {circuit['pull_up_resistor_sda']} Ω")
    print(f"SCL 上拉: {circuit['pull_up_resistor_scl']} Ω")
    print(f"備註: {circuit['note']}")


def example_instrumentation_amp():
    """儀表放大器範例"""
    print("\n=== 儀表放大器 (壓力感測器) ===\n")

    conditioning = AnalogSensorConditioning()
    circuit = conditioning.design_instrumentation_amp(
        differential_input=(0, 0.1),  # 100mV 差動信號
        output_range=(0, 5),          # 0-5V 輸出
        common_mode_voltage=2.5
    )

    print(f"電路類型: {circuit['circuit_type']}")
    print(f"IC 型號: {circuit['ic_model']}")
    print(f"增益: {circuit['gain']:.0f}x")
    print(f"差動輸入範圍: {circuit['differential_input_range']} V")
    print(f"輸出範圍: {circuit['output_range']} V")
    print(f"增益設定電阻: {circuit['r_gain']:.0f} Ω")
    print(f"共模抑制比: {circuit['cmrr_db']} dB")
    print(f"應用: {', '.join(circuit['applications'])}")


def example_4_20ma():
    """4-20mA 電流迴路範例"""
    print("\n=== 4-20mA 電流迴路接收器 ===\n")

    conditioning = AnalogSensorConditioning()
    circuit = conditioning.design_current_loop_receiver()

    print(f"介面類型: {circuit['interface_type']}")
    print(f"電流範圍: {circuit['current_range_ma'][0]:.0f}-{circuit['current_range_ma'][1]:.0f} mA")
    print(f"輸出電壓範圍: {circuit['output_voltage_range']} V")
    print(f"感測電阻: {circuit['r_sense']:.0f} Ω")
    print(f"功率消耗: {circuit['power_dissipation']:.3f} W")
    print(f"電阻額定: {circuit['resistor_rating']}")
    print(f"應用: {', '.join(circuit['applications'])}")


if __name__ == "__main__":
    example_lm35()
    example_ntc()
    example_pt100()
    example_i2c_pullup()
    example_instrumentation_amp()
    example_4_20ma()

    print("\n" + "="*50)
    print("所有範例執行完成！")
    print("="*50)
