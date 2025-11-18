#!/usr/bin/env python3
"""
I2C AI-Powered Diagnostics Tool

使用 AI 輔助診斷 I2C 問題和優化配置
"""

import os
import sys
import re
import subprocess
from typing import Dict, List, Tuple, Optional

# I2C 常見設備資料庫
I2C_DEVICE_DATABASE = {
    0x68: {"name": "MPU6050/MPU9250", "type": "IMU", "desc": "六軸/九軸慣性測量單元"},
    0x69: {"name": "MPU6050/MPU9250 (ALT)", "type": "IMU", "desc": "六軸/九軸慣性測量單元"},
    0x76: {"name": "BME280/BMP280", "type": "Environmental", "desc": "溫濕度氣壓感測器"},
    0x77: {"name": "BME280/BMP280 (ALT)", "type": "Environmental", "desc": "溫濕度氣壓感測器"},
    0x23: {"name": "BH1750", "type": "Light Sensor", "desc": "數位光強度感測器"},
    0x5C: {"name": "BH1750 (ALT)", "type": "Light Sensor", "desc": "數位光強度感測器"},
    0x48: {"name": "ADS1115/TMP102", "type": "ADC/Temperature", "desc": "16位元 ADC / 溫度感測器"},
    0x40: {"name": "SI7021/HTU21D", "type": "Humidity", "desc": "溫濕度感測器"},
    0x44: {"name": "SHT31", "type": "Humidity", "desc": "高精度溫濕度感測器"},
    0x50: {"name": "EEPROM (AT24Cxx)", "type": "Memory", "desc": "I2C EEPROM"},
    0x57: {"name": "EEPROM (AT24Cxx)", "type": "Memory", "desc": "I2C EEPROM"},
    0x20: {"name": "PCF8574", "type": "I/O Expander", "desc": "8位元 I/O 擴展器"},
    0x3C: {"name": "SSD1306", "type": "Display", "desc": "OLED 顯示器"},
    0x3D: {"name": "SSD1306 (ALT)", "type": "Display", "desc": "OLED 顯示器"},
    0x60: {"name": "MCP4725", "type": "DAC", "desc": "12位元 DAC"},
    0x1D: {"name": "ADXL345", "type": "Accelerometer", "desc": "三軸加速度計"},
    0x53: {"name": "ADXL345 (ALT)", "type": "Accelerometer", "desc": "三軸加速度計"},
}

