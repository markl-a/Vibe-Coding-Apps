#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整工作流程示例
展示 EDA 自動化工具的完整功能
"""

import sys
import os

# 添加父目錄到路徑
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.script_generator import ScriptGenerator
from src.ai_optimizer import AIDesignOptimizer
from src.supplier_integration import SupplierIntegration


def demo_script_generation():
    """示例 1: AI 腳本生成"""
    print("\n" + "=" * 60)
    print("示例 1: AI 腳本生成")
    print("=" * 60)

    # 初始化生成器（會使用模擬模式如果沒有 API 金鑰）
    gen = ScriptGenerator(tool="kicad", model="gpt-4")

    # 定義任務
    task = """
    將所有電阻（R開頭的元件）排列成整齊的網格：
    - 起始位置: (50mm, 50mm)
    - 列數: 10
    - 間距: 5mm
    - 方向: 水平（0度）
    """

    # 生成腳本
    print("\n📝 任務描述:")
    print(task)
    print("\n🤖 生成腳本中...")

    script = gen.generate(task)

    # 顯示生成的腳本
    print("\n✅ 腳本生成完成！")
    print("\n生成的腳本內容:")
    print("-" * 60)
    print(script.code[:500] + "..." if len(script.code) > 500 else script.code)
    print("-" * 60)

    # 保存腳本
    output_file = "output/generated_resistor_layout.py"
    os.makedirs("output", exist_ok=True)
    script.save(output_file)

    # 驗證腳本
    is_valid, errors = script.validate()
    print(f"\n腳本驗證: {'✅ 通過' if is_valid else '❌ 失敗'}")
    if errors:
        print("錯誤:")
        for error in errors:
            print(f"  - {error}")

    # 顯示腳本資訊
    info = script.get_info()
    print(f"\n腳本資訊:")
    print(f"  - 工具: {info['tool']}")
    print(f"  - 模型: {info['model']}")
    print(f"  - 行數: {info['lines']}")
    print(f"  - 大小: {info['size']} 字元")
    print(f"  - 生成時間: {info['created_at']}")


def demo_design_optimization():
    """示例 2: 設計優化分析"""
    print("\n" + "=" * 60)
    print("示例 2: 設計優化分析")
    print("=" * 60)

    # 初始化優化器
    optimizer = AIDesignOptimizer(model="gpt-4")

    # 模擬板子資訊（實際使用時會從 PCB 文件提取）
    print("\n📋 模擬 PCB 設計分析...")
    print("（實際使用時需要 KiCAD 環境和 .kicad_pcb 文件）")

    # 創建模擬建議
    from src.ai_optimizer import DesignSuggestion

    suggestions = [
        DesignSuggestion(
            category='power',
            severity='warning',
            title='IC U1 缺少去耦電容',
            description='建議在 IC U1 電源引腳附近添加 0.1µF 和 10µF 去耦電容',
            location=(75.5, 45.2),
            component='U1'
        ),
        DesignSuggestion(
            category='signal_integrity',
            severity='critical',
            title='高速訊號走線過長',
            description='USB 差分對走線長度超過建議值，可能影響訊號完整性',
            location=(120.3, 68.7)
        ),
        DesignSuggestion(
            category='layout',
            severity='suggestion',
            title='元件密度偏高',
            description='建議增加元件間距以改善散熱和維修性',
        ),
        DesignSuggestion(
            category='routing',
            severity='suggestion',
            title='過孔數量可以優化',
            description='部分走線可以在單層完成，減少過孔使用',
        ),
        DesignSuggestion(
            category='manufacturing',
            severity='suggestion',
            title='絲印優化',
            description='部分元件標記被焊盤遮擋，建議調整位置',
        )
    ]

    print(f"\n找到 {len(suggestions)} 個設計建議:\n")

    for i, sug in enumerate(suggestions, 1):
        print(f"{i}. {sug}")

    # 生成報告
    print("\n📄 生成優化報告...")
    os.makedirs("output", exist_ok=True)
    optimizer.generate_optimization_report(
        suggestions,
        "output/design_optimization_report.html",
        format='html'
    )
    print("✅ HTML 報告已生成: output/design_optimization_report.html")

    optimizer.generate_optimization_report(
        suggestions,
        "output/design_optimization_report.md",
        format='md'
    )
    print("✅ Markdown 報告已生成: output/design_optimization_report.md")


def demo_cost_estimation():
    """示例 3: BOM 成本估算"""
    print("\n" + "=" * 60)
    print("示例 3: BOM 成本估算")
    print("=" * 60)

    # 初始化供應商整合
    integration = SupplierIntegration(suppliers=['digikey', 'mouser', 'lcsc'])

    # 示例 BOM
    bom = [
        {
            'mpn': 'STM32F103C8T6',
            'manufacturer': 'STMicroelectronics',
            'quantity': 1,
            'description': 'ARM Cortex-M3 MCU'
        },
        {
            'mpn': 'TLV1117-33',
            'manufacturer': 'Texas Instruments',
            'quantity': 1,
            'description': '3.3V LDO 穩壓器'
        },
        {
            'mpn': 'CC0603KRX7R9BB104',
            'manufacturer': 'Yageo',
            'quantity': 10,
            'description': '0.1µF 電容 0603'
        },
        {
            'mpn': 'RC0603FR-0710KL',
            'manufacturer': 'Yageo',
            'quantity': 5,
            'description': '10kΩ 電阻 0603'
        },
        {
            'mpn': 'USB-MICRO-B-FCI',
            'manufacturer': 'Amphenol',
            'quantity': 1,
            'description': 'USB Micro-B 連接器'
        }
    ]

    print(f"\n📋 BOM 清單 ({len(bom)} 項目):")
    for i, item in enumerate(bom, 1):
        print(f"{i}. {item['mpn']} - {item['description']} x{item['quantity']}")

    # 估算成本
    print("\n💰 估算成本（100 片板子）...")
    estimate = integration.estimate_bom_cost(bom, quantity=100, preferred_supplier='lcsc')

    print(f"\n✅ 成本估算完成:")
    print(f"  - 總成本: ${estimate['total_cost']:.2f} {estimate['currency']}")
    print(f"  - 單板成本: ${estimate['cost_per_board']:.2f} {estimate['currency']}")
    print(f"  - 可用元件: {estimate['available_components']}/{estimate['component_count']}")
    print(f"  - 最長交期: {estimate['max_lead_time_days']} 天")

    # 顯示部分明細
    print(f"\n元件成本明細（前 3 項）:")
    for comp in estimate['components'][:3]:
        print(f"  - {comp['mpn']}: ${comp['unit_price']:.4f} x {comp['quantity']} = ${comp['total_price']:.2f}")
        print(f"    供應商: {comp['supplier']} | 庫存: {comp['stock']} | SKU: {comp['sku']}")

    # 生成報告
    print("\n📄 生成成本報告...")
    os.makedirs("output", exist_ok=True)
    integration.generate_cost_report(estimate, "output/bom_cost_report.html", format='html')
    print("✅ HTML 報告已生成: output/bom_cost_report.html")

    integration.generate_cost_report(estimate, "output/bom_cost_report.csv", format='csv')
    print("✅ CSV 報告已生成: output/bom_cost_report.csv")


def demo_component_search():
    """示例 4: 元件搜尋和價格比較"""
    print("\n" + "=" * 60)
    print("示例 4: 元件搜尋和價格比較")
    print("=" * 60)

    integration = SupplierIntegration(suppliers=['digikey', 'mouser', 'lcsc'])

    # 搜尋元件
    mpn = 'STM32F103C8T6'
    manufacturer = 'STMicroelectronics'
    quantity = 100

    print(f"\n🔍 搜尋元件: {mpn}")
    print(f"製造商: {manufacturer}")
    print(f"數量: {quantity}")

    # 比較價格
    comparisons = integration.compare_prices(mpn, manufacturer, quantity)

    if comparisons:
        print(f"\n找到 {len(comparisons)} 個選項:\n")

        for i, (supplier, price, total) in enumerate(comparisons, 1):
            unit_price = price.get_unit_price(quantity)
            print(f"{i}. {supplier}")
            print(f"   SKU: {price.sku}")
            print(f"   單價: ${unit_price:.4f}")
            print(f"   總價: ${total:.2f}")
            print(f"   庫存: {price.stock}")
            print(f"   MOQ: {price.moq}")
            print(f"   交期: {price.lead_time_days} 天")
            print()

        # 最佳選項
        best_supplier, best_price, best_total = comparisons[0]
        print(f"✅ 最佳選項: {best_supplier} - ${best_total:.2f}")
    else:
        print("❌ 未找到匹配的元件")


def main():
    """主函數"""
    print("\n" + "=" * 60)
    print("🤖 EDA 自動化工具 - 完整工作流程示例")
    print("=" * 60)

    try:
        # 運行所有示例
        demo_script_generation()
        demo_design_optimization()
        demo_cost_estimation()
        demo_component_search()

        print("\n" + "=" * 60)
        print("✅ 所有示例執行完成！")
        print("=" * 60)
        print("\n生成的文件:")
        print("  - output/generated_resistor_layout.py")
        print("  - output/design_optimization_report.html")
        print("  - output/design_optimization_report.md")
        print("  - output/bom_cost_report.html")
        print("  - output/bom_cost_report.csv")

    except KeyboardInterrupt:
        print("\n\n⚠️  用戶中斷")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 錯誤: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
