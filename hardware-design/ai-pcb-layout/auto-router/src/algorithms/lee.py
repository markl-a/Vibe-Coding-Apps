"""
Lee (波前擴展) 演算法實現
"""

import numpy as np
from typing import List, Tuple, Optional
from collections import deque


class LeeRouter:
    """Lee 路由器類"""

    def __init__(self):
        """初始化 Lee 路由器"""
        pass

    def search(self, grid: np.ndarray, start: Tuple[int, int],
              goal: Tuple[int, int]) -> Optional[List[Tuple[int, int]]]:
        """
        執行 Lee 搜尋

        Args:
            grid: 網格地圖（0=空閒，1=障礙物）
            start: 起點座標 (x, y)
            goal: 終點座標 (x, y)

        Returns:
            路徑點列表，若無法找到則返回 None
        """
        return lee_router(grid, start, goal)


def lee_router(grid: np.ndarray,
               start: Tuple[int, int],
               goal: Tuple[int, int]) -> Optional[List[Tuple[int, int]]]:
    """
    Lee (波前擴展) 路由演算法

    這是一種基於廣度優先搜尋的演算法，保證找到最短路徑。
    演算法分為兩個階段：
    1. 擴展階段：從起點開始，像波浪一樣向外擴展
    2. 回溯階段：從終點回溯到起點

    Args:
        grid: 網格地圖（0=空閒，1=障礙物，2=已走線）
        start: 起點座標 (x, y)
        goal: 終點座標 (x, y)

    Returns:
        路徑點列表，若無法找到則返回 None
    """
    height, width = grid.shape

    # 檢查起點和終點是否有效
    if not (0 <= start[0] < width and 0 <= start[1] < height):
        return None
    if not (0 <= goal[0] < width and 0 <= goal[1] < height):
        return None
    if grid[start[1], start[0]] == 1 or grid[goal[1], goal[0]] == 1:
        return None

    # 距離地圖，記錄每個點到起點的距離
    # -1 表示未訪問，-2 表示障礙物
    distance_map = np.full((height, width), -1, dtype=np.int32)

    # 標記障礙物
    distance_map[grid == 1] = -2

    # 階段 1: 波前擴展
    queue = deque([start])
    distance_map[start[1], start[0]] = 0

    found = False

    while queue and not found:
        current = queue.popleft()
        current_dist = distance_map[current[1], current[0]]

        # 如果到達目標，停止擴展
        if current == goal:
            found = True
            break

        # 擴展到鄰居
        for neighbor in _get_neighbors_lee(current, width, height):
            nx, ny = neighbor

            # 如果是障礙物或已訪問，跳過
            if distance_map[ny, nx] >= 0 or distance_map[ny, nx] == -2:
                continue

            # 標記距離
            distance_map[ny, nx] = current_dist + 1
            queue.append(neighbor)

    # 如果沒有找到路徑
    if not found:
        return None

    # 階段 2: 回溯
    path = [goal]
    current = goal
    current_dist = distance_map[goal[1], goal[0]]

    while current != start:
        # 尋找距離減 1 的鄰居
        found_next = False

        for neighbor in _get_neighbors_lee(current, width, height):
            nx, ny = neighbor

            if distance_map[ny, nx] == current_dist - 1:
                path.append(neighbor)
                current = neighbor
                current_dist = distance_map[ny, nx]
                found_next = True
                break

        if not found_next:
            # 理論上不應該發生
            return None

    # 反轉路徑（從起點到終點）
    path.reverse()

    return path


def _get_neighbors_lee(node: Tuple[int, int], width: int, height: int) -> List[Tuple[int, int]]:
    """
    獲取 Lee 演算法的鄰居（僅四個方向）

    Args:
        node: 當前節點
        width: 網格寬度
        height: 網格高度

    Returns:
        鄰居列表
    """
    x, y = node

    # Lee 演算法通常只使用四個基本方向
    directions = [
        (0, 1),   # 上
        (1, 0),   # 右
        (0, -1),  # 下
        (-1, 0),  # 左
    ]

    neighbors = []

    for dx, dy in directions:
        nx, ny = x + dx, y + dy

        # 檢查邊界
        if 0 <= nx < width and 0 <= ny < height:
            neighbors.append((nx, ny))

    return neighbors