class I2CDiagnostics:
    """I2C 診斷工具類"""

    def __init__(self):
        self.i2c_buses = []
        self.detected_devices = {}
        self.issues = []
        self.recommendations = []

    def detect_i2c_buses(self) -> List[int]:
        """檢測可用的 I2C 總線"""
        buses = []

        try:
            # 查找 /dev/i2c-* 設備
            for i in range(10):
                dev_path = f"/dev/i2c-{i}"
                if os.path.exists(dev_path):
                    buses.append(i)
        except Exception as e:
            self.issues.append(f"Failed to detect I2C buses: {e}")

        self.i2c_buses = buses
        return buses

    def scan_bus(self, bus: int) -> Dict[int, str]:
        """掃描 I2C 總線上的設備"""
        devices = {}

        try:
            # 使用 i2cdetect 掃描
            result = subprocess.run(
                ["i2cdetect", "-y", str(bus)],
                capture_output=True,
                text=True,
                timeout=5
            )

            if result.returncode != 0:
                self.issues.append(f"i2cdetect failed for bus {bus}")
                return devices

            # 解析輸出
            for line in result.stdout.split('\n'):
                if not line.strip() or line.startswith(' '):
                    continue

                parts = line.split()
                if len(parts) < 2:
                    continue

                for i, part in enumerate(parts[1:]):
                    if part != '--' and part != 'UU':
                        try:
                            addr = int(part, 16)
                            devices[addr] = self.identify_device(addr)
                        except ValueError:
                            pass

        except subprocess.TimeoutExpired:
            self.issues.append(f"i2cdetect timed out for bus {bus}")
        except FileNotFoundError:
            self.issues.append("i2cdetect not found. Please install i2c-tools.")
        except Exception as e:
            self.issues.append(f"Failed to scan bus {bus}: {e}")

        return devices

    def identify_device(self, addr: int) -> Dict:
        """識別設備"""
        if addr in I2C_DEVICE_DATABASE:
            return I2C_DEVICE_DATABASE[addr]
        else:
            return {"name": "Unknown", "type": "Unknown", "desc": "未知設備"}

    def check_bus_speed(self, bus: int) -> Optional[int]:
        """檢查 I2C 總線速度"""
        try:
            # 嘗試從設備樹讀取
            dt_path = f"/sys/class/i2c-adapter/i2c-{bus}/of_node/clock-frequency"
            if os.path.exists(dt_path):
                with open(dt_path, "rb") as f:
                    # 以大端序讀取 32 位元整數
                    data = f.read(4)
                    if len(data) == 4:
                        freq = int.from_bytes(data, byteorder='big')
                        return freq

            # 嘗試從其他來源讀取
            # (根據不同平台可能有不同的路徑)

        except Exception as e:
            pass

        return None

    def test_device_communication(self, bus: int, addr: int) -> bool:
        """測試與設備的通訊"""
        try:
            # 使用 i2cget 測試讀取
            result = subprocess.run(
                ["i2cget", "-y", str(bus), f"0x{addr:02x}", "0x00"],
                capture_output=True,
                text=True,
                timeout=2
            )

            return result.returncode == 0

        except Exception:
            return False

    def analyze_common_issues(self, bus: int) -> List[str]:
        """分析常見問題"""
        issues = []

        # 檢查權限
        dev_path = f"/dev/i2c-{bus}"
        if not os.access(dev_path, os.R_OK | os.W_OK):
            issues.append(
                f"❌ 沒有訪問權限: {dev_path}\n"
                f"   解決方法: sudo chmod 666 {dev_path}\n"
                f"   或將使用者加入 i2c 群組: sudo usermod -a -G i2c $USER"
            )

        # 檢查核心模組
        try:
            result = subprocess.run(
                ["lsmod"],
                capture_output=True,
                text=True
            )

            if "i2c_dev" not in result.stdout:
                issues.append(
                    "⚠️  i2c_dev 模組未載入\n"
                    "   解決方法: sudo modprobe i2c_dev"
                )

        except Exception:
            pass

        # 檢查總線速度
        speed = self.check_bus_speed(bus)
        if speed:
            if speed > 400000:
                issues.append(
                    f"⚠️  I2C 速度較高: {speed/1000:.0f} kHz\n"
                    "   某些設備可能不支援高速模式\n"
                    f"   建議降低速度: echo 100000 > /sys/class/i2c-adapter/i2c-{bus}/of_node/clock-frequency"
                )

        return issues

    def ai_suggest_configuration(self, device_type: str) -> List[str]:
        """基於設備類型的 AI 配置建議"""
        suggestions = []

        if device_type in ["IMU", "Accelerometer"]:
            suggestions.extend([
                "🎯 IMU/加速度計配置建議:",
                "  1. 確保設備固定且避免振動",
                "  2. 上電後等待至少 100ms 再讀取",
                "  3. 進行校準以消除零點偏移",
                "  4. 使用中斷讀取以獲得最佳性能",
                "  5. 建議讀取頻率: 50-100Hz",
                "  範例程式: mpu6050_example",
            ])

        elif device_type == "Environmental":
            suggestions.extend([
                "🌡️  環境感測器配置建議:",
                "  1. 避免陽光直射和熱源",
                "  2. 確保良好的空氣流通",
                "  3. 上電後等待至少 2 秒穩定",
                "  4. 建議讀取頻率: 1-10Hz (環境變化緩慢)",
                "  5. 使用平均濾波減少噪音",
                "  範例程式: bme280_example",
            ])

        elif device_type == "Light Sensor":
            suggestions.extend([
                "💡 光感測器配置建議:",
                "  1. 避免遮擋感測器表面",
                "  2. 選擇適當的解析度模式",
                "  3. 高解析度: 慢速但精確",
                "  4. 低解析度: 快速響應",
                "  5. 建議讀取頻率: 1-5Hz",
                "  範例程式: bh1750_example",
            ])

        elif device_type == "Display":
            suggestions.extend([
                "🖥️  顯示器配置建議:",
                "  1. 確認電源電壓 (通常 3.3V 或 5V)",
                "  2. 初始化後等待至少 100ms",
                "  3. 使用緩衝區更新以減少 I2C 流量",
                "  4. 避免頻繁全螢幕更新",
                "  5. 建議更新頻率: 10-30Hz",
            ])

        elif device_type == "Memory":
            suggestions.extend([
                "💾 EEPROM 配置建議:",
                "  1. 寫入後等待 5-10ms (寫週期時間)",
                "  2. 避免頻繁寫入 (寫入次數有限)",
                "  3. 使用分頁寫入提高效率",
                "  4. 重要資料使用 CRC 校驗",
                "  5. 考慮使用緩存減少讀取次數",
            ])

        else:
            suggestions.extend([
                "💡 I2C 通用配置建議:",
                "  1. 確保上拉電阻存在 (通常 4.7kΩ)",
                "  2. 檢查電源電壓匹配 (3.3V vs 5V)",
                "  3. 使用短接線減少干擾",
                "  4. 避免與其他高頻訊號並行",
                "  5. 檢查設備樹配置",
            ])

        return suggestions

    def suggest_troubleshooting(self, addr: int) -> List[str]:
        """針對特定地址的故障排除建議"""
        suggestions = []

        device_info = self.identify_device(addr)
        device_name = device_info["name"]

        suggestions.append(f"🔧 {device_name} (0x{addr:02X}) 故障排除:")
        suggestions.append("")

        # 常見問題檢查
        common_checks = [
            "1. 硬體連接:",
            "   - 確認 SDA/SCL 正確連接",
            "   - 檢查電源供應 (VCC/GND)",
            "   - 驗證上拉電阻存在 (4.7kΩ 典型值)",
            "",
            "2. 電氣特性:",
            "   - 檢查電壓等級 (3.3V vs 5V)",
            "   - 測量 SDA/SCL 信號完整性",
            "   - 確認沒有短路或開路",
            "",
            "3. 軟體配置:",
            "   - 確認 I2C 地址正確",
            "   - 檢查設備樹配置",
            "   - 驗證時鐘頻率設定",
            "",
            "4. 測試命令:",
            f"   # 掃描總線",
            f"   i2cdetect -y <bus>",
            f"   ",
            f"   # 讀取暫存器",
            f"   i2cget -y <bus> 0x{addr:02X} 0x00",
            f"   ",
            f"   # 寫入暫存器",
            f"   i2cset -y <bus> 0x{addr:02X} 0x00 0xFF",
        ]

        suggestions.extend(common_checks)

        # 設備特定建議
        if device_name.startswith("MPU"):
            suggestions.extend([
                "",
                "MPU6050/9250 特定檢查:",
                "  - WHO_AM_I 暫存器 (0x75) 應該返回 0x68",
                "  - 確認 AD0 引腳設定正確 (決定地址 0x68/0x69)",
                "  - 檢查是否需要複位 (PWR_MGMT_1 = 0x80)",
            ])

        elif device_name.startswith("BME") or device_name.startswith("BMP"):
            suggestions.extend([
                "",
                "BME280/BMP280 特定檢查:",
                "  - ID 暫存器 (0xD0) 應該返回 0x60 (BMP280) 或 0x58 (BME280)",
                "  - 確認 SDO 引腳設定正確 (決定地址 0x76/0x77)",
                "  - 檢查測量模式和過採樣設定",
            ])

        elif device_name == "BH1750":
            suggestions.extend([
                "",
                "BH1750 特定檢查:",
                "  - 確認 ADDR 引腳設定正確 (決定地址 0x23/0x5C)",
                "  - 發送 POWER ON 命令 (0x01)",
                "  - 等待測量完成 (120ms 高解析度, 16ms 低解析度)",
            ])

        return suggestions

    def generate_diagnostic_report(self) -> str:
        """生成完整診斷報告"""
        report = []
        report.append("=" * 70)
        report.append("I2C AI-Powered Diagnostics Report")
        report.append("=" * 70)
        report.append("")

        # 檢測 I2C 總線
        report.append("📡 I2C 總線檢測:")
        buses = self.detect_i2c_buses()

        if not buses:
            report.append("  ❌ 沒有檢測到 I2C 總線")
            report.append("  建議:")
            report.append("    1. 確認 I2C 驅動已載入: lsmod | grep i2c")
            report.append("    2. 檢查設備樹配置")
            report.append("    3. 嘗試載入 i2c-dev 模組: sudo modprobe i2c-dev")
        else:
            for bus in buses:
                speed = self.check_bus_speed(bus)
                speed_str = f"{speed/1000:.0f} kHz" if speed else "Unknown"
                report.append(f"  ✓ /dev/i2c-{bus} (速度: {speed_str})")

        report.append("")

        # 掃描每個總線
        for bus in buses:
            report.append(f"🔍 掃描總線 {bus}:")
            report.append("-" * 70)

            devices = self.scan_bus(bus)

            if not devices:
                report.append("  ℹ️  沒有檢測到設備")
            else:
                report.append(f"  檢測到 {len(devices)} 個設備:\n")

                for addr, info in sorted(devices.items()):
                    report.append(f"  📍 0x{addr:02X}: {info['name']}")
                    report.append(f"     類型: {info['type']}")
                    report.append(f"     說明: {info['desc']}")

                    # 測試通訊
                    if self.test_device_communication(bus, addr):
                        report.append("     狀態: ✓ 通訊正常")
                    else:
                        report.append("     狀態: ⚠️  通訊異常")

                    # AI 配置建議
                    suggestions = self.ai_suggest_configuration(info['type'])
                    if suggestions:
                        report.append("     AI 建議:")
                        for suggestion in suggestions:
                            report.append(f"       {suggestion}")

                    report.append("")

            # 分析常見問題
            common_issues = self.analyze_common_issues(bus)
            if common_issues:
                report.append("  ⚠️  常見問題分析:")
                report.extend([f"    {issue}" for issue in common_issues])

            report.append("")

        # 通用問題
        if self.issues:
            report.append("❌ 發現的問題:")
            report.extend([f"  {issue}" for issue in self.issues])
            report.append("")

        # 通用建議
        report.append("💡 通用 I2C 建議:")
        report.append("  1. 硬體: 確保上拉電阻存在 (SDA/SCL 各 4.7kΩ)")
        report.append("  2. 速度: 標準模式 100kHz, 快速模式 400kHz")
        report.append("  3. 電平: 確認所有設備電平匹配 (3.3V or 5V)")
        report.append("  4. 佈線: 使用短線材，避免與高頻訊號並行")
        report.append("  5. 工具: 安裝 i2c-tools (i2cdetect, i2cget, i2cset)")
        report.append("")

        report.append("=" * 70)
        report.append("診斷完成")
        report.append("=" * 70)

        return "\n".join(report)

