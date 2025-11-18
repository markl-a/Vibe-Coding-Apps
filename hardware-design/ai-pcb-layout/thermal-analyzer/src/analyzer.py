"""
PCB 熱分析器主模組
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
try:
    from .materials import MaterialDatabase
except ImportError:
    from materials import MaterialDatabase


class ThermalAnalyzer:
    """PCB 熱分析器"""

    def __init__(self, board_size: Tuple[float, float],
                 resolution: float = 1.0,
                 thickness: float = 1.6,
                 layers: int = 1):
        """
        初始化熱分析器

        Args:
            board_size: 板子尺寸 (width, height) in mm
            resolution: 網格解析度 in mm
            thickness: 板子厚度 in mm
            layers: 層數
        """
        self.board_size = board_size
        self.resolution = resolution
        self.thickness = thickness
        self.layers = layers

        # 計算網格大小
        self.grid_width = int(board_size[0] / resolution)
        self.grid_height = int(board_size[1] / resolution)

        # 初始化溫度網格
        self.temperature_grid = np.ones((self.grid_height, self.grid_width)) * 25.0

        # 功率分布網格（W/m²）
        self.power_grid = np.zeros((self.grid_height, self.grid_width))

        # 熱源列表
        self.heat_sources = []

        # 材料數據庫
        self.material_db = MaterialDatabase()

        # 邊界條件
        self.boundary_conditions = {
            'ambient_temp': 25.0,           # 環境溫度 °C
            'convection_coeff': 10.0,       # 對流係數 W/(m²·K)
            'emissivity': 0.9,              # 發射率
            'substrate_material': 'fr4'
        }

    def add_heat_source(self, x: float, y: float,
                       width: float, height: float,
                       power: float,
                       name: str = ""):
        """
        添加熱源

        Args:
            x, y: 位置 (mm)
            width, height: 尺寸 (mm)
            power: 功率 (W)
            name: 名稱
        """
        heat_source = {
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'power': power,
            'name': name or f"HS_{len(self.heat_sources)}"
        }
        self.heat_sources.append(heat_source)

        # 更新功率網格
        self._update_power_grid(heat_source)

    def _update_power_grid(self, heat_source: Dict):
        """更新功率分布網格"""
        # 轉換為網格座標
        grid_x = int(heat_source['x'] / self.resolution)
        grid_y = int(heat_source['y'] / self.resolution)
        grid_w = int(heat_source['width'] / self.resolution)
        grid_h = int(heat_source['height'] / self.resolution)

        # 計算功率密度（W/m²）
        area_m2 = (heat_source['width'] / 1000) * (heat_source['height'] / 1000)
        power_density = heat_source['power'] / area_m2 if area_m2 > 0 else 0

        # 分配到網格
        self.power_grid[grid_y:grid_y+grid_h, grid_x:grid_x+grid_w] += power_density

    def set_boundary_conditions(self, ambient_temp: float = None,
                                convection_coeff: float = None,
                                emissivity: float = None):
        """
        設定邊界條件

        Args:
            ambient_temp: 環境溫度 °C
            convection_coeff: 對流係數 W/(m²·K)
            emissivity: 發射率
        """
        if ambient_temp is not None:
            self.boundary_conditions['ambient_temp'] = ambient_temp
        if convection_coeff is not None:
            self.boundary_conditions['convection_coeff'] = convection_coeff
        if emissivity is not None:
            self.boundary_conditions['emissivity'] = emissivity

    def analyze(self, method: str = 'fdm',
                max_iterations: int = 1000,
                convergence: float = 0.01) -> Dict:
        """
        執行熱分析

        Args:
            method: 分析方法 ('fdm', 'fem', 'ml')
            max_iterations: 最大迭代次數
            convergence: 收斂標準

        Returns:
            分析結果字典
        """
        print(f"開始熱分析 (方法: {method})...")

        if method == 'fdm':
            result_temp = self._analyze_fdm(max_iterations, convergence)
        elif method == 'fem':
            print("FEM 方法尚未實現，使用 FDM 替代")
            result_temp = self._analyze_fdm(max_iterations, convergence)
        elif method == 'ml':
            result_temp = self._analyze_ml()
        else:
            raise ValueError(f"未知方法: {method}")

        # 更新溫度網格
        self.temperature_grid = result_temp

        # 計算統計資訊
        max_temp = np.max(result_temp)
        min_temp = np.min(result_temp)
        avg_temp = np.mean(result_temp)

        # 識別熱點
        hotspots = self._identify_hotspots(result_temp)

        result = {
            'temperature_grid': result_temp,
            'max_temp': max_temp,
            'min_temp': min_temp,
            'avg_temp': avg_temp,
            'hotspot_count': len(hotspots),
            'hotspots': hotspots,
            'method': method
        }

        print(f"分析完成:")
        print(f"  最高溫度: {max_temp:.1f} °C")
        print(f"  最低溫度: {min_temp:.1f} °C")
        print(f"  平均溫度: {avg_temp:.1f} °C")
        print(f"  熱點數量: {len(hotspots)}")

        return result

    def _analyze_fdm(self, max_iterations: int, convergence: float) -> np.ndarray:
        """
        使用有限差分法進行熱分析

        Args:
            max_iterations: 最大迭代次數
            convergence: 收斂標準

        Returns:
            溫度網格
        """
        try:
            from .solvers.fdm_solver import fdm_steady_state
        except ImportError:
            from solvers.fdm_solver import fdm_steady_state

        # 獲取材料屬性
        material_name = self.boundary_conditions['substrate_material']
        material = self.material_db.get_material(material_name)

        # 執行求解
        temp_grid = fdm_steady_state(
            power_grid=self.power_grid,
            initial_temp=self.boundary_conditions['ambient_temp'],
            thermal_conductivity=material['thermal_conductivity'],
            convection_coeff=self.boundary_conditions['convection_coeff'],
            ambient_temp=self.boundary_conditions['ambient_temp'],
            max_iterations=max_iterations,
            convergence=convergence,
            resolution=self.resolution
        )

        return temp_grid

    def _identify_hotspots(self, temp_grid: np.ndarray,
                          threshold: float = 60.0) -> List[Dict]:
        """
        識別熱點

        Args:
            temp_grid: 溫度網格
            threshold: 溫度閾值 °C

        Returns:
            熱點列表
        """
        hotspots = []

        # 找出高於閾值的區域
        hotspot_mask = temp_grid > threshold

        if not np.any(hotspot_mask):
            return hotspots

        # 簡單的連通域分析
        # TODO: 使用更精確的方法
        high_temp_points = np.argwhere(hotspot_mask)

        if len(high_temp_points) > 0:
            # 找出最熱的點
            max_idx = np.argmax(temp_grid)
            max_y, max_x = np.unravel_index(max_idx, temp_grid.shape)

            hotspot = {
                'x': max_x * self.resolution,
                'y': max_y * self.resolution,
                'max_temp': temp_grid[max_y, max_x],
                'area': len(high_temp_points) * self.resolution * self.resolution
            }
            hotspots.append(hotspot)

        return hotspots

    def visualize_heatmap(self, result: Dict, colormap: str = 'hot',
                         show: bool = True):
        """
        視覺化熱圖

        Args:
            result: 分析結果
            colormap: 色彩映射
            show: 是否顯示
        """
        import matplotlib.pyplot as plt

        temp_grid = result['temperature_grid']

        fig, ax = plt.subplots(figsize=(12, 10))

        # 繪製熱圖
        im = ax.imshow(temp_grid, cmap=colormap, origin='lower',
                      extent=[0, self.board_size[0], 0, self.board_size[1]],
                      vmin=result['min_temp'], vmax=result['max_temp'])

        # 添加色條
        cbar = plt.colorbar(im, ax=ax)
        cbar.set_label('Temperature (°C)', fontsize=12)

        # 標記熱源
        for hs in self.heat_sources:
            rect = plt.Rectangle(
                (hs['x'], hs['y']), hs['width'], hs['height'],
                fill=False, edgecolor='cyan', linewidth=2, linestyle='--'
            )
            ax.add_patch(rect)
            ax.text(hs['x'] + hs['width']/2, hs['y'] + hs['height']/2,
                   f"{hs['power']:.1f}W", color='cyan',
                   ha='center', va='center', fontsize=8, weight='bold')

        # 標記熱點
        for i, hp in enumerate(result['hotspots']):
            ax.plot(hp['x'], hp['y'], 'r*', markersize=15)
            ax.text(hp['x'], hp['y'] + 2, f"{hp['max_temp']:.1f}°C",
                   color='red', ha='center', fontsize=9, weight='bold')

        ax.set_xlabel('X (mm)', fontsize=12)
        ax.set_ylabel('Y (mm)', fontsize=12)
        ax.set_title(f'PCB Thermal Analysis\n'
                    f'Max: {result["max_temp"]:.1f}°C, '
                    f'Avg: {result["avg_temp"]:.1f}°C',
                    fontsize=14)
        ax.grid(True, alpha=0.3)

        plt.tight_layout()

        if show:
            plt.show()

        return fig

    def get_optimization_suggestions(self, result: Dict) -> List[Dict]:
        """
        獲取優化建議

        Args:
            result: 分析結果

        Returns:
            建議列表
        """
        suggestions = []

        max_temp = result['max_temp']

        # 溫度過高
        if max_temp > 85:
            suggestions.append({
                'type': 'critical',
                'description': '溫度超過 85°C，建議增加散熱措施',
                'improvement': (max_temp - 70)
            })

        # 熱點過多
        if result['hotspot_count'] > 3:
            suggestions.append({
                'type': 'warning',
                'description': f'發現 {result["hotspot_count"]} 個熱點，建議分散熱源',
                'improvement': 10
            })

        # 功率密度過高
        max_power_density = np.max(self.power_grid)
        if max_power_density > 10000:  # W/m²
            suggestions.append({
                'type': 'warning',
                'description': '功率密度過高，建議增加元件間距或使用散熱器',
                'improvement': 15
            })

        return suggestions

    def generate_report(self, result: Dict, output: str = 'thermal_report.txt'):
        """
        生成分析報告

        Args:
            result: 分析結果
            output: 輸出檔案名
        """
        with open(output, 'w', encoding='utf-8') as f:
            f.write("=" * 60 + "\n")
            f.write("PCB 熱分析報告\n")
            f.write("=" * 60 + "\n\n")

            f.write(f"板子尺寸: {self.board_size[0]} x {self.board_size[1]} mm\n")
            f.write(f"網格解析度: {self.resolution} mm\n")
            f.write(f"環境溫度: {self.boundary_conditions['ambient_temp']} °C\n\n")

            f.write("熱源列表:\n")
            for i, hs in enumerate(self.heat_sources):
                f.write(f"  {i+1}. {hs['name']}: {hs['power']:.2f} W "
                       f"於 ({hs['x']:.1f}, {hs['y']:.1f}) mm\n")

            f.write(f"\n分析結果:\n")
            f.write(f"  最高溫度: {result['max_temp']:.2f} °C\n")
            f.write(f"  最低溫度: {result['min_temp']:.2f} °C\n")
            f.write(f"  平均溫度: {result['avg_temp']:.2f} °C\n")
            f.write(f"  熱點數量: {result['hotspot_count']}\n\n")

            if result['hotspots']:
                f.write("熱點詳情:\n")
                for i, hp in enumerate(result['hotspots']):
                    f.write(f"  熱點 {i+1}:\n")
                    f.write(f"    位置: ({hp['x']:.1f}, {hp['y']:.1f}) mm\n")
                    f.write(f"    最高溫度: {hp['max_temp']:.2f} °C\n")
                    f.write(f"    面積: {hp['area']:.2f} mm²\n")

            suggestions = self.get_optimization_suggestions(result)
            if suggestions:
                f.write("\n優化建議:\n")
                for i, sug in enumerate(suggestions):
                    f.write(f"  {i+1}. [{sug['type'].upper()}] {sug['description']}\n")

            f.write("\n" + "=" * 60 + "\n")

        print(f"報告已生成: {output}")

    def _analyze_ml(self, model_path: str = None) -> np.ndarray:
        """
        使用機器學習進行熱分析

        Args:
            model_path: 預訓練模型路徑

        Returns:
            溫度網格
        """
        try:
            from .solvers.ml_predictor import MLThermalPredictor
        except ImportError:
            from solvers.ml_predictor import MLThermalPredictor

        # 獲取材料屬性
        material_name = self.boundary_conditions['substrate_material']
        material = self.material_db.get_material(material_name)

        # 創建預測器
        predictor = MLThermalPredictor(model_type='simple', model_path=model_path)

        # 執行預測
        temp_grid = predictor.predict(
            power_grid=self.power_grid,
            thermal_conductivity=material['thermal_conductivity'],
            convection_coeff=self.boundary_conditions['convection_coeff'],
            ambient_temp=self.boundary_conditions['ambient_temp']
        )

        return temp_grid

    def visualize_3d(self, result: Dict, elev: int = 30, azim: int = 45, show: bool = True):
        """
        3D 視覺化溫度分布

        Args:
            result: 分析結果
            elev: 仰角
            azim: 方位角
            show: 是否顯示
        """
        import matplotlib.pyplot as plt
        from mpl_toolkits.mplot3d import Axes3D

        temp_grid = result['temperature_grid']

        # 創建網格座標
        x = np.arange(0, self.board_size[0], self.resolution)
        y = np.arange(0, self.board_size[1], self.resolution)
        X, Y = np.meshgrid(x, y)

        # 創建 3D 圖
        fig = plt.figure(figsize=(14, 10))
        ax = fig.add_subplot(111, projection='3d')

        # 繪製表面
        surf = ax.plot_surface(X, Y, temp_grid, cmap='hot',
                              vmin=result['min_temp'], vmax=result['max_temp'],
                              alpha=0.9, antialiased=True)

        # 添加色條
        cbar = fig.colorbar(surf, ax=ax, shrink=0.5, aspect=5)
        cbar.set_label('Temperature (°C)', fontsize=12)

        # 設置標籤
        ax.set_xlabel('X (mm)', fontsize=12)
        ax.set_ylabel('Y (mm)', fontsize=12)
        ax.set_zlabel('Temperature (°C)', fontsize=12)
        ax.set_title(f'3D Temperature Distribution\n'
                    f'Max: {result["max_temp"]:.1f}°C',
                    fontsize=14)

        # 設置視角
        ax.view_init(elev=elev, azim=azim)

        plt.tight_layout()

        if show:
            plt.show()

        return fig

    def plot_temperature_profile(self, result: Dict, axis: str = 'x',
                                position: float = None, show: bool = True):
        """
        繪製溫度剖面圖

        Args:
            result: 分析結果
            axis: 剖面軸 ('x' 或 'y')
            position: 剖面位置 (mm)，None 表示中心
            show: 是否顯示
        """
        import matplotlib.pyplot as plt

        temp_grid = result['temperature_grid']

        if position is None:
            if axis == 'x':
                position = self.board_size[0] / 2
            else:
                position = self.board_size[1] / 2

        # 轉換為網格座標
        if axis == 'x':
            idx = int(position / self.resolution)
            idx = min(idx, temp_grid.shape[1] - 1)
            profile = temp_grid[:, idx]
            coord = np.arange(0, self.board_size[1], self.resolution)
            label_coord = 'Y (mm)'
            title = f'Temperature Profile at X = {position:.1f} mm'
        else:
            idx = int(position / self.resolution)
            idx = min(idx, temp_grid.shape[0] - 1)
            profile = temp_grid[idx, :]
            coord = np.arange(0, self.board_size[0], self.resolution)
            label_coord = 'X (mm)'
            title = f'Temperature Profile at Y = {position:.1f} mm'

        # 繪製剖面
        fig, ax = plt.subplots(figsize=(10, 6))

        ax.plot(coord[:len(profile)], profile, 'b-', linewidth=2)
        ax.fill_between(coord[:len(profile)], profile,
                        self.boundary_conditions['ambient_temp'],
                        alpha=0.3)

        ax.axhline(y=result['max_temp'], color='r', linestyle='--',
                  label=f'Max: {result["max_temp"]:.1f}°C')
        ax.axhline(y=result['avg_temp'], color='g', linestyle='--',
                  label=f'Avg: {result["avg_temp"]:.1f}°C')
        ax.axhline(y=self.boundary_conditions['ambient_temp'],
                  color='gray', linestyle=':', label='Ambient')

        ax.set_xlabel(label_coord, fontsize=12)
        ax.set_ylabel('Temperature (°C)', fontsize=12)
        ax.set_title(title, fontsize=14)
        ax.legend()
        ax.grid(True, alpha=0.3)

        plt.tight_layout()

        if show:
            plt.show()

        return fig
