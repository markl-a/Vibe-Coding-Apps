"""
熱感知元件擺放器實作
考慮熱分佈的 PCB 元件擺放優化
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
    power: float = 0.0  # 功耗 (W)
    thermal_resistance: float = 10.0  # 熱阻 (°C/W)
    position: Optional[Tuple[float, float]] = None


@dataclass
class Connection:
    """連接資料類別"""
    comp1: str
    comp2: str
    weight: float = 1.0


@dataclass
class HeatsinkArea:
    """散熱區域"""
    position: Tuple[float, float]  # (x, y)
    size: Tuple[float, float]  # (width, height)
    efficiency: float = 0.8  # 散熱效率 (0-1)


class ThermalAwarePlacer:
    """熱感知元件擺放器"""

    def __init__(self, board_size: Tuple[float, float] = (100, 80),
                 ambient_temp: float = 25.0,
                 grid_resolution: float = 1.0):
        """
        初始化熱感知擺放器

        Args:
            board_size: 板子大小 (width, height) in mm
            ambient_temp: 環境溫度 (°C)
            grid_resolution: 熱模擬網格解析度 (mm)
        """
        self.board_size = board_size
        self.ambient_temp = ambient_temp
        self.grid_resolution = grid_resolution

        # 計算熱模擬網格大小
        self.grid_width = int(board_size[0] / grid_resolution)
        self.grid_height = int(board_size[1] / grid_resolution)

        self.components: Dict[str, Component] = {}
        self.connections: List[Connection] = []
        self.heatsink_areas: List[HeatsinkArea] = []

        # 熱模擬參數
        self.thermal_diffusivity = 0.1  # 熱擴散係數

    def add_component(self, name: str, size: Tuple[float, float],
                     power: float = 0.0, thermal_resistance: float = 10.0):
        """
        添加元件

        Args:
            name: 元件名稱
            size: 元件大小 (width, height) in mm
            power: 功耗 (W)
            thermal_resistance: 熱阻 (°C/W)
        """
        self.components[name] = Component(name, size, power, thermal_resistance)

    def add_connection(self, comp1: str, comp2: str, weight: float = 1.0):
        """添加連接"""
        self.connections.append(Connection(comp1, comp2, weight))

    def add_heatsink_area(self, position: Tuple[float, float],
                         size: Tuple[float, float], efficiency: float = 0.8):
        """
        添加散熱區域

        Args:
            position: 位置 (x, y)
            size: 大小 (width, height)
            efficiency: 散熱效率 (0-1)
        """
        self.heatsink_areas.append(HeatsinkArea(position, size, efficiency))

    def _simulate_thermal(self, layout: Dict[str, Tuple[float, float]],
                         num_iterations: int = 50) -> np.ndarray:
        """
        模擬熱分佈

        Args:
            layout: 元件佈局
            num_iterations: 熱模擬迭代次數

        Returns:
            溫度分佈矩陣
        """
        # 初始化溫度場
        temperature = np.ones((self.grid_height, self.grid_width)) * self.ambient_temp

        # 初始化熱源
        heat_source = np.zeros((self.grid_height, self.grid_width))

        # 添加元件熱源
        for name, position in layout.items():
            comp = self.components[name]
            if comp.power > 0:
                x, y = position
                # 轉換為網格座標
                gx = int(x / self.grid_resolution)
                gy = int(y / self.grid_resolution)
                gw = max(1, int(comp.size[0] / self.grid_resolution))
                gh = max(1, int(comp.size[1] / self.grid_resolution))

                # 確保不超出邊界
                gx = min(gx, self.grid_width - 1)
                gy = min(gy, self.grid_height - 1)
                gx_end = min(gx + gw, self.grid_width)
                gy_end = min(gy + gh, self.grid_height)

                # 計算熱源強度（功率 / 面積）
                area = gw * gh * (self.grid_resolution ** 2)
                heat_intensity = comp.power / (area / 1000)  # W/mm²轉換

                heat_source[gy:gy_end, gx:gx_end] = heat_intensity

        # 散熱區域遮罩
        heatsink_mask = np.zeros((self.grid_height, self.grid_width))
        for heatsink in self.heatsink_areas:
            x, y = heatsink.position
            w, h = heatsink.size

            gx = int(x / self.grid_resolution)
            gy = int(y / self.grid_resolution)
            gw = int(w / self.grid_resolution)
            gh = int(h / self.grid_resolution)

            gx_end = min(gx + gw, self.grid_width)
            gy_end = min(gy + gh, self.grid_height)

            heatsink_mask[gy:gy_end, gx:gx_end] = heatsink.efficiency

        # 熱傳導核心（5點差分）
        kernel = np.array([
            [0, 1, 0],
            [1, -4, 1],
            [0, 1, 0]
        ], dtype=np.float32)

        # 迭代求解
        for _ in range(num_iterations):
            # 拉普拉斯算子
            laplacian = convolve(temperature, kernel, mode='constant', cval=self.ambient_temp)

            # 更新溫度
            temperature += self.thermal_diffusivity * laplacian + heat_source

            # 應用散熱區域
            temperature = temperature * (1 - heatsink_mask) + self.ambient_temp * heatsink_mask

            # 邊界條件（環境溫度）
            temperature[0, :] = self.ambient_temp
            temperature[-1, :] = self.ambient_temp
            temperature[:, 0] = self.ambient_temp
            temperature[:, -1] = self.ambient_temp

        return temperature

    def _get_max_temperature(self, layout: Dict[str, Tuple[float, float]]) -> float:
        """獲取最高溫度"""
        temp_field = self._simulate_thermal(layout)
        return np.max(temp_field)

    def _get_component_temperature(self, comp_name: str,
                                   layout: Dict[str, Tuple[float, float]]) -> float:
        """獲取元件溫度"""
        temp_field = self._simulate_thermal(layout)
        comp = self.components[comp_name]
        position = layout[comp_name]

        x, y = position
        gx = int(x / self.grid_resolution)
        gy = int(y / self.grid_resolution)
        gw = max(1, int(comp.size[0] / self.grid_resolution))
        gh = max(1, int(comp.size[1] / self.grid_resolution))

        gx_end = min(gx + gw, self.grid_width)
        gy_end = min(gy + gh, self.grid_height)

        # 返回元件區域的平均溫度
        return np.mean(temp_field[gy:gy_end, gx:gx_end])

    def _calculate_wire_length(self, layout: Dict[str, Tuple[float, float]]) -> float:
        """計算總連線長度"""
        total_length = 0.0

        for conn in self.connections:
            if conn.comp1 in layout and conn.comp2 in layout:
                comp1 = self.components[conn.comp1]
                comp2 = self.components[conn.comp2]

                pos1 = layout[conn.comp1]
                pos2 = layout[conn.comp2]

                x1 = pos1[0] + comp1.size[0] / 2
                y1 = pos1[1] + comp1.size[1] / 2
                x2 = pos2[0] + comp2.size[0] / 2
                y2 = pos2[1] + comp2.size[1] / 2

                distance = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                total_length += distance * conn.weight

        return total_length

    def _calculate_cost(self, layout: Dict[str, Tuple[float, float]],
                       wire_weight: float = 1.0,
                       thermal_weight: float = 1.0) -> Tuple[float, Dict[str, float]]:
        """
        計算總成本

        Returns:
            (總成本, 成本詳情字典)
        """
        # 連線長度成本
        wire_length = self._calculate_wire_length(layout)

        # 熱成本
        max_temp = self._get_max_temperature(layout)
        thermal_cost = max(0, max_temp - self.ambient_temp)

        # 總成本
        total_cost = wire_weight * wire_length + thermal_weight * thermal_cost

        details = {
            'wire_length': wire_length,
            'max_temperature': max_temp,
            'thermal_cost': thermal_cost,
            'total_cost': total_cost
        }

        return total_cost, details

    def _random_layout(self) -> Dict[str, Tuple[float, float]]:
        """生成隨機佈局"""
        layout = {}

        for name, comp in self.components.items():
            max_attempts = 100
            placed = False

            for _ in range(max_attempts):
                x = np.random.uniform(0, self.board_size[0] - comp.size[0])
                y = np.random.uniform(0, self.board_size[1] - comp.size[1])

                # 簡單檢查重疊
                valid = True
                for other_name, other_pos in layout.items():
                    other_comp = self.components[other_name]
                    ox, oy = other_pos

                    if not (x + comp.size[0] <= ox or x >= ox + other_comp.size[0] or
                           y + comp.size[1] <= oy or y >= oy + other_comp.size[1]):
                        valid = False
                        break

                if valid:
                    layout[name] = (x, y)
                    placed = True
                    break

            if not placed:
                x = np.random.uniform(0, max(0, self.board_size[0] - comp.size[0]))
                y = np.random.uniform(0, max(0, self.board_size[1] - comp.size[1]))
                layout[name] = (x, y)

        return layout

    def optimize(self, iterations: int = 100,
                wire_weight: float = 1.0,
                thermal_weight: float = 2.0,
                verbose: bool = True) -> Dict[str, Any]:
        """
        使用模擬退火優化擺放

        Args:
            iterations: 迭代次數
            wire_weight: 連線長度權重
            thermal_weight: 熱成本權重
            verbose: 是否顯示進度

        Returns:
            優化結果字典
        """
        # 初始化隨機佈局
        current_layout = self._random_layout()
        current_cost, current_details = self._calculate_cost(
            current_layout, wire_weight, thermal_weight
        )

        best_layout = current_layout.copy()
        best_cost = current_cost
        best_details = current_details.copy()

        # 模擬退火參數
        initial_temp = 100.0
        final_temp = 0.1
        alpha = (final_temp / initial_temp) ** (1.0 / iterations)

        temperature = initial_temp
        cost_history = [current_cost]

        if verbose:
            print(f"初始成本: {current_cost:.2f}")
            print(f"  - 連線長度: {current_details['wire_length']:.2f}")
            print(f"  - 最高溫度: {current_details['max_temperature']:.2f}°C\n")

        # 優化循環
        for iteration in range(iterations):
            # 隨機選擇一個元件移動
            comp_name = np.random.choice(list(self.components.keys()))
            comp = self.components[comp_name]

            # 生成新位置
            old_pos = current_layout[comp_name]
            offset = 10.0  # mm

            new_x = old_pos[0] + np.random.uniform(-offset, offset)
            new_y = old_pos[1] + np.random.uniform(-offset, offset)

            new_x = np.clip(new_x, 0, self.board_size[0] - comp.size[0])
            new_y = np.clip(new_y, 0, self.board_size[1] - comp.size[1])

            # 創建新佈局
            new_layout = current_layout.copy()
            new_layout[comp_name] = (new_x, new_y)

            # 計算新成本
            new_cost, new_details = self._calculate_cost(
                new_layout, wire_weight, thermal_weight
            )

            # 決定是否接受
            delta = new_cost - current_cost

            if delta < 0 or np.random.rand() < np.exp(-delta / temperature):
                current_layout = new_layout
                current_cost = new_cost
                current_details = new_details

                if current_cost < best_cost:
                    best_layout = current_layout.copy()
                    best_cost = current_cost
                    best_details = current_details.copy()

            # 降溫
            temperature *= alpha
            cost_history.append(current_cost)

            # 顯示進度
            if verbose and (iteration + 1) % 10 == 0:
                print(f"迭代 {iteration + 1}/{iterations}")
                print(f"  當前成本: {current_cost:.2f}, 最佳成本: {best_cost:.2f}")
                print(f"  最高溫度: {current_details['max_temperature']:.2f}°C")

        if verbose:
            print("\n=== 優化完成 ===")
            print(f"最終成本: {best_cost:.2f}")
            print(f"連線長度: {best_details['wire_length']:.2f}")
            print(f"最高溫度: {best_details['max_temperature']:.2f}°C")

        return {
            'layout': best_layout,
            'cost': best_cost,
            'details': best_details,
            'cost_history': cost_history,
            'iterations': iterations
        }

    def visualize_thermal(self, result: Dict[str, Any], save_path: Optional[str] = None):
        """視覺化熱分佈"""
        try:
            import matplotlib.pyplot as plt
            import matplotlib.patches as patches

            layout = result['layout']
            temp_field = self._simulate_thermal(layout)

            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

            # 左圖: 熱圖
            im = ax1.imshow(temp_field, cmap='hot', origin='lower',
                          extent=[0, self.board_size[0], 0, self.board_size[1]],
                          alpha=0.7)

            # 繪製元件邊界
            for name, position in layout.items():
                comp = self.components[name]
                x, y = position
                w, h = comp.size

                color = 'red' if comp.power > 1.0 else 'blue'
                linewidth = 2 if comp.power > 1.0 else 1

                ax1.add_patch(patches.Rectangle(
                    (x, y), w, h,
                    fill=False, edgecolor=color, linewidth=linewidth
                ))

                label = f"{name}"
                if comp.power > 0:
                    label += f"\n{comp.power:.1f}W"

                ax1.text(x + w/2, y + h/2, label,
                        ha='center', va='center', fontsize=7,
                        bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

            # 繪製散熱區域
            for heatsink in self.heatsink_areas:
                x, y = heatsink.position
                w, h = heatsink.size
                ax1.add_patch(patches.Rectangle(
                    (x, y), w, h,
                    fill=False, edgecolor='cyan', linewidth=2, linestyle='--'
                ))
                ax1.text(x + w/2, y + h/2, 'Heatsink',
                        ha='center', va='center', fontsize=8, color='cyan')

            plt.colorbar(im, ax=ax1, label='溫度 (°C)')
            ax1.set_xlabel('X (mm)')
            ax1.set_ylabel('Y (mm)')
            ax1.set_title(f'熱分佈圖\n最高溫度: {result["details"]["max_temperature"]:.1f}°C')

            # 右圖: 成本歷史
            ax2.plot(result['cost_history'], linewidth=2)
            ax2.set_xlabel('迭代次數')
            ax2.set_ylabel('總成本')
            ax2.set_title('優化歷史')
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
