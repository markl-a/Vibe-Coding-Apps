"""
基本 BOM 提取範例
"""

import sys
sys.path.insert(0, '../src')

from bom_manager import BOMManager


def main():
    print("=" * 60)
    print("BOM Manager - 基本提取範例")
    print("=" * 60)

    # 初始化 BOM 管理器
    bom = BOMManager()

    # 範例 1: 從 KiCAD 提取
    print("\n[範例 1] 從 KiCAD PCB 提取 BOM")
    print("-" * 60)

    # 假設有一個 board.kicad_pcb 檔案
    # bom.extract_from_kicad("board.kicad_pcb")

    # 範例用途,手動建立一些測試資料
    from src.bom_manager import BOMItem

    bom.items = [
        BOMItem(
            references=['C1', 'C2', 'C3', 'C4'],
            value='100nF',
            footprint='C_0603',
            mpn='CL10B104KB8NNNC',
            manufacturer='Samsung'
        ),
        BOMItem(
            references=['R1', 'R2', 'R3'],
            value='10K',
            footprint='R_0603',
            mpn='RC0603FR-0710KL',
            manufacturer='Yageo'
        ),
        BOMItem(
            references=['U1'],
            value='ATmega328P',
            footprint='TQFP-32',
            mpn='ATMEGA328P-AU',
            manufacturer='Microchip'
        ),
    ]

    # 顯示統計
    print(f"\n📊 BOM 統計:")
    print(f"  總元件數: {bom.total_components}")
    print(f"  唯一元件: {bom.unique_components}")

    # 顯示 BOM 項目
    print(f"\n📋 BOM 項目:")
    for idx, item in enumerate(bom.items, 1):
        print(f"  {idx}. {item.quantity}x {item.value} ({item.footprint})")
        print(f"      引用: {item.reference_str}")
        if item.mpn:
            print(f"      MPN: {item.mpn} ({item.manufacturer})")

    # 範例 2: 優化 BOM
    print("\n[範例 2] 優化 BOM")
    print("-" * 60)

    bom.optimize()

    # 範例 3: 輸出
    print("\n[範例 3] 輸出 BOM")
    print("-" * 60)

    import os
    os.makedirs("output", exist_ok=True)

    # 輸出 CSV
    bom.export_csv("output/bom.csv")

    # 輸出 Excel
    bom.export_excel("output/bom.xlsx")

    print("\n✅ 完成!")


if __name__ == "__main__":
    main()
