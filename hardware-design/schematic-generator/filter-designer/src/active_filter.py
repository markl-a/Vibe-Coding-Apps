"""
主動濾波器設計器
"""

import math
from typing import Dict


class ActiveFilterDesigner:
    """主動濾波器設計類別"""

    def design_lowpass_butterworth(self, cutoff_frequency: float,
                                   order: int = 2,
                                   gain: float = 1) -> Dict:
        """
        設計 Butterworth 低通濾波器 (Sallen-Key 拓撲)

        Args:
            cutoff_frequency: 截止頻率 (Hz)
            order: 階數 (2, 4, 6...)
            gain: 通帶增益

        Returns:
            電路參數字典
        """
        if order != 2:
            raise ValueError("目前只支援 2 階濾波器")

        # Butterworth 2 階參數
        Q = 0.707  # Butterworth Q 值

        # 選擇電容值
        if cutoff_frequency > 10000:
            C = 10e-9  # 10nF
        elif cutoff_frequency > 1000:
            C = 100e-9  # 100nF
        else:
            C = 1e-6  # 1µF

        # Equal component Sallen-Key
        # fc = 1 / (2π * R * C)
        R = 1 / (2 * math.pi * cutoff_frequency * C)

        # 增益電阻 (若 gain > 1)
        if gain > 1:
            R1_gain = 10000  # 10kΩ
            R2_gain = R1_gain * (gain - 1)
        else:
            R1_gain = 0
            R2_gain = 0

        return {
            'filter_type': 'lowpass_butterworth',
            'order': order,
            'topology': 'sallen_key',
            'cutoff_frequency': cutoff_frequency,
            'Q': Q,
            'R': R,
            'C': C,
            'R1': R,
            'R2': R,
            'C1': C,
            'C2': C,
            'gain': gain,
            'R1_gain': R1_gain,
            'R2_gain': R2_gain,
            'opamp': 'TL072',
        }

    def design_highpass_butterworth(self, cutoff_frequency: float,
                                    order: int = 2,
                                    gain: float = 1) -> Dict:
        """
        設計 Butterworth 高通濾波器

        Args:
            cutoff_frequency: 截止頻率 (Hz)
            order: 階數
            gain: 通帶增益

        Returns:
            電路參數字典
        """
        # 高通濾波器：交換 R 和 C 的位置
        lowpass = self.design_lowpass_butterworth(cutoff_frequency, order, gain)

        return {
            **lowpass,
            'filter_type': 'highpass_butterworth',
            'note': 'Swap R and C positions from lowpass design'
        }

    def design_bandpass(self, center_frequency: float,
                       bandwidth: float,
                       gain: float = 1) -> Dict:
        """
        設計帶通濾波器

        Args:
            center_frequency: 中心頻率 (Hz)
            bandwidth: 帶寬 (Hz)
            gain: 通帶增益

        Returns:
            電路參數字典
        """
        Q = center_frequency / bandwidth

        # 選擇電容
        if center_frequency > 10000:
            C = 10e-9
        elif center_frequency > 1000:
            C = 100e-9
        else:
            C = 1e-6

        # MFB (Multiple Feedback) 帶通濾波器
        # Q = π * fc * R2 * C
        R2 = Q / (math.pi * center_frequency * C)

        # 增益: Gain = -R2 / (2 * R1)
        R1 = -R2 / (2 * gain) if gain != 0 else R2

        # R3 通常選擇等於 R2
        R3 = R2

        return {
            'filter_type': 'bandpass_mfb',
            'topology': 'multiple_feedback',
            'center_frequency': center_frequency,
            'bandwidth': bandwidth,
            'Q': Q,
            'gain': gain,
            'R1': abs(R1),
            'R2': R2,
            'R3': R3,
            'C': C,
            'opamp': 'TL072',
        }

    def design_notch(self, notch_frequency: float,
                    Q: float = 10) -> Dict:
        """
        設計陷波濾波器 (Notch Filter)

        Args:
            notch_frequency: 陷波頻率 (Hz)
            Q: 品質因數 (越高越窄)

        Returns:
            電路參數字典
        """
        # Twin-T notch filter
        # fc = 1 / (2π * R * C)

        # 選擇電容
        if notch_frequency > 10000:
            C = 10e-9
        elif notch_frequency > 1000:
            C = 100e-9
        else:
            C = 1e-6

        R = 1 / (2 * math.pi * notch_frequency * C)

        # Twin-T 需要 2C 和 C/2
        C1 = C
        C2 = C
        C3 = 2 * C

        R1 = R
        R2 = R
        R3 = R / 2

        return {
            'filter_type': 'notch_twin_t',
            'topology': 'twin_t',
            'notch_frequency': notch_frequency,
            'Q': Q,
            'R1': R1,
            'R2': R2,
            'R3': R3,
            'C1': C1,
            'C2': C2,
            'C3': C3,
            'attenuation_db': -40,  # 典型衰減
        }


class PassiveFilterDesigner:
    """被動濾波器設計類別"""

    def design_rc_lowpass(self, cutoff_frequency: float) -> Dict:
        """
        設計簡單 RC 低通濾波器

        fc = 1 / (2π * R * C)

        Args:
            cutoff_frequency: 截止頻率 (Hz)

        Returns:
            電路參數字典
        """
        # 選擇電容值
        if cutoff_frequency > 10000:
            C = 10e-9  # 10nF
        elif cutoff_frequency > 1000:
            C = 100e-9  # 100nF
        else:
            C = 1e-6  # 1µF

        # 計算電阻
        R = 1 / (2 * math.pi * cutoff_frequency * C)

        return {
            'filter_type': 'rc_lowpass',
            'order': 1,
            'cutoff_frequency': cutoff_frequency,
            'R': R,
            'C': C,
            'attenuation_rate': '-20 dB/decade',
        }

    def design_rc_highpass(self, cutoff_frequency: float) -> Dict:
        """
        設計簡單 RC 高通濾波器

        Args:
            cutoff_frequency: 截止頻率 (Hz)

        Returns:
            電路參數字典
        """
        lowpass = self.design_rc_lowpass(cutoff_frequency)

        return {
            **lowpass,
            'filter_type': 'rc_highpass',
            'note': 'Swap R and C positions'
        }
