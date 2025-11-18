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
    DIFFICULTY_SELECT = 1
    SINGLE_PLAYER = 2
    TWO_PLAYER = 3
    GAME_OVER = 4


class AIDifficulty(Enum):
    """AI 難度等級"""
    EASY = {"name": "簡單", "accuracy": 0.60, "speed": 0.7, "reaction_delay": 0.15}
    MEDIUM = {"name": "中等", "accuracy": 0.85, "speed": 1.0, "reaction_delay": 0.05}
    HARD = {"name": "困難", "accuracy": 0.95, "speed": 1.2, "reaction_delay": 0.02}
    EXPERT = {"name": "專家", "accuracy": 0.98, "speed": 1.5, "reaction_delay": 0.0, "predict": True}


class Paddle:
    """球拍類"""

    def __init__(self, x, y, color):
        """初始化球拍"""
        self.rect = pygame.Rect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT)
        self.color = color
        self.speed = PADDLE_SPEED
        self.score = 0
        self.ai_difficulty = None
        self.last_reaction_time = 0

    def move_up(self):
        """向上移動"""
        speed = self.speed
        if self.ai_difficulty:
            speed *= self.ai_difficulty.value["speed"]
        self.rect.y -= speed
        if self.rect.y < 0:
            self.rect.y = 0

    def move_down(self):
        """向下移動"""
        speed = self.speed
        if self.ai_difficulty:
            speed *= self.ai_difficulty.value["speed"]
        self.rect.y += speed
        if self.rect.y > WINDOW_HEIGHT - PADDLE_HEIGHT:
            self.rect.y = WINDOW_HEIGHT - PADDLE_HEIGHT

    def ai_move(self, ball, current_time):
        """改進的 AI 移動邏輯"""
        if not self.ai_difficulty:
            self.ai_difficulty = AIDifficulty.MEDIUM

        difficulty = self.ai_difficulty.value

        # AI 只在球向它移動時才反應
        if ball.velocity_x > 0:
            # 檢查反應延遲
            if current_time - self.last_reaction_time < difficulty["reaction_delay"]:
                return

            self.last_reaction_time = current_time

            # 專家模式：預測球的軌跡
            if difficulty.get("predict", False):
                target_y = self._predict_ball_position(ball)
            else:
                target_y = ball.rect.centery

            paddle_center = self.rect.centery

            # 根據難度調整準確度
            if random.random() < difficulty["accuracy"]:
                tolerance = 10 if difficulty["accuracy"] < 0.9 else 5
                if paddle_center < target_y - tolerance:
                    self.move_down()
                elif paddle_center > target_y + tolerance:
                    self.move_up()

    def _predict_ball_position(self, ball):
        """預測球將到達的 Y 座標（專家模式）"""
        if ball.velocity_x == 0:
            return ball.rect.centery

        # 計算球到達右側球拍的時間
        time_to_reach = (self.rect.x - ball.rect.x) / ball.velocity_x

        # 預測 Y 座標（考慮反彈）
        predicted_y = ball.rect.centery + ball.velocity_y * time_to_reach

        # 處理牆壁反彈
        while predicted_y < 0 or predicted_y > WINDOW_HEIGHT:
            if predicted_y < 0:
                predicted_y = -predicted_y
            elif predicted_y > WINDOW_HEIGHT:
                predicted_y = 2 * WINDOW_HEIGHT - predicted_y

        return predicted_y

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
        pygame.display.set_caption("Pong 遊戲 - AI 增強版")
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
        self.selected_difficulty = AIDifficulty.MEDIUM
        self.difficulty_menu_index = 1  # 默認選擇中等難度

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
                        self.mode = GameMode.DIFFICULTY_SELECT
                    elif event.key == pygame.K_2:
                        self.start_game(GameMode.TWO_PLAYER)

                elif self.mode == GameMode.DIFFICULTY_SELECT:
                    if event.key == pygame.K_UP:
                        self.difficulty_menu_index = max(0, self.difficulty_menu_index - 1)
                    elif event.key == pygame.K_DOWN:
                        self.difficulty_menu_index = min(3, self.difficulty_menu_index + 1)
                    elif event.key == pygame.K_RETURN or event.key == pygame.K_SPACE:
                        difficulties = [AIDifficulty.EASY, AIDifficulty.MEDIUM,
                                      AIDifficulty.HARD, AIDifficulty.EXPERT]
                        self.selected_difficulty = difficulties[self.difficulty_menu_index]
                        self.right_paddle.ai_difficulty = self.selected_difficulty
                        self.start_game(GameMode.SINGLE_PLAYER)
                    elif event.key == pygame.K_ESCAPE:
                        self.mode = GameMode.MENU

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
            current_time = pygame.time.get_ticks() / 1000.0
            self.right_paddle.ai_move(self.ball, current_time)

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
        elif self.mode == GameMode.DIFFICULTY_SELECT:
            self.draw_difficulty_select()
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
            "按空白鍵暫停",
            "",
            "🤖 AI 增強版 - 多種難度挑戰"
        ]

        for i, instruction in enumerate(instructions):
            text = self.info_font.render(instruction, True, GRAY)
            text_rect = text.get_rect(center=(WINDOW_WIDTH // 2, 450 + i * 30))
            self.screen.blit(text, text_rect)

    def draw_difficulty_select(self):
        """繪製難度選擇畫面"""
        # 標題
        title = self.title_font.render("選擇 AI 難度", True, WHITE)
        title_rect = title.get_rect(center=(WINDOW_WIDTH // 2, 100))
        self.screen.blit(title, title_rect)

        # 難度選項
        difficulties = [
            (AIDifficulty.EASY, "簡單 - 適合新手"),
            (AIDifficulty.MEDIUM, "中等 - 標準挑戰"),
            (AIDifficulty.HARD, "困難 - 高手對決"),
            (AIDifficulty.EXPERT, "專家 - 終極挑戰（預測軌跡）")
        ]

        for i, (difficulty, desc) in enumerate(difficulties):
            y_pos = 220 + i * 80

            # 選中高亮
            if i == self.difficulty_menu_index:
                # 繪製選擇框
                highlight_rect = pygame.Rect(
                    WINDOW_WIDTH // 2 - 250,
                    y_pos - 10,
                    500,
                    60
                )
                pygame.draw.rect(self.screen, YELLOW, highlight_rect, 3, 10)

                # 難度名稱（高亮）
                name_text = self.menu_font.render(desc, True, YELLOW)
            else:
                # 難度名稱（普通）
                name_text = self.menu_font.render(desc, True, WHITE)

            name_rect = name_text.get_rect(center=(WINDOW_WIDTH // 2, y_pos))
            self.screen.blit(name_text, name_rect)

            # 難度詳情
            stats = difficulty.value
            detail_text = f"準確度: {stats['accuracy']*100:.0f}% | 速度: {stats['speed']:.1f}x | 反應: {stats['reaction_delay']:.2f}s"
            detail = self.info_font.render(detail_text, True, GRAY)
            detail_rect = detail.get_rect(center=(WINDOW_WIDTH // 2, y_pos + 25))
            self.screen.blit(detail, detail_rect)

        # 操作提示
        hint = self.info_font.render("↑/↓ 選擇難度 | Enter/空白鍵 確認 | ESC 返回", True, WHITE)
        hint_rect = hint.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT - 50))
        self.screen.blit(hint, hint_rect)

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

        # 繪製控制提示和AI信息
        if self.mode == GameMode.SINGLE_PLAYER:
            difficulty_name = self.selected_difficulty.value["name"]
            mode_text = f"單人模式 - vs AI ({difficulty_name})"

            # AI 訓練建議
            tips = self._get_ai_tips()
            if tips:
                tip_surface = self.info_font.render(f"💡 提示: {tips}", True, PURPLE)
                tip_rect = tip_surface.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT - 60))
                self.screen.blit(tip_surface, tip_rect)
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

    def _get_ai_tips(self):
        """獲取 AI 訓練建議"""
        if self.mode != GameMode.SINGLE_PLAYER:
            return None

        score_diff = self.right_paddle.score - self.left_paddle.score
        difficulty = self.selected_difficulty

        # 根據比分和難度給出建議
        if difficulty == AIDifficulty.EASY:
            if score_diff > 2:
                return "AI 太簡單了？試試中等難度吧！"
            else:
                return "保持節奏，控制好反彈角度"
        elif difficulty == AIDifficulty.MEDIUM:
            if score_diff > 2:
                return "嘗試用不同角度擊球來迷惑 AI"
            elif score_diff < -2:
                return "觀察球的軌跡，提前移動到位"
            else:
                return "勢均力敵！繼續保持"
        elif difficulty == AIDifficulty.HARD:
            if score_diff > 0:
                return "打得好！用變化的角度繼續挑戰"
            else:
                return "AI 反應很快，試著打向邊角"
        else:  # EXPERT
            if score_diff > 0:
                return "太強了！你擊敗了預測軌跡的專家 AI！"
            else:
                return "專家 AI 能預測軌跡，嘗試突然改變球速"

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

            # 顯示擊敗AI的成就
            if self.mode == GameMode.SINGLE_PLAYER:
                achievement = self.menu_font.render(
                    f"🏆 擊敗了 {self.selected_difficulty.value['name']} AI！",
                    True,
                    YELLOW
                )
                achievement_rect = achievement.get_rect(center=(WINDOW_WIDTH // 2, 150))
                self.screen.blit(achievement, achievement_rect)
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
