"""
基本元件擺放範例
展示如何使用 AI 元件擺放工具
"""

import sys
sys.path.insert(0, '../src')

from placer import MCTSPlacer


def main():
    """主函數"""
    print("=== AI 元件擺放工具 - 基本範例 ===\n")

    # 初始化擺放器
    placer = MCTSPlacer(algorithm="mcts", use_gpu=False)

    # 載入設計（示範）
    # placer.load_design("design.kicad_pcb")

    # 設定約束
    placer.set_constraints({
        'board_size': (100, 80),  # mm
        'min_spacing': 0.5         # mm
    })

    # 執行優化
    result = placer.optimize(iterations=100, temperature=1.0)

    # 視覺化結果
    placer.visualize(result, show_heatmap=True)

    # 儲存結果（示範）
    # placer.save("optimized_design.kicad_pcb")

    print("\n範例執行完成！")


if __name__ == "__main__":
    main()
