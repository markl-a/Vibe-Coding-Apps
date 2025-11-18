"""
完整的模組測試腳本
驗證所有電路設計模組的功能
"""

import sys
import os

# 設置路徑
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(base_dir, 'src'))
sys.path.insert(0, os.path.join(base_dir, 'analog-circuit-generator', 'src'))
sys.path.insert(0, os.path.join(base_dir, 'digital-circuit-generator', 'src'))
sys.path.insert(0, os.path.join(base_dir, 'power-supply-designer', 'src'))
sys.path.insert(0, os.path.join(base_dir, 'filter-designer', 'src'))
sys.path.insert(0, os.path.join(base_dir, 'sensor-interface-generator', 'src'))


class TestResults:
    """測試結果收集"""
    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.errors = []

    def add_pass(self, test_name):
        self.total += 1
        self.passed += 1
        print(f"  ✓ {test_name}")

    def add_fail(self, test_name, error):
        self.total += 1
        self.failed += 1
        self.errors.append((test_name, str(error)))
        print(f"  ✗ {test_name}: {error}")

    def print_summary(self):
        print("\n" + "="*70)
        print("📊 測試總結")
        print("="*70)
        print(f"總測試數: {self.total}")
        print(f"通過: {self.passed} ✓")
        print(f"失敗: {self.failed} ✗")
        print(f"通過率: {(self.passed/self.total*100) if self.total > 0 else 0:.1f}%")

        if self.errors:
            print("\n❌ 失敗的測試:")
            for test_name, error in self.errors:
                print(f"  - {test_name}: {error}")
        print("="*70)


def test_amplifier_designs(results):
    """測試放大器設計"""
    print("\n🧪 測試: 放大器設計模組")

    try:
        from amplifier_designer import OpAmpAmplifier

        # 測試 1: 非反相放大器
        try:
            amp = OpAmpAmplifier()
            circuit = amp.design_non_inverting(gain=10)

            assert circuit['circuit_type'] == 'non_inverting_amplifier'
            assert circuit['actual_gain'] > 0
            assert 'R1' in circuit
            assert 'R2' in circuit
            assert 'opamp_model' in circuit

            results.add_pass("非反相放大器設計")
        except Exception as e:
            results.add_fail("非反相放大器設計", e)

        # 測試 2: 反相放大器
        try:
            circuit = amp.design_inverting(gain=-5)

            assert circuit['circuit_type'] == 'inverting_amplifier'
            assert circuit['actual_gain'] < 0
            assert circuit['input_impedance'] > 0

            results.add_pass("反相放大器設計")
        except Exception as e:
            results.add_fail("反相放大器設計", e)

        # 測試 3: 差動放大器
        try:
            circuit = amp.design_differential(gain=5)

            assert circuit['circuit_type'] == 'differential_amplifier'
            assert 'R1' in circuit and 'R2' in circuit
            assert 'R3' in circuit and 'R4' in circuit

            results.add_pass("差動放大器設計")
        except Exception as e:
            results.add_fail("差動放大器設計", e)

        # 測試 4: 加法放大器
        try:
            circuit = amp.design_summing(gains=[-1, -2, -3])

            assert circuit['circuit_type'] == 'summing_amplifier'
            assert circuit['num_inputs'] == 3
            assert len(circuit['input_resistors']) == 3

            results.add_pass("加法放大器設計")
        except Exception as e:
            results.add_fail("加法放大器設計", e)

    except ImportError as e:
        results.add_fail("放大器模組導入", e)


def test_digital_circuits(results):
    """測試數位電路設計"""
    print("\n🧪 測試: 數位電路設計模組")

    try:
        from logic_designer import LogicGateDesigner, CounterDesigner, FlipFlopDesigner

        # 測試 1: 加法器
        try:
            designer = LogicGateDesigner()
            circuit = designer.design_adder(bits=4)

            assert circuit['circuit_type'] == 'binary_adder'
            assert circuit['bits'] == 4
            assert 'ic_model' in circuit

            results.add_pass("4-bit 加法器設計")
        except Exception as e:
            results.add_fail("4-bit 加法器設計", e)

        # 測試 2: 解碼器
        try:
            circuit = designer.design_decoder(inputs=3, outputs=8)

            assert circuit['circuit_type'] == 'decoder'
            assert circuit['inputs'] == 3
            assert circuit['outputs'] == 8

            results.add_pass("3-to-8 解碼器設計")
        except Exception as e:
            results.add_fail("3-to-8 解碼器設計", e)

        # 測試 3: 計數器
        try:
            counter = CounterDesigner()
            circuit = counter.design_counter(modulo=10)

            assert circuit['circuit_type'] == 'counter'
            assert circuit['modulo'] == 10

            results.add_pass("十進制計數器設計")
        except Exception as e:
            results.add_fail("十進制計數器設計", e)

        # 測試 4: 移位暫存器
        try:
            ff = FlipFlopDesigner()
            circuit = ff.design_register(bits=8, shift=True)

            assert circuit['circuit_type'] == 'shift_register'
            assert circuit['bits'] == 8

            results.add_pass("8-bit 移位暫存器設計")
        except Exception as e:
            results.add_fail("8-bit 移位暫存器設計", e)

    except ImportError as e:
        results.add_fail("數位電路模組導入", e)


