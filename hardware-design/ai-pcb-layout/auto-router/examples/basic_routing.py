"""
基本 PCB 自動走線範例
展示如何使用 Auto-Router 進行簡單的走線任務
"""

import sys
sys.path.insert(0, '../src')

from router import PCBRouter
import numpy as np


def main():
    """主函數"""
    print("=" * 60)
    print("AI PCB Auto-Router - 基本範例")
    print("=" * 60)

    # 創建一個 100mm x 100mm 的電路板
    print("\n[1] 創建路由器...")
    router = PCBRouter(
        board_size=(100, 100),
        grid_resolution=0.5,  # 0.5mm 網格
        layers=2
    )
    print(f"    板子大小: {router.board_size} mm")
    print(f"    網格解析度: {router.grid_resolution} mm")
    print(f"    網格大小: {router.grid_width} x {router.grid_height}")
    print(f"    層數: {router.layers}")

    # 添加一些障礙物（模擬已擺放的元件）
    print("\n[2] 添加障礙物（元件）...")
    obstacles = [
        {'x': 20, 'y': 20, 'w': 10, 'h': 10, 'name': 'IC1'},
        {'x': 70, 'y': 70, 'w': 15, 'h': 15, 'name': 'IC2'},
        {'x': 40, 'y': 60, 'w': 8, 'h': 8, 'name': 'R1'},
        {'x': 50, 'y': 30, 'w': 6, 'h': 6, 'name': 'C1'},
    ]

    for obs in obstacles:
        router.add_obstacle(
            x=obs['x'],
            y=obs['y'],
            width=obs['w'],
            height=obs['h'],
            layer=0
        )
        print(f"    添加 {obs['name']} 於 ({obs['x']}, {obs['y']}) "
              f"大小 {obs['w']}x{obs['h']} mm")

    # 添加需要走線的連接
    print("\n[3] 添加連接...")
    connections = [
        {
            'start': (15, 25),
            'end': (75, 75),
            'width': 0.2,
            'net': 'VCC'
        },
        {
            'start': (35, 25),
            'end': (85, 80),
            'width': 0.2,
            'net': 'GND'
        },
        {
            'start': (25, 15),
            'end': (45, 65),
            'width': 0.15,
            'net': 'SIGNAL1'
        },
        {
            'start': (10, 10),
            'end': (90, 90),
            'width': 0.25,
            'net': 'CLK'
        },
    ]

    for i, conn in enumerate(connections):
        router.add_connection(
            start=conn['start'],
            end=conn['end'],
            width=conn['width'],
            net_name=conn['net']
        )
        print(f"    連接 {i+1}: {conn['net']} "
              f"從 {conn['start']} 到 {conn['end']}, "
              f"線寬 {conn['width']} mm")

    # 執行自動走線 - 使用 A* 演算法
    print("\n[4] 執行自動走線 (A* 演算法)...")
    result_astar = router.route(algorithm='astar', heuristic='manhattan')

    print(f"\n    結果:")
    print(f"    - 成功率: {result_astar['success_rate']*100:.1f}%")
    print(f"    - 完成: {result_astar['routed_count']}/{result_astar['total_connections']}")
    print(f"    - 總長度: {result_astar['total_length']:.2f} mm")

    if result_astar['failed_connections']:
        print(f"    - 失敗連接: {result_astar['failed_connections']}")

    # 檢查設計規則
    print("\n[5] 檢查設計規則...")
    violations = router.check_design_rules()

    if violations:
        print(f"    發現 {len(violations)} 個違規:")
        for v in violations:
            print(f"      - {v['type']}: 連接 {v['connection']}, "
                  f"值 {v['value']:.2f}, 限制 {v['limit']:.2f}")
    else:
        print("    ✓ 無違規")

    # 視覺化結果
    print("\n[6] 視覺化結果...")
    try:
        fig = router.visualize(result_astar, layer=0, show=False)
        # 如果要顯示圖形，將 show 設為 True
        # fig.savefig('routing_result.png', dpi=300)
        print("    ✓ 視覺化完成")
    except Exception as e:
        print(f"    視覺化失敗: {e}")

    # 顯示詳細路徑信息
    print("\n[7] 路徑詳細信息:")
    for i, conn in enumerate(router.connections):
        if conn['routed'] and conn['path']:
            length = router._calculate_path_length(conn['path'])
            print(f"    {conn['net_name'] or f'Net {i}'}:")
            print(f"      - 路徑長度: {length:.2f} mm")
            print(f"      - 路徑點數: {len(conn['path'])}")

    print("\n" + "=" * 60)
    print("範例執行完成！")
    print("=" * 60)


def compare_algorithms():
    """比較不同演算法的性能"""
    print("\n" + "=" * 60)
    print("演算法比較")
    print("=" * 60)

    # 創建相同的測試場景
    router = PCBRouter(board_size=(50, 50), grid_resolution=0.2)

    # 添加障礙物
    router.add_obstacle(10, 10, 8, 8)
    router.add_obstacle(30, 30, 10, 10)

    # 添加連接
    router.add_connection((5, 5), (45, 45), net_name="test1")
    router.add_connection((5, 45), (45, 5), net_name="test2")

    import time

    algorithms = ['astar', 'lee']
    results = {}

    for algo in algorithms:
        # 重置網格
        router.grids = [np.zeros((router.grid_height, router.grid_width), dtype=np.int8)
                       for _ in range(router.layers)]

        # 重新添加障礙物
        router.add_obstacle(10, 10, 8, 8)
        router.add_obstacle(30, 30, 10, 10)

        # 執行並計時
        start_time = time.time()
        result = router.route(algorithm=algo)
        elapsed = time.time() - start_time

        results[algo] = {
            'time': elapsed,
            'success_rate': result['success_rate'],
            'total_length': result['total_length']
        }

        print(f"\n{algo.upper()}:")
        print(f"  時間: {elapsed*1000:.2f} ms")
        print(f"  成功率: {result['success_rate']*100:.1f}%")
        print(f"  總長度: {result['total_length']:.2f} mm")


if __name__ == "__main__":
    main()

    # 取消註解以執行演算法比較
    # compare_algorithms()
