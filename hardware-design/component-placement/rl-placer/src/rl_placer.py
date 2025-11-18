"""
強化學習元件擺放器實作
使用 PPO (Proximal Policy Optimization) 演算法
"""

import numpy as np
import gymnasium as gym
from gymnasium import spaces
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import math


@dataclass
class Component:
    """元件資料類別"""
    name: str
    size: Tuple[float, float]  # (width, height) in mm
    position: Optional[Tuple[float, float]] = None
    is_placed: bool = False


@dataclass
class Connection:
    """連接資料類別"""
    comp1: str
    comp2: str
    weight: float = 1.0


class PlacementEnv(gym.Env):
    """
    元件擺放 Gym 環境

    狀態空間：
    - 板子佔用網格 (grid_h × grid_w)
    - 未擺放元件特徵
    - 已擺放元件位置

    動作空間：
    - 連續動作：(x_ratio, y_ratio) ∈ [0, 1]²

    獎勵：
    - 成功擺放：-wire_length (連線長度越短越好)
    - 重疊懲罰：-1000
    - 超出邊界：-1000
    """

    metadata = {'render_modes': ['human']}

    def __init__(self, components: Dict[str, Component],
                 connections: List[Connection],
                 board_size: Tuple[float, float] = (100, 80),
                 grid_resolution: float = 1.0):
        """
        初始化環境

        Args:
            components: 元件字典
            connections: 連接列表
            board_size: 板子大小 (width, height) in mm
            grid_resolution: 網格解析度 (mm per cell)
        """
        super().__init__()

        self.board_size = board_size
        self.grid_resolution = grid_resolution
        self.grid_width = int(board_size[0] / grid_resolution)
        self.grid_height = int(board_size[1] / grid_resolution)

        # 初始化元件和連接
        self.components_template = components
        self.connections = connections
        self.components: Dict[str, Component] = {}
        self.component_list = list(components.keys())
        self.num_components = len(self.component_list)

        # 定義動作空間：連續的 (x, y) 位置比例
        self.action_space = spaces.Box(
            low=np.array([0.0, 0.0]),
            high=np.array([1.0, 1.0]),
            dtype=np.float32
        )

        # 定義觀察空間
        # [佔用網格, 當前元件特徵, 已擺放元件數量]
        obs_dim = self.grid_height * self.grid_width + 4 + 1
        self.observation_space = spaces.Box(
            low=0.0, high=1.0,
            shape=(obs_dim,),
            dtype=np.float32
        )

        self.current_step = 0
        self.max_steps = self.num_components
        self.occupancy_grid = None

    def reset(self, seed: Optional[int] = None, options: Optional[dict] = None):
        """重置環境"""
        super().reset(seed=seed)

        # 重置元件
        self.components = {
            name: Component(comp.name, comp.size)
            for name, comp in self.components_template.items()
        }

        # 重置網格
        self.occupancy_grid = np.zeros((self.grid_height, self.grid_width), dtype=np.float32)

        self.current_step = 0
        self.placed_components = []

        obs = self._get_observation()
        info = {'step': self.current_step}

        return obs, info

    def _get_current_component(self) -> Optional[Component]:
        """獲取當前要擺放的元件"""
        if self.current_step < self.num_components:
            comp_name = self.component_list[self.current_step]
            return self.components[comp_name]
        return None

    def _get_observation(self) -> np.ndarray:
        """
        獲取當前觀察

        Returns:
            觀察向量
        """
        # 佔用網格（攤平）
        grid_flat = self.occupancy_grid.flatten()

        # 當前元件特徵
        current_comp = self._get_current_component()
        if current_comp:
            comp_features = np.array([
                current_comp.size[0] / self.board_size[0],  # 寬度比例
                current_comp.size[1] / self.board_size[1],  # 高度比例
                self.current_step / self.num_components,    # 進度
                len(self.placed_components) / self.num_components  # 已擺放比例
            ], dtype=np.float32)
        else:
            comp_features = np.zeros(4, dtype=np.float32)

        # 已擺放元件數量
        placed_ratio = np.array([len(self.placed_components) / self.num_components], dtype=np.float32)

        obs = np.concatenate([grid_flat, comp_features, placed_ratio])

        return obs

    def _is_valid_position(self, comp: Component, position: Tuple[float, float]) -> bool:
        """檢查位置是否有效"""
        x, y = position
        w, h = comp.size

        # 檢查邊界
        if x < 0 or y < 0 or x + w > self.board_size[0] or y + h > self.board_size[1]:
            return False

        # 轉換為網格座標
        gx = int(x / self.grid_resolution)
        gy = int(y / self.grid_resolution)
        gw = max(1, int(np.ceil(w / self.grid_resolution)))
        gh = max(1, int(np.ceil(h / self.grid_resolution)))

        # 確保不超出網格邊界
        if gx + gw > self.grid_width or gy + gh > self.grid_height:
            return False

        # 檢查重疊
        if np.any(self.occupancy_grid[gy:gy+gh, gx:gx+gw] > 0):
            return False

        return True

    def _place_component(self, comp: Component, position: Tuple[float, float]):
        """擺放元件"""
        x, y = position
        w, h = comp.size

        comp.position = position
        comp.is_placed = True

        # 更新佔用網格
        gx = int(x / self.grid_resolution)
        gy = int(y / self.grid_resolution)
        gw = max(1, int(np.ceil(w / self.grid_resolution)))
        gh = max(1, int(np.ceil(h / self.grid_resolution)))

        self.occupancy_grid[gy:gy+gh, gx:gx+gw] = 1.0
        self.placed_components.append(comp.name)

    def _calculate_wire_length(self) -> float:
        """計算當前的總連線長度"""
        total_length = 0.0

        for conn in self.connections:
            comp1 = self.components[conn.comp1]
            comp2 = self.components[conn.comp2]

            if comp1.is_placed and comp2.is_placed:
                x1 = comp1.position[0] + comp1.size[0] / 2
                y1 = comp1.position[1] + comp1.size[1] / 2
                x2 = comp2.position[0] + comp2.size[0] / 2
                y2 = comp2.position[1] + comp2.size[1] / 2

                distance = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                total_length += distance * conn.weight

        return total_length

    def step(self, action: np.ndarray):
        """
        執行一步動作

        Args:
            action: [x_ratio, y_ratio] ∈ [0, 1]²

        Returns:
            observation, reward, terminated, truncated, info
        """
        current_comp = self._get_current_component()

        if current_comp is None:
            # 所有元件已擺放
            obs = self._get_observation()
            return obs, 0.0, True, False, {'message': 'All components placed'}

        # 將動作轉換為實際座標
        x_ratio, y_ratio = np.clip(action, 0.0, 1.0)

        max_x = self.board_size[0] - current_comp.size[0]
        max_y = self.board_size[1] - current_comp.size[1]

        x = x_ratio * max(0, max_x)
        y = y_ratio * max(0, max_y)

        position = (x, y)

        # 檢查位置是否有效
        valid = self._is_valid_position(current_comp, position)

        if valid:
            # 擺放元件
            self._place_component(current_comp, position)

            # 計算獎勵
            wire_length = self._calculate_wire_length()

            # 獎勵 = -連線長度（越短越好）+ 成功擺放獎勵
            reward = -wire_length / 100.0 + 10.0

            self.current_step += 1

            # 檢查是否完成
            terminated = (self.current_step >= self.num_components)

            if terminated:
                # 額外的完成獎勵
                reward += 50.0

            info = {
                'valid_placement': True,
                'wire_length': wire_length,
                'components_placed': len(self.placed_components)
            }
        else:
            # 無效擺放，給予懲罰
            reward = -100.0

            # 嘗試隨機擺放
            max_attempts = 50
            placed = False

            for _ in range(max_attempts):
                rand_x = np.random.uniform(0, max(0, max_x))
                rand_y = np.random.uniform(0, max(0, max_y))
                rand_pos = (rand_x, rand_y)

                if self._is_valid_position(current_comp, rand_pos):
                    self._place_component(current_comp, rand_pos)
                    placed = True
                    break

            if not placed:
                # 無法擺放，強制結束
                terminated = True
                reward = -1000.0
                info = {'valid_placement': False, 'forced_termination': True}
            else:
                self.current_step += 1
                terminated = (self.current_step >= self.num_components)
                info = {'valid_placement': False, 'random_placement': True}

        obs = self._get_observation()
        truncated = False

        return obs, reward, terminated, truncated, info

    def render(self):
        """渲染環境（可選）"""
        if self.current_step == 0:
            return

        print(f"\n=== Step {self.current_step}/{self.num_components} ===")
        print(f"Placed components: {len(self.placed_components)}")

        if len(self.placed_components) > 0:
            wire_length = self._calculate_wire_length()
            print(f"Current wire length: {wire_length:.2f} mm")


