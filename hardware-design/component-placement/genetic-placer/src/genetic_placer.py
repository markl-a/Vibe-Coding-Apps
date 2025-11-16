"""
遺傳演算法元件擺放器實作
使用遺傳演算法優化 PCB 元件擺放
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import copy


@dataclass
class Component:
    """元件資料類別"""
    name: str
    size: Tuple[float, float]  # (width, height) in mm


@dataclass
class Connection:
    """連接資料類別"""
    comp1: str
    comp2: str
    weight: float = 1.0


class Individual:
    """個體（一個佈局方案）"""

    def __init__(self, components: Dict[str, Component], board_size: Tuple[float, float]):
        self.components = components
        self.board_size = board_size
        self.genes: Dict[str, Tuple[float, float]] = {}  # component_name -> (x, y)
        self.fitness = 0.0

    def initialize_random(self):
        """隨機初始化基因"""
        for name, comp in self.components.items():
            max_attempts = 100
            placed = False

            for _ in range(max_attempts):
                x = np.random.uniform(0, self.board_size[0] - comp.size[0])
                y = np.random.uniform(0, self.board_size[1] - comp.size[1])

                if self._is_valid_position(name, (x, y)):
                    self.genes[name] = (x, y)
                    placed = True
                    break

            if not placed:
                # 強制擺放
                x = np.random.uniform(0, max(0, self.board_size[0] - comp.size[0]))
                y = np.random.uniform(0, max(0, self.board_size[1] - comp.size[1]))
                self.genes[name] = (x, y)

    def _is_valid_position(self, comp_name: str, position: Tuple[float, float],
                          exclude_comp: Optional[str] = None) -> bool:
        """檢查位置是否有效（不與其他元件重疊）"""
        comp = self.components[comp_name]
        x, y = position
        w, h = comp.size

        # 檢查邊界
        if x < 0 or y < 0 or x + w > self.board_size[0] or y + h > self.board_size[1]:
            return False

        # 檢查與其他元件的重疊
        for other_name, other_pos in self.genes.items():
            if other_name == comp_name or other_name == exclude_comp:
                continue

            other_comp = self.components[other_name]
            ox, oy = other_pos
            ow, oh = other_comp.size

            # 檢查矩形重疊
            if not (x + w <= ox or x >= ox + ow or y + h <= oy or y >= oy + oh):
                return False

        return True

    def copy(self) -> 'Individual':
        """複製個體"""
        new_ind = Individual(self.components, self.board_size)
        new_ind.genes = self.genes.copy()
        new_ind.fitness = self.fitness
        return new_ind


class GeneticPlacer:
    """遺傳演算法元件擺放器"""

    def __init__(self, board_size: Tuple[float, float] = (100, 80),
                 population_size: int = 50,
                 mutation_rate: float = 0.1,
                 crossover_rate: float = 0.8,
                 elitism_rate: float = 0.1):
        """
        初始化遺傳演算法擺放器

        Args:
            board_size: 板子大小 (width, height) in mm
            population_size: 族群大小
            mutation_rate: 突變率
            crossover_rate: 交叉率
            elitism_rate: 菁英保留比例
        """
        self.board_size = board_size
        self.population_size = population_size
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.elitism_rate = elitism_rate

        self.components: Dict[str, Component] = {}
        self.connections: List[Connection] = []
        self.population: List[Individual] = []

    def add_component(self, name: str, size: Tuple[float, float]):
        """添加元件"""
        self.components[name] = Component(name, size)

    def add_connection(self, comp1: str, comp2: str, weight: float = 1.0):
        """添加連接"""
        self.connections.append(Connection(comp1, comp2, weight))

    def _calculate_fitness(self, individual: Individual) -> float:
        """計算個體適應度（越高越好）"""
        # 計算總連線長度
        total_wire_length = 0.0

        for conn in self.connections:
            if conn.comp1 in individual.genes and conn.comp2 in individual.genes:
                comp1 = self.components[conn.comp1]
                comp2 = self.components[conn.comp2]

                pos1 = individual.genes[conn.comp1]
                pos2 = individual.genes[conn.comp2]

                # 元件中心
                x1 = pos1[0] + comp1.size[0] / 2
                y1 = pos1[1] + comp1.size[1] / 2
                x2 = pos2[0] + comp2.size[0] / 2
                y2 = pos2[1] + comp2.size[1] / 2

                distance = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                total_wire_length += distance * conn.weight

        # 適應度 = 1 / (1 + 總成本)
        fitness = 1.0 / (1.0 + total_wire_length)

        return fitness

    def _initialize_population(self):
        """初始化族群"""
        self.population = []

        for _ in range(self.population_size):
            individual = Individual(self.components, self.board_size)
            individual.initialize_random()
            individual.fitness = self._calculate_fitness(individual)
            self.population.append(individual)

    def _select_parent(self) -> Individual:
        """錦標賽選擇"""
        tournament_size = 3
        tournament = np.random.choice(self.population, tournament_size, replace=False)
        return max(tournament, key=lambda ind: ind.fitness)

    def _crossover(self, parent1: Individual, parent2: Individual) -> Tuple[Individual, Individual]:
        """單點交叉"""
        child1 = parent1.copy()
        child2 = parent2.copy()

        if np.random.rand() < self.crossover_rate:
            # 選擇交叉點
            comp_names = list(self.components.keys())
            crossover_point = np.random.randint(1, len(comp_names))

            # 交換基因
            for i in range(crossover_point, len(comp_names)):
                comp_name = comp_names[i]
                child1.genes[comp_name], child2.genes[comp_name] = \
                    child2.genes[comp_name], child1.genes[comp_name]

        return child1, child2

    def _mutate(self, individual: Individual):
        """突變操作"""
        for comp_name in self.components.keys():
            if np.random.rand() < self.mutation_rate:
                # 隨機移動元件
                comp = self.components[comp_name]

                # 嘗試找到新的有效位置
                max_attempts = 20
                mutated = False

                for _ in range(max_attempts):
                    # 在當前位置附近小範圍移動
                    current_pos = individual.genes[comp_name]
                    offset = 20.0  # mm

                    new_x = current_pos[0] + np.random.uniform(-offset, offset)
                    new_y = current_pos[1] + np.random.uniform(-offset, offset)

                    new_x = np.clip(new_x, 0, self.board_size[0] - comp.size[0])
                    new_y = np.clip(new_y, 0, self.board_size[1] - comp.size[1])

                    # 暫時保存舊位置
                    old_pos = individual.genes[comp_name]
                    individual.genes[comp_name] = (new_x, new_y)

                    if individual._is_valid_position(comp_name, (new_x, new_y)):
                        mutated = True
                        break
                    else:
                        # 還原
                        individual.genes[comp_name] = old_pos

                if not mutated:
                    # 完全隨機重新擺放
                    new_x = np.random.uniform(0, max(0, self.board_size[0] - comp.size[0]))
                    new_y = np.random.uniform(0, max(0, self.board_size[1] - comp.size[1]))
                    individual.genes[comp_name] = (new_x, new_y)

    def evolve(self, generations: int = 100, verbose: bool = True) -> Dict[str, Any]:
        """
        執行遺傳演算法演化

        Args:
            generations: 演化代數
            verbose: 是否顯示進度

        Returns:
            優化結果字典
        """
        # 初始化族群
        self._initialize_population()

        best_individual = max(self.population, key=lambda ind: ind.fitness)
        best_fitness_history = [best_individual.fitness]
        avg_fitness_history = [np.mean([ind.fitness for ind in self.population])]

        if verbose:
            cost = 1.0 / best_individual.fitness - 1.0
            print(f"第 0 代 - 最佳成本: {cost:.2f}")

        # 演化循環
        for generation in range(generations):
            new_population = []

            # 菁英保留
            elite_count = int(self.population_size * self.elitism_rate)
            elites = sorted(self.population, key=lambda ind: ind.fitness, reverse=True)[:elite_count]
            new_population.extend([elite.copy() for elite in elites])

            # 生成新個體
            while len(new_population) < self.population_size:
                # 選擇父代
                parent1 = self._select_parent()
                parent2 = self._select_parent()

                # 交叉
                child1, child2 = self._crossover(parent1, parent2)

                # 突變
                self._mutate(child1)
                self._mutate(child2)

                # 計算適應度
                child1.fitness = self._calculate_fitness(child1)
                child2.fitness = self._calculate_fitness(child2)

                new_population.append(child1)
                if len(new_population) < self.population_size:
                    new_population.append(child2)

            self.population = new_population

            # 更新最佳個體
            current_best = max(self.population, key=lambda ind: ind.fitness)
            if current_best.fitness > best_individual.fitness:
                best_individual = current_best.copy()

            # 記錄歷史
            best_fitness_history.append(best_individual.fitness)
            avg_fitness_history.append(np.mean([ind.fitness for ind in self.population]))

            # 顯示進度
            if verbose and (generation + 1) % 10 == 0:
                cost = 1.0 / best_individual.fitness - 1.0
                print(f"第 {generation + 1} 代 - 最佳成本: {cost:.2f}")

        # 轉換結果
        final_cost = 1.0 / best_individual.fitness - 1.0

        return {
            'layout': best_individual.genes,
            'cost': final_cost,
            'fitness': best_individual.fitness,
            'best_fitness_history': best_fitness_history,
            'avg_fitness_history': avg_fitness_history,
            'generations': generations
        }

    def visualize(self, result: Dict[str, Any], save_path: Optional[str] = None):
        """視覺化結果"""
        try:
            import matplotlib.pyplot as plt
            import matplotlib.patches as patches

            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))

            # 左圖: 佈局
            ax1.add_patch(patches.Rectangle(
                (0, 0), self.board_size[0], self.board_size[1],
                fill=False, edgecolor='black', linewidth=2
            ))

            layout = result['layout']
            colors = plt.cm.Set3(np.linspace(0, 1, len(layout)))

            for i, (name, position) in enumerate(layout.items()):
                comp = self.components[name]
                x, y = position
                w, h = comp.size

                ax1.add_patch(patches.Rectangle(
                    (x, y), w, h,
                    facecolor=colors[i], edgecolor='black', alpha=0.7
                ))

                ax1.text(x + w/2, y + h/2, name,
                        ha='center', va='center', fontsize=9, fontweight='bold')

            # 繪製連接線
            for conn in self.connections:
                comp1 = self.components[conn.comp1]
                comp2 = self.components[conn.comp2]

                if comp1.name in layout and comp2.name in layout:
                    pos1 = layout[comp1.name]
                    pos2 = layout[comp2.name]

                    x1 = pos1[0] + comp1.size[0] / 2
                    y1 = pos1[1] + comp1.size[1] / 2
                    x2 = pos2[0] + comp2.size[0] / 2
                    y2 = pos2[1] + comp2.size[1] / 2

                    ax1.plot([x1, x2], [y1, y2], 'b--', alpha=0.3, linewidth=1)

            ax1.set_xlim(-5, self.board_size[0] + 5)
            ax1.set_ylim(-5, self.board_size[1] + 5)
            ax1.set_aspect('equal')
            ax1.set_xlabel('X (mm)')
            ax1.set_ylabel('Y (mm)')
            ax1.set_title(f'遺傳演算法擺放結果\n最終成本: {result["cost"]:.2f}')
            ax1.grid(True, alpha=0.3)

            # 右圖: 適應度演化
            generations = range(len(result['best_fitness_history']))
            ax2.plot(generations, result['best_fitness_history'],
                    label='最佳適應度', linewidth=2, color='green')
            ax2.plot(generations, result['avg_fitness_history'],
                    label='平均適應度', linewidth=2, color='blue', alpha=0.7)
            ax2.set_xlabel('代數')
            ax2.set_ylabel('適應度')
            ax2.set_title('適應度演化歷史')
            ax2.legend()
            ax2.grid(True, alpha=0.3)

            plt.tight_layout()

            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                print(f"圖片已儲存到: {save_path}")
            else:
                plt.show()

            plt.close()

        except ImportError:
            print("需要安裝 matplotlib 才能視覺化結果")
