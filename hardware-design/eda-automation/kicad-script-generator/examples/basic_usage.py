"""
基本使用範例
"""

from src.generator import KiCADScriptGenerator


def main():
    # 初始化生成器
    gen = KiCADScriptGenerator(model="gpt-4")

    # 範例 1: 元件對齊
    print("=" * 60)
    print("範例 1: 生成元件對齊腳本")
    print("=" * 60)

    task1 = """
    將所有電阻(R開頭的元件)排列成網格,
    10 列,起始位置 (50, 50) mm,
    水平間距 5mm,垂直間距 5mm
    """

    script1 = gen.generate(task1)
    script1.save("output/align_resistors.py")

    # 範例 2: 走線寬度調整
    print("\n" + "=" * 60)
    print("範例 2: 生成走線寬度調整腳本")
    print("=" * 60)

    task2 = """
    批次修改走線寬度:
    - VCC 和 GND 網路: 0.5mm
    - 電源網路 (+5V, +3V3): 0.4mm
    - 訊號網路: 0.2mm
    """

    script2 = gen.generate(task2)
    script2.save("output/update_track_widths.py")

    # 範例 3: 驗證腳本
    print("\n" + "=" * 60)
    print("範例 3: 驗證生成的腳本")
    print("=" * 60)

    is_valid, issues = script2.validate()
    print(f"腳本有效: {is_valid}")
    if issues:
        print("發現的問題:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("✅ 沒有發現問題!")


if __name__ == "__main__":
    import os
    os.makedirs("output", exist_ok=True)
    main()
