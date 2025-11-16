"""
生成 SMD 封裝範例
"""

from src.wizard import FootprintWizard
import os


def main():
    print("=" * 60)
    print("SMD 封裝生成範例")
    print("=" * 60)

    wizard = FootprintWizard()

    # 建立輸出目錄
    os.makedirs("output/resistors", exist_ok=True)
    os.makedirs("output/capacitors", exist_ok=True)

    # 生成常見 SMD 尺寸
    sizes = ['0402', '0603', '0805', '1206']

    print("\n生成電阻封裝...")
    for size in sizes:
        footprint = wizard.generate_resistor(size)
        footprint.save(f"output/resistors/R_{size}.kicad_mod")
        print(f"  ✅ R_{size}")

    print("\n生成電容封裝...")
    for size in sizes:
        footprint = wizard.generate_capacitor(size)
        footprint.save(f"output/capacitors/C_{size}.kicad_mod")
        print(f"  ✅ C_{size}")

    print("\n✅ 完成! 封裝已生成至 output/ 目錄")


if __name__ == "__main__":
    main()
