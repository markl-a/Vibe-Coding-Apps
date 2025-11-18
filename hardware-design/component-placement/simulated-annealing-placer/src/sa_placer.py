"""
模擬退火元件擺放器實作
使用經典的 Simulated Annealing 演算法優化 PCB 元件擺放
"""

import numpy as np
import math
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import copy


@dataclass
class Component:
    """元件資料類別"""
    name: str
    size: Tuple[float, float]  # (width, height) in mm
    position: Optional[Tuple[float, float]] = None


@dataclass
class Connection:
    """連接資料類別"""
    comp1: str
    comp2: str
    weight: float = 1.0


class SimulatedAnnealingPlacer:
    """模擬退火元件擺放器"""

    def __init__(self, board_size: Tuple[float, float] = (100, 80),
                 initial_temperature: float = 100.0,
                 final_temperature: float = 0.1,
                 cooling_schedule: str = 'exponential',
                 alpha: float = 0.95):
        """
        初始化模擬退火擺放器

        Args:
            board_size: 板子大小 (width, height) in mm
            initial_temperature: 初始溫度
            final_temperature: 最終溫度
            cooling_schedule: 降溫策略 ('exponential', 'linear', 'logarithmic')
            alpha: 指數降溫係數 (0 < alpha < 1)
        """
        self.board_size = board_size
        self.initial_temperature = initial_temperature
        self.final_temperature = final_temperature
        self.cooling_schedule = cooling_schedule
        self.alpha = alpha

        self.components: Dict[str, Component] = {}
        self.connections: List[Connection] = []

    def add_component(self, name: str, size: Tuple[float, float]):
        """添加元件"""
        self.components[name] = Component(name, size)

    def add_connection(self, comp1: str, comp2: str, weight: float = 1.0):
        """添加連接"""
        self.connections.append(Connection(comp1, comp2, weight))

    def _generate_random_layout(self) -> Dict[str, Tuple[float, float]]:
        """生成隨機初始佈局"""
        layout = {}

        for name, comp in self.components.items():
            max_attempts = 100
            placed = False

            for _ in range(max_attempts):
                x = np.random.uniform(0, self.board_size[0] - comp.size[0])
                y = np.random.uniform(0, self.board_size[1] - comp.size[1])

                # 檢查重疊
                valid = True
                for other_name, other_pos in layout.items():
                    other_comp = self.components[other_name]
                    ox, oy = other_pos
                    ow, oh = other_comp.size

                    # 檢查矩形重疊
                    if not (x + comp.size[0] <= ox or x >= ox + ow or
                           y + comp.size[1] <= oy or y >= oy + oh):
                        valid = False
                        break

                if valid:
                    layout[name] = (x, y)
                    placed = True
                    break

            if not placed:
                # 強制擺放
                x = np.random.uniform(0, max(0, self.board_size[0] - comp.size[0]))
                y = np.random.uniform(0, max(0, self.board_size[1] - comp.size[1]))
                layout[name] = (x, y)

        return layout

    def _calculate_cost(self, layout: Dict[str, Tuple[float, float]]) -> float:
        """
        計算佈局成本

        成本 = 總連線長度（加權曼哈頓距離）
        """
        total_cost = 0.0

        for conn in self.connections:
            if conn.comp1 in layout and conn.comp2 in layout:
                comp1 = self.components[conn.comp1]
                comp2 = self.components[conn.comp2]

                pos1 = layout[conn.comp1]
                pos2 = layout[conn.comp2]

                # 計算元件中心
                x1 = pos1[0] + comp1.size[0] / 2
                y1 = pos1[1] + comp1.size[1] / 2
                x2 = pos2[0] + comp2.size[0] / 2
                y2 = pos2[1] + comp2.size[1] / 2

                # 歐幾里得距離
                distance = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                total_cost += distance * conn.weight

        return total_cost

    def _generate_neighbor(self, layout: Dict[str, Tuple[float, float]],
                           temperature: float) -> Dict[str, Tuple[float, float]]:
        """
        生成鄰近解

        策略：
        1. 隨機選擇 1-2 個元件
        2. 小幅度移動或交換位置
        3. 溫度越高，移動幅度越大
        """
        new_layout = layout.copy()

        # 根據溫度調整擾動強度
        perturbation_scale = min(20.0, 5.0 + temperature / 5.0)

        # 隨機選擇操作類型
        operation = np.random.choice(['move', 'swap', 'rotate'], p=[0.7, 0.2, 0.1])

        if operation == 'move':
            # 移動一個元件
            comp_name = np.random.choice(list(self.components.keys()))
            comp = self.components[comp_name]
            current_pos = new_layout[comp_name]

            # 在當前位置附近隨機移動
            dx = np.random.normal(0, perturbation_scale)
            dy = np.random.normal(0, perturbation_scale)

            new_x = current_pos[0] + dx
            new_y = current_pos[1] + dy

            # 限制在板子範圍內
            new_x = np.clip(new_x, 0, self.board_size[0] - comp.size[0])
            new_y = np.clip(new_y, 0, self.board_size[1] - comp.size[1])

            new_layout[comp_name] = (new_x, new_y)

        elif operation == 'swap':
            # 交換兩個元件的位置
            if len(self.components) >= 2:
                comp1_name, comp2_name = np.random.choice(
                    list(self.components.keys()), 2, replace=False
                )

                comp1 = self.components[comp1_name]
                comp2 = self.components[comp2_name]

                # 交換位置（需要調整以適應不同大小）
                pos1 = new_layout[comp1_name]
                pos2 = new_layout[comp2_name]

                # 檢查交換後是否超出邊界
                if (pos1[0] + comp2.size[0] <= self.board_size[0] and
                    pos1[1] + comp2.size[1] <= self.board_size[1] and
                    pos2[0] + comp1.size[0] <= self.board_size[0] and
                    pos2[1] + comp1.size[1] <= self.board_size[1]):

                    new_layout[comp1_name] = pos2
                    new_layout[comp2_name] = pos1

        elif operation == 'rotate':
            # 旋轉一個元件（交換寬高）
            comp_name = np.random.choice(list(self.components.keys()))
            comp = self.components[comp_name]
            current_pos = new_layout[comp_name]

            # 嘗試旋轉（交換寬高）
            rotated_w = comp.size[1]
            rotated_h = comp.size[0]

            if (current_pos[0] + rotated_w <= self.board_size[0] and
                current_pos[1] + rotated_h <= self.board_size[1]):
                # 更新元件大小（實際應用中可能需要另外處理）
                # 這裡只移動位置，不真正旋轉
                pass

        return new_layout

    def _acceptance_probability(self, current_cost: float, new_cost: float,
                                temperature: float) -> float:
        """
        計算接受新解的概率

        Metropolis 準則：
        - 如果新解更好，總是接受
        - 如果新解更差，以一定概率接受（概率隨溫度降低而減小）
        """
        if new_cost < current_cost:
            return 1.0
        else:
            delta = new_cost - current_cost
            return math.exp(-delta / temperature)

    def _update_temperature(self, temperature: float, iteration: int,
                           total_iterations: int) -> float:
        """
        更新溫度

        支援多種降溫策略：
        - exponential: T = T0 * alpha^k
        - linear: T = T0 * (1 - k/n)
        - logarithmic: T = T0 / (1 + alpha * log(1 + k))
        """
        if self.cooling_schedule == 'exponential':
            return temperature * self.alpha

        elif self.cooling_schedule == 'linear':
            progress = iteration / total_iterations
            return self.initial_temperature * (1 - progress)

        elif self.cooling_schedule == 'logarithmic':
            k = iteration + 1
            return self.initial_temperature / (1 + self.alpha * math.log(1 + k))

        else:
            # 默認使用指數降溫
            return temperature * self.alpha

    def optimize(self, iterations: int = 1000,
                verbose: bool = True,
                adaptive: bool = True) -> Dict[str, Any]:
        """
        執行模擬退火優化

        Args:
            iterations: 迭代次數
            verbose: 是否顯示進度
            adaptive: 是否使用自適應重啟

        Returns:
            優化結果字典
        """
        # 生成初始佈局
        current_layout = self._generate_random_layout()
        current_cost = self._calculate_cost(current_layout)

        # 記錄最佳解
        best_layout = current_layout.copy()
        best_cost = current_cost

        # 初始化溫度
        temperature = self.initial_temperature

        # 記錄歷史
        cost_history = [current_cost]
        temperature_history = [temperature]

        # 統計
        accepted_moves = 0
        rejected_moves = 0
        no_improvement_count = 0

        if verbose:
            print(f"初始成本: {current_cost:.2f}")
            print(f"初始溫度: {temperature:.2f}")
            print(f"降溫策略: {self.cooling_schedule}\n")

        # 模擬退火主循環
        for iteration in range(iterations):
            # 生成鄰近解
            new_layout = self._generate_neighbor(current_layout, temperature)
            new_cost = self._calculate_cost(new_layout)

            # 計算接受概率
            accept_prob = self._acceptance_probability(current_cost, new_cost, temperature)

            # 決定是否接受新解
            if np.random.rand() < accept_prob:
                current_layout = new_layout
                current_cost = new_cost
                accepted_moves += 1

                # 更新最佳解
                if current_cost < best_cost:
                    best_layout = current_layout.copy()
                    best_cost = current_cost
                    no_improvement_count = 0
                else:
                    no_improvement_count += 1
            else:
                rejected_moves += 1
                no_improvement_count += 1

            # 自適應重啟
            if adaptive and no_improvement_count > 100:
                if verbose:
                    print(f"  迭代 {iteration}: 執行自適應重啟")

                # 重新生成佈局
                current_layout = self._generate_random_layout()
                current_cost = self._calculate_cost(current_layout)
                temperature = self.initial_temperature
                no_improvement_count = 0

            # 更新溫度
            temperature = self._update_temperature(temperature, iteration, iterations)

            # 記錄歷史
            cost_history.append(current_cost)
            temperature_history.append(temperature)

            # 顯示進度
            if verbose and (iteration + 1) % 100 == 0:
                acceptance_rate = accepted_moves / (accepted_moves + rejected_moves + 1e-10) * 100
                print(f"迭代 {iteration + 1}/{iterations}")
                print(f"  當前成本: {current_cost:.2f}")
                print(f"  最佳成本: {best_cost:.2f}")
                print(f"  溫度: {temperature:.4f}")
                print(f"  接受率: {acceptance_rate:.1f}%")

            # 提早停止
            if temperature < self.final_temperature:
                if verbose:
                    print(f"\n溫度低於最終溫度 ({self.final_temperature})，提早停止")
                break

        if verbose:
            print(f"\n=== 優化完成 ===")
            print(f"最終成本: {best_cost:.2f}")
            print(f"改進: {((cost_history[0] - best_cost) / cost_history[0] * 100):.1f}%")
            print(f"接受的移動: {accepted_moves}")
            print(f"拒絕的移動: {rejected_moves}")

        return {
            'layout': best_layout,
            'cost': best_cost,
            'initial_cost': cost_history[0],
            'cost_history': cost_history,
            'temperature_history': temperature_history,
            'iterations': iteration + 1,
            'accepted_moves': accepted_moves,
            'rejected_moves': rejected_moves
        }

    def visualize(self, result: Dict[str, Any], save_path: Optional[str] = None):
        """視覺化結果"""
        try:
            import matplotlib.pyplot as plt
            import matplotlib.patches as patches

            fig = plt.figure(figsize=(16, 6))
            gs = fig.add_gridspec(2, 3, hspace=0.3, wspace=0.3)

            # 左圖: 佈局
            ax1 = fig.add_subplot(gs[:, 0])

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
                if conn.comp1 in layout and conn.comp2 in layout:
                    comp1 = self.components[conn.comp1]
                    comp2 = self.components[conn.comp2]

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
            ax1.set_title(f'模擬退火擺放結果\n最終成本: {result["cost"]:.2f}')
            ax1.grid(True, alpha=0.3)

            # 右上圖: 成本歷史
            ax2 = fig.add_subplot(gs[0, 1:])

            iterations = range(len(result['cost_history']))
            ax2.plot(iterations, result['cost_history'], linewidth=2, color='blue', alpha=0.7)
            ax2.axhline(y=result['cost'], color='red', linestyle='--', label=f'最佳成本: {result["cost"]:.2f}')
            ax2.set_xlabel('迭代次數')
            ax2.set_ylabel('成本')
            ax2.set_title('成本演化歷史')
            ax2.legend()
            ax2.grid(True, alpha=0.3)

            # 右下圖: 溫度歷史
            ax3 = fig.add_subplot(gs[1, 1:])

            ax3.plot(iterations, result['temperature_history'], linewidth=2, color='orange')
            ax3.set_xlabel('迭代次數')
            ax3.set_ylabel('溫度')
            ax3.set_title(f'溫度變化 ({self.cooling_schedule} 降溫)')
            ax3.set_yscale('log')
            ax3.grid(True, alpha=0.3)

            plt.suptitle('模擬退火優化分析', fontsize=14, fontweight='bold')

            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                print(f"圖片已儲存到: {save_path}")
            else:
                plt.show()

            plt.close()

        except ImportError:
            print("需要安裝 matplotlib 才能視覺化結果")
