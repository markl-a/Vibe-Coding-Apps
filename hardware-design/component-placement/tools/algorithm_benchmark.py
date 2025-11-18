"""
演算法性能基準測試工具
比較不同元件擺放演算法的性能
"""

import sys
import os
import time
import numpy as np
from typing import Dict, List, Tuple, Any
import matplotlib.pyplot as plt
import matplotlib.patches as patches


# 設置路徑以導入各個演算法
base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(base_path, 'mcts-placer/src'))
sys.path.insert(0, os.path.join(base_path, 'genetic-placer/src'))
sys.path.insert(0, os.path.join(base_path, 'thermal-aware-placer/src'))
sys.path.insert(0, os.path.join(base_path, 'cellular-automata-placer/src'))
sys.path.insert(0, os.path.join(base_path, 'simulated-annealing-placer/src'))


def create_test_circuit(size: str = 'medium') -> Tuple[Dict, List]:
    """
    創建測試電路

    Args:
        size: 'small', 'medium', 'large'

    Returns:
        (components, connections)
    """
    if size == 'small':
        components = {
            'U1': (10, 8),
            'U2': (8, 6),
            'C1': (3, 2),
            'C2': (3, 2),
            'R1': (2, 1),
            'R2': (2, 1),
        }
        connections = [
            ('U1', 'U2', 2.0),
            ('U1', 'C1', 1.5),
            ('U2', 'C2', 1.5),
            ('U1', 'R1', 1.0),
            ('R2', 'C2', 1.0),
        ]
        board_size = (80, 60)

    elif size == 'medium':
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
        board_size = (120, 90)

    else:  # large
        components = {
            f'U{i}': (10, 8) for i in range(1, 6)
        }
        for i in range(1, 11):
            components[f'C{i}'] = (3, 2)
        for i in range(1, 11):
            components[f'R{i}'] = (2, 1)

        connections = []
        for i in range(1, 5):
            connections.append((f'U{i}', f'U{i+1}', 2.0))
        for i in range(1, 6):
            connections.append((f'U{i}', f'C{i}', 1.5))
            connections.append((f'U{i}', f'C{i+5}', 1.0))
            connections.append((f'U{i}', f'R{i}', 1.0))
            connections.append((f'U{i}', f'R{i+5}', 1.0))

        board_size = (150, 120)

    return components, connections, board_size


