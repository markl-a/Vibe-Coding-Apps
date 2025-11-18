"""
互動式 AI 電路設計助手
提供對話式電路設計體驗
"""

import sys
import os
from typing import Optional, Dict, List
import json

# 設置路徑
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)
sys.path.insert(0, os.path.join(base_dir, 'src'))
sys.path.insert(0, os.path.join(base_dir, 'analog-circuit-generator', 'src'))
sys.path.insert(0, os.path.join(base_dir, 'digital-circuit-generator', 'src'))
sys.path.insert(0, os.path.join(base_dir, 'power-supply-designer', 'src'))
sys.path.insert(0, os.path.join(base_dir, 'filter-designer', 'src'))
sys.path.insert(0, os.path.join(base_dir, 'sensor-interface-generator', 'src'))

from amplifier_designer import OpAmpAmplifier
from smps_designer import BuckConverter, BoostConverter, BatteryCharger
from active_filter import ActiveFilterDesigner
from logic_designer import LogicGateDesigner, CounterDesigner
from sensor_interface import TemperatureSensor, I2CSensorInterface
from ai_assistant import AICircuitAssistant
from bom_generator import BOMBuilder
from circuit_visualizer import CircuitVisualizer


class InteractiveCircuitDesigner:
    """互動式電路設計助手"""

    def __init__(self):
        """初始化設計助手"""
        self.ai = AICircuitAssistant()
        self.current_design = None
        self.bom_builder = None
        self.visualizer = CircuitVisualizer()

    def start(self):
        """啟動互動式設計助手"""
        self.print_header()
        self.main_menu()

    def print_header(self):
        """列印標題"""
        print("\n" + "="*70)
        print("🤖 AI 互動式電路設計助手")
        print("="*70)
        print("歡迎使用 AI 輔助電路設計系統！")
        print("我可以幫助您設計各種類型的電子電路\n")

    def main_menu(self):
        """主選單"""
        while True:
            print("\n" + "-"*70)
            print("📋 主選單")
            print("-"*70)
            print("1. 🔌 模擬電路設計 (放大器、穩壓器)")
            print("2. 🔲 數位電路設計 (邏輯門、計數器)")
            print("3. ⚡ 電源電路設計 (SMPS、充電器)")
            print("4. 📊 濾波器設計 (主動/被動濾波器)")
            print("5. 🌡️  感測器介面設計")
            print("6. 🤖 AI 自由設計 (自然語言描述)")
            print("7. 📋 查看當前 BOM")
            print("8. 💾 匯出設計")
            print("9. ℹ️  說明和範例")
            print("0. 🚪 退出")
            print("-"*70)

            choice = input("\n請選擇 (0-9): ").strip()

            if choice == '1':
                self.analog_circuit_menu()
            elif choice == '2':
                self.digital_circuit_menu()
            elif choice == '3':
                self.power_supply_menu()
            elif choice == '4':
                self.filter_menu()
            elif choice == '5':
                self.sensor_interface_menu()
            elif choice == '6':
                self.ai_free_design()
            elif choice == '7':
                self.view_bom()
            elif choice == '8':
                self.export_design()
            elif choice == '9':
                self.show_help()
            elif choice == '0':
                print("\n👋 感謝使用！再見！")
                break
            else:
                print("❌ 無效選擇，請重試")

    def analog_circuit_menu(self):
        """模擬電路設計選單"""
        print("\n" + "-"*70)
        print("🔌 模擬電路設計")
        print("-"*70)
        print("1. 非反相放大器")
        print("2. 反相放大器")
        print("3. 差動放大器")
        print("4. 加法放大器")
        print("0. 返回主選單")

        choice = input("\n請選擇: ").strip()

        if choice == '1':
            self.design_non_inverting_amp()
        elif choice == '2':
            self.design_inverting_amp()
        elif choice == '3':
            self.design_differential_amp()
        elif choice == '4':
            self.design_summing_amp()

    def design_non_inverting_amp(self):
        """設計非反相放大器"""
        print("\n📐 非反相放大器設計")

        try:
            gain = float(input("請輸入目標增益 (例如: 10): "))
            if gain < 1:
                print("❌ 非反相放大器增益必須 ≥ 1")
                return

            supply_voltage = float(input("請輸入電源電壓 (V, 例如: 15): ") or "15")

            print("\n⚙️  計算中...")

            amp = OpAmpAmplifier(supply_voltage=supply_voltage)
            circuit = amp.design_non_inverting(gain=gain)

            self.current_design = circuit
            self.display_circuit_info(circuit)

            # AI 分析
            if input("\n是否需要 AI 設計分析？ (y/n): ").lower() == 'y':
                suggestions = self.ai.analyze_design('non_inverting_amplifier', circuit)
                self.display_suggestions(suggestions)

            # 添加到 BOM
            if input("\n是否添加到 BOM？ (y/n): ").lower() == 'y':
                self.add_amplifier_to_bom(circuit)

            # 可視化
            if input("\n是否生成電路圖？ (y/n): ").lower() == 'y':
                self.visualizer.draw_opamp_circuit(
                    circuit['circuit_type'],
                    circuit,
                    "/tmp/amplifier.svg"
                )

        except ValueError:
            print("❌ 輸入錯誤，請輸入有效數值")
        except Exception as e:
            print(f"❌ 設計失敗: {e}")

    def design_inverting_amp(self):
        """設計反相放大器"""
        print("\n📐 反相放大器設計")

        try:
            gain = float(input("請輸入目標增益 (負值, 例如: -5): "))
            input_impedance = float(input("請輸入輸入阻抗 (Ω, 例如: 10000): ") or "10000")

            amp = OpAmpAmplifier()
            circuit = amp.design_inverting(gain=gain, input_impedance=input_impedance)

            self.current_design = circuit
            self.display_circuit_info(circuit)

            if input("\n是否添加到 BOM？ (y/n): ").lower() == 'y':
                self.add_amplifier_to_bom(circuit)

        except Exception as e:
            print(f"❌ 設計失敗: {e}")

    def power_supply_menu(self):
        """電源設計選單"""
        print("\n" + "-"*70)
        print("⚡ 電源電路設計")
        print("-"*70)
        print("1. Buck 降壓轉換器")
        print("2. Boost 升壓轉換器")
        print("3. 鋰電池充電器")
        print("0. 返回主選單")

        choice = input("\n請選擇: ").strip()

        if choice == '1':
            self.design_buck_converter()
        elif choice == '2':
            self.design_boost_converter()
        elif choice == '3':
            self.design_battery_charger()

    def design_buck_converter(self):
        """設計 Buck 轉換器"""
        print("\n📐 Buck 降壓轉換器設計")

        try:
            vin = float(input("請輸入輸入電壓 (V, 例如: 12): "))
            vout = float(input("請輸入輸出電壓 (V, 例如: 5): "))
            iout = float(input("請輸入輸出電流 (A, 例如: 2): "))

            buck = BuckConverter()
            circuit = buck.design(
                input_voltage=vin,
                output_voltage=vout,
                output_current=iout
            )

            self.current_design = circuit
            self.display_circuit_info(circuit)

            print(f"\n💡 關鍵參數:")
            print(f"  工作週期: {circuit['duty_cycle_percent']:.1f}%")
            print(f"  電感: {circuit['L']*1e6:.2f} µH")
            print(f"  電容: {circuit['C']*1e6:.2f} µF")
            print(f"  效率: {circuit['efficiency']:.1f}%")
            print(f"  推薦 IC: {circuit['recommended_ic']}")

            # AI 優化建議
            if input("\n是否需要 AI 優化建議？ (y/n): ").lower() == 'y':
                suggestions = self.ai.analyze_design('buck_converter', circuit)
                self.display_suggestions(suggestions)

            # 可視化
            if input("\n是否生成電路圖？ (y/n): ").lower() == 'y':
                self.visualizer.draw_power_supply('buck', circuit, "/tmp/buck_converter.svg")

        except Exception as e:
            print(f"❌ 設計失敗: {e}")

    def filter_menu(self):
        """濾波器設計選單"""
        print("\n" + "-"*70)
        print("📊 濾波器設計")
        print("-"*70)
        print("1. 低通濾波器")
        print("2. 高通濾波器")
        print("3. 帶通濾波器")
        print("4. 陷波濾波器")
        print("0. 返回主選單")

        choice = input("\n請選擇: ").strip()

        if choice == '1':
            self.design_lowpass_filter()
        elif choice == '2':
            self.design_highpass_filter()
        elif choice == '3':
            self.design_bandpass_filter()
        elif choice == '4':
            self.design_notch_filter()

    def design_lowpass_filter(self):
        """設計低通濾波器"""
        print("\n📐 低通濾波器設計")

        try:
            fc = float(input("請輸入截止頻率 (Hz, 例如: 1000): "))
            gain = float(input("請輸入增益 (例如: 1): ") or "1")

            designer = ActiveFilterDesigner()
            circuit = designer.design_lowpass_butterworth(
                cutoff_frequency=fc,
                gain=gain
            )

            self.current_design = circuit
            self.display_circuit_info(circuit)

            # 頻率響應圖
            if input("\n是否生成頻率響應圖？ (y/n): ").lower() == 'y':
                self.visualizer.plot_frequency_response(
                    'lowpass',
                    circuit,
                    "/tmp/filter_response.png"
                )

        except Exception as e:
            print(f"❌ 設計失敗: {e}")

    def ai_free_design(self):
        """AI 自由設計"""
        print("\n" + "-"*70)
        print("🤖 AI 自由設計模式")
        print("-"*70)
        print("請用自然語言描述您想要設計的電路")
        print("範例: \"設計一個5V到3.3V的線性穩壓器，輸出電流500mA\"")
        print("      \"設計一個用於音頻的低通濾波器，截止頻率20kHz\"")
        print("\n輸入 'exit' 返回主選單")

        description = input("\n您的需求: ").strip()

        if description.lower() == 'exit':
            return

        if not description:
            print("❌ 請提供設計描述")
            return

        print("\n🤖 AI 正在分析您的需求...")

        # 使用 AI 解析需求並提供建議
        explanation = self.ai.explain_design("user_requirement", {"description": description})

        print(f"\n{explanation}")

        # 這裡可以進一步擴展，讓 AI 自動選擇合適的設計模組
        print("\n💡 提示: 根據您的需求，我建議使用以下功能:")
        if "放大" in description or "amplif" in description.lower():
            print("  - 模擬電路設計 → 放大器")
        if "濾波" in description or "filter" in description.lower():
            print("  - 濾波器設計")
        if "電源" in description or "power" in description.lower() or "穩壓" in description:
            print("  - 電源電路設計")

    def display_circuit_info(self, circuit: Dict):
        """顯示電路資訊"""
        print("\n✅ 設計完成！")
        print("-" * 50)
        for key, value in circuit.items():
            if isinstance(value, float):
                print(f"  {key}: {value:.4f}")
            elif isinstance(value, (list, dict)):
                print(f"  {key}: {json.dumps(value, indent=4, ensure_ascii=False)}")
            else:
                print(f"  {key}: {value}")

    def display_suggestions(self, suggestions: List):
        """顯示 AI 建議"""
        print("\n🤖 AI 設計建議:")
        print("-" * 50)
        for i, suggestion in enumerate(suggestions, 1):
            print(f"\n建議 {i} [{suggestion.priority.upper()}]:")
            print(f"  類別: {suggestion.category}")
            print(f"  建議: {suggestion.suggestion}")
            print(f"  理由: {suggestion.reasoning}")

    def add_amplifier_to_bom(self, circuit: Dict):
        """添加放大器元件到 BOM"""
        if not self.bom_builder:
            project_name = input("請輸入專案名稱: ") or "My Circuit"
            self.bom_builder = BOMBuilder(project_name)

        self.bom_builder.add_resistor(
            circuit.get('R1_formatted', '10kΩ'),
            description="Feedback resistor R1"
        )
        self.bom_builder.add_resistor(
            circuit.get('R2_formatted', '10kΩ'),
            description="Feedback resistor R2"
        )
        self.bom_builder.add_ic(
            circuit.get('opamp_model', 'LM358'),
            description="Operational Amplifier"
        )
        self.bom_builder.add_capacitor("100nF", quantity=2, description="Decoupling")

        print("✅ 已添加到 BOM")

    def view_bom(self):
        """查看 BOM"""
        if not self.bom_builder:
            print("\n⚠️  BOM 為空，請先設計電路")
            return

        bom = self.bom_builder.get_bom()
        bom.print_summary()

    def export_design(self):
        """匯出設計"""
        if not self.bom_builder:
            print("\n⚠️  沒有可匯出的設計")
            return

        print("\n📁 匯出選項:")
        print("1. CSV 格式")
        print("2. JSON 格式")
        print("3. HTML 格式")
        print("4. 全部匯出")

        choice = input("\n請選擇: ").strip()

        output_dir = input("請輸入輸出目錄 (預設: /tmp): ") or "/tmp"
        filename_base = input("請輸入檔案名稱 (預設: circuit_bom): ") or "circuit_bom"

        bom = self.bom_builder.get_bom()

        if choice == '1' or choice == '4':
            bom.export_csv(f"{output_dir}/{filename_base}.csv")
        if choice == '2' or choice == '4':
            bom.export_json(f"{output_dir}/{filename_base}.json")
        if choice == '3' or choice == '4':
            bom.export_html(f"{output_dir}/{filename_base}.html")

        print(f"\n✅ 匯出完成到 {output_dir}/")

    def show_help(self):
        """顯示說明"""
        print("\n" + "="*70)
        print("ℹ️  使用說明")
        print("="*70)
        print("""
這是一個 AI 輔助的互動式電路設計系統。您可以：

1. 📐 選擇電路類型進行參數化設計
   - 系統會根據您的規格計算元件值
   - 提供標準元件值建議

2. 🤖 使用 AI 輔助功能
   - 設計分析和優化建議
   - 自然語言電路描述
   - 故障診斷

3. 📋 自動生成 BOM
   - 物料清單自動生成
   - 成本估算
   - 多種格式匯出

4. 🎨 電路可視化
   - 自動繪製電路圖
   - 頻率響應圖
   - 仿真結果

範例工作流程:
  1) 選擇電路類型
  2) 輸入設計參數
  3) 查看設計結果
  4) 獲取 AI 建議
  5) 添加到 BOM
  6) 匯出設計文件

提示: 若要使用 AI 功能，請設置環境變數:
  export OPENAI_API_KEY="your-key"
  或
  export ANTHROPIC_API_KEY="your-key"
""")
        input("\n按 Enter 繼續...")


def main():
    """主函數"""
    designer = InteractiveCircuitDesigner()
    designer.start()


if __name__ == "__main__":
    main()
