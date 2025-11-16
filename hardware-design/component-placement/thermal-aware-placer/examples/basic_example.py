"""
熱感知元件擺放器基本範例
"""

import sys
sys.path.insert(0, '../src')

from thermal_placer import ThermalAwarePlacer


def main():
    """主函數"""
    print("=== 熱感知元件擺放器範例 ===\n")

    # 初始化擺放器
    placer = ThermalAwarePlacer(
        board_size=(100, 80),
        ambient_temp=25.0,  # 環境溫度 25°C
        grid_resolution=0.5  # 0.5mm 網格
    )

    # 添加元件（含功耗資訊）
    print("添加元件...")
    # 高功耗元件
    placer.add_component("CPU", size=(15, 15), power=5.0, thermal_resistance=5.0)
    placer.add_component("VREG", size=(10, 8), power=3.0, thermal_resistance=8.0)
    placer.add_component("MOSFET", size=(6, 5), power=2.0, thermal_resistance=10.0)

    # 中等功耗元件
    placer.add_component("LED_DRIVER", size=(8, 6), power=1.0)
    placer.add_component("OPAMP", size=(6, 5), power=0.5)

    # 低功耗元件
    placer.add_component("FLASH", size=(8, 6), power=0.2)
    placer.add_component("R1", size=(5, 3), power=0.1)
    placer.add_component("R2", size=(5, 3), power=0.1)
    placer.add_component("C1", size=(4, 4), power=0.0)
    placer.add_component("C2", size=(4, 4), power=0.0)
    placer.add_component("C3", size=(4, 4), power=0.0)

    # 添加連接關係
    print("添加連接...")
    placer.add_connection("CPU", "FLASH", weight=2.0)
    placer.add_connection("CPU", "VREG", weight=2.5)
    placer.add_connection("VREG", "C1", weight=3.0)
    placer.add_connection("VREG", "C2", weight=3.0)
    placer.add_connection("CPU", "C3", weight=2.0)
    placer.add_connection("MOSFET", "LED_DRIVER", weight=1.5)
    placer.add_connection("LED_DRIVER", "R1", weight=1.0)
    placer.add_connection("OPAMP", "R2", weight=1.0)
    placer.add_connection("CPU", "OPAMP", weight=1.5)

    # 定義散熱區域（板子右側）
    print("定義散熱區域...")
    placer.add_heatsink_area(
        position=(80, 10),
        size=(15, 60),
        efficiency=0.9
    )

    # 執行優化
    print("\n開始熱感知優化...\n")
    result = placer.optimize(
        iterations=100,
        wire_weight=0.5,    # 連線權重
        thermal_weight=2.0,  # 熱權重（更重視散熱）
        verbose=True
    )

    # 顯示結果
    print("\n=== 優化結果 ===")
    print(f"總成本: {result['cost']:.2f}")
    print(f"連線長度: {result['details']['wire_length']:.2f} mm")
    print(f"最高溫度: {result['details']['max_temperature']:.2f}°C")
    print(f"溫升: {result['details']['max_temperature'] - 25.0:.2f}°C")

    print("\n元件位置:")
    for comp_name, position in sorted(result['layout'].items()):
        comp = placer.components[comp_name]
        print(f"  {comp_name:12s}: ({position[0]:6.2f}, {position[1]:6.2f}) - {comp.power:.1f}W")

    # 視覺化熱分佈
    print("\n生成熱分佈圖...")
    placer.visualize_thermal(result, save_path='thermal_result.png')

    print("\n範例完成！")


if __name__ == "__main__":
    main()
