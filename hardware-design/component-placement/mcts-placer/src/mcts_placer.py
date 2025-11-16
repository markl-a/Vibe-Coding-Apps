"""
MCTS 元件擺放器實作
使用 Monte Carlo Tree Search 演算法優化 PCB 元件擺放
"""

import numpy as np
import math
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass


@dataclass
class Component:
    """元件資料類別"""
    name: str
    size: Tuple[float, float]  # (width, height)
    position: Optional[Tuple[float, float]] = None
    is_placed: bool = False


@dataclass
class Connection:
    """連接資料類別"""
    comp1: str
    comp2: str
    weight: float = 1.0  # 連接權重


class PlacementState:
    """擺放狀態類別"""

    def __init__(self, board_size: Tuple[float, float], components: Dict[str, Component]):
        self.board_size = board_size
        self.components = {name: Component(comp.name, comp.size) for name, comp in components.items()}
        self.connections: List[Connection] = []

    def copy(self) -> 'PlacementState':
        """複製狀態"""
        new_state = PlacementState(self.board_size, self.components)
        new_state.connections = self.connections.copy()
        for name, comp in self.components.items():
            if comp.is_placed:
                new_state.components[name].position = comp.position
                new_state.components[name].is_placed = True
        return new_state

    def get_unplaced_components(self) -> List[str]:
        """獲取未擺放的元件"""
        return [name for name, comp in self.components.items() if not comp.is_placed]

    def is_terminal(self) -> bool:
        """檢查是否為終止狀態"""
        return len(self.get_unplaced_components()) == 0

    def is_valid_position(self, comp_name: str, position: Tuple[float, float]) -> bool:
        """檢查位置是否有效"""
        comp = self.components[comp_name]
        x, y = position
        w, h = comp.size

        # 檢查是否在板子範圍內
        if x < 0 or y < 0 or x + w > self.board_size[0] or y + h > self.board_size[1]:
            return False

        # 檢查是否與其他元件重疊
        for other_name, other_comp in self.components.items():
            if other_name == comp_name or not other_comp.is_placed:
                continue

            ox, oy = other_comp.position
            ow, oh = other_comp.size

            # 檢查重疊
            if not (x + w <= ox or x >= ox + ow or y + h <= oy or y >= oy + oh):
                return False

        return True

    def place_component(self, comp_name: str, position: Tuple[float, float]) -> None:
        """擺放元件"""
        if self.is_valid_position(comp_name, position):
            self.components[comp_name].position = position
            self.components[comp_name].is_placed = True

    def get_random_valid_position(self, comp_name: str, max_attempts: int = 100) -> Optional[Tuple[float, float]]:
        """獲取隨機有效位置"""
        comp = self.components[comp_name]
        w, h = comp.size

        for _ in range(max_attempts):
            x = np.random.uniform(0, self.board_size[0] - w)
            y = np.random.uniform(0, self.board_size[1] - h)
            position = (x, y)

            if self.is_valid_position(comp_name, position):
                return position

        return None

    def evaluate(self, connections: List[Connection]) -> float:
        """評估當前狀態的成本（越低越好）"""
        if not self.is_terminal():
            return float('inf')

        total_cost = 0.0

        # 計算連線長度
        for conn in connections:
            comp1 = self.components[conn.comp1]
            comp2 = self.components[conn.comp2]

            if comp1.is_placed and comp2.is_placed:
                # 計算元件中心距離
                x1 = comp1.position[0] + comp1.size[0] / 2
                y1 = comp1.position[1] + comp1.size[1] / 2
                x2 = comp2.position[0] + comp2.size[0] / 2
                y2 = comp2.position[1] + comp2.size[1] / 2

                distance = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                total_cost += distance * conn.weight

        return total_cost


class MCTSNode:
    """MCTS 搜索樹節點"""

    def __init__(self, state: PlacementState, parent: Optional['MCTSNode'] = None,
                 action: Optional[Tuple[str, Tuple[float, float]]] = None):
        self.state = state
        self.parent = parent
        self.action = action  # (component_name, position)
        self.children: List['MCTSNode'] = []
        self.visits = 0
        self.value = 0.0
        self.untried_actions: List[Tuple[str, Tuple[float, float]]] = []

        # 初始化未嘗試的動作
        self._initialize_actions()

    def _initialize_actions(self, num_samples: int = 10):
        """初始化可用動作（採樣方式）"""
        unplaced = self.state.get_unplaced_components()

        for comp_name in unplaced:
            # 為每個未擺放的元件採樣多個位置
            for _ in range(num_samples):
                position = self.state.get_random_valid_position(comp_name)
                if position:
                    self.untried_actions.append((comp_name, position))

    def is_fully_expanded(self) -> bool:
        """檢查是否完全擴展"""
        return len(self.untried_actions) == 0

    def is_terminal(self) -> bool:
        """檢查是否為終止節點"""
        return self.state.is_terminal()

    def ucb1(self, exploration_weight: float = 1.414) -> float:
        """計算 UCB1 值"""
        if self.visits == 0:
            return float('inf')

        if self.parent is None or self.parent.visits == 0:
            return self.value / self.visits

        exploitation = self.value / self.visits
        exploration = exploration_weight * math.sqrt(math.log(self.parent.visits) / self.visits)

        return exploitation + exploration

    def select_child(self, exploration_weight: float = 1.414) -> 'MCTSNode':
        """選擇最佳子節點"""
        return max(self.children, key=lambda c: c.ucb1(exploration_weight))

    def expand(self) -> 'MCTSNode':
        """擴展新節點"""
        if not self.untried_actions:
            return self

        # 隨機選擇一個未嘗試的動作
        action = self.untried_actions.pop(np.random.randint(len(self.untried_actions)))
        comp_name, position = action

        # 創建新狀態
        new_state = self.state.copy()
        new_state.place_component(comp_name, position)

        # 創建子節點
        child = MCTSNode(new_state, parent=self, action=action)
        self.children.append(child)

        return child

    def simulate(self, connections: List[Connection]) -> float:
        """模擬到終止狀態"""
        current_state = self.state.copy()

        # 隨機擺放剩餘元件
        unplaced = current_state.get_unplaced_components()

        for comp_name in unplaced:
            position = current_state.get_random_valid_position(comp_name)
            if position:
                current_state.place_component(comp_name, position)
            else:
                # 無法擺放，返回很高的成本
                return 1000000.0

        # 評估最終狀態
        cost = current_state.evaluate(connections)

        # 轉換為獎勵（成本越低越好）
        reward = 1.0 / (1.0 + cost)

        return reward

    def backpropagate(self, value: float):
        """回傳更新節點值"""
        self.visits += 1
        self.value += value

        if self.parent:
            self.parent.backpropagate(value)


