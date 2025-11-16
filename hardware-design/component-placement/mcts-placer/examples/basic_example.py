"""
MCTS 元件擺放器基本範例
"""

import sys
sys.path.insert(0, '../src')

from mcts_placer import MCTSComponentPlacer


def main():
    """主函數"""
    print("=== MCTS 元件擺放器範例 ===\n")

    # 初始化擺放器
    placer = MCTSComponentPlacer(
        board_size=(100, 80),
        exploration_weight=1.414
    )

    # 添加元件
    print("添加元件...")
    placer.add_component("U1", size=(10, 8))   # IC
    placer.add_component("R1", size=(5, 3))    # 電阻
    placer.add_component("R2", size=(5, 3))
    placer.add_component("C1", size=(4, 4))    # 電容
    placer.add_component("C2", size=(4, 4))
    placer.add_component("LED1", size=(3, 3))  # LED

    # 添加連接關係
    print("添加連接...")
    placer.add_connection("U1", "R1", weight=1.0)
    placer.add_connection("U1", "R2", weight=1.0)
    placer.add_connection("R1", "LED1", weight=1.5)
    placer.add_connection("U1", "C1", weight=0.8)
    placer.add_connection("U1", "C2", weight=0.8)
    placer.add_connection("C1", "C2", weight=0.5)

    # 執行優化
    print("\n開始 MCTS 優化...\n")
    result = placer.optimize(iterations=500, verbose=True)

    # 顯示結果
    print("\n=== 優化結果 ===")
    print(f"總成本: {result['cost']:.2f}")
    print(f"迭代次數: {result['iterations']}")
    print(f"樹訪問次數: {result['tree_visits']}")

    print("\n元件位置:")
    for comp_name, position in result['layout'].items():
        print(f"  {comp_name}: ({position[0]:.2f}, {position[1]:.2f})")

    # 視覺化結果
    print("\n生成視覺化...")
    placer.visualize(result, save_path='mcts_result.png')

    print("\n範例完成！")


if __name__ == "__main__":
    main()