def test_power_supply_designs(results):
    """測試電源設計"""
    print("\n🧪 測試: 電源設計模組")

    try:
        from smps_designer import BuckConverter, BoostConverter, BatteryCharger

        # 測試 1: Buck 轉換器
        try:
            buck = BuckConverter()
            circuit = buck.design(
                input_voltage=12,
                output_voltage=5,
                output_current=2
            )

            assert circuit['converter_type'] == 'buck'
            assert circuit['input_voltage'] == 12
            assert circuit['output_voltage'] == 5
            assert 0 < circuit['duty_cycle'] < 1
            assert circuit['L'] > 0
            assert circuit['C'] > 0

            results.add_pass("Buck 降壓轉換器設計")
        except Exception as e:
            results.add_fail("Buck 降壓轉換器設計", e)

        # 測試 2: Boost 轉換器
        try:
            boost = BoostConverter()
            circuit = boost.design(
                input_voltage=5,
                output_voltage=12,
                output_current=1
            )

            assert circuit['converter_type'] == 'boost'
            assert circuit['output_voltage'] > circuit['input_voltage']

            results.add_pass("Boost 升壓轉換器設計")
        except Exception as e:
            results.add_fail("Boost 升壓轉換器設計", e)

        # 測試 3: 鋰電池充電器
        try:
            charger = BatteryCharger()
            circuit = charger.design_liion_charger(
                battery_voltage=4.2,
                charge_current=0.5
            )

            assert circuit['charger_type'] == 'li_ion'
            assert circuit['battery_voltage'] == 4.2
            assert circuit['charge_current'] == 0.5

            results.add_pass("鋰電池充電器設計")
        except Exception as e:
            results.add_fail("鋰電池充電器設計", e)

    except ImportError as e:
        results.add_fail("電源模組導入", e)


def test_filter_designs(results):
    """測試濾波器設計"""
    print("\n🧪 測試: 濾波器設計模組")

    try:
        from active_filter import ActiveFilterDesigner, PassiveFilterDesigner

        # 測試 1: 主動低通濾波器
        try:
            designer = ActiveFilterDesigner()
            circuit = designer.design_lowpass_butterworth(cutoff_frequency=1000)

            assert circuit['filter_type'] == 'lowpass_butterworth'
            assert circuit['cutoff_frequency'] == 1000
            assert circuit['R'] > 0
            assert circuit['C'] > 0

            results.add_pass("主動低通濾波器設計")
        except Exception as e:
            results.add_fail("主動低通濾波器設計", e)

        # 測試 2: 帶通濾波器
        try:
            circuit = designer.design_bandpass(
                center_frequency=1000,
                bandwidth=100
            )

            assert circuit['filter_type'] == 'bandpass_mfb'
            assert circuit['Q'] > 0

            results.add_pass("帶通濾波器設計")
        except Exception as e:
            results.add_fail("帶通濾波器設計", e)

        # 測試 3: 被動 RC 濾波器
        try:
            passive = PassiveFilterDesigner()
            circuit = passive.design_rc_lowpass(cutoff_frequency=1000)

            assert circuit['filter_type'] == 'rc_lowpass'
            assert circuit['order'] == 1

            results.add_pass("被動 RC 濾波器設計")
        except Exception as e:
            results.add_fail("被動 RC 濾波器設計", e)

    except ImportError as e:
        results.add_fail("濾波器模組導入", e)


