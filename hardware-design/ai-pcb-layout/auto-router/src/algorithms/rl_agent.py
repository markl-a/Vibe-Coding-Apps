"""
强化学习智能体用于PCB自动路由

使用 Deep Q-Network (DQN) 或 PPO 进行路径规划
"""

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from typing import List, Tuple, Optional, Dict
from collections import deque, namedtuple
import random


# 经验回放存储
Experience = namedtuple('Experience', ['state', 'action', 'reward', 'next_state', 'done'])


class DQNNetwork(nn.Module):
    """DQN 神经网络"""

    def __init__(self, state_dim: int, action_dim: int, hidden_size: int = 128):
        """
        初始化 DQN 网络

        Args:
            state_dim: 状态维度
            action_dim: 动作维度
            hidden_size: 隐藏层大小
        """
        super(DQNNetwork, self).__init__()

        self.fc1 = nn.Linear(state_dim, hidden_size)
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        self.fc3 = nn.Linear(hidden_size, action_dim)

    def forward(self, x):
        """前向传播"""
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return self.fc3(x)


class ReplayBuffer:
    """经验回放缓冲区"""

    def __init__(self, capacity: int = 10000):
        """
        初始化缓冲区

        Args:
            capacity: 缓冲区容量
        """
        self.buffer = deque(maxlen=capacity)

    def push(self, experience: Experience):
        """添加经验"""
        self.buffer.append(experience)

    def sample(self, batch_size: int) -> List[Experience]:
        """采样一批经验"""
        return random.sample(self.buffer, min(batch_size, len(self.buffer)))

    def __len__(self):
        return len(self.buffer)


