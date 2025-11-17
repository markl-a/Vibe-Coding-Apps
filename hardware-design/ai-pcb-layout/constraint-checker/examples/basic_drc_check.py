"""
PCB 設計規則檢查器範例
展示如何使用 PCBChecker 檢查設計規則違規
"""

import sys
sys.path.insert(0, '../src')

from checker import PCBChecker


def main():
    """主函數"""
    print("=" * 60)
    print("PCB 設計規則檢查器 - 基本範例")
    print("=" * 60)

    # 創建檢查器
    print("\n[1] 創建檢查器...")
    checker = PCBChecker()
    print(f"    預設規則已載入")
    print(f"    - 最小線寬: {checker.rules['min_trace_width']} mm")
    print(f"    - 最小間距: {checker.rules['min_trace_spacing']} mm")
    print(f"    - 最小過孔直徑: {checker.rules['min_via_diameter']} mm")

    # 自定義設計規則
    print("\n[2] 設定自定義規則...")
    custom_rules = {
        'min_trace_width': 0.2,
        'min_trace_spacing': 0.2,
        'power_min_width': 0.6
    }
    checker.set_rules(custom_rules)
    print(f"    已更新規則:")
    for key, value in custom_rules.items():
        print(f"      - {key}: {value} mm")

    # 添加走線
    print("\n[3] 添加走線...")
    traces = [
        {'start': (10, 10), 'end': (50, 10), 'width': 0.25, 'layer': 0, 'net_class': 'signal', 'name': 'SIGNAL1'},
        {'start': (10, 20), 'end': (50, 20), 'width': 0.15, 'layer': 0, 'net_class': 'signal', 'name': 'SIGNAL2'},  # 太窄
        {'start': (10, 30), 'end': (50, 30), 'width': 0.7, 'layer': 0, 'net_class': 'power', 'name': 'VCC'},
        {'start': (10, 40), 'end': (50, 40), 'width': 0.4, 'layer': 0, 'net_class': 'power', 'name': 'GND'},  # 電源線稍窄
    ]

    for trace in traces:
        checker.add_trace(
            start=trace['start'],
            end=trace['end'],
            width=trace['width'],
            layer=trace['layer'],
            net_class=trace['net_class']
        )
        print(f"    添加走線 {trace['name']}: 線寬 {trace['width']} mm ({trace['net_class']})")

    # 添加過孔
    print("\n[4] 添加過孔...")
    vias = [
        {'x': 25, 'y': 25, 'diameter': 0.5, 'drill': 0.25, 'name': 'VIA1'},
        {'x': 35, 'y': 35, 'diameter': 0.25, 'drill': 0.15, 'name': 'VIA2'},  # 太小
        {'x': 45, 'y': 45, 'diameter': 0.4, 'drill': 0.25, 'name': 'VIA3'},  # 環狀環太小
    ]

    for via in vias:
        checker.add_via(
            x=via['x'],
            y=via['y'],
            diameter=via['diameter'],
            drill=via['drill']
        )
        annular = (via['diameter'] - via['drill']) / 2
        print(f"    添加過孔 {via['name']}: 直徑 {via['diameter']} mm, "
              f"鑽孔 {via['drill']} mm, 環狀環 {annular:.3f} mm")

    # 執行檢查
    print("\n[5] 執行設計規則檢查...")
    violations = checker.check_all()

    # 顯示結果
    print(f"\n[6] 檢查結果:")
    if not violations:
        print("    ✓ 恭喜！未發現任何違規")
    else:
        print(f"    發現 {len(violations)} 個違規:")

        # 統計
        errors = [v for v in violations if v['severity'] == 'error']
        warnings = [v for v in violations if v['severity'] == 'warning']

        print(f"      - 錯誤: {len(errors)}")
        print(f"      - 警告: {len(warnings)}")

        # 顯示詳細信息
        print("\n    詳細信息:")
        for i, v in enumerate(violations, 1):
            severity_symbol = "✗" if v['severity'] == 'error' else "⚠"
            print(f"      {i}. {severity_symbol} [{v['severity'].upper()}] {v['type']}")
            print(f"         {v['description']}")
            print(f"         位置: ({v['x']:.1f}, {v['y']:.1f}) mm")

    # 生成報告
    print("\n[7] 生成檢查報告...")
    output_file = 'drc_report.txt'
    checker.generate_report(violations, output=output_file)
    print(f"    ✓ 報告已儲存到: {output_file}")

    print("\n" + "=" * 60)
    print("範例執行完成！")
    print("=" * 60)


def advanced_example():
    """進階範例：從 YAML 載入規則"""
    print("\n" + "=" * 60)
    print("進階範例：使用 YAML 規則檔案")
    print("=" * 60)

    # 首先創建一個範例 YAML 檔案
    yaml_content = """trace:
  min_trace_width: 0.15
  min_trace_spacing: 0.15
  max_trace_length: 500

via:
  min_via_diameter: 0.3
  min_via_drill: 0.2
  min_annular_ring: 0.1

power:
  power_min_width: 0.5
"""

    with open('example_rules.yaml', 'w') as f:
        f.write(yaml_content)

    print("\n已創建範例規則檔案: example_rules.yaml")

    # 載入規則
    checker = PCBChecker()
    try:
        checker.load_rules('example_rules.yaml')
        print("✓ 規則載入成功")
        print("\n當前規則:")
        for key, value in checker.rules.items():
            print(f"  - {key}: {value}")
    except Exception as e:
        print(f"✗ 載入失敗: {e}")


if __name__ == "__main__":
    main()

    # 取消註解以執行進階範例
    # advanced_example()
