"""
基本 PCB 佈局優化範例
展示如何使用 AI PCB 佈局優化器
"""

import sys
sys.path.insert(0, '../src')

from optimizer import PCBOptimizer


def main():
    """主函數"""
    print("=== AI PCB 佈局優化器 - 基本範例 ===\n")

    # 建立優化器
    optimizer = PCBOptimizer(board_size=(100, 80))
    print(f"建立優化器，板子大小: {optimizer.board_size} mm")

    # 載入設計（示範）
    # optimizer.load_design("example_board.kicad_pcb")

    # 執行優化
    print("\n開始優化...")
    result = optimizer.optimize(iterations=100)

    # 顯示結果
    print(f"\n優化完成:")
    print(f"  成功: {result['success']}")
    print(f"  迭代次數: {result['iterations']}")
    print(f"  最終成本: {result['final_cost']}")

    # 儲存結果（示範）
    # optimizer.save("optimized_board.kicad_pcb")

    print("\n範例執行完成！")


if __name__ == "__main__":
    main()
