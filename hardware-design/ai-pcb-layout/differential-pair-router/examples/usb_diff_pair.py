"""
差分對路由器範例
展示如何使用 DiffPairRouter 為 USB 或其他高速信號進行差分對走線
"""

import sys
sys.path.insert(0, '../src')

from router import DiffPairRouter
import math


def main():
    """主函數"""
    print("=" * 60)
    print("差分對路由器 - USB 範例")
    print("=" * 60)

    # 創建路由器
    print("\n[1] 創建差分對路由器...")
    board_size = (100, 80)
    router = DiffPairRouter(board_size=board_size)
    print(f"    板子大小: {board_size[0]} x {board_size[1]} mm")

    # 場景 1: USB 2.0 差分對（90Ω）
    print("\n[2] 添加 USB 2.0 差分對...")
    print("    USB 2.0 規格:")
    print("      - 目標阻抗: 90 Ω")
    print("      - 建議間距: 0.2 mm")
    print("      - 建議線寬: 0.15 mm")

    router.add_diff_pair(
        pos_start=(10, 40),
        pos_end=(90, 40),
        neg_start=(10, 39.8),
        neg_end=(90, 39.8),
        target_impedance=90.0,
        spacing=0.2,
        width=0.15
    )
    print("    ✓ USB D+ 和 D- 差分對已添加")

    # 執行路由
    print("\n[3] 執行差分對走線...")
    result = router.route(length_matching=True, max_length_diff=0.5)

    # 顯示結果
    print(f"\n[4] 走線結果:")
    if result['success']:
        print("    ✓ 走線成功")
        print(f"    正極長度: {result['positive_length']:.3f} mm")
        print(f"    負極長度: {result['negative_length']:.3f} mm")
        print(f"    長度差: {result['length_diff']:.3f} mm")
        print(f"    計算阻抗: {result['impedance']:.1f} Ω")
        print(f"    目標阻抗: 90.0 Ω")

        impedance_diff = abs(result['impedance'] - 90.0)
        if impedance_diff < 5:
            print(f"    ✓ 阻抗匹配良好 (差異: {impedance_diff:.1f} Ω)")
        else:
            print(f"    ⚠ 阻抗差異較大 (差異: {impedance_diff:.1f} Ω)")

        if result['matched']:
            print(f"    ✓ 長度匹配良好")
        else:
            print(f"    ⚠ 長度差異過大，建議調整")
    else:
        print(f"    ✗ 走線失敗: {result.get('message', '未知錯誤')}")

    print("\n" + "=" * 60)
    print("範例執行完成！")
    print("=" * 60)


def hdmi_example():
    """HDMI 差分對範例"""
    print("\n" + "=" * 60)
    print("進階範例：HDMI 差分對")
    print("=" * 60)

    router = DiffPairRouter(board_size=(120, 100))

    # HDMI 有多對差分信號
    hdmi_pairs = [
        {
            'name': 'TMDS_Data0',
            'impedance': 100,
            'pos_start': (10, 20),
            'pos_end': (110, 20),
            'neg_start': (10, 19.7),
            'neg_end': (110, 19.7)
        },
        {
            'name': 'TMDS_Data1',
            'impedance': 100,
            'pos_start': (10, 30),
            'pos_end': (110, 30),
            'neg_start': (10, 29.7),
            'neg_end': (110, 29.7)
        },
        {
            'name': 'TMDS_Data2',
            'impedance': 100,
            'pos_start': (10, 40),
            'pos_end': (110, 40),
            'neg_start': (10, 39.7),
            'neg_end': (110, 39.7)
        },
        {
            'name': 'TMDS_Clock',
            'impedance': 100,
            'pos_start': (10, 50),
            'pos_end': (110, 50),
            'neg_start': (10, 49.7),
            'neg_end': (110, 49.7)
        }
    ]

    print("\n添加 HDMI TMDS 差分對:")
    for pair in hdmi_pairs:
        router.add_diff_pair(
            pos_start=pair['pos_start'],
            pos_end=pair['pos_end'],
            neg_start=pair['neg_start'],
            neg_end=pair['neg_end'],
            target_impedance=pair['impedance'],
            spacing=0.3,
            width=0.15
        )
        print(f"  ✓ {pair['name']} (目標阻抗: {pair['impedance']} Ω)")

    # 注意：當前實現只處理第一對，這裡僅作示範
    print("\n執行路由...")
    result = router.route(length_matching=True, max_length_diff=0.3)

    print(f"\n結果（僅顯示第一對）:")
    print(f"  計算阻抗: {result['impedance']:.1f} Ω")
    print(f"  長度差: {result['length_diff']:.3f} mm")