class AlgorithmBenchmark:
    """演算法基準測試類別"""

    def __init__(self, test_size: str = 'medium'):
        """
        初始化基準測試

        Args:
            test_size: 測試規模 ('small', 'medium', 'large')
        """
        self.test_size = test_size
        self.components, self.connections, self.board_size = create_test_circuit(test_size)
        self.results = {}

    def run_mcts(self, iterations: int = 500) -> Dict[str, Any]:
        """運行 MCTS 演算法"""
        try:
            from mcts_placer import MCTSComponentPlacer

            placer = MCTSComponentPlacer(
                board_size=self.board_size,
                exploration_weight=1.414
            )

            for name, size in self.components.items():
                placer.add_component(name, size)

            for comp1, comp2, weight in self.connections:
                placer.add_connection(comp1, comp2, weight)

            start_time = time.time()
            result = placer.optimize(iterations=iterations, verbose=False)
            elapsed_time = time.time() - start_time

            return {
                'cost': result['cost'],
                'time': elapsed_time,
                'iterations': iterations,
                'layout': result['layout']
            }

        except Exception as e:
            return {'error': str(e)}

    def run_genetic(self, generations: int = 100) -> Dict[str, Any]:
        """運行遺傳演算法"""
        try:
            from genetic_placer import GeneticPlacer

            placer = GeneticPlacer(
                board_size=self.board_size,
                population_size=50,
                mutation_rate=0.1
            )

            for name, size in self.components.items():
                placer.add_component(name, size)

            for comp1, comp2, weight in self.connections:
                placer.add_connection(comp1, comp2, weight)

            start_time = time.time()
            result = placer.evolve(generations=generations, verbose=False)
            elapsed_time = time.time() - start_time

            return {
                'cost': result['cost'],
                'time': elapsed_time,
                'iterations': generations,
                'layout': result['layout']
            }

        except Exception as e:
            return {'error': str(e)}

    def run_thermal_aware(self, iterations: int = 100) -> Dict[str, Any]:
        """運行熱感知演算法"""
        try:
            from thermal_placer import ThermalAwarePlacer

            placer = ThermalAwarePlacer(
                board_size=self.board_size,
                grid_resolution=2.0
            )

            for name, size in self.components.items():
                power = 2.0 if 'U' in name or 'MCU' in name else 0.0
                placer.add_component(name, size, power=power)

            for comp1, comp2, weight in self.connections:
                placer.add_connection(comp1, comp2, weight)

            start_time = time.time()
            result = placer.optimize(iterations=iterations, verbose=False)
            elapsed_time = time.time() - start_time

            return {
                'cost': result['cost'],
                'time': elapsed_time,
                'iterations': iterations,
                'layout': result['layout']
            }

        except Exception as e:
            return {'error': str(e)}

    def run_cellular_automata(self, iterations: int = 200) -> Dict[str, Any]:
        """運行細胞自動機演算法"""
        try:
            from cellular_placer import CellularAutomataPlacer

            placer = CellularAutomataPlacer(
                board_size=self.board_size,
                grid_resolution=2.0
            )

            for name, size in self.components.items():
                placer.add_component(name, size)

            for comp1, comp2, weight in self.connections:
                placer.add_connection(comp1, comp2, weight)

            start_time = time.time()
            result = placer.evolve(iterations=iterations, verbose=False)
            elapsed_time = time.time() - start_time

            return {
                'cost': result['cost'],
                'time': elapsed_time,
                'iterations': iterations,
                'layout': result['layout']
            }

        except Exception as e:
            return {'error': str(e)}

    def run_simulated_annealing(self, iterations: int = 1000) -> Dict[str, Any]:
        """運行模擬退火演算法"""
        try:
            from sa_placer import SimulatedAnnealingPlacer

            placer = SimulatedAnnealingPlacer(
                board_size=self.board_size,
                initial_temperature=100.0,
                final_temperature=0.1,
                alpha=0.95
            )

            for name, size in self.components.items():
                placer.add_component(name, size)

            for comp1, comp2, weight in self.connections:
                placer.add_connection(comp1, comp2, weight)

            start_time = time.time()
            result = placer.optimize(iterations=iterations, verbose=False, adaptive=True)
            elapsed_time = time.time() - start_time

            return {
                'cost': result['cost'],
                'time': elapsed_time,
                'iterations': iterations,
                'layout': result['layout']
            }

        except Exception as e:
            return {'error': str(e)}

    def run_all_algorithms(self, num_runs: int = 3) -> Dict[str, List[Dict]]:
        """
        運行所有演算法

        Args:
            num_runs: 每個演算法運行次數

        Returns:
            所有演算法的結果
        """
        algorithms = {
            'MCTS': self.run_mcts,
            'Genetic Algorithm': self.run_genetic,
            'Thermal Aware': self.run_thermal_aware,
            'Cellular Automata': self.run_cellular_automata,
            'Simulated Annealing': self.run_simulated_annealing,
        }

        results = {}

        for alg_name, alg_func in algorithms.items():
            print(f"\n運行 {alg_name}...")
            results[alg_name] = []

            for run in range(num_runs):
                print(f"  運行 {run + 1}/{num_runs}...", end=' ')
                result = alg_func()

                if 'error' in result:
                    print(f"失敗: {result['error']}")
                else:
                    results[alg_name].append(result)
                    print(f"成本={result['cost']:.2f}, 時間={result['time']:.2f}s")

        self.results = results
        return results

    def print_summary(self):
        """列印摘要統計"""
        if not self.results:
            print("尚未運行任何演算法")
            return

        print("\n" + "=" * 80)
        print(f"演算法性能比較摘要 - 測試規模: {self.test_size}")
        print("=" * 80)

        print(f"\n{'演算法':<25} {'平均成本':<12} {'標準差':<10} {'平均時間':<12} {'運行次數'}")
        print("-" * 80)

        for alg_name, runs in self.results.items():
            if runs:
                costs = [r['cost'] for r in runs]
                times = [r['time'] for r in runs]

                avg_cost = np.mean(costs)
                std_cost = np.std(costs)
                avg_time = np.mean(times)

                print(f"{alg_name:<25} {avg_cost:<12.2f} {std_cost:<10.2f} {avg_time:<12.2f} {len(runs)}")

        # 找出最佳演算法
        best_alg = min(
            [(alg, np.mean([r['cost'] for r in runs]))
             for alg, runs in self.results.items() if runs],
            key=lambda x: x[1]
        )

        print("\n" + "-" * 80)
        print(f"最佳演算法（最低平均成本）: {best_alg[0]} ({best_alg[1]:.2f})")

    def visualize_comparison(self, save_path: str = 'algorithm_comparison.png'):
        """視覺化比較結果"""
        if not self.results:
            print("尚未運行任何演算法")
            return

        fig = plt.figure(figsize=(16, 10))
        gs = fig.add_gridspec(2, 2, hspace=0.3, wspace=0.3)

        # 1. 成本箱形圖
        ax1 = fig.add_subplot(gs[0, 0])

        data_to_plot = []
        labels = []
        for alg_name, runs in self.results.items():
            if runs:
                costs = [r['cost'] for r in runs]
                data_to_plot.append(costs)
                labels.append(alg_name)

        bp = ax1.boxplot(data_to_plot, labels=labels, patch_artist=True)

        for patch in bp['boxes']:
            patch.set_facecolor('lightblue')

        ax1.set_ylabel('成本 (mm)')
        ax1.set_title('成本分佈比較')
        ax1.grid(True, alpha=0.3, axis='y')
        plt.setp(ax1.xaxis.get_majorticklabels(), rotation=15, ha='right')

        # 2. 平均成本柱狀圖
        ax2 = fig.add_subplot(gs[0, 1])

        avg_costs = []
        std_costs = []
        alg_names = []

        for alg_name, runs in self.results.items():
            if runs:
                costs = [r['cost'] for r in runs]
                avg_costs.append(np.mean(costs))
                std_costs.append(np.std(costs))
                alg_names.append(alg_name)

        x_pos = np.arange(len(alg_names))
        ax2.bar(x_pos, avg_costs, yerr=std_costs, capsize=5,
                color='skyblue', edgecolor='navy', alpha=0.7)

        ax2.set_xticks(x_pos)
        ax2.set_xticklabels(alg_names, rotation=15, ha='right')
        ax2.set_ylabel('平均成本 (mm)')
        ax2.set_title('平均成本比較')
        ax2.grid(True, alpha=0.3, axis='y')

        # 3. 運行時間比較
        ax3 = fig.add_subplot(gs[1, 0])

        avg_times = []
        for alg_name, runs in self.results.items():
            if runs:
                times = [r['time'] for r in runs]
                avg_times.append(np.mean(times))

        colors = plt.cm.viridis(np.linspace(0, 1, len(alg_names)))
        ax3.barh(alg_names, avg_times, color=colors, edgecolor='black', alpha=0.7)

        ax3.set_xlabel('平均運行時間 (秒)')
        ax3.set_title('運行時間比較')
        ax3.grid(True, alpha=0.3, axis='x')

        # 4. 統計表格
        ax4 = fig.add_subplot(gs[1, 1])
        ax4.axis('off')

        table_data = [['演算法', '平均成本', '最佳成本', '平均時間']]

        for alg_name, runs in self.results.items():
            if runs:
                costs = [r['cost'] for r in runs]
                times = [r['time'] for r in runs]

                table_data.append([
                    alg_name,
                    f"{np.mean(costs):.2f}",
                    f"{min(costs):.2f}",
                    f"{np.mean(times):.2f}s"
                ])

        table = ax4.table(cellText=table_data, cellLoc='left',
                         loc='center', bbox=[0, 0, 1, 1])

        table.auto_set_font_size(False)
        table.set_fontsize(9)
        table.scale(1, 2)

        # 設置標題行樣式
        for i in range(4):
            cell = table[(0, i)]
            cell.set_facecolor('#40466e')
            cell.set_text_props(weight='bold', color='white')

        plt.suptitle(f'演算法性能比較 - {self.test_size.upper()} 規模測試',
                    fontsize=14, fontweight='bold')

        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"\n視覺化已儲存到: {save_path}")

        plt.close()


