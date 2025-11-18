#!/usr/bin/env python3
"""
GPIO AI-Powered Diagnostics Tool

使用 AI 輔助診斷 GPIO 問題和優化配置
"""

import os
import sys
import re
import subprocess
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional

class GPIODiagnostics:
    """GPIO 診斷工具類"""

    def __init__(self):
        self.gpio_base = Path("/sys/class/gpio")
        self.debug_base = Path("/sys/kernel/debug/gpio")
        self.issues = []
        self.recommendations = []

    def check_gpio_exists(self, gpio_num: int) -> bool:
        """檢查 GPIO 是否存在"""
        gpio_path = self.gpio_base / f"gpio{gpio_num}"
        return gpio_path.exists()

    def export_gpio(self, gpio_num: int) -> bool:
        """匯出 GPIO"""
        try:
            with open(self.gpio_base / "export", "w") as f:
                f.write(str(gpio_num))
            return True
        except Exception as e:
            self.issues.append(f"Failed to export GPIO {gpio_num}: {e}")
            return False

    def unexport_gpio(self, gpio_num: int) -> bool:
        """取消匯出 GPIO"""
        try:
            with open(self.gpio_base / "unexport", "w") as f:
                f.write(str(gpio_num))
            return True
        except Exception as e:
            self.issues.append(f"Failed to unexport GPIO {gpio_num}: {e}")
            return False

    def get_gpio_info(self, gpio_num: int) -> Optional[Dict]:
        """獲取 GPIO 資訊"""
        gpio_path = self.gpio_base / f"gpio{gpio_num}"

        if not gpio_path.exists():
            return None

        info = {"gpio": gpio_num}

        try:
            # 讀取方向
            with open(gpio_path / "direction", "r") as f:
                info["direction"] = f.read().strip()

            # 讀取值
            with open(gpio_path / "value", "r") as f:
                info["value"] = int(f.read().strip())

            # 讀取邊緣觸發設定
            edge_file = gpio_path / "edge"
            if edge_file.exists():
                with open(edge_file, "r") as f:
                    info["edge"] = f.read().strip()

            # 讀取 active_low 設定
            active_low_file = gpio_path / "active_low"
            if active_low_file.exists():
                with open(active_low_file, "r") as f:
                    info["active_low"] = int(f.read().strip())

        except Exception as e:
            self.issues.append(f"Failed to read GPIO {gpio_num} info: {e}")
            return None

        return info

    def analyze_gpio_state(self, gpio_num: int) -> List[str]:
        """分析 GPIO 狀態並提供建議"""
        suggestions = []
        info = self.get_gpio_info(gpio_num)

        if not info:
            suggestions.append(f"❌ GPIO {gpio_num} 不存在或無法讀取")
            return suggestions

        # 檢查方向配置
        if info["direction"] == "in":
            suggestions.append(f"✓ GPIO {gpio_num} 配置為輸入模式")

            # 建議啟用中斷
            if info.get("edge") == "none":
                suggestions.append(
                    f"💡 建議: 如需檢測輸入變化，可啟用邊緣觸發中斷\n"
                    f"   echo rising > /sys/class/gpio/gpio{gpio_num}/edge"
                )
        else:
            suggestions.append(f"✓ GPIO {gpio_num} 配置為輸出模式，當前值: {info['value']}")

            # 檢查是否可以使用 PWM
            suggestions.append(
                f"💡 建議: 如需調節輸出，可考慮使用 PWM 功能"
            )

        # 檢查 active_low 設定
        if info.get("active_low") == 1:
            suggestions.append(
                f"⚠️  注意: GPIO {gpio_num} 啟用了反向邏輯 (active_low=1)\n"
                f"   實際電平與讀取值相反"
            )

        return suggestions

    def detect_conflicts(self) -> List[str]:
        """檢測 GPIO 衝突"""
        conflicts = []

        try:
            # 讀取 debugfs 中的 GPIO 資訊
            if self.debug_base.exists():
                with open(self.debug_base, "r") as f:
                    gpio_debug = f.read()

                # 分析是否有多個消費者
                lines = gpio_debug.split('\n')
                for line in lines:
                    if '|' in line and 'gpio-' in line:
                        parts = line.split('|')
                        if len(parts) >= 2:
                            gpio_info = parts[1].strip()
                            # 檢測是否有衝突標記
                            if 'BUSY' in gpio_info or 'conflict' in gpio_info.lower():
                                conflicts.append(f"⚠️  檢測到 GPIO 衝突: {line.strip()}")

        except Exception as e:
            self.issues.append(f"Failed to check conflicts: {e}")

        return conflicts

    def check_permissions(self, gpio_num: int) -> List[str]:
        """檢查權限問題"""
        permission_issues = []
        gpio_path = self.gpio_base / f"gpio{gpio_num}"

        if not gpio_path.exists():
            return permission_issues

        try:
            # 檢查是否有讀寫權限
            test_files = ["direction", "value"]

            for filename in test_files:
                filepath = gpio_path / filename
                if filepath.exists():
                    # 檢查讀權限
                    if not os.access(filepath, os.R_OK):
                        permission_issues.append(
                            f"❌ 沒有讀取權限: {filepath}\n"
                            f"   執行: sudo chmod 644 {filepath}"
                        )

                    # 檢查寫權限
                    if filename in ["direction", "value"] and not os.access(filepath, os.W_OK):
                        permission_issues.append(
                            f"❌ 沒有寫入權限: {filepath}\n"
                            f"   執行: sudo chmod 666 {filepath}\n"
                            f"   或將使用者加入 gpio 群組"
                        )

        except Exception as e:
            self.issues.append(f"Failed to check permissions: {e}")

        return permission_issues

    def test_gpio_speed(self, gpio_num: int, iterations: int = 10000) -> Dict:
        """測試 GPIO 切換速度"""
        import time

        info = self.get_gpio_info(gpio_num)
        if not info or info["direction"] != "out":
            return {"error": "GPIO 必須配置為輸出模式"}

        gpio_path = self.gpio_base / f"gpio{gpio_num}"
        value_file = gpio_path / "value"

        try:
            start_time = time.time()

            for i in range(iterations):
                # 寫入 1
                with open(value_file, "w") as f:
                    f.write("1")
                # 寫入 0
                with open(value_file, "w") as f:
                    f.write("0")

            end_time = time.time()
            elapsed = end_time - start_time
            frequency = (iterations * 2) / elapsed

            return {
                "iterations": iterations,
                "elapsed_seconds": elapsed,
                "frequency_hz": frequency,
                "period_us": (1.0 / frequency) * 1000000
            }

        except Exception as e:
            return {"error": str(e)}

    def ai_suggest_configuration(self, use_case: str) -> List[str]:
        """基於使用案例的 AI 建議配置"""
        suggestions = []

        use_case_lower = use_case.lower()

        if "led" in use_case_lower or "light" in use_case_lower:
            suggestions.extend([
                "🔦 LED 控制建議配置:",
                "  1. 方向: 輸出 (out)",
                "  2. 初始值: 低電平 (0)",
                "  3. 考慮使用 PWM 實現亮度調節",
                "  4. 添加限流電阻 (通常 220Ω-1kΩ)",
                "  範例命令:",
                "    echo out > /sys/class/gpio/gpioN/direction",
                "    echo 0 > /sys/class/gpio/gpioN/value",
            ])

        elif "button" in use_case_lower or "switch" in use_case_lower:
            suggestions.extend([
                "🔘 按鈕/開關建議配置:",
                "  1. 方向: 輸入 (in)",
                "  2. 啟用內部上拉電阻 (如硬體支援)",
                "  3. 配置邊緣觸發: 下降緣或雙邊緣",
                "  4. 考慮啟用軟體去抖動 (debounce)",
                "  5. 建議去抖動時間: 50-100ms",
                "  範例命令:",
                "    echo in > /sys/class/gpio/gpioN/direction",
                "    echo both > /sys/class/gpio/gpioN/edge",
            ])

        elif "sensor" in use_case_lower:
            suggestions.extend([
                "📡 感測器建議配置:",
                "  1. 方向: 輸入 (in)",
                "  2. 根據感測器類型選擇觸發方式:",
                "     - 數位感測器: 邊緣觸發",
                "     - 類比感測器: 考慮使用 ADC",
                "  3. 注意電平匹配 (3.3V vs 5V)",
                "  4. 考慮使用電平轉換器",
            ])

        elif "motor" in use_case_lower or "relay" in use_case_lower:
            suggestions.extend([
                "⚙️  馬達/繼電器建議配置:",
                "  1. 方向: 輸出 (out)",
                "  2. 使用外部驅動電路 (絕不直接驅動)",
                "  3. 添加保護二極體 (反向電動勢保護)",
                "  4. 考慮使用 PWM 控制馬達速度",
                "  5. 注意電流限制 (GPIO 通常 4-16mA)",
                "  ⚠️  重要: 大功率負載必須使用外部驅動器",
            ])

        elif "pwm" in use_case_lower:
            suggestions.extend([
                "📊 PWM 建議配置:",
                "  1. 頻率選擇:",
                "     - LED 調光: 100Hz - 1kHz",
                "     - 馬達控制: 1kHz - 20kHz",
                "     - 伺服馬達: 50Hz",
                "  2. 占空比範圍: 0% - 100%",
                "  3. 使用硬體 PWM (如可用) 以獲得更精確的時序",
                "  4. 軟體 PWM 頻率限制約 ~1kHz",
            ])

        elif "interrupt" in use_case_lower or "irq" in use_case_lower:
            suggestions.extend([
                "⚡ 中斷建議配置:",
                "  1. 選擇適當的觸發類型:",
                "     - rising: 上升緣 (0→1)",
                "     - falling: 下降緣 (1→0)",
                "     - both: 雙邊緣",
                "  2. 啟用去抖動避免誤觸發",
                "  3. 中斷處理要快速，避免阻塞",
                "  4. 考慮使用 threaded IRQ 處理複雜邏輯",
                "  5. 監控中斷計數: cat /proc/interrupts",
            ])

        else:
            suggestions.extend([
                "💡 一般 GPIO 配置建議:",
                "  1. 明確設定方向 (輸入/輸出)",
                "  2. 輸出模式: 設定初始值避免毛刺",
                "  3. 輸入模式: 考慮上拉/下拉電阻",
                "  4. 使用完畢後 unexport 釋放資源",
                "  5. 參考硬體規格確認電氣特性",
            ])

        return suggestions

    def generate_diagnostic_report(self, gpio_list: List[int]) -> str:
        """生成完整診斷報告"""
        report = []
        report.append("=" * 70)
        report.append("GPIO AI-Powered Diagnostics Report")
        report.append("=" * 70)
        report.append("")

        # 系統資訊
        report.append("📋 系統資訊:")
        try:
            with open("/proc/cpuinfo", "r") as f:
                for line in f:
                    if "Hardware" in line or "Model" in line:
                        report.append(f"  {line.strip()}")
        except:
            pass
        report.append("")

        # 檢測衝突
        report.append("🔍 衝突檢測:")
        conflicts = self.detect_conflicts()
        if conflicts:
            report.extend([f"  {c}" for c in conflicts])
        else:
            report.append("  ✓ 未檢測到 GPIO 衝突")
        report.append("")

        # 分析每個 GPIO
        for gpio_num in gpio_list:
            report.append(f"📍 GPIO {gpio_num} 分析:")
            report.append("-" * 70)

            # 檢查是否存在
            if not self.check_gpio_exists(gpio_num):
                report.append(f"  ℹ️  GPIO {gpio_num} 未匯出，嘗試匯出...")
                if self.export_gpio(gpio_num):
                    report.append(f"  ✓ 成功匯出 GPIO {gpio_num}")
                else:
                    report.append(f"  ❌ 無法匯出 GPIO {gpio_num}")
                    continue

            # 獲取狀態
            info = self.get_gpio_info(gpio_num)
            if info:
                report.append(f"  當前狀態:")
                report.append(f"    - 方向: {info['direction']}")
                report.append(f"    - 值: {info['value']}")
                if 'edge' in info:
                    report.append(f"    - 邊緣: {info['edge']}")
                if 'active_low' in info:
                    report.append(f"    - Active Low: {info['active_low']}")

            # 狀態分析
            suggestions = self.analyze_gpio_state(gpio_num)
            if suggestions:
                report.append("  分析建議:")
                report.extend([f"    {s}" for s in suggestions])

            # 權限檢查
            perm_issues = self.check_permissions(gpio_num)
            if perm_issues:
                report.append("  權限問題:")
                report.extend([f"    {p}" for p in perm_issues])

            report.append("")

        # 通用問題
        if self.issues:
            report.append("⚠️  發現的問題:")
            report.extend([f"  {issue}" for issue in self.issues])
            report.append("")

        # 通用建議
        if self.recommendations:
            report.append("💡 通用建議:")
            report.extend([f"  {rec}" for rec in self.recommendations])
            report.append("")

        report.append("=" * 70)
        report.append("診斷完成")
        report.append("=" * 70)

        return "\n".join(report)