def pcie_example():
    """PCIe 差分對範例"""
    print("\n" + "=" * 60)
    print("進階範例：PCIe 差分對")
    print("=" * 60)

    router = DiffPairRouter(board_size=(150, 100))

    print("\nPCIe Gen 3 規格:")
    print("  - 目標阻抗: 85 Ω (±10%)")
    print("  - 最大長度差: 0.3 mm (within pair)")
    print("  - 建議間距: 0.18 mm")
    print("  - 建議線寬: 0.13 mm")

    router.add_diff_pair(
        pos_start=(10, 50),
        pos_end=(140, 50),
        neg_start=(10, 49.82),
        neg_end=(140, 49.82),
        target_impedance=85.0,
        spacing=0.18,
        width=0.13
    )

    print("\n執行 PCIe 差分對走線...")
    result = router.route(length_matching=True, max_length_diff=0.3)

    print(f"\n結果:")
    print(f"  正極長度: {result['positive_length']:.3f} mm")
    print(f"  負極長度: {result['negative_length']:.3f} mm")
    print(f"  長度差: {result['length_diff']:.3f} mm")
    print(f"  計算阻抗: {result['impedance']:.1f} Ω")

    # 檢查是否符合 PCIe 規範
    impedance_ok = 76.5 <= result['impedance'] <= 93.5  # 85Ω ±10%
    length_ok = result['length_diff'] <= 0.3

    print(f"\n規範檢查:")
    print(f"  阻抗範圍 (76.5-93.5 Ω): {'✓ 通過' if impedance_ok else '✗ 不通過'}")
    print(f"  長度差 (≤0.3 mm): {'✓ 通過' if length_ok else '✗ 不通過'}")


def impedance_calculator():
    """阻抗計算工具"""
    print("\n" + "=" * 60)
    print("差分阻抗計算工具")
    print("=" * 60)

    print("\n常見高速接口的差分阻抗要求:")
    interfaces = [
        {'name': 'USB 2.0', 'impedance': 90, 'tolerance': 10},
        {'name': 'USB 3.0/3.1', 'impedance': 90, 'tolerance': 10},
        {'name': 'HDMI', 'impedance': 100, 'tolerance': 10},
        {'name': 'PCIe Gen 1/2/3', 'impedance': 85, 'tolerance': 10},
        {'name': 'Ethernet (100BASE-TX)', 'impedance': 100, 'tolerance': 5},
        {'name': 'Ethernet (1000BASE-T)', 'impedance': 100, 'tolerance': 5},
        {'name': 'MIPI DSI/CSI', 'impedance': 100, 'tolerance': 10},
        {'name': 'LVDS', 'impedance': 100, 'tolerance': 10},
    ]

    for intf in interfaces:
        z_min = intf['impedance'] - intf['tolerance']
        z_max = intf['impedance'] + intf['tolerance']
        print(f"\n  {intf['name']}:")
        print(f"    目標阻抗: {intf['impedance']} Ω")
        print(f"    容差: ±{intf['tolerance']}%")
        print(f"    範圍: {z_min:.1f} - {z_max:.1f} Ω")


if __name__ == "__main__":
    main()

    # 取消註解以執行進階範例
    # print("\n")
    # hdmi_example()
    # print("\n")
    # pcie_example()
    # print("\n")
    # impedance_calculator()
