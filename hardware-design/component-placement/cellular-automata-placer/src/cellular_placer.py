"""
細胞自動機元件擺放器實作
使用細胞自動機演算法優化 PCB 元件擺放
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from scipy.ndimage import convolve


@dataclass
class Component:
    """元件資料類別"""
    name: str
    size: Tuple[float, float]  # (width, height) in mm
    grid_size: Tuple[int, int] = None  # (width, height) in grid cells
    position: Optional[Tuple[int, int]] = None  # grid position


@dataclass
class Connection:
    """連接資料類別"""
    comp1: str
    comp2: str
    weight: float = 1.0


class CellularAutomataPlacer:
    """細胞自動機元件擺放器"""

    def __init__(self, board_size: Tuple[float, float] = (100, 80),
                 grid_resolution: float = 1.0):
        """
        初始化細胞自動機擺放器

        Args:
            board_size: 板子大小 (width, height) in mm
            grid_resolution: 網格解析度 (mm per cell)
        """
        self.board_size = board_size
        self.grid_resolution = grid_resolution

        # 計算網格大小
        self.grid_width = int(board_size[0] / grid_resolution)
        self.grid_height = int(board_size[1] / grid_resolution)

        # 初始化網格
        self.grid = np.zeros((self.grid_height, self.grid_width), dtype=np.float32)
        self.occupancy = np.zeros((self.grid_height, self.grid_width), dtype=np.int32)

        self.components: Dict[str, Component] = {}
        self.connections: List[Connection] = []
        self.component_map: Dict[int, str] = {}  # component_id -> name
        self.next_comp_id = 1

    def add_component(self, name: str, size: Tuple[float, float]):
        """添加元件"""
        # 計算網格大小
        grid_w = max(1, int(np.ceil(size[0] / self.grid_resolution)))
        grid_h = max(1, int(np.ceil(size[1] / self.grid_resolution)))

        comp = Component(name, size, grid_size=(grid_w, grid_h))
        self.components[name] = comp
        self.component_map[self.next_comp_id] = name
        self.next_comp_id += 1

    def add_connection(self, comp1: str, comp2: str, weight: float = 1.0):
        """添加連接"""
        self.connections.append(Connection(comp1, comp2, weight))

    def _get_component_id(self, name: str) -> int:
        """獲取元件 ID"""
        for comp_id, comp_name in self.component_map.items():
            if comp_name == name:
                return comp_id
        return 0

    def _initialize_random_placement(self):
        """隨機初始化元件位置"""
        self.occupancy.fill(0)

        for name, comp in self.components.items():
            placed = False
            max_attempts = 100

            for _ in range(max_attempts):
                # 隨機位置
                x = np.random.randint(0, self.grid_width - comp.grid_size[0] + 1)
                y = np.random.randint(0, self.grid_height - comp.grid_size[1] + 1)

                # 檢查是否重疊
                if np.all(self.occupancy[y:y+comp.grid_size[1], x:x+comp.grid_size[0]] == 0):
                    # 擺放元件
                    comp_id = self._get_component_id(name)
                    self.occupancy[y:y+comp.grid_size[1], x:x+comp.grid_size[0]] = comp_id
                    comp.position = (x, y)
                    placed = True
                    break

            if not placed:
                print(f"警告: 無法擺放元件 {name}")

    def _calculate_attraction_field(self) -> np.ndarray:
        """計算吸引力場"""
        attraction = np.zeros((self.grid_height, self.grid_width), dtype=np.float32)

        for conn in self.connections:
            comp1 = self.components[conn.comp1]
            comp2 = self.components[conn.comp2]

            if comp1.position is None or comp2.position is None:
                continue

            # 計算元件中心
            c1_x = comp1.position[0] + comp1.grid_size[0] / 2
            c1_y = comp1.position[1] + comp1.grid_size[1] / 2
            c2_x = comp2.position[0] + comp2.grid_size[0] / 2
            c2_y = comp2.position[1] + comp2.grid_size[1] / 2

            # 計算方向向量
            dx = c2_x - c1_x
            dy = c2_y - c1_y
            distance = np.sqrt(dx**2 + dy**2) + 1e-6

            # 在元件周圍添加吸引力
            comp_id_1 = self._get_component_id(comp1.name)
            comp_id_2 = self._get_component_id(comp2.name)

            # 為 comp1 添加指向 comp2 的吸引力
            y1, x1 = comp1.position[1], comp1.position[0]
            h1, w1 = comp1.grid_size[1], comp1.grid_size[0]

            for i in range(h1):
                for j in range(w1):
                    if self.occupancy[y1+i, x1+j] == comp_id_1:
                        # 吸引力與距離成反比
                        attraction[y1+i, x1+j] += conn.weight / distance

        return attraction

    def _calculate_repulsion_field(self) -> np.ndarray:
        """計算排斥力場"""
        repulsion = np.zeros((self.grid_height, self.grid_width), dtype=np.float32)

        # 使用卷積計算鄰居數量
        kernel = np.ones((3, 3), dtype=np.float32)
        kernel[1, 1] = 0

        # 計算每個細胞周圍的佔用數
        neighbor_count = convolve((self.occupancy > 0).astype(np.float32),
                                 kernel, mode='constant', cval=0)

        # 排斥力與鄰居數量成正比
        repulsion = neighbor_count

        return repulsion

    def _try_move_component(self, comp_name: str, direction: Tuple[int, int]) -> bool:
        """嘗試移動元件"""
        comp = self.components[comp_name]
        if comp.position is None:
            return False

        x, y = comp.position
        dx, dy = direction
        new_x, new_y = x + dx, y + dy

        # 檢查邊界
        if (new_x < 0 or new_y < 0 or
            new_x + comp.grid_size[0] > self.grid_width or
            new_y + comp.grid_size[1] > self.grid_height):
            return False

        # 檢查是否與其他元件重疊
        comp_id = self._get_component_id(comp_name)
        target_area = self.occupancy[new_y:new_y+comp.grid_size[1],
                                     new_x:new_x+comp.grid_size[0]]

        if np.any((target_area > 0) & (target_area != comp_id)):
            return False

        # 移動元件
        # 清除舊位置
        self.occupancy[y:y+comp.grid_size[1], x:x+comp.grid_size[0]] = 0

        # 設置新位置
        self.occupancy[new_y:new_y+comp.grid_size[1], new_x:new_x+comp.grid_size[0]] = comp_id
        comp.position = (new_x, new_y)

        return True

    def _evolve_step(self, attraction_strength: float = 1.0,
                     repulsion_strength: float = 0.5):
        """執行一步演化"""
        attraction = self._calculate_attraction_field()
        repulsion = self._calculate_repulsion_field()

        # 計算總力場
        force_field = attraction_strength * attraction - repulsion_strength * repulsion

        # 隨機順序處理元件
        comp_names = list(self.components.keys())
        np.random.shuffle(comp_names)

        for comp_name in comp_names:
            comp = self.components[comp_name]
            if comp.position is None:
                continue

            # 計算元件區域的平均力
            x, y = comp.position
            h, w = comp.grid_size

            comp_force = force_field[y:y+h, x:x+w]
            avg_force = np.mean(comp_force)

            # 根據力場決定移動方向
            if abs(avg_force) < 0.1:  # 力太小，隨機移動
                if np.random.rand() < 0.1:  # 10% 機率隨機移動
                    direction = np.random.choice([(-1, 0), (1, 0), (0, -1), (0, 1)])
                    self._try_move_component(comp_name, direction)
            else:
                # 嘗試朝力的方向移動
                # 計算梯度
                directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
                best_dir = None
                best_force = avg_force

                for dx, dy in directions:
                    new_x, new_y = x + dx, y + dy

                    if (0 <= new_x < self.grid_width - w + 1 and
                        0 <= new_y < self.grid_height - h + 1):
                        new_force = np.mean(force_field[new_y:new_y+h, new_x:new_x+w])

                        if new_force > best_force:
                            best_force = new_force
                            best_dir = (dx, dy)

                if best_dir:
                    self._try_move_component(comp_name, best_dir)

    def _calculate_cost(self) -> float:
        """計算當前佈局的成本"""
        total_cost = 0.0

        for conn in self.connections:
            comp1 = self.components[conn.comp1]
            comp2 = self.components[conn.comp2]

            if comp1.position and comp2.position:
                # 計算元件中心距離
                c1_x = (comp1.position[0] + comp1.grid_size[0] / 2) * self.grid_resolution
                c1_y = (comp1.position[1] + comp1.grid_size[1] / 2) * self.grid_resolution
                c2_x = (comp2.position[0] + comp2.grid_size[0] / 2) * self.grid_resolution
                c2_y = (comp2.position[1] + comp2.grid_size[1] / 2) * self.grid_resolution

                distance = np.sqrt((c2_x - c1_x)**2 + (c2_y - c1_y)**2)
                total_cost += distance * conn.weight

        return total_cost

    def evolve(self, iterations: int = 200,
               attraction_strength: float = 1.0,
               repulsion_strength: float = 0.5,
               verbose: bool = True) -> Dict[str, Any]:
        """
        執行細胞自動機演化

        Args:
            iterations: 演化迭代次數
            attraction_strength: 吸引力強度
            repulsion_strength: 排斥力強度
            verbose: 是否顯示進度

        Returns:
            優化結果字典
        """
        # 初始化隨機擺放
        self._initialize_random_placement()

        initial_cost = self._calculate_cost()
        best_cost = initial_cost
        cost_history = [initial_cost]

        if verbose:
            print(f"初始成本: {initial_cost:.2f}")

        # 演化循環
        for iteration in range(iterations):
            self._evolve_step(attraction_strength, repulsion_strength)

            # 計算成本
            cost = self._calculate_cost()
            cost_history.append(cost)

            if cost < best_cost:
                best_cost = cost

            # 顯示進度
            if verbose and (iteration + 1) % 20 == 0:
                print(f"迭代 {iteration + 1}/{iterations}, 當前成本: {cost:.2f}, 最佳成本: {best_cost:.2f}")

        # 提取最終佈局
        layout = {}
        for name, comp in self.components.items():
            if comp.position:
                # 轉換回實際座標 (mm)
                x = comp.position[0] * self.grid_resolution
                y = comp.position[1] * self.grid_resolution
                layout[name] = (x, y)

        return {
            'layout': layout,
            'cost': best_cost,
            'initial_cost': initial_cost,
            'cost_history': cost_history,
            'iterations': iterations
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
            ax1.set_title(f'細胞自動機擺放結果\n最終成本: {result["cost"]:.2f}')
            ax1.grid(True, alpha=0.3)

            # 右圖: 成本歷史
            ax2.plot(result['cost_history'], linewidth=2)
            ax2.set_xlabel('迭代次數')
            ax2.set_ylabel('成本')
            ax2.set_title('成本演化歷史')
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
