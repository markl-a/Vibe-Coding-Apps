"""
有限差分法熱傳導求解器
"""

import numpy as np
from typing import Optional


def fdm_steady_state(power_grid: np.ndarray,
                    initial_temp: float,
                    thermal_conductivity: float,
                    convection_coeff: float,
                    ambient_temp: float,
                    max_iterations: int = 1000,
                    convergence: float = 0.01,
                    resolution: float = 1.0) -> np.ndarray:
    """
    使用有限差分法求解穩態熱傳導

    Args:
        power_grid: 功率分布網格 (W/m²)
        initial_temp: 初始溫度 °C
        thermal_conductivity: 熱導率 W/(m·K)
        convection_coeff: 對流係數 W/(m²·K)
        ambient_temp: 環境溫度 °C
        max_iterations: 最大迭代次數
        convergence: 收斂標準
        resolution: 網格解析度 mm

    Returns:
        溫度分布網格
    """
    h, w = power_grid.shape

    # 初始化溫度網格
    temp = np.ones((h, w)) * initial_temp

    # 網格間距（轉換為米）
    dx = dy = resolution / 1000.0

    # 穩定性參數
    # 使用 Gauss-Seidel 方法（omega = 1.0 更穩定）
    omega = 1.0  # 鬆弛因子

    for iteration in range(max_iterations):
        temp_old = temp.copy()

        for i in range(1, h - 1):
            for j in range(1, w - 1):
                # 熱源項（W/m³轉換為溫度增量）
                # Q = k * ∇²T，所以 ∇²T = Q/k
                # 簡化：功率密度直接作為熱源
                q_term = power_grid[i, j] * dx * dx / thermal_conductivity

                # Gauss-Seidel 更新（使用已更新的鄰居值）
                temp_new = (temp[i+1, j] + temp[i-1, j] +
                           temp[i, j+1] + temp[i, j-1] + q_term) / 4.0

                temp[i, j] = omega * temp_new + (1 - omega) * temp_old[i, j]

        # 邊界條件：對流邊界
        # 頂部
        temp[0, :] = temp[1, :] - (convection_coeff * dx / thermal_conductivity) * \
                    (temp[1, :] - ambient_temp)
        # 底部
        temp[-1, :] = temp[-2, :] - (convection_coeff * dx / thermal_conductivity) * \
                     (temp[-2, :] - ambient_temp)
        # 左側
        temp[:, 0] = temp[:, 1] - (convection_coeff * dy / thermal_conductivity) * \
                    (temp[:, 1] - ambient_temp)
        # 右側
        temp[:, -1] = temp[:, -2] - (convection_coeff * dy / thermal_conductivity) * \
                     (temp[:, -2] - ambient_temp)

        # 檢查收斂
        max_change = np.max(np.abs(temp - temp_old))
        if max_change < convergence:
            print(f"  收斂於迭代 {iteration + 1}, 最大變化: {max_change:.4f}")
            break

    return temp
