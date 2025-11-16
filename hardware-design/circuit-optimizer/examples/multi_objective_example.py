"""
多目標優化範例
展示如何使用多目標優化演算法優化電路設計
"""

import sys
sys.path.insert(0, '../src')

import numpy as np
from multi_objective import MultiObjectiveOptimizer


def main():
    """主函數"""
    print("=" * 60)
    print("多目標優化範例")
    print("=" * 60)
    print()

    # === 範例 1: RC 濾波器優化 ===
    print("範例 1: RC 低通濾波器優化")
    print("-" * 60)
    print("目標:")
    print("  1. 最小化成本")
    print("  2. 最大化截止頻率")
    print("  3. 最小化尺寸\n")

    optimizer1 = MultiObjectiveOptimizer()

    # 定義目標函數
    def cost_function(params):
        """成本函數"""
        R, C = params
        # 簡化成本模型：基於標準值的偏離程度
        cost_R = 0.01 * (1 + abs(np.log10(R) - 3) * 0.1)
        cost_C = 0.02 * (1 + abs(np.log10(C) + 7) * 0.1)
        return cost_R + cost_C

    def cutoff_frequency(params):
        """截止頻率 f = 1/(2πRC)"""
        R, C = params
        return 1 / (2 * np.pi * R * C)

    def circuit_size(params):
        """電路尺寸（簡化模型）"""
        R, C = params
        # 假設尺寸與元件值有關
        size_R = np.log10(R) * 2
        size_C = np.log10(abs(C)) * 3
        return size_R + size_C

    # 添加目標
    optimizer1.add_objective("cost", cost_function, minimize=True, weight=1.0)
    optimizer1.add_objective("frequency", cutoff_frequency, minimize=False, weight=1.0)
    optimizer1.add_objective("size", circuit_size, minimize=True, weight=0.5)

    # 設定參數範圍
    optimizer1.set_parameter_bounds([
        (100, 100000),     # R: 100Ω - 100kΩ
        (1e-9, 1e-6)       # C: 1nF - 1μF
    ])

    # 執行加權求和優化
    print("執行加權求和優化...")
    best = optimizer1.weighted_sum_optimization()
    R, C = best.genes
    print(f"\n最佳解:")
    print(f"  R = {R:.0f}Ω")
    print(f"  C = {C*1e9:.1f}nF")
    print(f"\n性能指標:")
    print(f"  成本: ${best.objectives['cost']:.3f}")
    print(f"  截止頻率: {-best.objectives['frequency']:.0f} Hz")
    print(f"  尺寸指標: {best.objectives['size']:.2f}")

    # === 範例 2: 運算放大器電路優化 ===
    print("\n" + "=" * 60)
    print("範例 2: 非反相放大器優化")
    print("-" * 60)
    print("目標:")
    print("  1. 最小化成本")
    print("  2. 達到目標增益 (10倍)")
    print("  3. 最小化功耗\n")

    optimizer2 = MultiObjectiveOptimizer()

    # 定義目標函數
    def amplifier_cost(params):
        """放大器成本"""
        R1, R2 = params
        cost = 0.01 * (2 + abs(np.log10(R1) - 3) * 0.1 + abs(np.log10(R2) - 4) * 0.1)
        return cost

    def gain_error(params):
        """增益誤差（目標增益 10）"""
        R1, R2 = params
        target_gain = 10
        actual_gain = 1 + R2 / R1
        return abs(actual_gain - target_gain)

    def power_dissipation(params):
        """功耗（假設 5V 輸入）"""
        R1, R2 = params
        V_in = 5.0
        # 簡化功耗模型
        power = (V_in ** 2) / (R1 + R2)
        return power

    # 添加目標
    optimizer2.add_objective("cost", amplifier_cost, minimize=True, weight=0.5)
    optimizer2.add_objective("gain_error", gain_error, minimize=True, weight=2.0)
    optimizer2.add_objective("power", power_dissipation, minimize=True, weight=1.0)

    # 設定參數範圍
    optimizer2.set_parameter_bounds([
        (1000, 100000),    # R1: 1kΩ - 100kΩ
        (10000, 1000000)   # R2: 10kΩ - 1MΩ
    ])

    # 添加約束
    def constraint_reasonable_ratio(params):
        """約束：R2/R1 在合理範圍內"""
        R1, R2 = params
        ratio = R2 / R1
        return 5 <= ratio <= 20

    optimizer2.add_constraint(constraint_reasonable_ratio)

    # 執行優化
    print("執行優化...")
    best2 = optimizer2.weighted_sum_optimization()
    R1, R2 = best2.genes
    actual_gain = 1 + R2 / R1

    print(f"\n最佳解:")
    print(f"  R1 = {R1/1000:.1f}kΩ")
    print(f"  R2 = {R2/1000:.1f}kΩ")
    print(f"\n性能指標:")
    print(f"  成本: ${best2.objectives['cost']:.3f}")
    print(f"  實際增益: {actual_gain:.2f}x (目標: 10x)")
    print(f"  增益誤差: {best2.objectives['gain_error']:.3f}")
    print(f"  功耗: {best2.objectives['power']*1000:.2f}mW")

    # === 範例 3: NSGA-II 多目標優化 ===
    print("\n" + "=" * 60)
    print("範例 3: NSGA-II Pareto 最優解")
    print("-" * 60)
    print("使用 NSGA-II 尋找 RC 濾波器的 Pareto 前沿\n")

    # 使用範例 1 的優化器，但只用兩個目標
    optimizer3 = MultiObjectiveOptimizer()
    optimizer3.add_objective("cost", cost_function, minimize=True)
    optimizer3.add_objective("frequency", cutoff_frequency, minimize=False)
    optimizer3.set_parameter_bounds([
        (100, 100000),
        (1e-9, 1e-6)
    ])

    print("執行 NSGA-II 演算法...")
    print("(種群大小: 50, 世代數: 30)\n")

    pareto_front = optimizer3.nsga2_optimize(population_size=50, n_generations=30)

    print(f"找到 {len(pareto_front)} 個 Pareto 最優解\n")
    print("Pareto 前沿（顯示 10 個解）:")
    print("-" * 60)
    print(f"{'#':<4} {'R (Ω)':<12} {'C (nF)':<12} {'成本 ($)':<12} {'頻率 (Hz)':<12}")
    print("-" * 60)

    # 按頻率排序顯示
    sorted_front = sorted(pareto_front, key=lambda x: x.objectives['frequency'])
    for i, ind in enumerate(sorted_front[:10], 1):
        R, C = ind.genes
        cost = ind.objectives['cost']
        freq = -ind.objectives['frequency']  # 轉回原始值
        print(f"{i:<4} {R:<12.0f} {C*1e9:<12.1f} {cost:<12.3f} {freq:<12.0f}")

    print("\n分析:")
    print(f"  最低成本解: ${min(ind.objectives['cost'] for ind in pareto_front):.3f}")
    print(f"  最高頻率解: {max(-ind.objectives['frequency'] for ind in pareto_front):.0f} Hz")

    print("\n" + "=" * 60)
    print("範例執行完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()