class DQNAgent:
    """DQN 智能体用于路由优化"""

    def __init__(self,
                 state_dim: int = 10,
                 action_dim: int = 4,
                 learning_rate: float = 1e-3,
                 gamma: float = 0.99,
                 epsilon_start: float = 1.0,
                 epsilon_end: float = 0.01,
                 epsilon_decay: float = 0.995):
        """
        初始化 DQN 智能体

        Args:
            state_dim: 状态维度（包括当前位置、目标位置、周围障碍物等）
            action_dim: 动作维度（上、下、左、右）
            learning_rate: 学习率
            gamma: 折扣因子
            epsilon_start: 初始探索率
            epsilon_end: 最终探索率
            epsilon_decay: 探索率衰减
        """
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.gamma = gamma
        self.epsilon = epsilon_start
        self.epsilon_end = epsilon_end
        self.epsilon_decay = epsilon_decay

        # 设备
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Q 网络和目标网络
        self.q_network = DQNNetwork(state_dim, action_dim).to(self.device)
        self.target_network = DQNNetwork(state_dim, action_dim).to(self.device)
        self.target_network.load_state_dict(self.q_network.state_dict())

        # 优化器
        self.optimizer = optim.Adam(self.q_network.parameters(), lr=learning_rate)

        # 经验回放
        self.replay_buffer = ReplayBuffer(capacity=10000)

        # 训练统计
        self.training_step = 0

    def get_state(self, grid: np.ndarray, current: Tuple[int, int],
                  goal: Tuple[int, int]) -> np.ndarray:
        """
        从网格和当前位置提取状态特征

        Args:
            grid: 网格地图
            current: 当前位置 (x, y)
            goal: 目标位置 (x, y)

        Returns:
            状态向量
        """
        height, width = grid.shape
        x, y = current
        gx, gy = goal

        # 特征：
        # 1. 归一化的当前位置
        # 2. 归一化的目标位置
        # 3. 到目标的距离
        # 4. 四个方向的障碍物信息

        state = []

        # 当前位置（归一化）
        state.append(x / width)
        state.append(y / height)

        # 目标位置（归一化）
        state.append(gx / width)
        state.append(gy / height)

        # 到目标的曼哈顿距离（归一化）
        manhattan_dist = abs(x - gx) + abs(y - gy)
        state.append(manhattan_dist / (width + height))

        # 到目标的欧几里得距离（归一化）
        euclidean_dist = np.sqrt((x - gx)**2 + (y - gy)**2)
        state.append(euclidean_dist / np.sqrt(width**2 + height**2))

        # 四个方向的障碍物（上、右、下、左）
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                state.append(1.0 if grid[ny, nx] == 1 else 0.0)
            else:
                state.append(1.0)  # 边界视为障碍物

        return np.array(state, dtype=np.float32)

    def select_action(self, state: np.ndarray, training: bool = True) -> int:
        """
        选择动作（epsilon-greedy 策略）

        Args:
            state: 当前状态
            training: 是否在训练模式

        Returns:
            动作索引
        """
        if training and random.random() < self.epsilon:
            # 探索：随机选择动作
            return random.randrange(self.action_dim)
        else:
            # 利用：选择 Q 值最高的动作
            with torch.no_grad():
                state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
                q_values = self.q_network(state_tensor)
                return q_values.argmax(1).item()

    def store_experience(self, state, action, reward, next_state, done):
        """存储经验"""
        experience = Experience(state, action, reward, next_state, done)
        self.replay_buffer.push(experience)

    def train(self, batch_size: int = 64):
        """
        训练网络

        Args:
            batch_size: 批次大小
        """
        if len(self.replay_buffer) < batch_size:
            return

        # 采样经验
        experiences = self.replay_buffer.sample(batch_size)

        # 准备批次数据
        states = torch.FloatTensor([e.state for e in experiences]).to(self.device)
        actions = torch.LongTensor([e.action for e in experiences]).to(self.device)
        rewards = torch.FloatTensor([e.reward for e in experiences]).to(self.device)
        next_states = torch.FloatTensor([e.next_state for e in experiences]).to(self.device)
        dones = torch.FloatTensor([e.done for e in experiences]).to(self.device)

        # 当前 Q 值
        current_q = self.q_network(states).gather(1, actions.unsqueeze(1))

        # 目标 Q 值
        with torch.no_grad():
            next_q = self.target_network(next_states).max(1)[0]
            target_q = rewards + (1 - dones) * self.gamma * next_q

        # 计算损失
        loss = F.mse_loss(current_q.squeeze(), target_q)

        # 优化
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

        # 更新探索率
        self.epsilon = max(self.epsilon_end, self.epsilon * self.epsilon_decay)

        self.training_step += 1

        # 定期更新目标网络
        if self.training_step % 100 == 0:
            self.target_network.load_state_dict(self.q_network.state_dict())

        return loss.item()

    def save(self, filepath: str):
        """保存模型"""
        torch.save({
            'q_network': self.q_network.state_dict(),
            'target_network': self.target_network.state_dict(),
            'optimizer': self.optimizer.state_dict(),
            'epsilon': self.epsilon,
            'training_step': self.training_step
        }, filepath)
        print(f"模型已保存到: {filepath}")

    def load(self, filepath: str):
        """加载模型"""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.q_network.load_state_dict(checkpoint['q_network'])
        self.target_network.load_state_dict(checkpoint['target_network'])
        self.optimizer.load_state_dict(checkpoint['optimizer'])
        self.epsilon = checkpoint['epsilon']
        self.training_step = checkpoint['training_step']
        print(f"模型已从 {filepath} 加载")


