"""
遺傳演算法元件擺放器基本範例
"""

import sys
sys.path.insert(0, '../src')

from genetic_placer import GeneticPlacer


def main():
    """主函數"""
    print("=== 遺傳演算法元件擺放器範例 ===\n")

    # 初始化擺放器
    placer = GeneticPlacer(
        board_size=(100, 80),
        population_size=50,
        mutation_rate=0.15,
        crossover_rate=0.85,
        elitism_rate=0.1
    )

    # 添加元件
    print("添加元件...")
    placer.add_component("MCU", size=(15, 12))
    placer.add_component("FLASH", size=(8, 6))
    placer.add_component("RAM", size=(8, 6))
    placer.add_component("USB", size=(10, 8))
    placer.add_component("R1", size=(5, 3))
    placer.add_component("R2", size=(5, 3))
    placer.add_component("R3", size=(5, 3))
    placer.add_component("C1", size=(4, 4))
    placer.add_component("C2", size=(4, 4))
    placer.add_component("C3", size=(4, 4))
    placer.add_component("XTAL", size=(6, 4))
    placer.add_component("LED", size=(3, 3))

    # 添加連接關係
    print("添加連接...")
    # MCU 相關連接
    placer.add_connection("MCU", "FLASH", weight=2.0)
    placer.add_connection("MCU", "RAM", weight=2.0)
    placer.add_connection("MCU", "USB", weight=1.5)
    placer.add_connection("MCU", "XTAL", weight=2.5)
    placer.add_connection("MCU", "R1", weight=1.0)

    # 電源去耦電容
    placer.add_connection("MCU", "C1", weight=3.0)
    placer.add_connection("MCU", "C2", weight=3.0)
    placer.add_connection("FLASH", "C3", weight=2.0)

    # USB 相關
    placer.add_connection("USB", "R2", weight=1.2)
    placer.add_connection("USB", "R3", weight=1.2)

    # LED
    placer.add_connection("R1", "LED", weight=1.5)

    # 執行演化
    print("\n開始遺傳演算法演化...\n")
    result = placer.evolve(generations=80, verbose=True)

    # 顯示結果
    print("\n=== 演化結果 ===")
    print(f"最終成本: {result['cost']:.2f}")
    print(f"最佳適應度: {result['fitness']:.4f}")
    print(f"演化代數: {result['generations']}")

    print("\n元件位置:")
    for comp_name, position in sorted(result['layout'].items()):
        print(f"  {comp_name:8s}: ({position[0]:6.2f}, {position[1]:6.2f})")

    # 視覺化結果
    print("\n生成視覺化...")
    placer.visualize(result, save_path='genetic_result.png')

    print("\n範例完成！")


if __name__ == "__main__":
    main()