def main():
    """主函數"""
    print("=" * 80)
    print("元件擺放演算法性能基準測試")
    print("=" * 80)

    # 選擇測試規模
    print("\n選擇測試規模:")
    print("1. Small (6 元件)")
    print("2. Medium (15 元件)")
    print("3. Large (25 元件)")

    choice = input("請選擇 [1/2/3, 默認=2]: ").strip() or '2'

    size_map = {'1': 'small', '2': 'medium', '3': 'large'}
    test_size = size_map.get(choice, 'medium')

    # 運行次數
    num_runs = int(input("每個演算法運行次數 [默認=3]: ").strip() or '3')

    # 創建基準測試
    benchmark = AlgorithmBenchmark(test_size=test_size)

    print(f"\n測試配置:")
    print(f"  規模: {test_size}")
    print(f"  元件數量: {len(benchmark.components)}")
    print(f"  連接數量: {len(benchmark.connections)}")
    print(f"  板子大小: {benchmark.board_size}")
    print(f"  運行次數: {num_runs}")

    # 運行所有演算法
    benchmark.run_all_algorithms(num_runs=num_runs)

    # 列印摘要
    benchmark.print_summary()

    # 視覺化
    benchmark.visualize_comparison(f'benchmark_{test_size}.png')

    print("\n基準測試完成！")


if __name__ == "__main__":
    main()