class RLRouter:
    """使用强化学习的路由器"""

    def __init__(self, agent: Optional[DQNAgent] = None):
        """
        初始化 RL 路由器

        Args:
            agent: DQN 智能体（可选）
        """
        self.agent = agent if agent else DQNAgent()

    def search(self, grid: np.ndarray, start: Tuple[int, int],
              goal: Tuple[int, int], max_steps: int = 1000) -> Optional[List[Tuple[int, int]]]:
        """
        使用 RL 智能体搜索路径

        Args:
            grid: 网格地图
            start: 起点
            goal: 终点
            max_steps: 最大步数

        Returns:
            路径或 None
        """
        height, width = grid.shape

        # 检查有效性
        if not (0 <= start[0] < width and 0 <= start[1] < height):
            return None
        if not (0 <= goal[0] < width and 0 <= goal[1] < height):
            return None
        if grid[start[1], start[0]] == 1 or grid[goal[1], goal[0]] == 1:
            return None

        # 动作映射：0=上, 1=右, 2=下, 3=左
        actions = [(0, 1), (1, 0), (0, -1), (-1, 0)]

        path = [start]
        current = start
        visited = {start}

        for step in range(max_steps):
            # 如果到达目标
            if current == goal:
                return path

            # 获取当前状态
            state = self.agent.get_state(grid, current, goal)

            # 选择动作（不训练，只推理）
            action = self.agent.select_action(state, training=False)

            # 执行动作
            dx, dy = actions[action]
            next_pos = (current[0] + dx, current[1] + dy)

            # 检查是否有效
            nx, ny = next_pos
            if not (0 <= nx < width and 0 <= ny < height):
                # 越界，尝试其他动作
                continue
            if grid[ny, nx] == 1:
                # 障碍物，尝试其他动作
                continue
            if next_pos in visited:
                # 已访问，避免循环
                continue

            # 移动
            current = next_pos
            path.append(current)
            visited.add(current)

        # 超过最大步数，失败
        return None

    def train_agent(self, grid: np.ndarray, start: Tuple[int, int],
                   goal: Tuple[int, int], episodes: int = 1000):
        """
        训练智能体

        Args:
            grid: 训练用的网格
            start: 起点
            goal: 终点
            episodes: 训练轮数
        """
        height, width = grid.shape
        actions = [(0, 1), (1, 0), (0, -1), (-1, 0)]

        rewards_history = []

        for episode in range(episodes):
            current = start
            total_reward = 0
            visited = {start}

            for step in range(500):  # 每轮最多500步
                # 获取状态
                state = self.agent.get_state(grid, current, goal)

                # 选择动作
                action = self.agent.select_action(state, training=True)

                # 执行动作
                dx, dy = actions[action]
                next_pos = (current[0] + dx, current[1] + dy)
                nx, ny = next_pos

                # 计算奖励
                done = False
                reward = -0.1  # 每步小惩罚

                if not (0 <= nx < width and 0 <= ny < height):
                    reward = -1.0  # 越界惩罚
                    next_pos = current  # 不移动
                elif grid[ny, nx] == 1:
                    reward = -1.0  # 障碍物惩罚
                    next_pos = current
                elif next_pos in visited:
                    reward = -0.5  # 重复访问惩罚
                    next_pos = current
                elif next_pos == goal:
                    reward = 10.0  # 到达目标奖励
                    done = True
                else:
                    # 根据距离目标的变化给予奖励
                    old_dist = abs(current[0] - goal[0]) + abs(current[1] - goal[1])
                    new_dist = abs(next_pos[0] - goal[0]) + abs(next_pos[1] - goal[1])
                    if new_dist < old_dist:
                        reward = 0.1  # 靠近目标
                    visited.add(next_pos)

                # 获取下一个状态
                next_state = self.agent.get_state(grid, next_pos, goal)

                # 存储经验
                self.agent.store_experience(state, action, reward, next_state, done)

                # 训练
                loss = self.agent.train()

                total_reward += reward
                current = next_pos

                if done:
                    break

            rewards_history.append(total_reward)

            # 打印进度
            if (episode + 1) % 100 == 0:
                avg_reward = np.mean(rewards_history[-100:])
                print(f"Episode {episode + 1}/{episodes}, "
                      f"Avg Reward: {avg_reward:.2f}, "
                      f"Epsilon: {self.agent.epsilon:.3f}")

        return rewards_history


def rl_router_search(grid: np.ndarray,
                     start: Tuple[int, int],
                     goal: Tuple[int, int],
                     model_path: Optional[str] = None) -> Optional[List[Tuple[int, int]]]:
    """
    使用 RL 进行路由的便捷函数

    Args:
        grid: 网格地图
        start: 起点
        goal: 终点
        model_path: 预训练模型路径（可选）

    Returns:
        路径或 None
    """
    agent = DQNAgent()

    if model_path:
        try:
            agent.load(model_path)
        except:
            print(f"无法加载模型 {model_path}，使用未训练的智能体")

    router = RLRouter(agent)
    return router.search(grid, start, goal)
