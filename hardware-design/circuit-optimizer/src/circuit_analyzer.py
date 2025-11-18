"""
电路分析器模块
提供电路仿真和频率响应分析功能
"""

from typing import Dict, List, Tuple, Optional, Callable
from dataclasses import dataclass
import numpy as np
import matplotlib.pyplot as plt
from scipy import signal
from scipy.fft import fft, fftfreq
import warnings
warnings.filterwarnings('ignore')


@dataclass
class TransferFunction:
    """传递函数"""
    numerator: List[float]  # 分子系数
    denominator: List[float]  # 分母系数
    name: str = "H(s)"

    def evaluate(self, frequency: float) -> complex:
        """
        在给定频率评估传递函数

        Args:
            frequency: 频率 (Hz)

        Returns:
            复数增益
        """
        s = 2j * np.pi * frequency
        num = sum(c * s**i for i, c in enumerate(reversed(self.numerator)))
        den = sum(c * s**i for i, c in enumerate(reversed(self.denominator)))
        return num / den if den != 0 else 0


class CircuitAnalyzer:
    """电路分析器"""

    def __init__(self):
        """初始化分析器"""
        self.circuits = {}

    def analyze_rc_lowpass(
        self,
        R: float,
        C: float,
        frequencies: Optional[np.ndarray] = None
    ) -> Dict:
        """
        分析 RC 低通滤波器

        Args:
            R: 电阻 (Ω)
            C: 电容 (F)
            frequencies: 频率点数组 (Hz)

        Returns:
            分析结果字典
        """
        # 截止频率
        fc = 1 / (2 * np.pi * R * C)

        if frequencies is None:
            frequencies = np.logspace(np.log10(fc/100), np.log10(fc*100), 1000)

        # 传递函数: H(s) = 1 / (1 + sRC)
        omega = 2 * np.pi * frequencies
        H = 1 / (1 + 1j * omega * R * C)

        # 幅度和相位
        magnitude = np.abs(H)
        magnitude_db = 20 * np.log10(magnitude + 1e-10)
        phase = np.angle(H, deg=True)

        return {
            'type': 'RC Lowpass',
            'fc': fc,
            'R': R,
            'C': C,
            'frequencies': frequencies,
            'magnitude': magnitude,
            'magnitude_db': magnitude_db,
            'phase': phase,
            'transfer_function': H
        }

    def analyze_rc_highpass(
        self,
        R: float,
        C: float,
        frequencies: Optional[np.ndarray] = None
    ) -> Dict:
        """
        分析 RC 高通滤波器

        Args:
            R: 电阻 (Ω)
            C: 电容 (F)
            frequencies: 频率点数组 (Hz)

        Returns:
            分析结果字典
        """
        fc = 1 / (2 * np.pi * R * C)

        if frequencies is None:
            frequencies = np.logspace(np.log10(fc/100), np.log10(fc*100), 1000)

        # 传递函数: H(s) = sRC / (1 + sRC)
        omega = 2 * np.pi * frequencies
        H = (1j * omega * R * C) / (1 + 1j * omega * R * C)

        magnitude = np.abs(H)
        magnitude_db = 20 * np.log10(magnitude + 1e-10)
        phase = np.angle(H, deg=True)

        return {
            'type': 'RC Highpass',
            'fc': fc,
            'R': R,
            'C': C,
            'frequencies': frequencies,
            'magnitude': magnitude,
            'magnitude_db': magnitude_db,
            'phase': phase,
            'transfer_function': H
        }

    def analyze_rlc_bandpass(
        self,
        R: float,
        L: float,
        C: float,
        frequencies: Optional[np.ndarray] = None
    ) -> Dict:
        """
        分析 RLC 带通滤波器

        Args:
            R: 电阻 (Ω)
            L: 电感 (H)
            C: 电容 (F)
            frequencies: 频率点数组 (Hz)

        Returns:
            分析结果字典
        """
        # 谐振频率
        f0 = 1 / (2 * np.pi * np.sqrt(L * C))

        # 品质因数
        Q = (1 / R) * np.sqrt(L / C)

        # 带宽
        BW = f0 / Q

        if frequencies is None:
            frequencies = np.logspace(np.log10(f0/100), np.log10(f0*100), 1000)

        # 传递函数: H(s) = sRC / (s²LC + sRC + 1)
        omega = 2 * np.pi * frequencies
        s = 1j * omega

        H = (s * R * C) / (s**2 * L * C + s * R * C + 1)

        magnitude = np.abs(H)
        magnitude_db = 20 * np.log10(magnitude + 1e-10)
        phase = np.angle(H, deg=True)

        return {
            'type': 'RLC Bandpass',
            'f0': f0,
            'Q': Q,
            'BW': BW,
            'R': R,
            'L': L,
            'C': C,
            'frequencies': frequencies,
            'magnitude': magnitude,
            'magnitude_db': magnitude_db,
            'phase': phase,
            'transfer_function': H
        }

    def analyze_voltage_divider(
        self,
        R1: float,
        R2: float,
        V_in: float = 1.0
    ) -> Dict:
        """
        分析电压分压器

        Args:
            R1: 上电阻 (Ω)
            R2: 下电阻 (Ω)
            V_in: 输入电压 (V)

        Returns:
            分析结果字典
        """
        V_out = V_in * R2 / (R1 + R2)
        ratio = R2 / (R1 + R2)
        ratio_db = 20 * np.log10(ratio)

        return {
            'type': 'Voltage Divider',
            'R1': R1,
            'R2': R2,
            'V_in': V_in,
            'V_out': V_out,
            'ratio': ratio,
            'ratio_db': ratio_db
        }

    def analyze_opamp_inverting(
        self,
        Rf: float,
        Rin: float,
        frequencies: Optional[np.ndarray] = None
    ) -> Dict:
        """
        分析反相运放电路

        Args:
            Rf: 反馈电阻 (Ω)
            Rin: 输入电阻 (Ω)
            frequencies: 频率点数组 (Hz)

        Returns:
            分析结果字典
        """
        # 增益
        gain = -Rf / Rin
        gain_db = 20 * np.log10(abs(gain))

        # 输入阻抗
        Zin = Rin

        result = {
            'type': 'Inverting OpAmp',
            'Rf': Rf,
            'Rin': Rin,
            'gain': gain,
            'gain_db': gain_db,
            'Zin': Zin
        }

        if frequencies is not None:
            # 假设理想运放（平坦的频率响应）
            magnitude = np.full_like(frequencies, abs(gain))
            magnitude_db = np.full_like(frequencies, gain_db)
            phase = np.full_like(frequencies, 180 if gain < 0 else 0)

            result.update({
                'frequencies': frequencies,
                'magnitude': magnitude,
                'magnitude_db': magnitude_db,
                'phase': phase
            })

        return result

    def analyze_opamp_noninverting(
        self,
        Rf: float,
        Rin: float,
        frequencies: Optional[np.ndarray] = None
    ) -> Dict:
        """
        分析非反相运放电路

        Args:
            Rf: 反馈电阻 (Ω)
            Rin: 输入电阻 (Ω)
            frequencies: 频率点数组 (Hz)

        Returns:
            分析结果字典
        """
        # 增益
        gain = 1 + Rf / Rin
        gain_db = 20 * np.log10(gain)

        result = {
            'type': 'Non-Inverting OpAmp',
            'Rf': Rf,
            'Rin': Rin,
            'gain': gain,
            'gain_db': gain_db,
            'Zin': float('inf')  # 理想运放输入阻抗无穷大
        }

        if frequencies is not None:
            magnitude = np.full_like(frequencies, gain)
            magnitude_db = np.full_like(frequencies, gain_db)
            phase = np.zeros_like(frequencies)

            result.update({
                'frequencies': frequencies,
                'magnitude': magnitude,
                'magnitude_db': magnitude_db,
                'phase': phase
            })

        return result

    def calculate_power_dissipation(
        self,
        V: float,
        I: float
    ) -> Dict:
        """
        计算功耗

        Args:
            V: 电压 (V)
            I: 电流 (A)

        Returns:
            功耗分析结果
        """
        power = V * I

        return {
            'voltage': V,
            'current': I,
            'power': power,
            'power_mw': power * 1000
        }

    def analyze_buck_converter(
        self,
        V_in: float,
        V_out: float,
        efficiency: float = 0.85
    ) -> Dict:
        """
        分析降压转换器

        Args:
            V_in: 输入电压 (V)
            V_out: 输出电压 (V)
            efficiency: 效率 (0-1)

        Returns:
            分析结果
        """
        duty_cycle = V_out / V_in
        theoretical_efficiency = 1.0  # 理想情况

        return {
            'type': 'Buck Converter',
            'V_in': V_in,
            'V_out': V_out,
            'duty_cycle': duty_cycle,
            'duty_cycle_percent': duty_cycle * 100,
            'efficiency': efficiency,
            'theoretical_efficiency': theoretical_efficiency
        }

    def transient_response_rc(
        self,
        R: float,
        C: float,
        V_initial: float,
        V_final: float,
        t_max: float = None
    ) -> Dict:
        """
        计算 RC 电路的瞬态响应

        Args:
            R: 电阻 (Ω)
            C: 电容 (F)
            V_initial: 初始电压 (V)
            V_final: 最终电压 (V)
            t_max: 最大时间 (s)

        Returns:
            瞬态响应数据
        """
        tau = R * C  # 时间常数

        if t_max is None:
            t_max = 5 * tau  # 5个时间常数

        t = np.linspace(0, t_max, 1000)

        # 充电/放电响应: V(t) = V_final + (V_initial - V_final) * exp(-t/τ)
        V_t = V_final + (V_initial - V_final) * np.exp(-t / tau)

        # 电流: I(t) = (V_final - V_initial) / R * exp(-t/τ)
        I_t = (V_final - V_initial) / R * np.exp(-t / tau)

        return {
            'type': 'RC Transient',
            'tau': tau,
            'tau_ms': tau * 1000,
            'time': t,
            'voltage': V_t,
            'current': I_t,
            'V_initial': V_initial,
            'V_final': V_final,
            't_63': tau,  # 到达63.2%的时间
            't_95': 3 * tau,  # 到达95%的时间
            't_99': 5 * tau  # 到达99%的时间
        }


