"""
強化學習元件擺放器進階範例
展示模型訓練、儲存、載入和多次測試
"""

import sys
sys.path.insert(0, '../src')

from rl_placer import RLComponentPlacer
import numpy as np
import os


def create_test_circuit():
    """創建測試電路"""
    components = {
        # 主要 IC
        'MCU': (12, 12),
        'POWER_IC': (8, 6),
        'USB_IC': (6, 4),

        # 電源元件
        'C1': (3, 2), 'C2': (3, 2), 'C3': (3, 2),
        'C4': (3, 2), 'C5': (3, 2),

        # 電阻
        'R1': (2, 1), 'R2': (2, 1), 'R3': (2, 1),
        'R4': (2, 1), 'R5': (2, 1),

        # LED 和開關
        'LED1': (3, 3), 'LED2': (3, 3),
        'SW1': (5, 5), 'RESET': (4, 4),

        # 連接器
        'J1': (8, 4),
    }

    connections = [
        # MCU 連接
        ('MCU', 'POWER_IC', 2.5),
        ('MCU', 'USB_IC', 2.0),
        ('MCU', 'C1', 1.5),
        ('MCU', 'C2', 1.5),
        ('MCU', 'R1', 1.0),
        ('MCU', 'R2', 1.0),
        ('MCU', 'LED1', 1.0),
        ('MCU', 'LED2', 1.0),
        ('MCU', 'RESET', 1.5),

        # 電源網路
        ('POWER_IC', 'C3', 2.0),
        ('POWER_IC', 'C4', 2.0),
        ('POWER_IC', 'C5', 1.5),

        # USB 連接
        ('USB_IC', 'J1', 2.0),
        ('USB_IC', 'R3', 1.0),

        # LED 驅動
        ('R4', 'LED1', 1.0),
        ('R5', 'LED2', 1.0),

        # 開關
        ('SW1', 'MCU', 1.5),
    ]

    return components, connections


def train_and_save_model(placer, model_path='rl_model'):
    """訓練並儲存模型"""
    print("=" * 60)
    print("步驟 1: 訓練模型")
    print("=" * 60)

    train_result = placer.train(
        total_timesteps=50000,
        verbose=True
    )

    if 'error' in train_result:
        print(f"訓練失敗: {train_result['error']}")
        return False

    print(f"\n模型訓練完成！")
    placer.save_model(model_path)

    return True


def evaluate_model(placer, num_tests=5):
    """評估模型性能"""
    print("\n" + "=" * 60)
    print("步驟 2: 評估模型性能")
    print("=" * 60)

    results = []

    for i in range(num_tests):
        print(f"\n測試 {i+1}/{num_tests}...")
        result = placer.optimize(use_trained_model=True)
        results.append(result['cost'])
        print(f"  連線長度: {result['cost']:.2f} mm")

    avg_cost = np.mean(results)
    std_cost = np.std(results)
    min_cost = np.min(results)
    max_cost = np.max(results)

    print(f"\n統計結果 (基於 {num_tests} 次測試):")
    print(f"  平均成本: {avg_cost:.2f} ± {std_cost:.2f} mm")
    print(f"  最佳成本: {min_cost:.2f} mm")
    print(f"  最差成本: {max_cost:.2f} mm")

    return avg_cost, min_cost


def compare_with_random(placer, num_tests=5):
    """與隨機策略比較"""
    print("\n" + "=" * 60)
    print("步驟 3: 與隨機策略比較")
    print("=" * 60)

    rl_results = []
    random_results = []

    for i in range(num_tests):
        # RL 策略
        rl_result = placer.optimize(use_trained_model=True)
        rl_results.append(rl_result['cost'])

        # 隨機策略
        random_result = placer.optimize(use_trained_model=False)
        random_results.append(random_result['cost'])

        print(f"測試 {i+1}: RL={rl_result['cost']:.2f}, Random={random_result['cost']:.2f}")

    avg_rl = np.mean(rl_results)
    avg_random = np.mean(random_results)
    improvement = ((avg_random - avg_rl) / avg_random) * 100

    print(f"\n平均結果:")
    print(f"  RL 策略: {avg_rl:.2f} mm")
    print(f"  隨機策略: {avg_random:.2f} mm")
    print(f"  改進: {improvement:.1f}%")

    return improvement


def visualize_best_result(placer):
    """視覺化最佳結果"""
    print("\n" + "=" * 60)
    print("步驟 4: 視覺化最佳結果")
    print("=" * 60)

    # 運行多次找到最佳結果
    best_result = None
    best_cost = float('inf')

    for i in range(10):
        result = placer.optimize(use_trained_model=True)
        if result['cost'] < best_cost:
            best_cost = result['cost']
            best_result = result

    print(f"\n最佳結果 (來自 10 次測試):")
    print(f"  總成本: {best_cost:.2f} mm")

    placer.visualize(best_result, save_path='rl_best_placement.png')

    return best_result


def main():
    """主函數"""
    print("\n" + "=" * 60)
    print("強化學習元件擺放器 - 進階範例")
    print("=" * 60)

    # 創建測試電路
    components, connections = create_test_circuit()

    print(f"\n電路規格:")
    print(f"  元件數量: {len(components)}")
    print(f"  連接數量: {len(connections)}")
    print(f"  板子大小: 120 × 90 mm")

    # 創建擺放器
    placer = RLComponentPlacer(
        board_size=(120, 90),
        grid_resolution=2.0
    )

    # 添加元件和連接
    for name, size in components.items():
        placer.add_component(name, size)

    for comp1, comp2, weight in connections:
        placer.add_connection(comp1, comp2, weight)

    # 檢查是否已有訓練好的模型
    model_path = 'rl_advanced_model'

    if os.path.exists(f"{model_path}.zip"):
        print(f"\n找到已訓練的模型: {model_path}.zip")
        print("選項: (1) 載入現有模型  (2) 重新訓練")
        choice = input("請選擇 [1/2]: ").strip()

        if choice == '1':
            placer.load_model(model_path)
        else:
            if not train_and_save_model(placer, model_path):
                return
    else:
        if not train_and_save_model(placer, model_path):
            return

    # 評估模型
    avg_cost, min_cost = evaluate_model(placer, num_tests=5)

    # 與隨機策略比較
    improvement = compare_with_random(placer, num_tests=5)

    # 視覺化最佳結果
    best_result = visualize_best_result(placer)

    # 總結
    print("\n" + "=" * 60)
    print("總結")
    print("=" * 60)
    print(f"✓ 模型已訓練並儲存")
    print(f"✓ 平均成本: {avg_cost:.2f} mm")
    print(f"✓ 最佳成本: {min_cost:.2f} mm")
    print(f"✓ 相比隨機策略改進: {improvement:.1f}%")
    print(f"✓ 視覺化已儲存: rl_best_placement.png")

    print("\n進階範例執行完成！")


if __name__ == "__main__":
    main()
