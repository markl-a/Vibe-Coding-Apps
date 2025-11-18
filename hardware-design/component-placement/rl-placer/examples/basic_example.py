"""
強化學習元件擺放器基本範例
展示如何使用 RL-PPO 演算法優化元件擺放
"""

import sys
sys.path.insert(0, '../src')

from rl_placer import RLComponentPlacer
import numpy as np


def main():
    """主函數"""
    print("=== 強化學習元件擺放器 - 基本範例 ===\n")

    # 創建擺放器
    placer = RLComponentPlacer(
        board_size=(100, 80),
        grid_resolution=2.0  # 較粗的網格以加快訓練
    )

    # 添加元件
    print("添加元件...")
    components = {
        'U1': (10, 8),    # IC
        'U2': (8, 8),     # IC
        'C1': (3, 2),     # 電容
        'C2': (3, 2),
        'R1': (2, 1),     # 電阻
        'R2': (2, 1),
        'LED1': (3, 3),   # LED
        'SW1': (5, 5),    # 開關
    }

    for name, size in components.items():
        placer.add_component(name, size)

    # 添加連接（模擬電路連接）
    print("添加連接...")
    connections = [
        ('U1', 'U2', 2.0),    # 重要連接
        ('U1', 'C1', 1.0),
        ('U1', 'C2', 1.0),
        ('U2', 'R1', 1.0),
        ('U2', 'R2', 1.0),
        ('R1', 'LED1', 1.5),
        ('SW1', 'U1', 1.5),
    ]

    for comp1, comp2, weight in connections:
        placer.add_connection(comp1, comp2, weight)

    print(f"  元件數量: {len(components)}")
    print(f"  連接數量: {len(connections)}\n")

    # 訓練模型
    print("開始訓練 RL 模型...")
    print("(這可能需要幾分鐘時間，請耐心等待)\n")

    train_result = placer.train(
        total_timesteps=30000,  # 可調整訓練步數
        verbose=True
    )

    if 'error' in train_result:
        print(f"訓練失敗: {train_result['error']}")
        return

    # 使用訓練好的模型進行優化
    print("\n使用訓練好的模型進行優化...")
    result = placer.optimize(use_trained_model=True)

    print("\n=== 優化結果 ===")
    print(f"擺放方法: {result['method']}")
    print(f"總連線長度: {result['cost']:.2f} mm")
    print(f"總獎勵: {result['total_reward']:.2f}")
    print(f"成功擺放元件數: {result['components_placed']}/{len(components)}")

    # 視覺化結果
    print("\n生成視覺化...")
    placer.visualize(result, save_path='rl_placement_result.png')

    # 儲存訓練好的模型
    print("\n儲存模型...")
    placer.save_model('rl_placer_model')

    # 比較：使用隨機策略
    print("\n比較：使用隨機策略...")
    random_result = placer.optimize(use_trained_model=False)

    print(f"\n隨機策略結果:")
    print(f"  總連線長度: {random_result['cost']:.2f} mm")
    print(f"  總獎勵: {random_result['total_reward']:.2f}")

    improvement = ((random_result['cost'] - result['cost']) / random_result['cost']) * 100
    print(f"\nRL 模型改進: {improvement:.1f}%")

    print("\n範例執行完成！")


if __name__ == "__main__":
    main()
