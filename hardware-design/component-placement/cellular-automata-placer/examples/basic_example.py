"""
細胞自動機元件擺放器基本範例
"""

import sys
sys.path.insert(0, '../src')

from cellular_placer import CellularAutomataPlacer


def main():
    """主函數"""
    print("=== 細胞自動機元件擺放器範例 ===\n")

    # 初始化擺放器
    placer = CellularAutomataPlacer(
        board_size=(100, 80),
        grid_resolution=0.5  # 0.5mm per cell
    )

    # 添加元件
    print("添加元件...")
    placer.add_component("U1", size=(12, 10))  # MCU
    placer.add_component("U2", size=(8, 6))    # Voltage Regulator
    placer.add_component("R1", size=(5, 3))
    placer.add_component("R2", size=(5, 3))
    placer.add_component("R3", size=(5, 3))
    placer.add_component("C1", size=(4, 4))
    placer.add_component("C2", size=(4, 4))
    placer.add_component("C3", size=(4, 4))
    placer.add_component("LED1", size=(3, 3))
    placer.add_component("LED2", size=(3, 3))

    # 添加連接關係
    print("添加連接...")
    # MCU 連接
    placer.add_connection("U1", "U2", weight=1.5)
    placer.add_connection("U1", "R1", weight=1.0)
    placer.add_connection("U1", "R2", weight=1.0)
    placer.add_connection("U1", "C1", weight=1.2)

    # 電源相關
    placer.add_connection("U2", "C2", weight=2.0)
    placer.add_connection("U2", "C3", weight=2.0)
    placer.add_connection("C2", "C3", weight=1.5)

    # LED 連接
    placer.add_connection("R1", "LED1", weight=1.8)
    placer.add_connection("R2", "LED2", weight=1.8)
    placer.add_connection("U1", "R3", weight=1.0)

    # 執行演化
    print("\n開始細胞自動機演化...\n")
    result = placer.evolve(
        iterations=150,
        attraction_strength=1.5,
        repulsion_strength=0.3,
        verbose=True
    )

    # 顯示結果
    print("\n=== 演化結果 ===")
    print(f"初始成本: {result['initial_cost']:.2f}")
    print(f"最終成本: {result['cost']:.2f}")
    print(f"改善率: {(1 - result['cost']/result['initial_cost'])*100:.1f}%")

    print("\n元件位置:")
    for comp_name, position in result['layout'].items():
        print(f"  {comp_name}: ({position[0]:.2f}, {position[1]:.2f})")

    # 視覺化結果
    print("\n生成視覺化...")
    placer.visualize(result, save_path='cellular_result.png')

    print("\n範例完成！")


if __name__ == "__main__":
    main()
