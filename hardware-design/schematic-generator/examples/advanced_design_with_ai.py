"""
進階電路設計範例 - 整合 AI 輔助、BOM 生成和可視化
展示完整的設計流程
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'analog-circuit-generator', 'src'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'power-supply-designer', 'src'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'filter-designer', 'src'))

from amplifier_designer import OpAmpAmplifier
from smps_designer import BuckConverter, BoostConverter
from active_filter import ActiveFilterDesigner
from ai_assistant import AICircuitAssistant, ParameterOptimizer
from bom_generator import BOMBuilder, Component
from circuit_visualizer import CircuitVisualizer


def example_1_amplifier_with_ai():
    """範例 1: 使用 AI 輔助設計放大器"""
    print("\n" + "="*70)
    print("範例 1: AI 輔助放大器設計")
    print("="*70)

    # 1. 設計放大器
    amp = OpAmpAmplifier(supply_voltage=12)
    circuit = amp.design_non_inverting(gain=10, input_impedance=10000)

    print("\n📐 電路設計:")
    print(f"  類型: {circuit['circuit_type']}")
    print(f"  目標增益: {circuit['target_gain']}")
    print(f"  實際增益: {circuit['actual_gain']:.3f}")
    print(f"  誤差: {circuit['error_percent']:.2f}%")
    print(f"  R1: {circuit['R1_formatted']}")
    print(f"  R2: {circuit['R2_formatted']}")
    print(f"  OpAmp: {circuit['opamp_model']}")

    # 2. AI 分析
    print("\n🤖 AI 設計分析:")
    ai = AICircuitAssistant(model="gpt-4")
    suggestions = ai.analyze_design('non_inverting_amplifier', circuit)

    if suggestions:
        for i, suggestion in enumerate(suggestions, 1):
            print(f"\n  建議 {i} [{suggestion.priority.upper()}]:")
            print(f"    類別: {suggestion.category}")
            print(f"    建議: {suggestion.suggestion}")
            print(f"    理由: {suggestion.reasoning}")
    else:
        print("  (AI 功能未啟用或分析失敗)")

    # 3. 生成 BOM
    print("\n📋 生成物料清單 (BOM):")
    bom_builder = BOMBuilder("Non-Inverting Amplifier")

    # 添加元件
    bom_builder.add_resistor(circuit['R1_formatted'], description="Feedback divider")
    bom_builder.add_resistor(circuit['R2_formatted'], description="Feedback resistor")
    bom_builder.add_ic(circuit['opamp_model'], description="Operational Amplifier", manufacturer="Texas Instruments")
    bom_builder.add_capacitor("100nF", description="Decoupling capacitor", quantity=2)

    bom = bom_builder.get_bom()
    bom.print_summary()

    # 匯出 BOM
    output_dir = "/tmp"
    bom.export_csv(f"{output_dir}/amplifier_bom.csv")
    bom.export_html(f"{output_dir}/amplifier_bom.html")

    # 4. 可視化
    print("\n🎨 生成電路圖:")
    visualizer = CircuitVisualizer()
    try:
        output_file = visualizer.draw_opamp_circuit(
            circuit['circuit_type'],
            circuit,
            f"{output_dir}/amplifier_circuit.svg"
        )
        print(f"  電路圖: {output_file}")
    except Exception as e:
        print(f"  繪圖失敗 (使用 ASCII 版本): {e}")
        visualizer.draw_opamp_circuit(circuit['circuit_type'], circuit)


def example_2_power_supply_optimization():
    """範例 2: 使用 AI 優化電源設計"""
    print("\n" + "="*70)
    print("範例 2: AI 優化的 Buck 轉換器設計")
    print("="*70)

    # 1. 初始設計
    buck = BuckConverter()
    circuit = buck.design(
        input_voltage=12,
        output_voltage=5,
        output_current=2,
        switching_frequency=100000
    )

    print("\n📐 初始設計:")
    print(f"  輸入: {circuit['input_voltage']}V")
    print(f"  輸出: {circuit['output_voltage']}V @ {circuit['output_current']}A")
    print(f"  功率: {circuit['output_power']:.2f}W")
    print(f"  工作週期: {circuit['duty_cycle_percent']:.1f}%")
    print(f"  電感: {circuit['L']*1e6:.2f} µH")
    print(f"  電容: {circuit['C']*1e6:.2f} µF")
    print(f"  效率: {circuit['efficiency']:.1f}%")

    # 2. AI 優化
    print("\n🤖 AI 參數優化:")
    ai = AICircuitAssistant()
    optimizer = ParameterOptimizer(ai)

    print("  優化目標: 效率")
    optimized = optimizer.optimize_for_efficiency('buck_converter', circuit)

    if optimized and optimized != circuit:
        print("  ✓ 優化完成")
        # 這裡可以比較優化前後的差異
    else:
        print("  (使用原始設計)")

    # 3. 生成 BOM
    print("\n📋 生成 BOM:")
    bom_builder = BOMBuilder("Buck Converter 12V to 5V")

    bom_builder.add_ic(
        circuit['recommended_ic'],
        description="Buck Controller IC",
        manufacturer="Texas Instruments"
    )
    bom_builder.add_inductor(
        f"{circuit['L']*1e6:.1f}µH",
        description="Power Inductor",
        manufacturer="Würth Elektronik"
    )
    bom_builder.add_capacitor(
        f"{circuit['C']*1e6:.1f}µF",
        cap_type='electrolytic',
        description="Output Capacitor"
    )
    bom_builder.add_capacitor(
        "10µF",
        description="Input Capacitor"
    )
    bom_builder.add_resistor("10kΩ", description="Feedback resistor", quantity=2)

    bom = bom_builder.get_bom()
    bom.print_summary()

    # 4. 可視化
    print("\n🎨 生成電路圖:")
    visualizer = CircuitVisualizer()
    output_dir = "/tmp"

    try:
        visualizer.draw_power_supply(
            'buck',
            circuit,
            f"{output_dir}/buck_converter.svg"
        )
    except Exception as e:
        print(f"  繪圖失敗: {e}")


def example_3_filter_with_frequency_response():
    """範例 3: 濾波器設計與頻率響應分析"""
    print("\n" + "="*70)
    print("範例 3: 低通濾波器設計與頻率響應")
    print("="*70)

    # 1. 設計濾波器
    filter_designer = ActiveFilterDesigner()
    circuit = filter_designer.design_lowpass_butterworth(
        cutoff_frequency=1000,  # 1kHz
        order=2,
        gain=1
    )

    print("\n📐 濾波器設計:")
    print(f"  類型: {circuit['filter_type']}")
    print(f"  截止頻率: {circuit['cutoff_frequency']} Hz")
    print(f"  階數: {circuit['order']}")
    print(f"  Q 值: {circuit['Q']}")
    print(f"  R: {circuit['R']:.0f} Ω")
    print(f"  C: {circuit['C']*1e9:.2f} nF")

    # 2. AI 說明
    print("\n🤖 AI 設計說明:")
    ai = AICircuitAssistant()
    explanation = ai.explain_design('lowpass_butterworth_filter', circuit)
    if explanation:
        print(f"\n{explanation}")
    else:
        print("  (AI 功能未啟用)")

    # 3. 頻率響應
    print("\n📊 生成頻率響應圖:")
    visualizer = CircuitVisualizer()
    output_dir = "/tmp"

    try:
        visualizer.plot_frequency_response(
            'lowpass',
            circuit,
            f"{output_dir}/filter_response.png"
        )
        print(f"  ✓ 頻率響應圖已保存")
    except Exception as e:
        print(f"  繪圖失敗: {e}")

    # 4. BOM
    print("\n📋 生成 BOM:")
    bom_builder = BOMBuilder("Butterworth Low-Pass Filter")

    bom_builder.add_resistor(f"{circuit['R']:.0f}Ω", quantity=2, description="Sallen-Key resistors")
    bom_builder.add_capacitor(f"{circuit['C']*1e9:.0f}nF", quantity=2, description="Sallen-Key capacitors")
    bom_builder.add_ic(circuit['opamp'], description="Operational Amplifier")

    bom = bom_builder.get_bom()
    bom.print_summary()


def example_4_complete_system():
    """範例 4: 完整系統設計（感測器 + 放大器 + 濾波器）"""
    print("\n" + "="*70)
    print("範例 4: 完整感測器信號調理系統")
    print("="*70)

    print("\n📐 系統架構:")
    print("  感測器 → 放大器 → 濾波器 → ADC")

    # 綜合 BOM
    bom_builder = BOMBuilder("Complete Sensor Signal Conditioning System")

    print("\n1️⃣  感測器介面:")
    # LM35 溫度感測器
    bom_builder.add_ic("LM35", description="Temperature Sensor", manufacturer="Texas Instruments")
    bom_builder.add_capacitor("100nF", description="Sensor decoupling")
    print("   ✓ LM35 溫度感測器")

    print("\n2️⃣  放大器級:")
    # 放大器設計
    amp = OpAmpAmplifier()
    amp_circuit = amp.design_non_inverting(gain=5)

    bom_builder.add_ic(amp_circuit['opamp_model'], description="Amplifier")
    bom_builder.add_resistor(amp_circuit['R1_formatted'], description="Amplifier R1")
    bom_builder.add_resistor(amp_circuit['R2_formatted'], description="Amplifier R2")
    print(f"   ✓ 非反相放大器 (增益 {amp_circuit['actual_gain']:.1f})")

    print("\n3️⃣  濾波器級:")
    # 濾波器設計
    filter_designer = ActiveFilterDesigner()
    filter_circuit = filter_designer.design_lowpass_butterworth(cutoff_frequency=100)

    bom_builder.add_resistor(f"{filter_circuit['R']:.0f}Ω", quantity=2, description="Filter resistors")
    bom_builder.add_capacitor(f"{filter_circuit['C']*1e6:.2f}µF", quantity=2, description="Filter capacitors")
    print(f"   ✓ 低通濾波器 (fc = {filter_circuit['cutoff_frequency']} Hz)")

    print("\n4️⃣  電源:")
    bom_builder.add_ic("LM7805", description="5V Regulator")
    bom_builder.add_capacitor("10µF", cap_type='electrolytic', quantity=2, description="Regulator capacitors")
    print("   ✓ 5V 穩壓器")

    # 完整 BOM
    print("\n" + "="*70)
    bom = bom_builder.get_bom()
    bom.print_summary()

    # 匯出
    output_dir = "/tmp"
    bom.export_csv(f"{output_dir}/complete_system_bom.csv")
    bom.export_html(f"{output_dir}/complete_system_bom.html")
    bom.export_json(f"{output_dir}/complete_system_bom.json")

    print(f"\n✓ BOM 已匯出到 {output_dir}/")
    print(f"  - CSV: complete_system_bom.csv")
    print(f"  - HTML: complete_system_bom.html")
    print(f"  - JSON: complete_system_bom.json")


def main():
    """主函數"""
    print("\n" + "="*70)
    print("🚀 AI 輔助電路設計系統 - 進階範例")
    print("="*70)
    print("\n展示功能:")
    print("  ✓ AI 輔助設計分析")
    print("  ✓ 參數優化")
    print("  ✓ BOM 自動生成")
    print("  ✓ 電路可視化")
    print("  ✓ 頻率響應分析")

    try:
        # 執行所有範例
        example_1_amplifier_with_ai()
        example_2_power_supply_optimization()
        example_3_filter_with_frequency_response()
        example_4_complete_system()

        print("\n" + "="*70)
        print("✅ 所有範例執行完成！")
        print("="*70)
        print("\n📁 輸出檔案位置: /tmp/")
        print("  - *.csv, *.html, *.json (BOM 檔案)")
        print("  - *.svg, *.png (電路圖)")

    except Exception as e:
        print(f"\n❌ 錯誤: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
