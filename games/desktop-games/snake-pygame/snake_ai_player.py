#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
貪吃蛇 AI 自動玩家
使用 A* 尋路算法和安全策略
"""

import pygame
from collections import deque
from enum import Enum
import heapq


class Direction(Enum):
    """方向枚舉"""
    UP = (0, -1)
    DOWN = (0, 1)
    LEFT = (-1, 0)
    RIGHT = (1, 0)


class SnakeAI:
    """貪吃蛇 AI 玩家"""

    def __init__(self, grid_width, grid_height):
        """初始化 AI"""
        self.grid_width = grid_width
        self.grid_height = grid_height
        self.path = []
        self.show_path = False

    def get_next_direction(self, snake_body, food_position, current_direction):
        """
        獲取下一步移動方向

        Args:
            snake_body: 蛇身體列表 [(x, y), ...]
            food_position: 食物位置 (x, y)
            current_direction: 當前移動方向

        Returns:
            Direction: 下一步移動方向
        """
        head = snake_body[0]

        # 嘗試找到通往食物的安全路徑
        path = self._find_path_to_food(snake_body, food_position)

        if path and len(path) > 1:
            # 如果找到路徑且足夠安全，沿著路徑移動
            self.path = path
            next_pos = path[1]
            dx = next_pos[0] - head[0]
            dy = next_pos[1] - head[1]

            if dx == 1:
                return Direction.RIGHT
            elif dx == -1:
                return Direction.LEFT
            elif dy == 1:
                return Direction.DOWN
            elif dy == -1:
                return Direction.UP

        # 如果找不到安全路徑到食物，使用生存策略
        return self._survival_strategy(snake_body, current_direction)

    def _find_path_to_food(self, snake_body, food_position):
        """
        使用 A* 算法找到通往食物的路徑

        Returns:
            list: 路徑列表 [(x, y), ...] 或 None
        """
        head = snake_body[0]
        snake_set = set(snake_body)

        # A* 算法
        open_set = []
        heapq.heappush(open_set, (0, head))
        came_from = {}
        g_score = {head: 0}
        f_score = {head: self._heuristic(head, food_position)}

        while open_set:
            current = heapq.heappop(open_set)[1]

            # 找到食物
            if current == food_position:
                path = self._reconstruct_path(came_from, current)

                # 檢查吃到食物後是否還有逃生路線
                if self._check_path_safety(path, snake_body):
                    return path
                else:
                    return None

            # 探索鄰居
            for direction in [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT]:
                dx, dy = direction.value
                neighbor = (current[0] + dx, current[1] + dy)

                # 檢查是否超出邊界或碰到蛇身
                if not self._is_valid_position(neighbor, snake_set):
                    continue

                tentative_g_score = g_score[current] + 1

                if neighbor not in g_score or tentative_g_score < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g_score
                    f_score[neighbor] = tentative_g_score + self._heuristic(neighbor, food_position)
                    heapq.heappush(open_set, (f_score[neighbor], neighbor))

        return None

    def _heuristic(self, pos1, pos2):
        """曼哈頓距離啟發式函數"""
        return abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1])

    def _is_valid_position(self, pos, snake_set):
        """檢查位置是否有效"""
        x, y = pos

        # 檢查邊界
        if x < 0 or x >= self.grid_width or y < 0 or y >= self.grid_height:
            return False

        # 檢查是否碰到蛇身（排除尾部，因為尾部會移動）
        if pos in snake_set:
            return False

        return True

    def _reconstruct_path(self, came_from, current):
        """重建路徑"""
        path = [current]
        while current in came_from:
            current = came_from[current]
            path.append(current)
        path.reverse()
        return path

    def _check_path_safety(self, path, snake_body):
        """
        檢查路徑安全性
        確保吃到食物後還有足夠的空間移動
        """
        if not path or len(path) < 2:
            return False

        # 模擬吃到食物後的蛇身
        simulated_snake = list(snake_body)
        simulated_snake.insert(0, path[-1])  # 添加新頭部（食物位置）

        # 檢查是否還有逃生空間
        head = simulated_snake[0]
        accessible_cells = self._count_accessible_cells(head, set(simulated_snake))

        # 需要至少能訪問到蛇身長度的格子
        return accessible_cells >= len(simulated_snake)

    def _count_accessible_cells(self, start, obstacles):
        """計算從起點可訪問的格子數（BFS）"""
        visited = {start}
        queue = deque([start])
        count = 1

        while queue:
            current = queue.popleft()

            for direction in [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT]:
                dx, dy = direction.value
                neighbor = (current[0] + dx, current[1] + dy)

                if neighbor in visited:
                    continue

                if not self._is_valid_position(neighbor, obstacles):
                    continue

                visited.add(neighbor)
                queue.append(neighbor)
                count += 1

        return count

    def _survival_strategy(self, snake_body, current_direction):
        """
        生存策略：當找不到安全路徑到食物時
        嘗試跟隨自己的尾巴，保持存活
        """
        head = snake_body[0]
        snake_set = set(snake_body)

        # 獲取所有可能的方向
        possible_directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT]

        # 過濾掉會立即導致死亡的方向
        safe_directions = []
        for direction in possible_directions:
            dx, dy = direction.value
            new_pos = (head[0] + dx, head[1] + dy)

            if self._is_valid_position(new_pos, snake_set):
                # 計算這個方向的可訪問格子數
                temp_snake = list(snake_body)
                temp_snake.insert(0, new_pos)
                if len(temp_snake) > len(snake_body):
                    temp_snake.pop()

                accessible = self._count_accessible_cells(new_pos, set(temp_snake))
                safe_directions.append((accessible, direction))

        if safe_directions:
            # 選擇可訪問格子最多的方向
            safe_directions.sort(reverse=True)
            return safe_directions[0][1]

        # 如果所有方向都不安全，保持當前方向
        return current_direction

    def draw_path(self, screen, grid_size):
        """
        繪製 AI 的移動路徑

        Args:
            screen: Pygame screen
            grid_size: 格子大小
        """
        if not self.show_path or not self.path:
            return

        # 繪製路徑
        for i, pos in enumerate(self.path):
            x, y = pos
            alpha = int(255 * (i / len(self.path)))  # 漸變透明度

            # 繪製路徑點
            surface = pygame.Surface((grid_size - 4, grid_size - 4))
            surface.set_alpha(alpha)
            surface.fill((255, 255, 0))  # 黃色路徑
            screen.blit(surface, (x * grid_size + 2, y * grid_size + 2))

        # 繪製路徑線條
        if len(self.path) > 1:
            points = [(pos[0] * grid_size + grid_size // 2,
                      pos[1] * grid_size + grid_size // 2) for pos in self.path]
            pygame.draw.lines(screen, (255, 255, 0), False, points, 2)


def integrate_ai_into_game(game):
    """
    將 AI 功能整合到遊戲中的輔助函數

    Args:
        game: Game 實例

    Usage:
        from snake_ai_player import integrate_ai_into_game
        integrate_ai_into_game(game)
    """
    # 創建 AI 實例
    game.ai_player = SnakeAI(game.GRID_WIDTH, game.GRID_HEIGHT)
    game.ai_enabled = False
    game.show_ai_path = False

    # 保存原始的 handle_events 方法
    original_handle_events = game.handle_events

    def new_handle_events():
        """增強的事件處理"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    return False

                # AI 控制開關（按 'A' 鍵）
                if event.key == pygame.K_a:
                    game.ai_enabled = not game.ai_enabled
                    print(f"AI {'啟用' if game.ai_enabled else '停用'}")

                # 路徑顯示開關（按 'V' 鍵）
                if event.key == pygame.K_v:
                    game.show_ai_path = not game.show_ai_path
                    game.ai_player.show_path = game.show_ai_path
                    print(f"路徑顯示 {'開啟' if game.show_ai_path else '關閉'}")

                # 其他原始按鍵處理
                # ...

        return original_handle_events()

    game.handle_events = new_handle_events
