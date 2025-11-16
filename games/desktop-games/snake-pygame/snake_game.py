#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
貪吃蛇遊戲 - Snake Game
使用 Pygame 開發的經典貪吃蛇遊戲
"""

import pygame
import random
import sys
from enum import Enum
from collections import deque

# 初始化 Pygame
pygame.init()

# 遊戲常量
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
GRID_SIZE = 20
GRID_WIDTH = WINDOW_WIDTH // GRID_SIZE
GRID_HEIGHT = WINDOW_HEIGHT // GRID_SIZE

# 顏色定義 (RGB)
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (231, 76, 60)
GREEN = (46, 204, 113)
BLUE = (52, 152, 219)
YELLOW = (241, 196, 15)
PURPLE = (155, 89, 182)
GRAY = (149, 165, 166)
DARK_GRAY = (52, 73, 94)

# 遊戲設定
FPS = 10
INITIAL_SPEED = 10

class Direction(Enum):
    """方向枚舉"""
    UP = (0, -1)
    DOWN = (0, 1)
    LEFT = (-1, 0)
    RIGHT = (1, 0)

class Snake:
    """蛇類"""
    def __init__(self):
        """初始化蛇"""
        self.reset()

    def reset(self):
        """重置蛇的狀態"""
        # 初始位置在屏幕中央
        start_x = GRID_WIDTH // 2
        start_y = GRID_HEIGHT // 2

        # 蛇身體(使用雙端隊列以提高性能)
        self.body = deque([
            (start_x, start_y),
            (start_x - 1, start_y),
            (start_x - 2, start_y)
        ])

        # 初始方向向右
        self.direction = Direction.RIGHT
        self.next_direction = Direction.RIGHT
        self.grow_pending = 0

    def get_head(self):
        """獲取蛇頭位置"""
        return self.body[0]

    def change_direction(self, new_direction):
        """改變方向(防止反向移動)"""
        # 防止蛇反向移動
        opposite = {
            Direction.UP: Direction.DOWN,
            Direction.DOWN: Direction.UP,
            Direction.LEFT: Direction.RIGHT,
            Direction.RIGHT: Direction.LEFT
        }

        if new_direction != opposite[self.direction]:
            self.next_direction = new_direction

    def move(self):
        """移動蛇"""
        self.direction = self.next_direction
        head_x, head_y = self.get_head()
        dx, dy = self.direction.value

        # 計算新的頭部位置
        new_head = (head_x + dx, head_y + dy)

        # 添加新頭部
        self.body.appendleft(new_head)

        # 如果需要生長,不移除尾部
        if self.grow_pending > 0:
            self.grow_pending -= 1
        else:
            self.body.pop()

    def grow(self, amount=1):
        """蛇生長"""
        self.grow_pending += amount

    def check_collision(self):
        """檢查碰撞"""
        head_x, head_y = self.get_head()

        # 檢查是否撞牆
        if head_x < 0 or head_x >= GRID_WIDTH or head_y < 0 or head_y >= GRID_HEIGHT:
            return True

        # 檢查是否撞到自己
        if self.get_head() in list(self.body)[1:]:
            return True

        return False

class Food:
    """食物類"""
    def __init__(self):
        """初始化食物"""
        self.position = (0, 0)
        self.type = 'normal'

    def spawn(self, snake_body):
        """生成食物(避免在蛇身上)"""
        while True:
            x = random.randint(0, GRID_WIDTH - 1)
            y = random.randint(0, GRID_HEIGHT - 1)
            position = (x, y)

            if position not in snake_body:
                self.position = position

                # 10% 機率生成特殊食物
                self.type = 'special' if random.random() < 0.1 else 'normal'
                break

    def get_value(self):
        """獲取食物分數"""
        return 50 if self.type == 'special' else 10

    def get_color(self):
        """獲取食物顏色"""
        return YELLOW if self.type == 'special' else RED

class Game:
    """遊戲主類"""
    def __init__(self):
        """初始化遊戲"""
        # 創建窗口
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption('貪吃蛇 - Snake Game')

        # 時鐘
        self.clock = pygame.time.Clock()

        # 字體
        self.font_large = pygame.font.Font(None, 72)
        self.font_medium = pygame.font.Font(None, 36)
        self.font_small = pygame.font.Font(None, 24)

        # 遊戲對象
        self.snake = Snake()
        self.food = Food()

        # 遊戲狀態
        self.score = 0
        self.high_score = 0
        self.game_over = False
        self.paused = False

        # 生成第一個食物
        self.food.spawn(self.snake.body)

    def handle_events(self):
        """處理事件"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    return False

                # 遊戲結束時重新開始
                if self.game_over:
                    if event.key == pygame.K_SPACE:
                        self.reset_game()
                    continue

                # 暫停
                if event.key == pygame.K_p:
                    self.paused = not self.paused
                    continue

                # 方向控制
                if not self.paused:
                    if event.key == pygame.K_UP or event.key == pygame.K_w:
                        self.snake.change_direction(Direction.UP)
                    elif event.key == pygame.K_DOWN or event.key == pygame.K_s:
                        self.snake.change_direction(Direction.DOWN)
                    elif event.key == pygame.K_LEFT or event.key == pygame.K_a:
                        self.snake.change_direction(Direction.LEFT)
                    elif event.key == pygame.K_RIGHT or event.key == pygame.K_d:
                        self.snake.change_direction(Direction.RIGHT)

        return True

    def update(self):
        """更新遊戲邏輯"""
        if self.game_over or self.paused:
            return

        # 移動蛇
        self.snake.move()

        # 檢查碰撞
        if self.snake.check_collision():
            self.game_over = True
            if self.score > self.high_score:
                self.high_score = self.score
            return

        # 檢查是否吃到食物
        if self.snake.get_head() == self.food.position:
            self.snake.grow()
            self.score += self.food.get_value()
            self.food.spawn(self.snake.body)

    def draw(self):
        """繪製遊戲畫面"""
        # 背景
        self.screen.fill(DARK_GRAY)

        # 繪製網格線(可選)
        self.draw_grid()

        # 繪製食物
        self.draw_food()

        # 繪製蛇
        self.draw_snake()

        # 繪製UI
        self.draw_ui()

        # 遊戲結束畫面
        if self.game_over:
            self.draw_game_over()

        # 暫停畫面
        if self.paused:
            self.draw_paused()

        pygame.display.flip()

    def draw_grid(self):
        """繪製網格"""
        for x in range(0, WINDOW_WIDTH, GRID_SIZE):
            pygame.draw.line(self.screen, GRAY, (x, 0), (x, WINDOW_HEIGHT), 1)
        for y in range(0, WINDOW_HEIGHT, GRID_SIZE):
            pygame.draw.line(self.screen, GRAY, (0, y), (WINDOW_WIDTH, y), 1)

    def draw_snake(self):
        """繪製蛇"""
        for i, (x, y) in enumerate(self.snake.body):
            # 蛇頭用不同顏色
            color = BLUE if i == 0 else GREEN

            rect = pygame.Rect(
                x * GRID_SIZE + 1,
                y * GRID_SIZE + 1,
                GRID_SIZE - 2,
                GRID_SIZE - 2
            )
            pygame.draw.rect(self.screen, color, rect, border_radius=3)

            # 蛇頭畫眼睛
            if i == 0:
                eye_size = 3
                if self.snake.direction == Direction.RIGHT:
                    eye1 = (x * GRID_SIZE + 12, y * GRID_SIZE + 6)
                    eye2 = (x * GRID_SIZE + 12, y * GRID_SIZE + 14)
                elif self.snake.direction == Direction.LEFT:
                    eye1 = (x * GRID_SIZE + 8, y * GRID_SIZE + 6)
                    eye2 = (x * GRID_SIZE + 8, y * GRID_SIZE + 14)
                elif self.snake.direction == Direction.UP:
                    eye1 = (x * GRID_SIZE + 6, y * GRID_SIZE + 8)
                    eye2 = (x * GRID_SIZE + 14, y * GRID_SIZE + 8)
                else:  # DOWN
                    eye1 = (x * GRID_SIZE + 6, y * GRID_SIZE + 12)
                    eye2 = (x * GRID_SIZE + 14, y * GRID_SIZE + 12)

                pygame.draw.circle(self.screen, WHITE, eye1, eye_size)
                pygame.draw.circle(self.screen, WHITE, eye2, eye_size)

    def draw_food(self):
        """繪製食物"""
        x, y = self.food.position
        color = self.food.get_color()

        rect = pygame.Rect(
            x * GRID_SIZE + 2,
            y * GRID_SIZE + 2,
            GRID_SIZE - 4,
            GRID_SIZE - 4
        )

        if self.food.type == 'special':
            # 特殊食物畫星形
            pygame.draw.circle(self.screen, color,
                             (x * GRID_SIZE + GRID_SIZE // 2,
                              y * GRID_SIZE + GRID_SIZE // 2),
                             GRID_SIZE // 2 - 2)
        else:
            # 普通食物畫圓形
            pygame.draw.circle(self.screen, color,
                             (x * GRID_SIZE + GRID_SIZE // 2,
                              y * GRID_SIZE + GRID_SIZE // 2),
                             GRID_SIZE // 3)

    def draw_ui(self):
        """繪製UI"""
        # 分數
        score_text = self.font_medium.render(f'分數: {self.score}', True, WHITE)
        self.screen.blit(score_text, (10, 10))

        # 最高分
        high_score_text = self.font_small.render(f'最高: {self.high_score}', True, YELLOW)
        self.screen.blit(high_score_text, (10, 50))

        # 長度
        length_text = self.font_small.render(f'長度: {len(self.snake.body)}', True, WHITE)
        self.screen.blit(length_text, (WINDOW_WIDTH - 120, 10))

        # 操作提示
        hint_text = self.font_small.render('P-暫停 ESC-退出', True, GRAY)
        self.screen.blit(hint_text, (WINDOW_WIDTH - 180, WINDOW_HEIGHT - 30))

    def draw_game_over(self):
        """繪製遊戲結束畫面"""
        # 半透明背景
        overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT))
        overlay.set_alpha(200)
        overlay.fill(BLACK)
        self.screen.blit(overlay, (0, 0))

        # Game Over 文字
        game_over_text = self.font_large.render('遊戲結束!', True, RED)
        text_rect = game_over_text.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2 - 60))
        self.screen.blit(game_over_text, text_rect)

        # 最終分數
        score_text = self.font_medium.render(f'最終分數: {self.score}', True, WHITE)
        text_rect = score_text.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2))
        self.screen.blit(score_text, text_rect)

        # 最高分
        if self.score >= self.high_score:
            high_score_text = self.font_medium.render('新紀錄!', True, YELLOW)
        else:
            high_score_text = self.font_medium.render(f'最高分: {self.high_score}', True, YELLOW)
        text_rect = high_score_text.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2 + 50))
        self.screen.blit(high_score_text, text_rect)

        # 重新開始提示
        restart_text = self.font_small.render('按空白鍵重新開始', True, WHITE)
        text_rect = restart_text.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2 + 100))
        self.screen.blit(restart_text, text_rect)

    def draw_paused(self):
        """繪製暫停畫面"""
        overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT))
        overlay.set_alpha(150)
        overlay.fill(BLACK)
        self.screen.blit(overlay, (0, 0))

        paused_text = self.font_large.render('暫停', True, WHITE)
        text_rect = paused_text.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2))
        self.screen.blit(paused_text, text_rect)

    def reset_game(self):
        """重置遊戲"""
        self.snake.reset()
        self.food.spawn(self.snake.body)
        self.score = 0
        self.game_over = False
        self.paused = False

    def run(self):
        """運行遊戲主循環"""
        running = True

        while running:
            # 處理事件
            running = self.handle_events()

            # 更新遊戲
            self.update()

            # 繪製畫面
            self.draw()

            # 控制幀率
            self.clock.tick(FPS)

        pygame.quit()
        sys.exit()

def main():
    """主函數"""
    game = Game()
    game.run()

if __name__ == '__main__':
    main()
