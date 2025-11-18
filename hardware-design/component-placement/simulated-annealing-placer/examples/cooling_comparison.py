"""
模擬退火降溫策略比較範例
比較不同降溫策略的效果
"""

import sys
sys.path.insert(0, '../src')

from sa_placer import SimulatedAnnealingPlacer
import numpy as np
import matplotlib.pyplot as plt


def create_test_circuit():
    """創建測試電路"""
    components = {
        'MCU': (12, 10),
        'USB': (6, 4),
        'POWER': (8, 6),
        'C1': (3, 2), 'C2': (3, 2), 'C3': (3, 2),
        'C4': (3, 2), 'C5': (3, 2),
        'R1': (2, 1), 'R2': (2, 1), 'R3': (2, 1),
        'LED1': (3, 3), 'LED2': (3, 3),
        'SW1': (5, 5),
    }

    connections = [
        ('MCU', 'USB', 2.0),
        ('MCU', 'POWER', 2.5),
        ('MCU', 'C1', 1.5),
        ('MCU', 'C2', 1.5),
        ('POWER', 'C3', 2.0),
        ('POWER', 'C4', 2.0),
        ('POWER', 'C5', 1.5),
        ('USB', 'R1', 1.0),
        ('MCU', 'R2', 1.0),
        ('R3', 'LED1', 1.0),
        ('MCU', 'LED2', 1.0),
        ('SW1', 'MCU', 1.5),
    ]

    return components, connections


def test_cooling_schedule(cooling_schedule: str, alpha: float = 0.95):
    """測試特定降溫策略"""
    components, connections = create_test_circuit()

    placer = SimulatedAnnealingPlacer(
        board_size=(120, 90),
        initial_temperature=100.0,
        final_temperature=0.1,
        cooling_schedule=cooling_schedule,
        alpha=alpha
    )

    for name, size in components.items():
        placer.add_component(name, size)

    for comp1, comp2, weight in connections:
        placer.add_connection(comp1, comp2, weight)

    result = placer.optimize(
        iterations=1000,
        verbose=False,
        adaptive=False
    )

    return result


def main():
    """主函數"""
    print("=" * 60)
    print("模擬退火降溫策略比較")
    print("=" * 60)

    cooling_schedules = ['exponential', 'linear', 'logarithmic']
    results = {}

    # 測試每種降溫策略（多次運行取平均）
    num_runs = 5

    for schedule in cooling_schedules:
        print(f"\n測試 {schedule} 降溫策略...")
        costs = []

        for run in range(num_runs):
            result = test_cooling_schedule(schedule)
            costs.append(result['cost'])
            print(f"  運行 {run+1}: 成本 = {result['cost']:.2f}")

        avg_cost = np.mean(costs)
        std_cost = np.std(costs)

        results[schedule] = {
            'costs': costs,
            'avg': avg_cost,
            'std': std_cost,
            'result': result  # 保存最後一次的結果用於視覺化
        }

        print(f"  平均成本: {avg_cost:.2f} ± {std_cost:.2f}")

    # 總結比較
    print("\n" + "=" * 60)
    print("總結比較")
    print("=" * 60)

    for schedule, data in results.items():
        print(f"{schedule:15s}: {data['avg']:.2f} ± {data['std']:.2f}")

    # 找出最佳策略
    best_schedule = min(results.items(), key=lambda x: x[1]['avg'])[0]
    print(f"\n最佳策略: {best_schedule}")

    # 視覺化比較
    print("\n生成視覺化...")

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # 1. 成本箱形圖
    ax1 = axes[0, 0]
    data_to_plot = [results[s]['costs'] for s in cooling_schedules]
    box = ax1.boxplot(data_to_plot, labels=cooling_schedules, patch_artist=True)

    for patch in box['boxes']:
        patch.set_facecolor('lightblue')

    ax1.set_ylabel('成本 (mm)')
    ax1.set_title('不同降溫策略的成本分佈')
    ax1.grid(True, alpha=0.3)

    # 2. 成本歷史比較
    ax2 = axes[0, 1]
    for schedule in cooling_schedules:
        result = results[schedule]['result']
        ax2.plot(result['cost_history'], label=schedule, alpha=0.7, linewidth=2)

    ax2.set_xlabel('迭代次數')
    ax2.set_ylabel('成本')
    ax2.set_title('成本演化比較')
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    # 3. 溫度歷史比較
    ax3 = axes[1, 0]
    for schedule in cooling_schedules:
        result = results[schedule]['result']
        ax3.plot(result['temperature_history'], label=schedule, alpha=0.7, linewidth=2)

    ax3.set_xlabel('迭代次數')
    ax3.set_ylabel('溫度')
    ax3.set_title('溫度變化比較')
    ax3.set_yscale('log')
    ax3.legend()
    ax3.grid(True, alpha=0.3)

    # 4. 統計摘要
    ax4 = axes[1, 1]
    ax4.axis('off')

    summary_text = "=== 統計摘要 ===\n\n"
    for schedule in cooling_schedules:
        data = results[schedule]
        summary_text += f"{schedule}:\n"
        summary_text += f"  平均: {data['avg']:.2f}\n"
        summary_text += f"  標準差: {data['std']:.2f}\n"
        summary_text += f"  最好: {min(data['costs']):.2f}\n"
        summary_text += f"  最差: {max(data['costs']):.2f}\n\n"

    summary_text += f"最佳策略: {best_schedule}\n"
    improvement = (results['linear']['avg'] - results[best_schedule]['avg']) / results['linear']['avg'] * 100
    summary_text += f"改進: {improvement:.1f}%"

    ax4.text(0.1, 0.9, summary_text,
            verticalalignment='top',
            fontfamily='monospace',
            fontsize=10)

    plt.suptitle('模擬退火降溫策略比較分析', fontsize=14, fontweight='bold')
    plt.tight_layout()

    plt.savefig('sa_cooling_comparison.png', dpi=300, bbox_inches='tight')
    print("比較圖已儲存: sa_cooling_comparison.png")

    print("\n範例執行完成！")


if __name__ == "__main__":
    main()
