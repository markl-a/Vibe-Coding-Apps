"""
基本電路優化範例
展示如何使用電路優化工具
"""

import sys
sys.path.insert(0, '../src')

from optimizer import CircuitOptimizer


def main():
    """主函數"""
    print("=== 電路優化工具 - 基本範例 ===\n")

    # 建立優化器
    optimizer = CircuitOptimizer()

    # 載入電路（示範）
    # optimizer.load_circuit("amplifier.net")

    # 設定優化目標
    optimizer.set_objectives({
        'cost': 'minimize',
        'power': 'minimize',
        'gain': 'maximize'
    })

    # 設定約束
    optimizer.add_constraints({
        'cost': {'max': 10},      # 最大成本 $10
        'power': {'max': 100},    # 最大功耗 100mW
    })

    # 執行優化
    print("\n開始優化...")
    results = optimizer.optimize(iterations=100)

    # 顯示結果
    print(f"\n優化結果:")
    print(f"  最佳成本: ${results.cost:.2f}")
    print(f"  預測增益: {results.gain:.1f} dB")
    print(f"  功耗: {results.power:.2f} mW")

    # 取得 BOM
    bom = results.get_bom()
    # bom.export("optimized_bom.csv")

    print("\n範例執行完成！")


if __name__ == "__main__":
    main()
