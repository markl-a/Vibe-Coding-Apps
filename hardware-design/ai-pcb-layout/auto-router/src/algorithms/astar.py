"""
A* 路徑搜尋演算法實現
"""

import numpy as np
from typing import List, Tuple, Optional, Callable
from queue import PriorityQueue
import math


def manhattan_distance(p1: Tuple[int, int], p2: Tuple[int, int]) -> float:
    """曼哈頓距離啟發函數"""
    return abs(p1[0] - p2[0]) + abs(p1[1] - p2[1])


def euclidean_distance(p1: Tuple[int, int], p2: Tuple[int, int]) -> float:
    """歐幾里得距離啟發函數"""
    dx = p1[0] - p2[0]
    dy = p1[1] - p2[1]
    return math.sqrt(dx * dx + dy * dy)


def chebyshev_distance(p1: Tuple[int, int], p2: Tuple[int, int]) -> float:
    """切比雪夫距離啟發函數"""
    return max(abs(p1[0] - p2[0]), abs(p1[1] - p2[1]))


class AStarRouter:
    """A* 路由器類"""

    def __init__(self, heuristic: str = 'manhattan', diagonal: bool = False):
        """
        初始化 A* 路由器

        Args:
            heuristic: 啟發函數類型 ('manhattan', 'euclidean', 'chebyshev')
            diagonal: 是否允許對角移動
        """
        self.diagonal = diagonal

        # 選擇啟發函數
        if heuristic == 'manhattan':
            self.heuristic_fn = manhattan_distance
        elif heuristic == 'euclidean':
            self.heuristic_fn = euclidean_distance
        elif heuristic == 'chebyshev':
            self.heuristic_fn = chebyshev_distance
        else:
            raise ValueError(f"未知啟發函數: {heuristic}")

    def search(self, grid: np.ndarray, start: Tuple[int, int],
              goal: Tuple[int, int]) -> Optional[List[Tuple[int, int]]]:
        """
        執行 A* 搜尋

        Args:
            grid: 網格地圖（0=空閒，1=障礙物）
            start: 起點座標 (x, y)
            goal: 終點座標 (x, y)

        Returns:
            路徑點列表，若無法找到則返回 None
        """
        return astar_search(grid, start, goal,
                          heuristic=self.heuristic_fn,
                          diagonal=self.diagonal)


def astar_search(grid: np.ndarray,
                start: Tuple[int, int],
                goal: Tuple[int, int],
                heuristic: Callable = None,
                diagonal: bool = False) -> Optional[List[Tuple[int, int]]]:
    """
    A* 路徑搜尋演算法

    Args:
        grid: 網格地圖（0=空閒，1=障礙物，2=已走線）
        start: 起點座標 (x, y)
        goal: 終點座標 (x, y)
        heuristic: 啟發函數
        diagonal: 是否允許對角移動

    Returns:
        路徑點列表，若無法找到則返回 None
    """
    if heuristic is None:
        heuristic = manhattan_distance

    height, width = grid.shape

    # 檢查起點和終點是否有效
    if not (0 <= start[0] < width and 0 <= start[1] < height):
        return None
    if not (0 <= goal[0] < width and 0 <= goal[1] < height):
        return None
    if grid[start[1], start[0]] == 1 or grid[goal[1], goal[0]] == 1:
        return None

    # 優先隊列：(f_score, counter, node)
    # counter 用於打破平手
    counter = 0
    open_set = PriorityQueue()
    open_set.put((0, counter, start))
    counter += 1

    # 記錄路徑
    came_from = {}

    # g_score: 從起點到節點的實際成本
    g_score = {start: 0}

    # f_score: g_score + heuristic
    f_score = {start: heuristic(start, goal)}

    # 用於快速檢查節點是否在 open_set 中
    open_set_hash = {start}

    while not open_set.empty():
        current_f, _, current = open_set.get()
        open_set_hash.discard(current)

        # 到達目標
        if current == goal:
            return _reconstruct_path(came_from, current)

        # 探索鄰居
        for neighbor in _get_neighbors(current, grid, diagonal):
            # 計算到鄰居的成本
            # 對角移動成本為 sqrt(2) ≈ 1.414
            if diagonal and abs(neighbor[0] - current[0]) + abs(neighbor[1] - current[1]) == 2:
                move_cost = 1.414
            else:
                move_cost = 1.0

            # 如果鄰居是已走線，增加成本以避免交叉
            if grid[neighbor[1], neighbor[0]] == 2:
                move_cost += 5.0

            tentative_g = g_score[current] + move_cost

            # 找到更好的路徑
            if neighbor not in g_score or tentative_g < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f = tentative_g + heuristic(neighbor, goal)
                f_score[neighbor] = f

                if neighbor not in open_set_hash:
                    open_set.put((f, counter, neighbor))
                    counter += 1
                    open_set_hash.add(neighbor)

    # 無法找到路徑
    return None


def _get_neighbors(node: Tuple[int, int], grid: np.ndarray,
                   diagonal: bool = False) -> List[Tuple[int, int]]:
    """
    獲取節點的鄰居

    Args:
        node: 當前節點
        grid: 網格
        diagonal: 是否包含對角鄰居

    Returns:
        鄰居列表
    """
    x, y = node
    height, width = grid.shape

    # 四個基本方向
    directions = [
        (0, 1),   # 上
        (1, 0),   # 右
        (0, -1),  # 下
        (-1, 0),  # 左
    ]

    # 如果允許對角移動，添加四個對角方向
    if diagonal:
        directions.extend([
            (1, 1),   # 右上
            (1, -1),  # 右下
            (-1, -1), # 左下
            (-1, 1),  # 左上
        ])

    neighbors = []

    for dx, dy in directions:
        nx, ny = x + dx, y + dy

        # 檢查邊界
        if not (0 <= nx < width and 0 <= ny < height):
            continue

        # 檢查是否是障礙物
        if grid[ny, nx] == 1:
            continue

        # 對角移動時，檢查是否會穿過牆角
        if diagonal and abs(dx) + abs(dy) == 2:
            # 檢查兩個相鄰的直線方向是否都是空的
            if grid[y + dy, x] == 1 or grid[y, x + dx] == 1:
                continue

        neighbors.append((nx, ny))

    return neighbors


def _reconstruct_path(came_from: dict, current: Tuple[int, int]) -> List[Tuple[int, int]]:
    """
    重建路徑

    Args:
        came_from: 路徑記錄字典
        current: 當前節點（終點）

    Returns:
        從起點到終點的路徑
    """
    path = [current]

    while current in came_from:
        current = came_from[current]
        path.append(current)

    path.reverse()
    return path


def optimize_path(path: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
    """
    優化路徑，移除不必要的節點

    Args:
        path: 原始路徑

    Returns:
        優化後的路徑
    """
    if len(path) <= 2:
        return path

    optimized = [path[0]]

    for i in range(1, len(path) - 1):
        prev = path[i - 1]
        current = path[i]
        next_point = path[i + 1]

        # 檢查是否在同一條直線上
        dx1 = current[0] - prev[0]
        dy1 = current[1] - prev[1]
        dx2 = next_point[0] - current[0]
        dy2 = next_point[1] - current[1]

        # 如果方向改變，保留這個點
        if dx1 != dx2 or dy1 != dy2:
            optimized.append(current)

    optimized.append(path[-1])

    return optimized