class MCTSComponentPlacer:
    """MCTS 元件擺放器"""

    def __init__(self, board_size: Tuple[float, float] = (100, 80),
                 exploration_weight: float = 1.414):
        """
        初始化 MCTS 擺放器

        Args:
            board_size: 板子大小 (width, height) in mm
            exploration_weight: UCB1 探索權重
        """
        self.board_size = board_size
        self.exploration_weight = exploration_weight
        self.components: Dict[str, Component] = {}
        self.connections: List[Connection] = []

    def add_component(self, name: str, size: Tuple[float, float]):
        """添加元件"""
        self.components[name] = Component(name, size)

    def add_connection(self, comp1: str, comp2: str, weight: float = 1.0):
        """添加連接"""
        self.connections.append(Connection(comp1, comp2, weight))

    def optimize(self, iterations: int = 1000, verbose: bool = True) -> Dict[str, Any]:
        """
        執行 MCTS 優化

        Args:
            iterations: 搜索迭代次數
            verbose: 是否顯示進度

        Returns:
            優化結果字典
        """
        # 初始化根節點
        initial_state = PlacementState(self.board_size, self.components)
        initial_state.connections = self.connections
        root = MCTSNode(initial_state)

        best_cost = float('inf')
        best_layout = None

        # MCTS 主循環
        for iteration in range(iterations):
            # 1. Selection
            node = root
            while not node.is_terminal() and node.is_fully_expanded():
                node = node.select_child(self.exploration_weight)

            # 2. Expansion
            if not node.is_terminal() and not node.is_fully_expanded():
                node = node.expand()

            # 3. Simulation
            reward = node.simulate(self.connections)

            # 4. Backpropagation
            node.backpropagate(reward)

            # 更新最佳解
            if node.is_terminal():
                cost = node.state.evaluate(self.connections)
                if cost < best_cost:
                    best_cost = cost
                    best_layout = {
                        name: comp.position
                        for name, comp in node.state.components.items()
                    }

            # 顯示進度
            if verbose and (iteration + 1) % 100 == 0:
                print(f"迭代 {iteration + 1}/{iterations}, 最佳成本: {best_cost:.2f}")

        return {
            'layout': best_layout,
            'cost': best_cost,
            'iterations': iterations,
            'tree_visits': root.visits
        }

    def visualize(self, result: Dict[str, Any], save_path: Optional[str] = None):
        """視覺化結果"""
        try:
            import matplotlib.pyplot as plt
            import matplotlib.patches as patches

            fig, ax = plt.subplots(figsize=(10, 8))

            # 繪製板子邊界
            ax.add_patch(patches.Rectangle(
                (0, 0), self.board_size[0], self.board_size[1],
                fill=False, edgecolor='black', linewidth=2
            ))

            # 繪製元件
            layout = result['layout']
            colors = plt.cm.Set3(np.linspace(0, 1, len(layout)))

            for i, (name, position) in enumerate(layout.items()):
                comp = self.components[name]
                x, y = position
                w, h = comp.size

                # 繪製元件矩形
                ax.add_patch(patches.Rectangle(
                    (x, y), w, h,
                    facecolor=colors[i], edgecolor='black', alpha=0.7
                ))

                # 添加元件名稱
                ax.text(x + w/2, y + h/2, name,
                       ha='center', va='center', fontsize=8, fontweight='bold')

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

                    ax.plot([x1, x2], [y1, y2], 'b--', alpha=0.3, linewidth=1)

            ax.set_xlim(-5, self.board_size[0] + 5)
            ax.set_ylim(-5, self.board_size[1] + 5)
            ax.set_aspect('equal')
            ax.set_xlabel('X (mm)')
            ax.set_ylabel('Y (mm)')
            ax.set_title(f'MCTS 元件擺放結果\n總成本: {result["cost"]:.2f}')
            ax.grid(True, alpha=0.3)

            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                print(f"圖片已儲存到: {save_path}")
            else:
                plt.show()

            plt.close()

        except ImportError:
            print("需要安裝 matplotlib 才能視覺化結果")