class FrequencyAnalyzer:
    """频率分析器"""

    @staticmethod
    def plot_bode(
        result: Dict,
        save_path: Optional[str] = None,
        show_phase: bool = True
    ):
        """
        绘制伯德图

        Args:
            result: 分析结果
            save_path: 保存路径
            show_phase: 是否显示相位图
        """
        if 'frequencies' not in result:
            print("结果中没有频率数据")
            return

        fig, axes = plt.subplots(2 if show_phase else 1, 1, figsize=(10, 8 if show_phase else 4))

        if not show_phase:
            axes = [axes]

        # 幅度图
        axes[0].semilogx(result['frequencies'], result['magnitude_db'])
        axes[0].grid(True, which='both', alpha=0.3)
        axes[0].set_ylabel('幅度 (dB)')
        axes[0].set_title(f"{result.get('type', 'Circuit')} 频率响应")

        # 标记截止频率
        if 'fc' in result:
            axes[0].axvline(result['fc'], color='r', linestyle='--', alpha=0.7, label=f"fc = {result['fc']:.2f} Hz")
            axes[0].axhline(-3, color='g', linestyle='--', alpha=0.5, label='-3dB')
            axes[0].legend()

        if show_phase:
            # 相位图
            axes[1].semilogx(result['frequencies'], result['phase'])
            axes[1].grid(True, which='both', alpha=0.3)
            axes[1].set_xlabel('频率 (Hz)')
            axes[1].set_ylabel('相位 (度)')

            if 'fc' in result:
                axes[1].axvline(result['fc'], color='r', linestyle='--', alpha=0.7)
        else:
            axes[0].set_xlabel('频率 (Hz)')

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"伯德图已保存到: {save_path}")
        else:
            plt.show()

        plt.close()

    @staticmethod
    def plot_transient(
        result: Dict,
        save_path: Optional[str] = None
    ):
        """
        绘制瞬态响应图

        Args:
            result: 瞬态响应结果
            save_path: 保存路径
        """
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8))

        # 电压曲线
        ax1.plot(result['time'] * 1000, result['voltage'], linewidth=2)
        ax1.grid(True, alpha=0.3)
        ax1.set_ylabel('电压 (V)')
        ax1.set_title(f"{result.get('type', 'Circuit')} 瞬态响应")

        # 标记时间常数
        if 'tau_ms' in result:
            tau_ms = result['tau_ms']
            V_63 = result['V_final'] + (result['V_initial'] - result['V_final']) * np.exp(-1)
            ax1.axvline(tau_ms, color='r', linestyle='--', alpha=0.7, label=f"τ = {tau_ms:.2f} ms")
            ax1.axhline(V_63, color='g', linestyle='--', alpha=0.5, label=f"63.2% = {V_63:.2f} V")
            ax1.legend()

        # 电流曲线
        ax2.plot(result['time'] * 1000, result['current'] * 1000, linewidth=2, color='orange')
        ax2.grid(True, alpha=0.3)
        ax2.set_xlabel('时间 (ms)')
        ax2.set_ylabel('电流 (mA)')

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"瞬态响应图已保存到: {save_path}")
        else:
            plt.show()

        plt.close()