class RLComponentPlacer:
    """強化學習元件擺放器"""

    def __init__(self, board_size: Tuple[float, float] = (100, 80),
                 grid_resolution: float = 1.0):
        """
        初始化 RL 擺放器

        Args:
            board_size: 板子大小 (width, height) in mm
            grid_resolution: 網格解析度
        """
        self.board_size = board_size
        self.grid_resolution = grid_resolution
        self.components: Dict[str, Component] = {}
        self.connections: List[Connection] = []
        self.model = None
        self.env = None

    def add_component(self, name: str, size: Tuple[float, float]):
        """添加元件"""
        self.components[name] = Component(name, size)

    def add_connection(self, comp1: str, comp2: str, weight: float = 1.0):
        """添加連接"""
        self.connections.append(Connection(comp1, comp2, weight))

    def train(self, total_timesteps: int = 50000, verbose: bool = True) -> Dict[str, Any]:
        """
        訓練 RL 模型

        Args:
            total_timesteps: 訓練總步數
            verbose: 是否顯示訓練進度

        Returns:
            訓練結果字典
        """
        try:
            from stable_baselines3 import PPO
            from stable_baselines3.common.env_checker import check_env
        except ImportError:
            print("錯誤: 需要安裝 stable-baselines3")
            print("請執行: pip install stable-baselines3")
            return {'error': 'stable-baselines3 not installed'}

        # 創建環境
        self.env = PlacementEnv(
            self.components,
            self.connections,
            self.board_size,
            self.grid_resolution
        )

        if verbose:
            print("檢查環境...")
            try:
                check_env(self.env)
                print("✓ 環境檢查通過")
            except Exception as e:
                print(f"⚠ 環境檢查警告: {e}")

        if verbose:
            print(f"\n開始訓練 PPO 模型...")
            print(f"總訓練步數: {total_timesteps}")
            print(f"元件數量: {len(self.components)}")
            print(f"連接數量: {len(self.connections)}")

        # 創建 PPO 模型
        self.model = PPO(
            "MlpPolicy",
            self.env,
            verbose=1 if verbose else 0,
            learning_rate=3e-4,
            n_steps=2048,
            batch_size=64,
            n_epochs=10,
            gamma=0.99,
            gae_lambda=0.95,
            clip_range=0.2,
            ent_coef=0.01,
        )

        # 訓練模型
        self.model.learn(total_timesteps=total_timesteps)

        if verbose:
            print("\n✓ 訓練完成！")

        return {
            'total_timesteps': total_timesteps,
            'model_type': 'PPO',
            'status': 'success'
        }

    def optimize(self, use_trained_model: bool = True) -> Dict[str, Any]:
        """
        使用訓練好的模型進行優化

        Args:
            use_trained_model: 是否使用訓練好的模型

        Returns:
            優化結果字典
        """
        if use_trained_model and self.model is None:
            print("錯誤: 模型尚未訓練，請先調用 train() 方法")
            return {'error': 'model not trained'}

        # 創建新環境進行測試
        test_env = PlacementEnv(
            self.components,
            self.connections,
            self.board_size,
            self.grid_resolution
        )

        obs, info = test_env.reset()
        total_reward = 0.0
        done = False

        while not done:
            if use_trained_model and self.model:
                action, _states = self.model.predict(obs, deterministic=True)
            else:
                # 隨機動作
                action = test_env.action_space.sample()

            obs, reward, terminated, truncated, info = test_env.step(action)
            total_reward += reward
            done = terminated or truncated

        # 提取佈局
        layout = {}
        for name, comp in test_env.components.items():
            if comp.is_placed:
                layout[name] = comp.position

        wire_length = test_env._calculate_wire_length()

        return {
            'layout': layout,
            'cost': wire_length,
            'total_reward': total_reward,
            'components_placed': len(layout),
            'method': 'RL-PPO' if use_trained_model else 'Random'
        }

    def save_model(self, filepath: str):
        """儲存訓練好的模型"""
        if self.model is None:
            print("錯誤: 模型尚未訓練")
            return

        self.model.save(filepath)
        print(f"模型已儲存到: {filepath}")

    def load_model(self, filepath: str):
        """載入訓練好的模型"""
        try:
            from stable_baselines3 import PPO
        except ImportError:
            print("錯誤: 需要安裝 stable-baselines3")
            return

        self.model = PPO.load(filepath)
        print(f"模型已從 {filepath} 載入")

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

                ax.add_patch(patches.Rectangle(
                    (x, y), w, h,
                    facecolor=colors[i], edgecolor='black', alpha=0.7
                ))

                ax.text(x + w/2, y + h/2, name,
                       ha='center', va='center', fontsize=8, fontweight='bold')

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

                    ax.plot([x1, x2], [y1, y2], 'b--', alpha=0.3, linewidth=1)

            ax.set_xlim(-5, self.board_size[0] + 5)
            ax.set_ylim(-5, self.board_size[1] + 5)
            ax.set_aspect('equal')
            ax.set_xlabel('X (mm)')
            ax.set_ylabel('Y (mm)')
            ax.set_title(f'RL-PPO 元件擺放結果\n總成本: {result["cost"]:.2f}')
            ax.grid(True, alpha=0.3)

            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                print(f"圖片已儲存到: {save_path}")
            else:
                plt.show()

            plt.close()

        except ImportError:
            print("需要安裝 matplotlib 才能視覺化結果")
