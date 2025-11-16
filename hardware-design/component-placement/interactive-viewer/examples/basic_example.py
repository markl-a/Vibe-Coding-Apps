"""
互動式視覺化工具基本範例
"""

import sys
sys.path.insert(0, '../src')

from layout_viewer import LayoutViewer


def main():
    """主函數"""
    print("=== 互動式佈局視覺化工具範例 ===\n")

    # 初始化視覺化器
    viewer = LayoutViewer(board_size=(100, 80))

    # 添加元件
    print("添加元件...")
    viewer.add_component("MCU", size=(15, 12), position=(20, 30),
                        power=5.0, category="IC")
    viewer.add_component("FLASH", size=(8, 6), position=(40, 35),
                        power=0.5, category="IC")
    viewer.add_component("RAM", size=(8, 6), position=(40, 20),
                        power=0.8, category="IC")

    viewer.add_component("VREG", size=(10, 8), position=(10, 10),
                        power=3.0, category="Power")

    viewer.add_component("R1", size=(5, 3), position=(55, 40),
                        power=0.1, category="Passive")
    viewer.add_component("R2", size=(5, 3), position=(55, 30),
                        power=0.1, category="Passive")
    viewer.add_component("R3", size=(5, 3), position=(55, 20),
                        power=0.1, category="Passive")

    viewer.add_component("C1", size=(4, 4), position=(15, 50),
                        power=0.0, category="Passive")
    viewer.add_component("C2", size=(4, 4), position=(25, 50),
                        power=0.0, category="Passive")
    viewer.add_component("C3", size=(4, 4), position=(35, 50),
                        power=0.0, category="Passive")

    viewer.add_component("LED1", size=(3, 3), position=(70, 40),
                        power=0.05, category="LED")
    viewer.add_component("LED2", size=(3, 3), position=(70, 30),
                        power=0.05, category="LED")

    # 添加連接
    print("添加連接...")
    viewer.add_connection("MCU", "FLASH", weight=2.0)
    viewer.add_connection("MCU", "RAM", weight=2.0)
    viewer.add_connection("MCU", "VREG", weight=1.5)
    viewer.add_connection("MCU", "R1", weight=1.0)
    viewer.add_connection("MCU", "R2", weight=1.0)
    viewer.add_connection("MCU", "R3", weight=1.0)

    viewer.add_connection("VREG", "C1", weight=3.0)
    viewer.add_connection("VREG", "C2", weight=3.0)
    viewer.add_connection("MCU", "C3", weight=2.0)

    viewer.add_connection("R1", "LED1", weight=1.5)
    viewer.add_connection("R2", "LED2", weight=1.5)

    # 列印摘要
    print("\n")
    viewer.print_summary()

    # 儲存為 JSON
    print("\n儲存佈局...")
    viewer.save_to_json('layout_example.json')

    # 顯示 Matplotlib 視圖
    print("\n生成基本視圖...")
    viewer.show_matplotlib(save_path='layout_basic.png')

    # 顯示統計分析
    print("\n生成統計分析...")
    viewer.show_statistics(save_path='layout_statistics.png')

    # 顯示 Plotly 互動視圖（如果已安裝）
    try:
        print("\n生成互動視圖...")
        viewer.show_plotly(save_path='layout_interactive.html')
    except ImportError:
        print("跳過 Plotly 互動視圖（未安裝 plotly）")

    print("\n範例完成！")
    print("\n生成的檔案:")
    print("  - layout_example.json (佈局數據)")
    print("  - layout_basic.png (基本視圖)")
    print("  - layout_statistics.png (統計分析)")
    print("  - layout_interactive.html (互動視圖)")


if __name__ == "__main__":
    main()
