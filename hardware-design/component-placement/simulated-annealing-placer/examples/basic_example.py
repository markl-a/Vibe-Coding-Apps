"""
模擬退火元件擺放器基本範例
展示如何使用 SA 演算法優化元件擺放
"""

import sys
sys.path.insert(0, '../src')

from sa_placer import SimulatedAnnealingPlacer


def main():
    """主函數"""
    print("=== 模擬退火元件擺放器 - 基本範例 ===\n")

    # 創建擺放器
    placer = SimulatedAnnealingPlacer(
        board_size=(100, 80),
        initial_temperature=100.0,
        final_temperature=0.1,
        cooling_schedule='exponential',  # 'exponential', 'linear', 'logarithmic'
        alpha=0.95
    )

    # 添加元件
    print("添加元件...")
    components = {
        'U1': (10, 8),    # IC
        'U2': (8, 8),     # IC
        'C1': (3, 2),     # 電容
        'C2': (3, 2),
        'C3': (3, 2),
        'R1': (2, 1),     # 電阻
        'R2': (2, 1),
        'R3': (2, 1),
        'LED1': (3, 3),   # LED
        'SW1': (5, 5),    # 開關
    }

    for name, size in components.items():
        placer.add_component(name, size)

    # 添加連接
    print("添加連接...")
    connections = [
        ('U1', 'U2', 2.5),    # 重要連接
        ('U1', 'C1', 1.5),
        ('U1', 'C2', 1.5),
        ('U2', 'C3', 1.5),
        ('U2', 'R1', 1.0),
        ('U2', 'R2', 1.0),
        ('R3', 'LED1', 1.0),
        ('SW1', 'U1', 2.0),
        ('U1', 'R3', 1.0),
    ]

    for comp1, comp2, weight in connections:
        placer.add_connection(comp1, comp2, weight)

    print(f"  元件數量: {len(components)}")
    print(f"  連接數量: {len(connections)}\n")

    # 執行優化
    print("開始模擬退火優化...\n")

    result = placer.optimize(
        iterations=1000,
        verbose=True,
        adaptive=True  # 使用自適應重啟
    )

    # 視覺化結果
    print("\n生成視覺化...")
    placer.visualize(result, save_path='sa_placement_result.png')

    print("\n範例執行完成！")


if __name__ == "__main__":
    main()