def lee_with_cost(grid: np.ndarray,
                  start: Tuple[int, int],
                  goal: Tuple[int, int],
                  cost_map: Optional[np.ndarray] = None) -> Optional[List[Tuple[int, int]]]:
    """
    帶成本的 Lee 演算法變體

    Args:
        grid: 網格地圖
        start: 起點
        goal: 終點
        cost_map: 成本地圖（可選）

    Returns:
        路徑或 None
    """
    if cost_map is None:
        cost_map = np.ones_like(grid, dtype=np.float32)

    height, width = grid.shape

    # 檢查有效性
    if not (0 <= start[0] < width and 0 <= start[1] < height):
        return None
    if not (0 <= goal[0] < width and 0 <= goal[1] < height):
        return None
    if grid[start[1], start[0]] == 1 or grid[goal[1], goal[0]] == 1:
        return None

    # 累積成本地圖
    total_cost = np.full((height, width), np.inf, dtype=np.float32)
    total_cost[start[1], start[0]] = 0

    # 前驅節點記錄
    came_from = {}

    # 優先隊列（簡化版，使用列表）
    queue = deque([start])

    while queue:
        current = queue.popleft()
        current_cost = total_cost[current[1], current[0]]

        if current == goal:
            break

        for neighbor in _get_neighbors_lee(current, width, height):
            nx, ny = neighbor

            # 障礙物
            if grid[ny, nx] == 1:
                continue

            # 計算新成本
            new_cost = current_cost + cost_map[ny, nx]

            # 如果找到更好的路徑
            if new_cost < total_cost[ny, nx]:
                total_cost[ny, nx] = new_cost
                came_from[neighbor] = current
                queue.append(neighbor)

    # 回溯路徑
    if goal not in came_from and goal != start:
        return None

    path = [goal]
    current = goal

    while current != start:
        if current not in came_from:
            return None
        current = came_from[current]
        path.append(current)

    path.reverse()
    return path


def visualize_wave_expansion(grid: np.ndarray,
                             start: Tuple[int, int],
                             goal: Tuple[int, int]):
    """
    視覺化波前擴展過程（用於除錯和教學）

    Args:
        grid: 網格
        start: 起點
        goal: 終點
    """
    import matplotlib.pyplot as plt
    import matplotlib.animation as animation

    height, width = grid.shape
    distance_map = np.full((height, width), -1, dtype=np.int32)
    distance_map[grid == 1] = -2
    distance_map[start[1], start[0]] = 0

    queue = deque([start])
    frames = []

    while queue:
        # 記錄當前狀態
        frame = distance_map.copy()
        frames.append(frame)

        # 一次處理一層
        level_size = len(queue)
        for _ in range(level_size):
            current = queue.popleft()
            current_dist = distance_map[current[1], current[0]]

            if current == goal:
                queue.clear()
                break

            for neighbor in _get_neighbors_lee(current, width, height):
                nx, ny = neighbor

                if distance_map[ny, nx] >= 0 or distance_map[ny, nx] == -2:
                    continue

                distance_map[ny, nx] = current_dist + 1
                queue.append(neighbor)

    # 創建動畫
    fig, ax = plt.subplots(figsize=(10, 8))

    def update(frame_num):
        ax.clear()
        ax.imshow(frames[frame_num], cmap='viridis', origin='lower')
        ax.set_title(f'Lee 演算法波前擴展 - 步驟 {frame_num + 1}/{len(frames)}')
        ax.plot(start[0], start[1], 'go', markersize=15, label='起點')
        ax.plot(goal[0], goal[1], 'ro', markersize=15, label='終點')
        ax.legend()

    ani = animation.FuncAnimation(fig, update, frames=len(frames), interval=200, repeat=True)

    plt.show()

    return ani
