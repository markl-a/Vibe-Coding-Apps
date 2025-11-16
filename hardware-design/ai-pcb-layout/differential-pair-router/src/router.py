"""
差分對路由器主模組
"""

import numpy as np
from typing import Tuple, Dict, Optional
import math


class DiffPairRouter:
    """差分對路由器"""

    def __init__(self, board_size: Tuple[float, float]):
        """初始化路由器"""
        self.board_size = board_size
        self.diff_pairs = []

    def add_diff_pair(self, pos_start: Tuple[float, float],
                     pos_end: Tuple[float, float],
                     neg_start: Tuple[float, float],
                     neg_end: Tuple[float, float],
                     target_impedance: float = 100.0,
                     spacing: float = 0.2,
                     width: float = 0.15):
        """添加差分對"""
        pair = {
            'pos_start': pos_start,
            'pos_end': pos_end,
            'neg_start': neg_start,
            'neg_end': neg_end,
            'target_impedance': target_impedance,
            'spacing': spacing,
            'width': width,
            'routed': False
        }
        self.diff_pairs.append(pair)

    def route(self, length_matching: bool = True,
             max_length_diff: float = 0.5) -> Dict:
        """執行差分對走線"""
        print("開始差分對走線...")

        if not self.diff_pairs:
            return {'success': False, 'message': '沒有差分對'}

        pair = self.diff_pairs[0]  # 簡化：只處理第一對

        # 計算初始路徑長度
        pos_length = self._calculate_length(pair['pos_start'], pair['pos_end'])
        neg_length = self._calculate_length(pair['neg_start'], pair['neg_end'])

        length_diff = abs(pos_length - neg_length)

        print(f"  正極長度: {pos_length:.2f} mm")
        print(f"  負極長度: {neg_length:.2f} mm")
        print(f"  長度差: {length_diff:.2f} mm")

        # 如果需要長度匹配
        if length_matching and length_diff > max_length_diff:
            print(f"  需要長度匹配 (差異 {length_diff:.2f} > {max_length_diff:.2f})")
            # TODO: 實現蛇形線長度匹配

        # 計算阻抗
        impedance = self._calculate_impedance(pair)

        result = {
            'success': True,
            'positive_length': pos_length,
            'negative_length': neg_length,
            'length_diff': length_diff,
            'impedance': impedance,
            'matched': length_diff <= max_length_diff
        }

        print(f"  計算阻抗: {impedance:.1f} Ω (目標: {pair['target_impedance']:.1f} Ω)")

        return result

    def _calculate_length(self, start: Tuple[float, float],
                         end: Tuple[float, float]) -> float:
        """計算路徑長度"""
        dx = end[0] - start[0]
        dy = end[1] - start[1]
        return math.sqrt(dx*dx + dy*dy)

    def _calculate_impedance(self, pair: Dict) -> float:
        """計算差分阻抗（簡化公式）"""
        # 使用微帶線差分阻抗公式
        # 這是一個簡化版本
        single_impedance = 50.0  # 假設單端阻抗
        S = pair['spacing']
        W = pair['width']

        # 簡化的差分阻抗計算
        Z_diff = 2 * single_impedance * (1 - 0.48 * math.exp(-0.96 * S / W))

        return Z_diff
