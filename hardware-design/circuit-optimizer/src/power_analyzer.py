"""
功耗分析器
分析和優化電路功耗
"""

from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import numpy as np


class PowerMode(Enum):
    """功耗模式"""
    ACTIVE = "active"
    SLEEP = "sleep"
    DEEP_SLEEP = "deep_sleep"
    STANDBY = "standby"


@dataclass
class PowerProfile:
    """功耗檔案"""
    mode: PowerMode
    voltage: float  # 電壓 (V)
    current: float  # 電流 (A)
    duration_percent: float  # 時間佔比 (0-1)

    @property
    def power(self) -> float:
        """計算功率 (W)"""
        return self.voltage * self.current

    @property
    def energy(self) -> float:
        """計算能量消耗 (相對值)"""
        return self.power * self.duration_percent


@dataclass
class ComponentPower:
    """元件功耗"""
    name: str
    category: str
    voltage: float
    current: float
    duty_cycle: float = 1.0  # 工作週期 (0-1)

    @property
    def average_power(self) -> float:
        """平均功耗 (W)"""
        return self.voltage * self.current * self.duty_cycle


class PowerAnalyzer:
    """功耗分析器"""

    def __init__(self):
        """初始化分析器"""
        self.components: List[ComponentPower] = []
        self.power_profiles: List[PowerProfile] = []
        self.supply_voltage: float = 3.3  # 預設供電電壓

    def add_component(self, component: ComponentPower) -> None:
        """
        添加元件功耗

        Args:
            component: 元件功耗資料
        """
        self.components.append(component)

    def add_power_profile(self, profile: PowerProfile) -> None:
        """
        添加功耗檔案

        Args:
            profile: 功耗檔案
        """
        self.power_profiles.append(profile)

    def calculate_total_power(self) -> float:
        """
        計算總功耗

        Returns:
            總功耗 (W)
        """
        return sum(comp.average_power for comp in self.components)

    def calculate_average_power(self) -> float:
        """
        計算平均功耗（考慮不同模式）

        Returns:
            平均功耗 (W)
        """
        if not self.power_profiles:
            return self.calculate_total_power()

        total_energy = sum(profile.energy for profile in self.power_profiles)
        return total_energy

    def get_power_breakdown(self) -> Dict[str, float]:
        """
        取得功耗分解

        Returns:
            按類別分組的功耗字典
        """
        breakdown = {}
        for comp in self.components:
            category = comp.category
            if category not in breakdown:
                breakdown[category] = 0
            breakdown[category] += comp.average_power
        return breakdown

    def find_power_hungry_components(self, top_n: int = 5) -> List[ComponentPower]:
        """
        找出最耗電的元件

        Args:
            top_n: 返回前 N 個

        Returns:
            功耗最高的元件列表
        """
        sorted_components = sorted(
            self.components,
            key=lambda c: c.average_power,
            reverse=True
        )
        return sorted_components[:top_n]

    def estimate_battery_life(
        self,
        battery_capacity_mah: float,
        battery_voltage: float = 3.7
    ) -> Tuple[float, str]:
        """
        估算電池續航時間

        Args:
            battery_capacity_mah: 電池容量 (mAh)
            battery_voltage: 電池電壓 (V)

        Returns:
            (續航時間 (小時), 人類可讀格式)
        """
        avg_power = self.calculate_average_power()
        if avg_power == 0:
            return float('inf'), "無限"

        # 電池能量 (Wh)
        battery_energy_wh = (battery_capacity_mah / 1000) * battery_voltage

        # 續航時間 (小時)
        battery_life_hours = battery_energy_wh / avg_power

        # 轉換為人類可讀格式
        if battery_life_hours < 1:
            minutes = battery_life_hours * 60
            readable = f"{minutes:.1f} 分鐘"
        elif battery_life_hours < 24:
            readable = f"{battery_life_hours:.1f} 小時"
        else:
            days = battery_life_hours / 24
            readable = f"{days:.1f} 天"

        return battery_life_hours, readable

    def optimize_power_modes(
        self,
        active_time_percent: float = 0.1
    ) -> Dict[str, float]:
        """
        優化功耗模式配置

        Args:
            active_time_percent: 主動模式時間佔比

        Returns:
            優化建議
        """
        # 計算不同模式下的建議
        sleep_time = 1 - active_time_percent

        # 假設的模式功耗（實際應根據具體 MCU）
        active_power = self.calculate_total_power()
        sleep_power = active_power * 0.1  # 睡眠模式約 10%
        deep_sleep_power = active_power * 0.01  # 深度睡眠約 1%

        scenarios = {
            "無優化": active_power,
            "使用睡眠模式": active_power * active_time_percent + sleep_power * sleep_time,
            "使用深度睡眠": active_power * active_time_percent + deep_sleep_power * sleep_time,
        }

        return scenarios

    def suggest_power_optimizations(self) -> List[str]:
        """
        提供功耗優化建議

        Returns:
            優化建議列表
        """
        suggestions = []
        breakdown = self.get_power_breakdown()
        total_power = self.calculate_total_power()

        # 分析各類別功耗
        if "IC" in breakdown:
            ic_power = breakdown["IC"]
            if ic_power / total_power > 0.5:
                suggestions.append(
                    "IC 功耗佔比超過 50%，建議:\n"
                    "  - 使用低功耗模式\n"
                    "  - 降低時鐘頻率\n"
                    "  - 啟用動態電壓頻率調整 (DVFS)"
                )

        if "LED" in breakdown:
            led_power = breakdown["LED"]
            if led_power / total_power > 0.2:
                suggestions.append(
                    "LED 功耗佔比超過 20%，建議:\n"
                    "  - 降低 LED 亮度\n"
                    "  - 使用脈衝寬度調變 (PWM)\n"
                    "  - 考慮使用更高效的 LED"
                )

        if "Power" in breakdown:
            power_supply = breakdown["Power"]
            if power_supply / total_power > 0.15:
                suggestions.append(
                    "電源管理功耗較高，建議:\n"
                    "  - 使用高效率穩壓器\n"
                    "  - 考慮開關式穩壓器 (SMPS)\n"
                    "  - 優化穩壓器工作點"
                )

        # 檢查是否有高電流元件
        high_current = [c for c in self.components if c.current > 0.1]
        if high_current:
            suggestions.append(
                f"發現 {len(high_current)} 個高電流元件 (>100mA)，建議:\n"
                "  - 檢查是否必要\n"
                "  - 考慮間歇工作模式\n"
                "  - 使用電源閘控技術"
            )

        if not suggestions:
            suggestions.append("功耗配置良好，暫無優化建議")

        return suggestions

    def generate_report(self) -> str:
        """
        生成功耗分析報告

        Returns:
            報告文字
        """
        total_power = self.calculate_total_power()
        avg_power = self.calculate_average_power()
        breakdown = self.get_power_breakdown()
        power_hungry = self.find_power_hungry_components(5)

        report = "=== 功耗分析報告 ===\n\n"
        report += f"總元件數: {len(self.components)}\n"
        report += f"總功耗: {total_power*1000:.2f} mW\n"
        report += f"平均功耗: {avg_power*1000:.2f} mW\n\n"

        report += "功耗分解:\n"
        for category, power in sorted(breakdown.items(), key=lambda x: x[1], reverse=True):
            percentage = (power / total_power) * 100 if total_power > 0 else 0
            report += f"  {category}: {power*1000:.2f} mW ({percentage:.1f}%)\n"

        report += "\n最耗電的元件:\n"
        for i, comp in enumerate(power_hungry, 1):
            percentage = (comp.average_power / total_power) * 100 if total_power > 0 else 0
            report += f"  {i}. {comp.name}: {comp.average_power*1000:.2f} mW ({percentage:.1f}%)\n"

        # 電池續航估算
        if avg_power > 0:
            report += "\n電池續航估算 (3.7V 1000mAh):\n"
            hours, readable = self.estimate_battery_life(1000, 3.7)
            report += f"  預估續航: {readable}\n"

        # 優化建議
        report += "\n優化建議:\n"
        suggestions = self.suggest_power_optimizations()
        for i, suggestion in enumerate(suggestions, 1):
            report += f"{i}. {suggestion}\n"

        return report


