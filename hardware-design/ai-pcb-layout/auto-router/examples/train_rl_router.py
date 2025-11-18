"""
训练强化学习路由器示例
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import numpy as np
import matplotlib.pyplot as plt
from algorithms.rl_agent import DQNAgent, RLRouter


def create_sample_grid(size: int = 50) -> np.ndarray:
    """创建示例网格，包含一些障碍物"""
    grid = np.zeros((size, size), dtype=np.int8)

    # 添加一些障碍物
    # 垂直墙
    grid[10:40, 25] = 1

    # 水平墙
    grid[25, 30:45] = 1

    # 散落的障碍物
    np.random.seed(42)
    for _ in range(20):
        x = np.random.randint(0, size)
        y = np.random.randint(0, size)
        if grid[y, x] == 0:
            grid[y:min(y+2, size), x:min(x+2, size)] = 1

    return grid


def visualize_training_progress(rewards_history):
    """可视化训练进度"""
    plt.figure(figsize=(12, 5))

    # 原始奖励
    plt.subplot(1, 2, 1)
    plt.plot(rewards_history, alpha=0.3, label='Raw Rewards')

    # 移动平均
    window = 50
    moving_avg = []
    for i in range(len(rewards_history)):
        start = max(0, i - window)
        moving_avg.append(np.mean(rewards_history[start:i+1]))

    plt.plot(moving_avg, label=f'{window}-Episode Moving Average', linewidth=2)
    plt.xlabel('Episode')
    plt.ylabel('Total Reward')
    plt.title('Training Progress')
    plt.legend()
    plt.grid(True, alpha=0.3)

    # 最近100轮的分布
    plt.subplot(1, 2, 2)
    recent_rewards = rewards_history[-100:] if len(rewards_history) > 100 else rewards_history
    plt.hist(recent_rewards, bins=30, edgecolor='black')
    plt.xlabel('Total Reward')
    plt.ylabel('Frequency')
    plt.title('Recent Reward Distribution (Last 100 Episodes)')
    plt.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('rl_training_progress.png', dpi=150)
    plt.show()


def test_trained_agent(agent: DQNAgent, grid: np.ndarray,
                       start: tuple, goal: tuple):
    """测试训练好的智能体"""
    router = RLRouter(agent)

    print(f"\n测试训练好的智能体...")
    print(f"起点: {start}, 终点: {goal}")

    path = router.search(grid, start, goal)

    if path:
        print(f"成功找到路径！长度: {len(path)}")

        # 可视化结果
        plt.figure(figsize=(10, 10))
        plt.imshow(grid, cmap='gray_r', origin='lower')

        if len(path) > 1:
            path_array = np.array(path)
            plt.plot(path_array[:, 0], path_array[:, 1],
                    'b-', linewidth=3, label='RL Path', alpha=0.7)

        plt.plot(start[0], start[1], 'go', markersize=15, label='Start')
        plt.plot(goal[0], goal[1], 'ro', markersize=15, label='Goal')
        plt.title('RL Agent Routing Result')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.savefig('rl_routing_result.png', dpi=150)
        plt.show()

        return True
    else:
        print("未找到路径")
        return False


def compare_with_astar(grid: np.ndarray, start: tuple, goal: tuple):
    """与A*算法比较"""
    from algorithms.astar import astar_search
    from algorithms.rl_agent import rl_router_search

    print("\n比较 RL 和 A* 算法...")

    # A* 路径
    astar_path = astar_search(grid, start, goal)

    # RL 路径（使用训练好的模型）
    agent = DQNAgent()
    try:
        agent.load('rl_router_model.pth')
        router = RLRouter(agent)
        rl_path = router.search(grid, start, goal)
    except:
        print("未找到训练好的模型，跳过 RL 测试")
        rl_path = None

    # 可视化比较
    fig, axes = plt.subplots(1, 2, figsize=(16, 7))

    # A* 结果
    axes[0].imshow(grid, cmap='gray_r', origin='lower')
    if astar_path:
        path_array = np.array(astar_path)
        axes[0].plot(path_array[:, 0], path_array[:, 1],
                    'r-', linewidth=3, label=f'A* (Length: {len(astar_path)})')
    axes[0].plot(start[0], start[1], 'go', markersize=12, label='Start')
    axes[0].plot(goal[0], goal[1], 'ro', markersize=12, label='Goal')
    axes[0].set_title('A* Algorithm')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)

    # RL 结果
    axes[1].imshow(grid, cmap='gray_r', origin='lower')
    if rl_path:
        path_array = np.array(rl_path)
        axes[1].plot(path_array[:, 0], path_array[:, 1],
                    'b-', linewidth=3, label=f'RL (Length: {len(rl_path)})')
    axes[1].plot(start[0], start[1], 'go', markersize=12, label='Start')
    axes[1].plot(goal[0], goal[1], 'ro', markersize=12, label='Goal')
    axes[1].set_title('RL Algorithm')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('algorithm_comparison.png', dpi=150)
    plt.show()

    # 打印统计
    print(f"\nA* 路径长度: {len(astar_path) if astar_path else 'N/A'}")
    print(f"RL 路径长度: {len(rl_path) if rl_path else 'N/A'}")


def main():
    """主函数"""
    print("=" * 60)
    print("PCB 自动路由 - 强化学习训练示例")
    print("=" * 60)

    # 创建网格
    print("\n创建示例网格...")
    grid = create_sample_grid(size=50)
    print(f"网格大小: {grid.shape}")

    # 定义起点和终点
    start = (5, 5)
    goal = (45, 45)

    # 创建智能体
    print("\n创建 DQN 智能体...")
    agent = DQNAgent(
        state_dim=10,
        action_dim=4,
        learning_rate=1e-3,
        gamma=0.99,
        epsilon_start=1.0,
        epsilon_end=0.01,
        epsilon_decay=0.995
    )

    # 训练
    print(f"\n开始训练...")
    print(f"起点: {start}")
    print(f"终点: {goal}")

    router = RLRouter(agent)
    rewards_history = router.train_agent(
        grid=grid,
        start=start,
        goal=goal,
        episodes=2000
    )

    print(f"\n训练完成！")
    print(f"最终 epsilon: {agent.epsilon:.4f}")

    # 保存模型
    print("\n保存模型...")
    agent.save('rl_router_model.pth')

    # 可视化训练进度
    print("\n可视化训练进度...")
    visualize_training_progress(rewards_history)

    # 测试训练好的智能体
    test_trained_agent(agent, grid, start, goal)

    # 与 A* 比较
    compare_with_astar(grid, start, goal)

    print("\n" + "=" * 60)
    print("训练和测试完成！")
    print("生成的文件:")
    print("  - rl_router_model.pth (训练好的模型)")
    print("  - rl_training_progress.png (训练进度)")
    print("  - rl_routing_result.png (路由结果)")
    print("  - algorithm_comparison.png (算法比较)")
    print("=" * 60)


if __name__ == '__main__':
    main()
