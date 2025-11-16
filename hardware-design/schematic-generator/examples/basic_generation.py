"""
基本原理圖生成範例
展示如何使用 AI 原理圖生成器
"""

import sys
sys.path.insert(0, '../src')

from generator import SchematicAI


def main():
    """主函數"""
    print("=== AI 原理圖生成器 - 基本範例 ===\n")

    # 初始化生成器
    gen = SchematicAI(model="gpt-4")

    # 電路描述
    description = """
    設計一個 Arduino 連接的溫度感測器電路:
    - 使用 LM35 溫度感測器
    - 輸出連接到 Arduino A0 (0-5V)
    - 包含必要的濾波電路
    - 指示 LED
    """

    # 生成電路
    circuit = gen.generate(description)

    # 顯示資訊
    print(f"\n生成的電路:")
    print(f"  元件數量: {len(circuit.components)}")
    print(f"  網表預覽: {circuit.netlist[:100]}...")

    # 匯出到 KiCAD（示範）
    # circuit.export_kicad("temp_sensor.kicad_sch")

    # 模擬驗證（示範）
    # simulation = circuit.simulate()
    # print(f"  輸出電壓範圍: {simulation.vout_min:.2f}V - {simulation.vout_max:.2f}V")

    print("\n範例執行完成！")


if __name__ == "__main__":
    main()
