"""
PCB 層疊優化器範例
展示如何使用 LayerOptimizer 設計 PCB 層疊結構
"""

import sys
sys.path.insert(0, '../src')

from optimizer import LayerOptimizer


def main():
    """主函數"""
    print("=" * 60)
    print("PCB 層疊優化器 - 基本範例")
    print("=" * 60)

    # 創建優化器
    print("\n[1] 創建層疊優化器...")
    optimizer = LayerOptimizer()
    print("    ✓ 優化器已創建")

    # 場景 1: 簡單的雙層板
    print("\n" + "=" * 60)
    print("場景 1: 雙層板設計")
    print("=" * 60)

    requirements_2layer = {
        'signal_layers': 2,
        'power_planes': 0
    }

    optimizer.set_requirements(requirements_2layer)
    print("\n需求:")
    print(f"  - 信號層: {requirements_2layer['signal_layers']}")
    print(f"  - 電源層: {requirements_2layer['power_planes']}")

    stackup_2layer = optimizer.optimize()
    optimizer.print_stackup(stackup_2layer)

    cost_2layer = optimizer.estimate_cost(stackup_2layer)
    print(f"\n估算成本: ${cost_2layer:.2f}")

    # 場景 2: 標準四層板
    print("\n" + "=" * 60)
    print("場景 2: 四層板設計")
    print("=" * 60)

    requirements_4layer = {
        'signal_layers': 2,
        'power_planes': 1
    }

    optimizer.set_requirements(requirements_4layer)
    print("\n需求:")
    print(f"  - 信號層: {requirements_4layer['signal_layers']}")
    print(f"  - 電源層: {requirements_4layer['power_planes']}")
    print("\n適用場景:")
    print("  - 中等複雜度電路")
    print("  - 需要良好的信號完整性")
    print("  - 需要電源層和地層分離")

    stackup_4layer = optimizer.optimize()
    optimizer.print_stackup(stackup_4layer)

    cost_4layer = optimizer.estimate_cost(stackup_4layer)
    print(f"\n估算成本: ${cost_4layer:.2f}")

    # 場景 3: 六層板
    print("\n" + "=" * 60)
    print("場景 3: 六層板設計")
    print("=" * 60)

    requirements_6layer = {
        'signal_layers': 4,
        'power_planes': 1
    }

    optimizer.set_requirements(requirements_6layer)
    print("\n需求:")
    print(f"  - 信號層: {requirements_6layer['signal_layers']}")
    print(f"  - 電源層: {requirements_6layer['power_planes']}")
    print("\n適用場景:")
    print("  - 高速數位電路")
    print("  - DDR 記憶體接口")
    print("  - 高密度布線")

    stackup_6layer = optimizer.optimize()
    optimizer.print_stackup(stackup_6layer)

    cost_6layer = optimizer.estimate_cost(stackup_6layer)
    print(f"\n估算成本: ${cost_6layer:.2f}")

    # 成本比較
    print("\n" + "=" * 60)
    print("成本比較")
    print("=" * 60)
    print(f"\n2 層板: ${cost_2layer:.2f}")
    print(f"4 層板: ${cost_4layer:.2f} (+${cost_4layer - cost_2layer:.2f})")
    print(f"6 層板: ${cost_6layer:.2f} (+${cost_6layer - cost_2layer:.2f})")

    print("\n" + "=" * 60)
    print("範例執行完成！")
    print("=" * 60)


def high_speed_design():
    """高速電路板設計範例"""
    print("\n" + "=" * 60)
    print("進階範例：高速電路板層疊設計")
    print("=" * 60)

    optimizer = LayerOptimizer()

    print("\n高速電路板設計建議:")
    print("  1. 使用對稱層疊結構")
    print("  2. 信號層應緊鄰參考層（電源或地層）")
    print("  3. 高速信號優先使用內層")
    print("  4. 考慮阻抗控制")

    # 高速 8 層板範例
    print("\n8 層高速板建議層疊:")
    layers_8 = [
        {'name': 'Top Signal', 'type': 'signal', 'thickness': 0.035, 'note': '低速信號、元件'},
        {'name': 'GND', 'type': 'plane', 'thickness': 0.035, 'note': '完整地層'},
        {'name': 'Signal L3', 'type': 'signal', 'thickness': 0.035, 'note': '高速信號'},
        {'name': 'Power', 'type': 'plane', 'thickness': 0.035, 'note': '電源層'},
        {'name': 'GND', 'type': 'plane', 'thickness': 0.035, 'note': '地層'},
        {'name': 'Signal L6', 'type': 'signal', 'thickness': 0.035, 'note': '高速信號'},
        {'name': 'GND', 'type': 'plane', 'thickness': 0.035, 'note': '完整地層'},
        {'name': 'Bottom Signal', 'type': 'signal', 'thickness': 0.035, 'note': '低速信號、元件'}
    ]

    print("\n" + "=" * 50)
    for i, layer in enumerate(layers_8, 1):
        print(f"L{i}: {layer['name']:15s} ({layer['type']:8s}) - {layer['note']}")
    print("=" * 50)

    print("\n優點:")
    print("  ✓ 對稱結構，減少翹曲")
    print("  ✓ 每個信號層都有緊鄰的參考層")
    print("  ✓ 良好的 EMI 性能")
    print("  ✓ 適合阻抗控制")