def demonstrate_power_analyzer():
    """展示功耗分析器"""
    print("=== 功耗分析器示範 ===\n")

    analyzer = PowerAnalyzer()

    # 添加元件功耗
    components = [
        ComponentPower("STM32F401", "IC", 3.3, 0.050, 1.0),  # 50mA 持續
        ComponentPower("ESP32", "IC", 3.3, 0.160, 0.3),  # 160mA, 30% 工作週期
        ComponentPower("LED_RED", "LED", 3.3, 0.020, 0.5),  # 20mA, 50% 工作週期
        ComponentPower("LED_GREEN", "LED", 3.3, 0.020, 0.5),
        ComponentPower("LDO_3V3", "Power", 5.0, 0.003, 1.0),  # 靜態電流 3mA
        ComponentPower("Sensor", "Sensor", 3.3, 0.001, 0.1),  # 1mA, 10% 工作週期
    ]

    for comp in components:
        analyzer.add_component(comp)

    # 添加功耗檔案（不同工作模式）
    profiles = [
        PowerProfile(PowerMode.ACTIVE, 3.3, 0.25, 0.10),  # 主動模式 10% 時間
        PowerProfile(PowerMode.SLEEP, 3.3, 0.05, 0.80),   # 睡眠模式 80% 時間
        PowerProfile(PowerMode.DEEP_SLEEP, 3.3, 0.001, 0.10),  # 深度睡眠 10% 時間
    ]

    for profile in profiles:
        analyzer.add_power_profile(profile)

    # 生成報告
    print(analyzer.generate_report())

    # 優化模式分析
    print("\n=== 功耗模式優化分析 ===")
    scenarios = analyzer.optimize_power_modes(active_time_percent=0.1)
    for scenario, power in scenarios.items():
        print(f"{scenario}: {power*1000:.2f} mW")


if __name__ == "__main__":
    demonstrate_power_analyzer()
