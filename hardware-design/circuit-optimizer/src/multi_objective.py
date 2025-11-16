"""
多目標優化演算法
使用遺傳演算法（NSGA-II）和 Pareto 最優解進行電路優化
"""

from typing import List, Dict, Callable, Tuple, Optional
from dataclasses import dataclass
import numpy as np
from scipy.optimize import differential_evolution, minimize
import random


@dataclass
class OptimizationObjective:
    """優化目標"""
    name: str
    weight: float  # 權重 (用於加權求和法)
    minimize: bool  # True 為最小化，False 為最大化
    eval_func: Callable  # 評估函數


@dataclass
class Individual:
    """個體（解決方案）"""
    genes: List[float]  # 基因（參數值）
    objectives: Dict[str, float] = None  # 目標值
    rank: int = 0  # Pareto 排名
    crowding_distance: float = 0.0  # 擁擠距離

    def __repr__(self) -> str:
        obj_str = ", ".join([f"{k}={v:.2f}" for k, v in (self.objectives or {}).items()])
        return f"Individual({obj_str})"


class MultiObjectiveOptimizer:
    """多目標優化器"""

    def __init__(self):
        """初始化優化器"""
        self.objectives: List[OptimizationObjective] = []
        self.constraints: List[Callable] = []
        self.parameter_bounds: List[Tuple[float, float]] = []
        self.population: List[Individual] = []

    def add_objective(
        self,
        name: str,
        eval_func: Callable,
        minimize: bool = True,
        weight: float = 1.0
    ) -> None:
        """
        添加優化目標

        Args:
            name: 目標名稱
            eval_func: 評估函數，輸入參數列表，返回目標值
            minimize: 是否最小化
            weight: 權重
        """
        objective = OptimizationObjective(name, weight, minimize, eval_func)
        self.objectives.append(objective)

    def add_constraint(self, constraint_func: Callable) -> None:
        """
        添加約束條件

        Args:
            constraint_func: 約束函數，返回 True 表示滿足約束
        """
        self.constraints.append(constraint_func)

    def set_parameter_bounds(self, bounds: List[Tuple[float, float]]) -> None:
        """
        設定參數範圍

        Args:
            bounds: 參數邊界列表 [(min, max), ...]
        """
        self.parameter_bounds = bounds

    def evaluate_individual(self, individual: Individual) -> None:
        """
        評估個體的所有目標值

        Args:
            individual: 個體
        """
        individual.objectives = {}
        for obj in self.objectives:
            value = obj.eval_func(individual.genes)
            # 如果是最大化目標，轉換為最小化（取負值）
            if not obj.minimize:
                value = -value
            individual.objectives[obj.name] = value

    def check_constraints(self, genes: List[float]) -> bool:
        """
        檢查解是否滿足所有約束

        Args:
            genes: 參數列表

        Returns:
            是否滿足所有約束
        """
        return all(constraint(genes) for constraint in self.constraints)

    def weighted_sum_optimization(self) -> Individual:
        """
        使用加權求和法進行優化

        Returns:
            最優個體
        """
        def objective_function(genes):
            if not self.check_constraints(genes):
                return 1e10  # 懲罰不滿足約束的解

            total = 0
            for obj in self.objectives:
                value = obj.eval_func(genes)
                if not obj.minimize:
                    value = -value
                total += obj.weight * value
            return total

        # 使用差分進化演算法
        result = differential_evolution(
            objective_function,
            self.parameter_bounds,
            maxiter=100,
            popsize=15,
            strategy='best1bin',
            seed=42
        )

        individual = Individual(genes=list(result.x))
        self.evaluate_individual(individual)
        return individual

    def pareto_dominate(self, ind1: Individual, ind2: Individual) -> bool:
        """
        判斷 ind1 是否 Pareto 支配 ind2

        Args:
            ind1: 個體 1
            ind2: 個體 2

        Returns:
            ind1 是否支配 ind2
        """
        better_in_any = False
        for obj_name in ind1.objectives:
            if ind1.objectives[obj_name] > ind2.objectives[obj_name]:
                return False  # ind1 在某個目標上更差
            if ind1.objectives[obj_name] < ind2.objectives[obj_name]:
                better_in_any = True  # ind1 在某個目標上更好

        return better_in_any

    def fast_non_dominated_sort(self, population: List[Individual]) -> List[List[Individual]]:
        """
        快速非支配排序（NSGA-II）

        Args:
            population: 種群

        Returns:
            分層的前沿面列表
        """
        fronts = [[]]
        domination_count = {}  # 支配個體的計數
        dominated_solutions = {}  # 被支配的解集合

        for p in population:
            domination_count[id(p)] = 0
            dominated_solutions[id(p)] = []

        # 計算支配關係
        for i, p in enumerate(population):
            for q in population[i+1:]:
                if self.pareto_dominate(p, q):
                    dominated_solutions[id(p)].append(q)
                    domination_count[id(q)] += 1
                elif self.pareto_dominate(q, p):
                    dominated_solutions[id(q)].append(p)
                    domination_count[id(p)] += 1

            # 第一層前沿面
            if domination_count[id(p)] == 0:
                p.rank = 0
                fronts[0].append(p)

        # 構建其他層
        i = 0
        while fronts[i]:
            next_front = []
            for p in fronts[i]:
                for q in dominated_solutions[id(p)]:
                    domination_count[id(q)] -= 1
                    if domination_count[id(q)] == 0:
                        q.rank = i + 1
                        next_front.append(q)
            i += 1
            if next_front:
                fronts.append(next_front)

        return fronts

    def calculate_crowding_distance(self, front: List[Individual]) -> None:
        """
        計算擁擠距離（NSGA-II）

        Args:
            front: 前沿面
        """
        if len(front) == 0:
            return

        # 初始化
        for ind in front:
            ind.crowding_distance = 0

        n_objectives = len(front[0].objectives)

        for obj_name in front[0].objectives:
            # 按目標值排序
            front.sort(key=lambda x: x.objectives[obj_name])

            # 邊界個體設為無窮大
            front[0].crowding_distance = float('inf')
            front[-1].crowding_distance = float('inf')

            obj_min = front[0].objectives[obj_name]
            obj_max = front[-1].objectives[obj_name]
            obj_range = obj_max - obj_min

            if obj_range == 0:
                continue

            # 計算中間個體的擁擠距離
            for i in range(1, len(front) - 1):
                distance = (front[i+1].objectives[obj_name] -
                           front[i-1].objectives[obj_name]) / obj_range
                front[i].crowding_distance += distance

    def nsga2_optimize(
        self,
        population_size: int = 100,
        n_generations: int = 50
    ) -> List[Individual]:
        """
        使用 NSGA-II 演算法進行多目標優化

        Args:
            population_size: 種群大小
            n_generations: 世代數

        Returns:
            Pareto 最優解集
        """
        # 初始化種群
        population = []
        for _ in range(population_size):
            genes = [random.uniform(lb, ub) for lb, ub in self.parameter_bounds]
            individual = Individual(genes=genes)
            self.evaluate_individual(individual)
            population.append(individual)

        # 演化
        for generation in range(n_generations):
            # 非支配排序
            fronts = self.fast_non_dominated_sort(population)

            # 計算擁擠距離
            for front in fronts:
                self.calculate_crowding_distance(front)

            # 選擇
            offspring = []
            while len(offspring) < population_size:
                # 錦標賽選擇
                parent1 = self._tournament_selection(population)
                parent2 = self._tournament_selection(population)

                # 交叉
                child_genes = self._crossover(parent1.genes, parent2.genes)

                # 變異
                child_genes = self._mutate(child_genes)

                # 創建子代
                if self.check_constraints(child_genes):
                    child = Individual(genes=child_genes)
                    self.evaluate_individual(child)
                    offspring.append(child)

            # 合併父代和子代
            population.extend(offspring)

            # 選擇下一代
            fronts = self.fast_non_dominated_sort(population)
            new_population = []
            for front in fronts:
                if len(new_population) + len(front) <= population_size:
                    new_population.extend(front)
                else:
                    # 按擁擠距離排序
                    self.calculate_crowding_distance(front)
                    front.sort(key=lambda x: x.crowding_distance, reverse=True)
                    new_population.extend(front[:population_size - len(new_population)])
                    break

            population = new_population

        # 返回 Pareto 前沿
        fronts = self.fast_non_dominated_sort(population)
        return fronts[0] if fronts else []

    def _tournament_selection(self, population: List[Individual]) -> Individual:
        """錦標賽選擇"""
        candidates = random.sample(population, min(3, len(population)))
        # 選擇 rank 最小（更好）的，若相同則選擇 crowding_distance 最大的
        return min(candidates, key=lambda x: (x.rank, -x.crowding_distance))

    def _crossover(self, genes1: List[float], genes2: List[float]) -> List[float]:
        """模擬二進制交叉（SBX）"""
        child_genes = []
        for i in range(len(genes1)):
            if random.random() < 0.5:
                child_genes.append(genes1[i])
            else:
                child_genes.append(genes2[i])
        return child_genes

    def _mutate(self, genes: List[float], mutation_rate: float = 0.1) -> List[float]:
        """多項式變異"""
        mutated = genes.copy()
        for i in range(len(mutated)):
            if random.random() < mutation_rate:
                lb, ub = self.parameter_bounds[i]
                mutated[i] = random.uniform(lb, ub)
        return mutated