def impedance_controlled_stackup():
    """阻抗控制層疊設計"""
    print("\n" + "=" * 60)
    print("進階範例：阻抗控制層疊")
    print("=" * 60)

    print("\n4 層阻抗控制板範例:")
    print("\n層疊結構:")
    print("  L1: Top Signal (0.035 mm)")
    print("      ↕ 介電層 (0.2 mm, εr=4.5)")
    print("  L2: GND Plane (0.035 mm)")
    print("      ↕ 芯板 (1.065 mm, εr=4.5)")
    print("  L3: Power Plane (0.035 mm)")
    print("      ↕ 介電層 (0.2 mm, εr=4.5)")
    print("  L4: Bottom Signal (0.035 mm)")
    print("  ────────────────────────────")
    print("  總厚度: 1.6 mm")

    print("\n特性阻抗計算（微帶線，L1 到 L2）:")
    print("  線寬 0.15 mm → 約 50 Ω")
    print("  線寬 0.25 mm → 約 43 Ω")
    print("  線寬 0.35 mm → 約 38 Ω")

    print("\n差分阻抗計算（微帶線，L1 到 L2）:")
    print("  線寬 0.15 mm, 間距 0.15 mm → 約 90 Ω")
    print("  線寬 0.15 mm, 間距 0.20 mm → 約 100 Ω")

    print("\n注意事項:")
    print("  • 實際阻抗需要使用專業工具計算（如 Saturn PCB Toolkit）")
    print("  • 製造公差會影響實際阻抗")
    print("  • 需要與 PCB 廠商確認製程能力")


def material_selection():
    """材料選擇指南"""
    print("\n" + "=" * 60)
    print("進階範例：PCB 材料選擇")
    print("=" * 60)

    materials = [
        {
            'name': 'FR-4 標準',
            'cost': '低',
            'tg': '130-140°C',
            'df': '0.02',
            'applications': '一般消費性電子'
        },
        {
            'name': 'FR-4 高 Tg',
            'cost': '中',
            'tg': '170-180°C',
            'df': '0.015',
            'applications': '汽車電子、工業控制'
        },
        {
            'name': 'Rogers 4350B',
            'cost': '高',
            'tg': '>280°C',
            'df': '0.0037',
            'applications': '高頻 RF、微波電路'
        },
        {
            'name': 'Isola IS410',
            'cost': '中高',
            'tg': '180°C',
            'df': '0.012',
            'applications': '高速數位、伺服器'
        }
    ]

    print("\n常見 PCB 材料比較:\n")
    print(f"{'材料':<20} {'成本':<8} {'Tg':<15} {'Df':<10} {'應用':<20}")
    print("-" * 80)

    for mat in materials:
        print(f"{mat['name']:<20} {mat['cost']:<8} {mat['tg']:<15} "
              f"{mat['df']:<10} {mat['applications']:<20}")

    print("\n選擇建議:")
    print("  • 標準 FR-4: 成本敏感、頻率 < 1 GHz")
    print("  • 高 Tg FR-4: 高溫環境、無鉛製程")
    print("  • 低損耗材料: 頻率 > 1 GHz、高速數位")
    print("  • 特殊材料: RF/微波、極高速應用")


if __name__ == "__main__":
    main()

    # 取消註解以執行進階範例
    # print("\n")
    # high_speed_design()
    # print("\n")
    # impedance_controlled_stackup()
    # print("\n")
    # material_selection()
