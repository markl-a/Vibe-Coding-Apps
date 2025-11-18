"""
電路可視化模組
使用 matplotlib 和 schemdraw 繪製電路圖
"""

import matplotlib.pyplot as plt
from typing import Dict, List, Optional, Tuple
import math


class CircuitVisualizer:
    """電路可視化工具"""

    def __init__(self):
        """初始化可視化器"""
        self.fig = None
        self.ax = None

    def draw_opamp_circuit(self, circuit_type: str,
                          parameters: Dict,
                          output_file: Optional[str] = None) -> str:
        """
        繪製運算放大器電路

        Args:
            circuit_type: 電路類型 (non_inverting, inverting, differential)
            parameters: 電路參數
            output_file: 輸出檔案路徑

        Returns:
            輸出檔案路徑
        """
        try:
            import schemdraw
            import schemdraw.elements as elm
        except ImportError:
            print("⚠ schemdraw 未安裝，無法繪製電路圖")
            print("提示: pip install schemdraw")
            return self._draw_ascii_opamp(circuit_type, parameters)

        with schemdraw.Drawing() as d:
            d.config(fontsize=12, font='sans-serif')

            if circuit_type == 'non_inverting_amplifier':
                # 非反相放大器
                d += (vin := elm.SourceV().label('Vin'))
                d += elm.Line().right(0.5)
                d += elm.Dot()
                d.push()

                # OpAmp
                d += elm.Line().right(0.5)
                d += (op := elm.Opamp().anchor('in1'))

                # 反饋網路
                d += elm.Line().at(op.out).right(0.5)
                d += (out_dot := elm.Dot())
                d += elm.Line().right(0.5)
                d += elm.Gap().label('Vout')

                # R2 (反饋電阻)
                d += elm.Line().at(out_dot.start).down(0.5)
                d += (r2 := elm.Resistor().down().label(f"R2\n{parameters.get('R2_formatted', 'R2')}"))
                d += elm.Dot()
                d.push()

                # R1 (接地)
                d += (r1 := elm.Resistor().down().label(f"R1\n{parameters.get('R1_formatted', 'R1')}"))
                d += elm.Ground()

                # 連接到負輸入
                d.pop()
                d += elm.Line().left().to(op.in2)

                # 正輸入接地
                d.pop()
                d += elm.Line().down().length(d.unit/2)
                d += elm.Ground()

            elif circuit_type == 'inverting_amplifier':
                # 反相放大器
                d += (vin := elm.SourceV().label('Vin'))
                d += elm.Line().right(0.5)
                d += (r1 := elm.Resistor().right().label(f"R1\n{parameters.get('R1_formatted', 'R1')}"))
                d += (input_dot := elm.Dot())

                # OpAmp
                d += elm.Line().right(0.5)
                d += (op := elm.Opamp().anchor('in2'))

                # 正輸入接地
                d += elm.Line().at(op.in1).left(0.5)
                d += elm.Ground()

                # 輸出和反饋
                d += elm.Line().at(op.out).right(0.5)
                d += (out_dot := elm.Dot())
                d += elm.Line().right(0.5)
                d += elm.Gap().label('Vout')

                # 反饋電阻 R2
                d += elm.Line().at(out_dot.start).up(0.5)
                d += (r2 := elm.Resistor().left().label(f"R2\n{parameters.get('R2_formatted', 'R2')}"))
                d += elm.Line().down().to(input_dot.start)

            # 添加標題
            opamp_model = parameters.get('opamp_model', 'OpAmp')
            gain = parameters.get('actual_gain', parameters.get('target_gain', 1))
            d += elm.Annotate().at((0, 2.5)).label(
                f"{circuit_type.replace('_', ' ').title()}\n"
                f"Gain: {gain:.2f}\n"
                f"OpAmp: {opamp_model}",
                fontsize=10
            )

            if output_file:
                d.save(output_file)
                print(f"✓ 電路圖已保存到 {output_file}")
                return output_file
            else:
                d.draw()
                plt.show()

        return "circuit.svg"

    def draw_power_supply(self, converter_type: str,
                         parameters: Dict,
                         output_file: Optional[str] = None) -> str:
        """
        繪製電源電路

        Args:
            converter_type: 轉換器類型 (buck, boost)
            parameters: 電路參數
            output_file: 輸出檔案路徑

        Returns:
            輸出檔案路徑
        """
        try:
            import schemdraw
            import schemdraw.elements as elm
        except ImportError:
            return self._draw_ascii_power(converter_type, parameters)

        with schemdraw.Drawing() as d:
            d.config(fontsize=12)

            if converter_type == 'buck':
                # Buck 降壓轉換器
                # 輸入
                d += (vin := elm.SourceV().label(f"Vin\n{parameters.get('input_voltage', 0)}V"))
                d += elm.Line().right(0.5)
                d += (c_in := elm.Capacitor().down().label('Cin'))
                d += elm.Ground()

                # 開關 (MOSFET)
                d += elm.Line().at(vin.end).right(0.5)
                d += (sw := elm.Switch().right().label('MOSFET'))

                # 電感
                d += elm.Line().right(0.5)
                d += (L := elm.Inductor2().right().label(f"L\n{parameters.get('L', 0)*1e6:.1f}µH"))

                # 輸出電容和負載
                d += elm.Line().right(0.5)
                d += (out_dot := elm.Dot())
                d += elm.Line().right(0.5)
                d += elm.Gap().label(f"Vout\n{parameters.get('output_voltage', 0)}V")

                d += elm.Line().at(out_dot.start).down(0.5)
                d += (c_out := elm.Capacitor().down().label(f"Cout\n{parameters.get('C', 0)*1e6:.1f}µF"))
                d += elm.Ground()

                # 二極體（續流）
                d += elm.Line().at(sw.end).down(0.5)
                d += (diode := elm.Diode().down().label('D'))
                d += elm.Ground()

                # 標題
                d += elm.Annotate().at((0, 2)).label(
                    f"Buck Converter\n"
                    f"Efficiency: {parameters.get('efficiency', 0):.1f}%\n"
                    f"Fsw: {parameters.get('switching_frequency', 0)/1000:.0f}kHz",
                    fontsize=10
                )

            elif converter_type == 'boost':
                # Boost 升壓轉換器
                d += (vin := elm.SourceV().label(f"Vin\n{parameters.get('input_voltage', 0)}V"))
                d += elm.Line().right(0.5)

                # 電感
                d += (L := elm.Inductor2().right().label(f"L\n{parameters.get('L', 0)*1e6:.1f}µH"))
                d += (l_dot := elm.Dot())

                # 二極體
                d += elm.Line().right(0.5)
                d += (diode := elm.Diode().right().label('D'))

                # 輸出
                d += elm.Line().right(0.5)
                d += (out_dot := elm.Dot())
                d += elm.Line().right(0.5)
                d += elm.Gap().label(f"Vout\n{parameters.get('output_voltage', 0)}V")

                # 輸出電容
                d += elm.Line().at(out_dot.start).down(0.5)
                d += (c_out := elm.Capacitor().down().label(f"Cout\n{parameters.get('C', 0)*1e6:.1f}µF"))
                d += elm.Ground()

                # 開關到地
                d += elm.Line().at(l_dot.start).down(0.5)
                d += (sw := elm.Switch().down().label('MOSFET'))
                d += elm.Ground()

            if output_file:
                d.save(output_file)
                print(f"✓ 電路圖已保存到 {output_file}")
                return output_file
            else:
                d.draw()
                plt.show()

        return "power_circuit.svg"

    def draw_filter(self, filter_type: str,
                   parameters: Dict,
                   output_file: Optional[str] = None) -> str:
        """
        繪製濾波器電路

        Args:
            filter_type: 濾波器類型
            parameters: 參數
            output_file: 輸出檔案

        Returns:
            輸出檔案路徑
        """
        try:
            import schemdraw
            import schemdraw.elements as elm
        except ImportError:
            return self._draw_ascii_filter(filter_type, parameters)

        with schemdraw.Drawing() as d:
            if 'lowpass' in filter_type:
                # 簡單 RC 低通濾波器
                d += elm.Gap().label('Vin')
                d += elm.Line().right(0.5)
                d += elm.Resistor().right().label(f"R\n{parameters.get('R', 0):.0f}Ω")
                d += (mid := elm.Dot())
                d += elm.Line().right(0.5)
                d += elm.Gap().label('Vout')

                d += elm.Line().at(mid.start).down(0.5)
                d += elm.Capacitor().down().label(f"C\n{parameters.get('C', 0)*1e9:.0f}nF")
                d += elm.Ground()

                fc = parameters.get('cutoff_frequency', 0)
                d += elm.Annotate().at((0, 1.5)).label(
                    f"RC Low-Pass Filter\nfc = {fc:.1f} Hz",
                    fontsize=10
                )

            if output_file:
                d.save(output_file)
                return output_file

        return "filter.svg"

    def plot_frequency_response(self, filter_type: str,
                               parameters: Dict,
                               output_file: Optional[str] = None):
        """
        繪製頻率響應圖

        Args:
            filter_type: 濾波器類型
            parameters: 參數
            output_file: 輸出檔案
        """
        import numpy as np

        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8))

        fc = parameters.get('cutoff_frequency', 1000)
        frequencies = np.logspace(0, 6, 1000)  # 1Hz to 1MHz

        if 'lowpass' in filter_type:
            # 一階低通濾波器: H(f) = 1 / (1 + j*f/fc)
            H = 1 / np.sqrt(1 + (frequencies/fc)**2)
            phase = -np.arctan(frequencies/fc) * 180/np.pi

        elif 'highpass' in filter_type:
            # 一階高通濾波器
            H = (frequencies/fc) / np.sqrt(1 + (frequencies/fc)**2)
            phase = 90 - np.arctan(frequencies/fc) * 180/np.pi

        else:
            H = np.ones_like(frequencies)
            phase = np.zeros_like(frequencies)

        # 幅度響應
        ax1.semilogx(frequencies, 20*np.log10(H))
        ax1.grid(True, which='both', alpha=0.3)
        ax1.axvline(fc, color='r', linestyle='--', label=f'fc = {fc:.1f} Hz')
        ax1.axhline(-3, color='g', linestyle='--', alpha=0.5, label='-3dB')
        ax1.set_xlabel('Frequency (Hz)')
        ax1.set_ylabel('Magnitude (dB)')
        ax1.set_title(f'{filter_type} - Frequency Response')
        ax1.legend()

        # 相位響應
        ax2.semilogx(frequencies, phase)
        ax2.grid(True, which='both', alpha=0.3)
        ax2.axvline(fc, color='r', linestyle='--')
        ax2.set_xlabel('Frequency (Hz)')
        ax2.set_ylabel('Phase (degrees)')
        ax2.set_title('Phase Response')

        plt.tight_layout()

        if output_file:
            plt.savefig(output_file, dpi=300, bbox_inches='tight')
            print(f"✓ 頻率響應圖已保存到 {output_file}")
        else:
            plt.show()

    def _draw_ascii_opamp(self, circuit_type: str, parameters: Dict) -> str:
        """繪製 ASCII 運算放大器電路"""
        if circuit_type == 'non_inverting_amplifier':
            ascii_art = f"""
        非反相放大器電路

              R2 ({parameters.get('R2_formatted', 'R2')})
        +----/\\/\\/\\----+
        |              |
    +---|+\\_           |
Vin     |  \\_____|----+---- Vout
    +---|  /
        |-/
        |
       ---
       | | R1 ({parameters.get('R1_formatted', 'R1')})
       ---
        |
       GND

增益: {parameters.get('actual_gain', 'N/A')}
OpAmp: {parameters.get('opamp_model', 'N/A')}
"""
        elif circuit_type == 'inverting_amplifier':
            ascii_art = f"""
        反相放大器電路

              R2 ({parameters.get('R2_formatted', 'R2')})
        +----/\\/\\/\\----+
        |              |
        |    +\\        |
Vin ----+---|  \\____|----+---- Vout
   R1   |   |-/
({parameters.get('R1_formatted', 'R1')})  |
        |
       GND

增益: {parameters.get('actual_gain', 'N/A')}
OpAmp: {parameters.get('opamp_model', 'N/A')}
"""
        else:
            ascii_art = f"\n電路類型: {circuit_type}\n參數: {parameters}\n"

        print(ascii_art)
        return "ascii_circuit.txt"

    def _draw_ascii_power(self, converter_type: str, parameters: Dict) -> str:
        """繪製 ASCII 電源電路"""
        ascii_art = f"""
{converter_type.upper()} 轉換器

輸入電壓: {parameters.get('input_voltage', 'N/A')}V
輸出電壓: {parameters.get('output_voltage', 'N/A')}V
輸出電流: {parameters.get('output_current', 'N/A')}A
效率: {parameters.get('efficiency', 'N/A')}%
"""
        print(ascii_art)
        return "ascii_power.txt"

    def _draw_ascii_filter(self, filter_type: str, parameters: Dict) -> str:
        """繪製 ASCII 濾波器電路"""
        ascii_art = f"""
{filter_type} 濾波器

截止頻率: {parameters.get('cutoff_frequency', 'N/A')} Hz
"""
        print(ascii_art)
        return "ascii_filter.txt"
