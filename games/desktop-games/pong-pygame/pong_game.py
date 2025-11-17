#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pong 遊戲 - Pong Game
使用 Pygame 開發的經典乒乓球遊戲
"""

import pygame
import sys
import random
from enum import Enum

# 初始化 Pygame
pygame.init()

# 遊戲常量
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
FPS = 60

# 顏色定義 (RGB)
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (128, 128, 128)
GREEN = (46, 204, 113)
BLUE = (52, 152, 219)
RED = (231, 76, 60)
YELLOW = (241, 196, 15)
PURPLE = (155, 89, 182)

# 球拍常量
PADDLE_WIDTH = 15
PADDLE_HEIGHT = 100
PADDLE_SPEED = 6

# 球常量
BALL_SIZE = 15
INITIAL_BALL_SPEED = 5

class GameMode(Enum):
    """遊戲模式"""
    MENU = 0
    SINGLE_PLAYER = 1
    TWO_PLAYER = 2
    GAME_OVER = 3


class Paddle:
    """球拍類"""

    def __init__(self, x, y, color):
        """初始化球拍"""
        self.rect = pygame.Rect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT)
        self.color = color
        self.speed = PADDLE_SPEED
        self.score = 0

    def move_up(self):
        """向上移動"""
        self.rect.y -= self.speed
        if self.rect.y < 0:
            self.rect.y = 0

    def move_down(self):
        """向下移動"""
        self.rect.y += self.speed
        if self.rect.y > WINDOW_HEIGHT - PADDLE_HEIGHT:
            self.rect.y = WINDOW_HEIGHT - PADDLE_HEIGHT

    def ai_move(self, ball):
        """AI 移動邏輯"""
        # AI 只在球向它移動時才反應
        if ball.velocity_x > 0:
            # 添加一些隨機性和延遲使 AI 不完美
            target_y = ball.rect.centery
            paddle_center = self.rect.centery

            # AI 反應速度（不完美）
            if random.random() < 0.85:  # 85% 機率正確反應
                if paddle_center < target_y - 10:
                    self.move_down()
                elif paddle_center > target_y + 10:
                    self.move_up()

    def draw(self, screen):
        """繪製球拍"""
        pygame.draw.rect(screen, self.color, self.rect)
        # 添加邊框
        pygame.draw.rect(screen, WHITE, self.rect, 2)


class Ball:
    """球類"""

    def __init__(self):
        """初始化球"""
        self.rect = pygame.Rect(
            WINDOW_WIDTH // 2 - BALL_SIZE // 2,
            WINDOW_HEIGHT // 2 - BALL_SIZE // 2,
            BALL_SIZE,
            BALL_SIZE
        )
        self.velocity_x = 0
        self.velocity_y = 0
        self.speed = INITIAL_BALL_SPEED
        self.reset()

    def reset(self):
        """重置球的位置和速度"""
        self.rect.center = (WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2)

        # 隨機發球方向
        angle = random.choice([
            random.uniform(-45, 45),
            random.uniform(135, 225)
        ])

        import math
        self.velocity_x = self.speed * math.cos(math.radians(angle))
        self.velocity_y = self.speed * math.sin(math.radians(angle))

    def update(self, left_paddle, right_paddle):
        """更新球的位置"""
        self.rect.x += self.velocity_x
        self.rect.y += self.velocity_y

        # 與上下邊界碰撞
        if self.rect.top <= 0 or self.rect.bottom >= WINDOW_HEIGHT:
            self.velocity_y = -self.velocity_y
            self.rect.y = max(0, min(self.rect.y, WINDOW_HEIGHT - BALL_SIZE))

        # 與左球拍碰撞
        if self.rect.colliderect(left_paddle.rect) and self.velocity_x < 0:
            self.velocity_x = -self.velocity_x
            # 根據擊中位置調整角度
            hit_pos = (self.rect.centery - left_paddle.rect.centery) / PADDLE_HEIGHT
            self.velocity_y += hit_pos * self.speed * 0.5
            # 略微增加速度
            self.speed *= 1.05
            self.velocity_x = abs(self.velocity_x)

        # 與右球拍碰撞
        if self.rect.colliderect(right_paddle.rect) and self.velocity_x > 0:
            self.velocity_x = -self.velocity_x
            # 根據擊中位置調整角度
            hit_pos = (self.rect.centery - right_paddle.rect.centery) / PADDLE_HEIGHT
            self.velocity_y += hit_pos * self.speed * 0.5
            # 略微增加速度
            self.speed *= 1.05
            self.velocity_x = -abs(self.velocity_x)

        # 限制最大速度
        max_speed = INITIAL_BALL_SPEED * 2
        if abs(self.velocity_x) > max_speed:
            self.velocity_x = max_speed if self.velocity_x > 0 else -max_speed
        if abs(self.velocity_y) > max_speed:
            self.velocity_y = max_speed if self.velocity_y > 0 else -max_speed

    def draw(self, screen):
        """繪製球"""
        pygame.draw.ellipse(screen, WHITE, self.rect)
        # 添加高光效果
        highlight = pygame.Rect(
            self.rect.x + 3,
            self.rect.y + 3,
            BALL_SIZE // 3,
            BALL_SIZE // 3
        )
        pygame.draw.ellipse(screen, GRAY, highlight)

    def is_out_of_bounds(self):
        """檢查球是否出界"""
        if self.rect.left <= 0:
            return "right"  # 右邊得分
        elif self.rect.right >= WINDOW_WIDTH:
            return "left"   # 左邊得分
        return None


class PongGame:
    """Pong 遊戲主類"""

    def __init__(self):
        """初始化遊戲"""
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("Pong 遊戲")
        self.clock = pygame.time.Clock()
        self.running = True
        self.mode = GameMode.MENU

        # 創建遊戲對象
        self.left_paddle = Paddle(30, WINDOW_HEIGHT // 2 - PADDLE_HEIGHT // 2, BLUE)
        self.right_paddle = Paddle(
            WINDOW_WIDTH - 30 - PADDLE_WIDTH,
            WINDOW_HEIGHT // 2 - PADDLE_HEIGHT // 2,
            RED
        )
        self.ball = Ball()

        # 字體
        self.title_font = pygame.font.Font(None, 72)
        self.score_font = pygame.font.Font(None, 48)
        self.menu_font = pygame.font.Font(None, 36)
        self.info_font = pygame.font.Font(None, 24)

        # 遊戲狀態
        self.winning_score = 5
        self.paused = False

    def handle_events(self):
        """處理事件"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if self.mode != GameMode.MENU:
                        self.mode = GameMode.MENU
                    else:
                        self.running = False

                if self.mode == GameMode.MENU:
                    if event.key == pygame.K_1:
                        self.start_game(GameMode.SINGLE_PLAYER)
                    elif event.key == pygame.K_2:
                        self.start_game(GameMode.TWO_PLAYER)

                elif self.mode == GameMode.GAME_OVER:
                    if event.key == pygame.K_SPACE:
                        self.mode = GameMode.MENU

                elif event.key == pygame.K_SPACE:
                    self.paused = not self.paused

    def start_game(self, mode):
        """開始遊戲"""
        self.mode = mode
        self.left_paddle.score = 0
        self.right_paddle.score = 0
        self.ball.speed = INITIAL_BALL_SPEED
        self.ball.reset()
        self.paused = False

    def update(self):
        """更新遊戲狀態"""
        if self.mode == GameMode.MENU or self.mode == GameMode.GAME_OVER or self.paused:
            return

        # 處理輸入
        keys = pygame.key.get_pressed()

        # 左球拍控制 (W/S)
        if keys[pygame.K_w]:
            self.left_paddle.move_up()
        if keys[pygame.K_s]:
            self.left_paddle.move_down()

        # 右球拍控制
        if self.mode == GameMode.TWO_PLAYER:
            # 雙人模式：上/下方向鍵
            if keys[pygame.K_UP]:
                self.right_paddle.move_up()
            if keys[pygame.K_DOWN]:
                self.right_paddle.move_down()
        else:
            # 單人模式：AI 控制
            self.right_paddle.ai_move(self.ball)

        # 更新球
        self.ball.update(self.left_paddle, self.right_paddle)

        # 檢查得分
        scorer = self.ball.is_out_of_bounds()
        if scorer:
            if scorer == "left":
                self.left_paddle.score += 1
            else:
                self.right_paddle.score += 1

            # 檢查是否有玩家獲勝
            if self.left_paddle.score >= self.winning_score or \
               self.right_paddle.score >= self.winning_score:
                self.mode = GameMode.GAME_OVER
            else:
                self.ball.speed = INITIAL_BALL_SPEED
                self.ball.reset()
                pygame.time.wait(1000)  # 暫停 1 秒

    def draw(self):
        """繪製遊戲"""
        # 清空畫面
        self.screen.fill(BLACK)

        if self.mode == GameMode.MENU:
            self.draw_menu()
        elif self.mode == GameMode.GAME_OVER:
            self.draw_game_over()
        else:
            self.draw_game()

        pygame.display.flip()

    def draw_menu(self):
        """繪製主菜單"""
        # 標題
        title = self.title_font.render("PONG", True, WHITE)
        title_rect = title.get_rect(center=(WINDOW_WIDTH // 2, 100))
        self.screen.blit(title, title_rect)

        # 菜單選項
        options = [
            "按 1 - 單人遊戲 (vs AI)",
            "按 2 - 雙人遊戲",
            "按 ESC - 退出",
        ]

        for i, option in enumerate(options):
            text = self.menu_font.render(option, True, WHITE)
            text_rect = text.get_rect(center=(WINDOW_WIDTH // 2, 250 + i * 60))
            self.screen.blit(text, text_rect)

        # 遊戲說明
        instructions = [
            "左邊玩家: W/S 鍵控制",
            "右邊玩家: ↑/↓ 鍵控制",
            f"先得 {self.winning_score} 分獲勝",
            "按空白鍵暫停"
        ]

        for i, instruction in enumerate(instructions):
            text = self.info_font.render(instruction, True, GRAY)
            text_rect = text.get_rect(center=(WINDOW_WIDTH // 2, 450 + i * 30))
            self.screen.blit(text, text_rect)

    def draw_game(self):
        """繪製遊戲畫面"""
        # 繪製中線
        for i in range(0, WINDOW_HEIGHT, 20):
            pygame.draw.rect(self.screen, GRAY, (WINDOW_WIDTH // 2 - 2, i, 4, 10))

        # 繪製球拍和球
        self.left_paddle.draw(self.screen)
        self.right_paddle.draw(self.screen)
        self.ball.draw(self.screen)

        # 繪製分數
        left_score = self.score_font.render(str(self.left_paddle.score), True, BLUE)
        right_score = self.score_font.render(str(self.right_paddle.score), True, RED)

        left_score_rect = left_score.get_rect(center=(WINDOW_WIDTH // 4, 50))
        right_score_rect = right_score.get_rect(center=(WINDOW_WIDTH * 3 // 4, 50))

        self.screen.blit(left_score, left_score_rect)
        self.screen.blit(right_score, right_score_rect)

        # 繪製控制提示
        if self.mode == GameMode.SINGLE_PLAYER:
            mode_text = "單人模式 - vs AI"
        else:
            mode_text = "雙人模式"

        mode_surface = self.info_font.render(mode_text, True, GRAY)
        mode_rect = mode_surface.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT - 30))
        self.screen.blit(mode_surface, mode_rect)

        # 暫停提示
        if self.paused:
            pause_text = self.title_font.render("暫停", True, YELLOW)
            pause_rect = pause_text.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2))

            # 半透明背景
            overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT))
            overlay.set_alpha(128)
            overlay.fill(BLACK)
            self.screen.blit(overlay, (0, 0))

            self.screen.blit(pause_text, pause_rect)

    def draw_game_over(self):
        """繪製遊戲結束畫面"""
        # 半透明覆蓋
        overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT))
        overlay.set_alpha(200)
        overlay.fill(BLACK)
        self.screen.blit(overlay, (0, 0))

        # 獲勝者
        if self.left_paddle.score > self.right_paddle.score:
            winner_text = "左邊玩家獲勝!"
            winner_color = BLUE
        else:
            if self.mode == GameMode.SINGLE_PLAYER:
                winner_text = "AI 獲勝!"
            else:
                winner_text = "右邊玩家獲勝!"
            winner_color = RED

        winner = self.title_font.render(winner_text, True, winner_color)
        winner_rect = winner.get_rect(center=(WINDOW_WIDTH // 2, 200))
        self.screen.blit(winner, winner_rect)

        # 最終分數
        final_score = self.score_font.render(
            f"{self.left_paddle.score} - {self.right_paddle.score}",
            True,
            WHITE
        )
        score_rect = final_score.get_rect(center=(WINDOW_WIDTH // 2, 300))
        self.screen.blit(final_score, score_rect)

        # 提示
        prompt = self.menu_font.render("按空白鍵返回主菜單", True, WHITE)
        prompt_rect = prompt.get_rect(center=(WINDOW_WIDTH // 2, 400))
        self.screen.blit(prompt, prompt_rect)

    def run(self):
        """運行遊戲"""
        while self.running:
            self.handle_events()
            self.update()
            self.draw()
            self.clock.tick(FPS)

        pygame.quit()
        sys.exit()


def main():
    """主函數"""
    game = PongGame()
    game.run()


if __name__ == "__main__":
    main()
