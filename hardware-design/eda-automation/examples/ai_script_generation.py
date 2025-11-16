"""
AI 腳本生成範例
展示如何使用 AI 生成 EDA 腳本
"""

import sys
sys.path.insert(0, '../src')

from script_generator import ScriptGenerator


def main():
    """主函數"""
    print("=== EDA 自動化工具 - AI 腳本生成範例 ===\n")

    # 建立腳本生成器
    gen = ScriptGenerator(tool="kicad", model="gpt-4")

    # 定義任務
    task = """
    將所有去耦電容放置在對應 IC 的附近,
    距離不超過 5mm, 並連接到最近的電源和地層
    """

    # 生成腳本
    script = gen.generate(task)

    # 查看生成的程式碼
    print("\n生成的腳本:")
    print("=" * 60)
    print(script.code)
    print("=" * 60)

    # 儲存腳本
    script.save("place_decoupling_caps.py")

    # 注意: 執行需要 KiCAD 環境
    # script.execute()

    print("\n範例執行完成！")


if __name__ == "__main__":
    main()