def main():
    """主函數"""
    import argparse

    parser = argparse.ArgumentParser(
        description="GPIO AI-Powered Diagnostics Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument("--gpio", "-g", type=int, nargs="+",
                       help="要診斷的 GPIO 編號")
    parser.add_argument("--scan", "-s", action="store_true",
                       help="掃描所有可用的 GPIO")
    parser.add_argument("--suggest", "-S", type=str,
                       help="基於使用案例提供配置建議 (led/button/sensor/motor/pwm/interrupt)")
    parser.add_argument("--speed-test", "-t", type=int,
                       help="測試指定 GPIO 的切換速度")
    parser.add_argument("--output", "-o", type=str,
                       help="輸出報告到文件")

    args = parser.parse_args()

    diagnostics = GPIODiagnostics()

    # 使用案例建議
    if args.suggest:
        print("\n🤖 AI 配置建議\n")
        suggestions = diagnostics.ai_suggest_configuration(args.suggest)
        for suggestion in suggestions:
            print(suggestion)
        print()
        return

    # 速度測試
    if args.speed_test is not None:
        print(f"\n⚡ GPIO {args.speed_test} 速度測試\n")
        result = diagnostics.test_gpio_speed(args.speed_test)
        if "error" in result:
            print(f"錯誤: {result['error']}")
        else:
            print(f"迭代次數: {result['iterations']}")
            print(f"耗時: {result['elapsed_seconds']:.3f} 秒")
            print(f"切換頻率: {result['frequency_hz']:.2f} Hz")
            print(f"週期: {result['period_us']:.2f} μs")
        print()
        return

    # GPIO 診斷
    gpio_list = args.gpio if args.gpio else []

    if args.scan:
        # 掃描所有 GPIO (0-255)
        print("掃描 GPIO (這可能需要一些時間)...")
        for i in range(256):
            if diagnostics.check_gpio_exists(i):
                gpio_list.append(i)

    if not gpio_list:
        parser.print_help()
        return

    # 生成報告
    report = diagnostics.generate_diagnostic_report(gpio_list)

    # 輸出報告
    if args.output:
        with open(args.output, "w") as f:
            f.write(report)
        print(f"報告已儲存到: {args.output}")
    else:
        print(report)

if __name__ == "__main__":
    main()