def demonstrate_circuit_analyzer():
    """演示电路分析器"""
    print("=" * 70)
    print("电路分析器示范")
    print("=" * 70 + "\n")

    analyzer = CircuitAnalyzer()
    freq_analyzer = FrequencyAnalyzer()

    # 1. RC 低通滤波器
    print("1. RC 低通滤波器分析")
    print("-" * 70)
    result = analyzer.analyze_rc_lowpass(R=1000, C=100e-9)
    print(f"截止频率: {result['fc']:.2f} Hz")
    print(f"在 fc 处的增益: {result['magnitude_db'][np.argmin(np.abs(result['frequencies'] - result['fc']))]:.2f} dB")
    freq_analyzer.plot_bode(result, save_path="circuit_output/rc_lowpass_bode.png")
    print()

    # 2. RLC 带通滤波器
    print("2. RLC 带通滤波器分析")
    print("-" * 70)
    result = analyzer.analyze_rlc_bandpass(R=100, L=1e-3, C=1e-6)
    print(f"谐振频率: {result['f0']:.2f} Hz")
    print(f"品质因数 Q: {result['Q']:.2f}")
    print(f"带宽: {result['BW']:.2f} Hz")
    freq_analyzer.plot_bode(result, save_path="circuit_output/rlc_bandpass_bode.png")
    print()

    # 3. 运放电路
    print("3. 反相运放电路分析")
    print("-" * 70)
    result = analyzer.analyze_opamp_inverting(Rf=10000, Rin=1000)
    print(f"增益: {result['gain']:.2f} ({result['gain_db']:.2f} dB)")
    print(f"输入阻抗: {result['Zin']:.0f} Ω")
    print()

    # 4. 瞬态响应
    print("4. RC 电路瞬态响应")
    print("-" * 70)
    result = analyzer.transient_response_rc(R=1000, C=100e-6, V_initial=0, V_final=5)
    print(f"时间常数 τ: {result['tau_ms']:.2f} ms")
    print(f"到达 63.2% 时间: {result['t_63']*1000:.2f} ms")
    print(f"到达 95% 时间: {result['t_95']*1000:.2f} ms")
    freq_analyzer.plot_transient(result, save_path="circuit_output/rc_transient.png")
    print()

    # 5. 电压分压器
    print("5. 电压分压器")
    print("-" * 70)
    result = analyzer.analyze_voltage_divider(R1=10000, R2=10000, V_in=5.0)
    print(f"输入电压: {result['V_in']:.2f} V")
    print(f"输出电压: {result['V_out']:.2f} V")
    print(f"分压比: {result['ratio']:.3f} ({result['ratio_db']:.2f} dB)")
    print()

    print("=" * 70)
    print("所有分析完成！输出文件保存在 circuit_output 目录")
    print("=" * 70)


if __name__ == "__main__":
    import os
    os.makedirs("circuit_output", exist_ok=True)
    demonstrate_circuit_analyzer()
