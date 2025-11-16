"""
PCB 自動路由器主模組
"""

import numpy as np
from typing import List, Tuple, Dict, Optional
from enum import Enum


class RoutingAlgorithm(Enum):
    """路由演算法類型"""
    ASTAR = "astar"
    LEE = "lee"
    RL = "rl"


class PCBRouter:
    """PCB 自動路由器"""

    def __init__(self, board_size: Tuple[float, float], grid_resolution: float = 0.1, layers: int = 2):
        """
        初始化路由器

        Args:
            board_size: 電路板尺寸 (width, height) in mm
            grid_resolution: 網格解析度 in mm
            layers: 層數
        """
        self.board_size = board_size
        self.grid_resolution = grid_resolution
        self.layers = layers

        # 計算網格大小
        self.grid_width = int(board_size[0] / grid_resolution)
        self.grid_height = int(board_size[1] / grid_resolution)

        # 初始化多層網格（0=空閒，1=障礙物，2=已走線）
        self.grids = [np.zeros((self.grid_height, self.grid_width), dtype=np.int8)
                      for _ in range(layers)]

        # 連接列表
        self.connections = []

        # 設計規則
        self.design_rules = {
            'min_trace_width': 0.15,
            'min_clearance': 0.15,
            'min_via_diameter': 0.3,
            'max_trace_length': 500
        }

    def add_obstacle(self, x: float, y: float, width: float, height: float, layer: int = 0):
        """
        添加障礙物（元件、已擺放物件等）

        Args:
            x, y: 左下角座標 (mm)
            width, height: 寬高 (mm)
            layer: 所在層
        """
        # 轉換為網格座標
        grid_x = int(x / self.grid_resolution)
        grid_y = int(y / self.grid_resolution)
        grid_w = int(width / self.grid_resolution)
        grid_h = int(height / self.grid_resolution)

        # 標記網格為障礙物
        self.grids[layer][grid_y:grid_y+grid_h, grid_x:grid_x+grid_w] = 1

    def add_connection(self, start: Tuple[float, float], end: Tuple[float, float],
                      width: float = 0.2, clearance: float = 0.15,
                      layer: int = 0, net_name: str = ""):
        """
        添加需要走線的連接

        Args:
            start: 起點座標 (x, y) in mm
            end: 終點座標 (x, y) in mm
            width: 線寬 in mm
            clearance: 間距 in mm
            layer: 走線層
            net_name: 網路名稱
        """
        connection = {
            'start': start,
            'end': end,
            'width': width,
            'clearance': clearance,
            'layer': layer,
            'net_name': net_name,
            'routed': False,
            'path': None
        }
        self.connections.append(connection)

    def add_differential_pair(self, positive_start: Tuple[float, float],
                             positive_end: Tuple[float, float],
                             negative_start: Tuple[float, float],
                             negative_end: Tuple[float, float],
                             spacing: float = 0.2,
                             length_matching: bool = True):
        """
        添加差分對連接

        Args:
            positive_start: 正極起點
            positive_end: 正極終點
            negative_start: 負極起點
            negative_end: 負極終點
            spacing: 差分對間距
            length_matching: 是否進行等長匹配
        """
        # 添加兩條走線，並標記為差分對
        self.add_connection(positive_start, positive_end, net_name="diff_p")
        self.add_connection(negative_start, negative_end, net_name="diff_n")

        # TODO: 實現差分對約束邏輯

    def set_design_rules(self, rules: Dict):
        """
        設定設計規則

        Args:
            rules: 設計規則字典
        """
        self.design_rules.update(rules)

    def route(self, algorithm: str = 'astar', **kwargs) -> Dict:
        """
        執行自動走線

        Args:
            algorithm: 路由演算法 ('astar', 'lee', 'rl')
            **kwargs: 演算法特定參數

        Returns:
            路由結果字典
        """
        print(f"開始使用 {algorithm} 演算法進行走線...")

        routed_count = 0
        failed_connections = []
        total_length = 0.0

        for i, conn in enumerate(self.connections):
            if conn['routed']:
                continue

            # 根據選擇的演算法執行路由
            if algorithm == 'astar':
                path = self._route_astar(conn, **kwargs)
            elif algorithm == 'lee':
                path = self._route_lee(conn, **kwargs)
            elif algorithm == 'rl':
                path = self._route_rl(conn, **kwargs)
            else:
                raise ValueError(f"未知演算法: {algorithm}")

            if path:
                conn['path'] = path
                conn['routed'] = True
                routed_count += 1

                # 計算路徑長度
                length = self._calculate_path_length(path)
                total_length += length

                # 標記網格為已走線
                self._mark_path_on_grid(path, conn['layer'])
            else:
                failed_connections.append(i)

        success_rate = routed_count / len(self.connections) if self.connections else 0

        result = {
            'success_rate': success_rate,
            'routed_count': routed_count,
            'total_connections': len(self.connections),
            'failed_connections': failed_connections,
            'total_length': total_length,
            'algorithm': algorithm
        }

        print(f"走線完成: {routed_count}/{len(self.connections)} ({success_rate*100:.1f}%)")
        print(f"總長度: {total_length:.2f} mm")

        return result

    def _route_astar(self, connection: Dict, **kwargs) -> Optional[List]:
        """使用 A* 演算法進行路由"""
        from .algorithms.astar import astar_search

        start = self._to_grid_coords(connection['start'])
        end = self._to_grid_coords(connection['end'])
        layer = connection['layer']

        path = astar_search(self.grids[layer], start, end, **kwargs)
        return path

    def _route_lee(self, connection: Dict, **kwargs) -> Optional[List]:
        """使用 Lee 演算法進行路由"""
        from .algorithms.lee import lee_router

        start = self._to_grid_coords(connection['start'])
        end = self._to_grid_coords(connection['end'])
        layer = connection['layer']

        path = lee_router(self.grids[layer], start, end)
        return path

    def _route_rl(self, connection: Dict, **kwargs) -> Optional[List]:
        """使用強化學習進行路由"""
        # TODO: 實現 RL 路由
        print("RL 路由尚未實現，使用 A* 替代")
        return self._route_astar(connection, **kwargs)

    def _to_grid_coords(self, point: Tuple[float, float]) -> Tuple[int, int]:
        """將實際座標轉換為網格座標"""
        x = int(point[0] / self.grid_resolution)
        y = int(point[1] / self.grid_resolution)
        return (x, y)

    def _to_real_coords(self, point: Tuple[int, int]) -> Tuple[float, float]:
        """將網格座標轉換為實際座標"""
        x = point[0] * self.grid_resolution
        y = point[1] * self.grid_resolution
        return (x, y)

    def _calculate_path_length(self, path: List[Tuple[int, int]]) -> float:
        """計算路徑長度"""
        if not path or len(path) < 2:
            return 0.0

        length = 0.0
        for i in range(len(path) - 1):
            p1 = np.array(path[i])
            p2 = np.array(path[i + 1])
            length += np.linalg.norm(p2 - p1) * self.grid_resolution

        return length

    def _mark_path_on_grid(self, path: List[Tuple[int, int]], layer: int):
        """在網格上標記路徑"""
        for x, y in path:
            if 0 <= y < self.grid_height and 0 <= x < self.grid_width:
                self.grids[layer][y, x] = 2

    def check_design_rules(self) -> List[Dict]:
        """
        檢查設計規則違規

        Returns:
            違規列表
        """
        violations = []

        # 檢查每條走線
        for i, conn in enumerate(self.connections):
            if not conn['routed'] or not conn['path']:
                continue

            # 檢查線寬
            if conn['width'] < self.design_rules['min_trace_width']:
                violations.append({
                    'type': 'min_trace_width',
                    'connection': i,
                    'value': conn['width'],
                    'limit': self.design_rules['min_trace_width']
                })

            # 檢查總長度
            length = self._calculate_path_length(conn['path'])
            if length > self.design_rules['max_trace_length']:
                violations.append({
                    'type': 'max_trace_length',
                    'connection': i,
                    'value': length,
                    'limit': self.design_rules['max_trace_length']
                })

        return violations

    def visualize(self, result: Dict, layer: int = 0, show: bool = True):
        """
        視覺化路由結果

        Args:
            result: 路由結果
            layer: 要顯示的層
            show: 是否顯示圖形
        """
        import matplotlib.pyplot as plt
        import matplotlib.patches as patches

        fig, ax = plt.subplots(figsize=(12, 10))

        # 顯示網格
        ax.imshow(self.grids[layer], cmap='gray_r', origin='lower',
                 extent=[0, self.board_size[0], 0, self.board_size[1]])

        # 繪製所有路徑
        colors = plt.cm.rainbow(np.linspace(0, 1, len(self.connections)))

        for i, conn in enumerate(self.connections):
            if conn['routed'] and conn['path']:
                path = conn['path']
                real_path = [self._to_real_coords(p) for p in path]

                xs = [p[0] for p in real_path]
                ys = [p[1] for p in real_path]

                ax.plot(xs, ys, color=colors[i], linewidth=2,
                       label=f"{conn['net_name'] or f'Net {i}'}")

                # 標記起點和終點
                ax.plot(xs[0], ys[0], 'go', markersize=8)
                ax.plot(xs[-1], ys[-1], 'ro', markersize=8)

        ax.set_xlabel('X (mm)')
        ax.set_ylabel('Y (mm)')
        ax.set_title(f'PCB Routing Result - Layer {layer}\n'
                    f'Success: {result["routed_count"]}/{result["total_connections"]} '
                    f'({result["success_rate"]*100:.1f}%)')
        ax.legend(loc='upper right', fontsize=8)
        ax.grid(True, alpha=0.3)

        plt.tight_layout()

        if show:
            plt.show()

        return fig

    def export_kicad(self, filepath: str):
        """
        匯出為 KiCAD 格式

        Args:
            filepath: 輸出檔案路徑
        """
        # TODO: 實現 KiCAD 格式匯出
        print(f"匯出 KiCAD 格式到: {filepath}")
        print("注意：KiCAD 匯出功能尚未實現")