def demonstrate_multi_objective():
    """展示多目標優化"""
    print("=== 多目標優化示範 ===\n")
    print("問題: 優化一個簡單的 RC 濾波器")
    print("目標 1: 最小化成本")
    print("目標 2: 最大化截止頻率\n")

    # 定義優化問題
    optimizer = MultiObjectiveOptimizer()

    # 定義目標函數
    def cost_function(params):
        """成本函數：R 和 C 的價格"""
        R, C = params
        # 簡化的成本模型
        cost_R = 0.01 * (1 + abs(np.log10(R) - 3) * 0.1)  # 1kΩ 最便宜
        cost_C = 0.02 * (1 + abs(np.log10(C) + 7) * 0.1)  # 100nF 最便宜
        return cost_R + cost_C

    def cutoff_frequency(params):
        """截止頻率：f = 1/(2πRC)"""
        R, C = params
        return 1 / (2 * np.pi * R * C)

    # 添加目標
    optimizer.add_objective("cost", cost_function, minimize=True, weight=1.0)
    optimizer.add_objective("frequency", cutoff_frequency, minimize=False, weight=1.0)

    # 設定參數範圍
    optimizer.set_parameter_bounds([
        (100, 100000),     # R: 100Ω - 100kΩ
        (1e-9, 1e-6)       # C: 1nF - 1μF
    ])

    # 方法 1: 加權求和法
    print("方法 1: 加權求和法優化")
    best = optimizer.weighted_sum_optimization()
    print(f"最佳解: R={best.genes[0]:.0f}Ω, C={best.genes[1]*1e9:.1f}nF")
    print(f"成本: ${best.objectives['cost']:.3f}")
    print(f"截止頻率: {-best.objectives['frequency']:.0f} Hz\n")

    # 方法 2: NSGA-II
    print("方法 2: NSGA-II 多目標優化")
    pareto_front = optimizer.nsga2_optimize(population_size=50, n_generations=30)
    print(f"找到 {len(pareto_front)} 個 Pareto 最優解\n")

    print("Pareto 前沿（部分）:")
    for i, ind in enumerate(pareto_front[:5], 1):
        R, C = ind.genes
        cost = ind.objectives['cost']
        freq = -ind.objectives['frequency']  # 轉回原始值
        print(f"  {i}. R={R:.0f}Ω, C={C*1e9:.1f}nF | "
              f"成本=${cost:.3f}, 頻率={freq:.0f}Hz")


if __name__ == "__main__":
    demonstrate_multi_objective()