def test_sensor_interfaces(results):
    """測試感測器介面"""
    print("\n🧪 測試: 感測器介面模組")

    try:
        from sensor_interface import TemperatureSensor, I2CSensorInterface, AnalogSensorConditioning

        # 測試 1: LM35 介面
        try:
            temp = TemperatureSensor()
            circuit = temp.design_lm35_interface(mcu_adc_voltage=3.3)

            assert circuit['sensor_type'] == 'LM35'
            assert 'output_voltage_range' in circuit

            results.add_pass("LM35 溫度感測器介面")
        except Exception as e:
            results.add_fail("LM35 溫度感測器介面", e)

        # 測試 2: I2C 上拉電阻
        try:
            i2c = I2CSensorInterface()
            circuit = i2c.design_i2c_pullup(bus_voltage=3.3)

            assert circuit['interface_type'] == 'I2C'
            assert 'r_pullup_recommended' in circuit
            assert circuit['r_pullup_recommended'] > 0

            results.add_pass("I2C 上拉電阻設計")
        except Exception as e:
            results.add_fail("I2C 上拉電阻設計", e)

        # 測試 3: 4-20mA 電流迴路
        try:
            analog = AnalogSensorConditioning()
            circuit = analog.design_current_loop_receiver()

            assert circuit['interface_type'] == '4-20mA_current_loop'
            assert 'r_sense' in circuit

            results.add_pass("4-20mA 電流迴路接收器")
        except Exception as e:
            results.add_fail("4-20mA 電流迴路接收器", e)

    except ImportError as e:
        results.add_fail("感測器模組導入", e)


def test_bom_generator(results):
    """測試 BOM 生成器"""
    print("\n🧪 測試: BOM 生成器")

    try:
        from bom_generator import BOMBuilder, Component

        # 測試 1: BOM 建構
        try:
            bom_builder = BOMBuilder("Test Project")
            bom_builder.add_resistor("10kΩ", quantity=5)
            bom_builder.add_capacitor("100nF", quantity=3)
            bom_builder.add_ic("LM358", description="OpAmp")

            bom = bom_builder.get_bom()

            assert bom.get_component_count() == 9  # 5 + 3 + 1
            assert bom.get_unique_parts() == 3
            assert bom.get_total_cost() > 0

            results.add_pass("BOM 建構和計算")
        except Exception as e:
            results.add_fail("BOM 建構和計算", e)

        # 測試 2: BOM 匯出
        try:
            import tempfile
            with tempfile.TemporaryDirectory() as tmpdir:
                bom.export_csv(f"{tmpdir}/test_bom.csv")
                bom.export_json(f"{tmpdir}/test_bom.json")
                bom.export_html(f"{tmpdir}/test_bom.html")

                # 檢查檔案是否建立
                assert os.path.exists(f"{tmpdir}/test_bom.csv")
                assert os.path.exists(f"{tmpdir}/test_bom.json")
                assert os.path.exists(f"{tmpdir}/test_bom.html")

            results.add_pass("BOM 檔案匯出")
        except Exception as e:
            results.add_fail("BOM 檔案匯出", e)

    except ImportError as e:
        results.add_fail("BOM 生成器模組導入", e)


def test_component_library(results):
    """測試元件庫"""
    print("\n🧪 測試: 元件庫")

    try:
        from component_library import E_Series, OpAmpLibrary

        # 測試 1: E-Series 標準值
        try:
            value, magnitude = E_Series.nearest_value(9876, series='E24')

            assert isinstance(value, (int, float))
            assert value > 0

            results.add_pass("E-Series 標準值查找")
        except Exception as e:
            results.add_fail("E-Series 標準值查找", e)

        # 測試 2: OpAmp 選擇
        try:
            opamp = OpAmpLibrary.select_opamp(supply_voltage=15)

            assert opamp in OpAmpLibrary.COMMON_OPAMPS
            results.add_pass("OpAmp 選擇")
        except Exception as e:
            results.add_fail("OpAmp 選擇", e)

    except ImportError as e:
        results.add_fail("元件庫模組導入", e)


def main():
    """主測試函數"""
    print("="*70)
    print("🧪 電路設計模組完整測試")
    print("="*70)

    results = TestResults()

    # 執行所有測試
    test_amplifier_designs(results)
    test_digital_circuits(results)
    test_power_supply_designs(results)
    test_filter_designs(results)
    test_sensor_interfaces(results)
    test_bom_generator(results)
    test_component_library(results)

    # 顯示總結
    results.print_summary()

    # 返回成功/失敗
    return results.failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
