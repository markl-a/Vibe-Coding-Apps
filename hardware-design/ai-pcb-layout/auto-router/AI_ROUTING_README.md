# 🤖 AI 辅助路由功能

## 概述

新增的 AI 辅助路由功能使用深度强化学习（Deep Reinforcement Learning, DRL）来优化 PCB 走线路径。该功能基于 Deep Q-Network (DQN) 算法实现。

## 主要特性

### 🎯 强化学习路由器

- **DQN 智能体**: 使用深度 Q 学习进行路径规划
- **经验回放**: 提高学习效率和稳定性
- **Epsilon-贪心策略**: 平衡探索与利用
- **自适应学习**: 根据环境反馈调整策略

### 📊 状态表示

智能体使用以下特征作为状态：

1. 当前位置（归一化）
2. 目标位置（归一化）
3. 到目标的曼哈顿距离
4. 到目标的欧几里得距离
5. 四个方向的障碍物信息

### 🎁 奖励函数设计

- **到达目标**: +10.0
- **靠近目标**: +0.1
- **每步移动**: -0.1（鼓励短路径）
- **碰撞障碍物**: -1.0
- **越界**: -1.0
- **重复访问**: -0.5

## 安装依赖

```bash
# 进入项目目录
cd hardware-design/ai-pcb-layout/auto-router

# 安装依赖
pip install -r requirements.txt

# 主要依赖：
# - numpy: 数值计算
# - torch: 深度学习框架
# - matplotlib: 可视化
```

## 使用方法

### 1. 训练新模型

```python
from algorithms.rl_agent import DQNAgent, RLRouter
import numpy as np

# 创建网格（0=空闲，1=障碍物）
grid = np.zeros((50, 50), dtype=np.int8)
grid[20:30, 25] = 1  # 添加障碍物

# 创建智能体
agent = DQNAgent(
    state_dim=10,
    action_dim=4,
    learning_rate=1e-3,
    gamma=0.99
)

# 训练
router = RLRouter(agent)
rewards = router.train_agent(
    grid=grid,
    start=(5, 5),
    goal=(45, 45),
    episodes=2000
)

# 保存模型
agent.save('my_router_model.pth')
```

### 2. 使用预训练模型

```python
from algorithms.rl_agent import DQNAgent, RLRouter

# 加载模型
agent = DQNAgent()
agent.load('my_router_model.pth')

# 创建路由器
router = RLRouter(agent)

# 进行路由
path = router.search(grid, start=(5, 5), goal=(45, 45))

if path:
    print(f"找到路径，长度: {len(path)}")
else:
    print("未找到路径")
```

### 3. 完整训练示例

```bash
# 运行训练脚本
cd examples
python train_rl_router.py
```

该脚本会：
1. 创建示例网格
2. 训练 DQN 智能体（2000 轮）
3. 保存训练好的模型
4. 生成训练进度可视化
5. 测试路由性能
6. 与 A* 算法进行比较

## 输出文件

训练完成后会生成以下文件：

- `rl_router_model.pth`: 训练好的模型权重
- `rl_training_progress.png`: 训练进度图表
- `rl_routing_result.png`: 路由结果可视化
- `algorithm_comparison.png`: RL vs A* 对比

## 性能优化建议

### 训练参数调整

```python
agent = DQNAgent(
    state_dim=10,
    action_dim=4,
    learning_rate=1e-3,      # 降低学习率以稳定训练
    gamma=0.99,              # 折扣因子（远期奖励权重）
    epsilon_start=1.0,       # 初始探索率
    epsilon_end=0.01,        # 最终探索率
    epsilon_decay=0.995      # 探索率衰减速度
)
```

### GPU 加速

如果有 GPU，PyTorch 会自动使用：

```python
import torch
print(f"使用设备: {torch.device('cuda' if torch.cuda.is_available() else 'cpu')}")
```

### 训练技巧

1. **增加训练轮数**: 复杂环境需要更多训练
2. **调整探索率**: 较慢的衰减可能更好
3. **调整奖励权重**: 根据具体需求调整奖励函数
4. **使用预训练模型**: 在相似任务上迁移学习

## 与传统算法比较

| 特性 | A* | Lee | RL (DQN) |
|------|----|----|----------|
| 路径最优性 | ✓ | ✓ | 近似最优 |
| 训练时间 | 不需要 | 不需要 | 需要训练 |
| 推理速度 | 快 | 中等 | 快 |
| 适应性 | 低 | 低 | 高 |
| 内存消耗 | 低 | 高 | 中等 |
| 复杂环境 | 好 | 好 | 优秀 |

## RL 的优势

1. **自适应**: 可以学习特定布局的最优策略
2. **灵活**: 容易修改奖励函数以适应不同需求
3. **可扩展**: 可以添加更多特征（如阻抗、时序等）
4. **端到端**: 直接从环境学习，无需手工设计启发式

## RL 的局限性

1. **需要训练**: 首次使用需要大量训练时间
2. **不保证最优**: 只能找到近似最优解
3. **数据需求**: 需要大量训练样本
4. **调参复杂**: 超参数调整需要经验

## 高级功能

### 自定义奖励函数

可以修改 `train_agent` 中的奖励计算来适应特定需求：

```python
# 示例：增加对特定区域的惩罚
if is_in_keep_out_area(next_pos):
    reward -= 2.0

# 示例：奖励使用特定层
if next_layer == preferred_layer:
    reward += 0.5
```

### 多目标优化

通过调整奖励函数，可以同时优化多个目标：

```python
reward = (
    -0.1 * step_count +           # 最小化步数
    -0.5 * via_count +            # 最小化过孔
    -0.2 * bend_count +           # 最小化弯折
    +1.0 * clearance_margin       # 最大化间距余量
)
```

## 故障排除

### 训练不收敛

1. 降低学习率
2. 增加训练轮数
3. 调整探索率衰减
4. 检查奖励函数设计

### 找不到路径

1. 增加最大步数限制
2. 使用预训练模型
3. 简化环境进行测试
4. 检查起点和终点是否有效

### 内存不足

1. 减小经验回放缓冲区大小
2. 减小批次大小
3. 使用较小的神经网络

## 未来改进方向

- [ ] 实现 PPO 算法（更稳定的训练）
- [ ] 添加多层路由支持
- [ ] 实现差分对路由
- [ ] 添加注意力机制
- [ ] 支持在线学习
- [ ] 实现分布式训练

## 参考资料

1. **DQN 论文**: [Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602)
2. **Double DQN**: [Deep Reinforcement Learning with Double Q-learning](https://arxiv.org/abs/1509.06461)
3. **PCB 路由**: [Learning-based PCB Component Placement](https://arxiv.org/abs/2008.07358)

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。