def main():
    """主函數"""
    import argparse

    parser = argparse.ArgumentParser(
        description="I2C AI-Powered Diagnostics Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument("--bus", "-b", type=int,
                       help="指定要診斷的 I2C 總線")
    parser.add_argument("--scan", "-s", action="store_true",
                       help="掃描所有 I2C 總線")
    parser.add_argument("--device", "-d", type=str,
                       help="獲取特定設備的建議 (輸入地址，如 0x68)")
    parser.add_argument("--suggest", "-S", type=str,
                       help="基於設備類型提供配置建議 (IMU/Environmental/Light/Display/Memory)")
    parser.add_argument("--output", "-o", type=str,
                       help="輸出報告到文件")

    args = parser.parse_args()

    diagnostics = I2CDiagnostics()

    # 設備類型建議
    if args.suggest:
        print("\n🤖 AI 配置建議\n")
        suggestions = diagnostics.ai_suggest_configuration(args.suggest)
        for suggestion in suggestions:
            print(suggestion)
        print()
        return

    # 特定設備建議
    if args.device:
        try:
            addr = int(args.device, 0)
            print("\n🔧 故障排除建議\n")
            suggestions = diagnostics.suggest_troubleshooting(addr)
            for suggestion in suggestions:
                print(suggestion)
            print()
        except ValueError:
            print(f"Invalid address: {args.device}")
        return

    # 生成完整報告
    report = diagnostics.generate_diagnostic_report()

    # 輸出報告
    if args.output:
        with open(args.output, "w") as f:
            f.write(report)
        print(f"報告已儲存到: {args.output}")
    else:
        print(report)

if __name__ == "__main__":
    main()
