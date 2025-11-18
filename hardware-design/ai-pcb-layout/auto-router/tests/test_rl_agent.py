"""
测试强化学习智能体
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import numpy as np
import pytest
from algorithms.rl_agent import DQNAgent, DQNNetwork, ReplayBuffer, RLRouter


def test_dqn_network():
    """测试 DQN 网络"""
    import torch

    network = DQNNetwork(state_dim=10, action_dim=4, hidden_size=64)

    # 测试前向传播
    state = torch.randn(1, 10)
    output = network(state)

    assert output.shape == (1, 4), "输出形状不正确"
    print("✓ DQN 网络测试通过")


def test_replay_buffer():
    """测试经验回放缓冲区"""
    from algorithms.rl_agent import Experience

    buffer = ReplayBuffer(capacity=100)

    # 添加经验
    for i in range(150):
        exp = Experience(
            state=np.random.randn(10),
            action=i % 4,
            reward=np.random.randn(),
            next_state=np.random.randn(10),
            done=False
        )
        buffer.push(exp)

    # 检查容量限制
    assert len(buffer) == 100, "缓冲区容量限制失败"

    # 测试采样
    samples = buffer.sample(32)
    assert len(samples) == 32, "采样数量不正确"

    print("✓ 经验回放缓冲区测试通过")


def test_dqn_agent():
    """测试 DQN 智能体"""
    agent = DQNAgent(
        state_dim=10,
        action_dim=4,
        learning_rate=1e-3,
        gamma=0.99
    )

    # 测试状态提取
    grid = np.zeros((20, 20), dtype=np.int8)
    grid[10, :] = 1  # 添加障碍物

    state = agent.get_state(grid, (5, 5), (15, 15))
    assert state.shape == (10,), "状态维度不正确"
    assert np.all(state >= 0) and np.all(state <= 1), "状态值应该在 [0, 1] 范围内"

    # 测试动作选择
    action = agent.select_action(state, training=False)
    assert 0 <= action < 4, "动作索引超出范围"

    # 测试经验存储
    agent.store_experience(state, action, 1.0, state, False)
    assert len(agent.replay_buffer) == 1, "经验存储失败"

    print("✓ DQN 智能体测试通过")


def test_rl_router_basic():
    """测试 RL 路由器基本功能"""
    # 创建简单网格
    grid = np.zeros((20, 20), dtype=np.int8)

    # 添加障碍物
    grid[10, 5:15] = 1

    agent = DQNAgent()
    router = RLRouter(agent)

    # 测试路径搜索（即使未训练也应该能执行）
    start = (2, 2)
    goal = (18, 18)

    path = router.search(grid, start, goal, max_steps=100)

    # 未训练的智能体可能找不到路径，这是正常的
    if path:
        assert path[0] == start, "路径应该从起点开始"
        assert path[-1] == goal, "路径应该在终点结束"
        print(f"✓ RL 路由器找到路径，长度: {len(path)}")
    else:
        print("✓ RL 路由器测试通过（未训练，未找到路径是正常的）")


def test_rl_training():
    """测试训练过程（简短版本）"""
    grid = np.zeros((10, 10), dtype=np.int8)
    grid[5, 3:7] = 1  # 障碍物

    agent = DQNAgent()
    router = RLRouter(agent)

    # 短训练
    start = (1, 1)
    goal = (8, 8)

    print("运行短训练（10轮）...")
    rewards = router.train_agent(grid, start, goal, episodes=10)

    assert len(rewards) == 10, "训练轮数不匹配"
    print(f"✓ RL 训练测试通过，平均奖励: {np.mean(rewards):.2f}")


def test_model_save_load(tmp_path):
    """测试模型保存和加载"""
    agent = DQNAgent()

    # 保存模型
    model_path = tmp_path / "test_model.pth"
    agent.save(str(model_path))

    assert model_path.exists(), "模型文件未创建"

    # 加载模型
    new_agent = DQNAgent()
    new_agent.load(str(model_path))

    # 检查参数是否相同
    assert new_agent.epsilon == agent.epsilon, "Epsilon 值不匹配"
    assert new_agent.training_step == agent.training_step, "训练步数不匹配"

    print("✓ 模型保存/加载测试通过")


def run_all_tests():
    """运行所有测试"""
    print("=" * 60)
    print("运行强化学习智能体测试")
    print("=" * 60)

    try:
        import torch
        print(f"PyTorch 版本: {torch.__version__}")
        print(f"CUDA 可用: {torch.cuda.is_available()}\n")
    except ImportError:
        print("警告: PyTorch 未安装，某些测试可能失败\n")

    import tempfile

    test_dqn_network()
    test_replay_buffer()
    test_dqn_agent()
    test_rl_router_basic()
    test_rl_training()

    # 使用临时目录测试保存/加载
    with tempfile.TemporaryDirectory() as tmpdir:
        test_model_save_load(tmpdir)

    print("\n" + "=" * 60)
    print("所有测试通过！")
    print("=" * 60)


if __name__ == '__main__':
    run_all_tests()
