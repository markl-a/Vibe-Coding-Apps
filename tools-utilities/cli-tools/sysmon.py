#!/usr/bin/env python3
"""
sysmon.py - 系統監控工具
使用 AI 輔助開發的即時系統資源監控與分析工具
"""

import argparse
import sys
import time
import json
import platform
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path

try:
    import psutil
except ImportError:
    print("❌ 錯誤: 需要安裝 psutil 庫")
    print("請執行: pip install psutil")
    sys.exit(1)

try:
    from rich.console import Console
    from rich.table import Table
    from rich.live import Live
    from rich.panel import Panel
    from rich.progress import Progress, BarColumn, TextColumn
    from rich.layout import Layout
    from rich.text import Text
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False


class SystemMonitor:
    """系統監控類別"""

    def __init__(self):
        self.console = Console() if RICH_AVAILABLE else None
        self.history: List[Dict] = []
        self.alert_thresholds = {
            'cpu': 80.0,
            'memory': 85.0,
            'disk': 90.0
        }

    def get_cpu_info(self) -> Dict:
        """獲取 CPU 資訊"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count(logical=False)
            cpu_count_logical = psutil.cpu_count(logical=True)
            cpu_freq = psutil.cpu_freq()
            cpu_per_core = psutil.cpu_percent(interval=1, percpu=True)

            return {
                'percent': cpu_percent,
                'count': cpu_count,
                'count_logical': cpu_count_logical,
                'frequency': {
                    'current': cpu_freq.current if cpu_freq else 0,
                    'min': cpu_freq.min if cpu_freq else 0,
                    'max': cpu_freq.max if cpu_freq else 0,
                },
                'per_core': cpu_per_core,
                'alert': cpu_percent > self.alert_thresholds['cpu']
            }
        except Exception as e:
            return {'error': str(e)}

    def get_memory_info(self) -> Dict:
        """獲取記憶體資訊"""
        try:
            mem = psutil.virtual_memory()
            swap = psutil.swap_memory()

            return {
                'total': mem.total,
                'available': mem.available,
                'used': mem.used,
                'percent': mem.percent,
                'swap_total': swap.total,
                'swap_used': swap.used,
                'swap_percent': swap.percent,
                'alert': mem.percent > self.alert_thresholds['memory']
            }
        except Exception as e:
            return {'error': str(e)}

    def get_disk_info(self) -> List[Dict]:
        """獲取磁碟資訊"""
        disks = []
        try:
            for partition in psutil.disk_partitions(all=False):
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    disks.append({
                        'device': partition.device,
                        'mountpoint': partition.mountpoint,
                        'fstype': partition.fstype,
                        'total': usage.total,
                        'used': usage.used,
                        'free': usage.free,
                        'percent': usage.percent,
                        'alert': usage.percent > self.alert_thresholds['disk']
                    })
                except PermissionError:
                    continue
        except Exception as e:
            disks.append({'error': str(e)})

        return disks

    def get_network_info(self) -> Dict:
        """獲取網路資訊"""
        try:
            net_io = psutil.net_io_counters()
            net_connections = len(psutil.net_connections())

            return {
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv,
                'packets_sent': net_io.packets_sent,
                'packets_recv': net_io.packets_recv,
                'errin': net_io.errin,
                'errout': net_io.errout,
                'dropin': net_io.dropin,
                'dropout': net_io.dropout,
                'connections': net_connections
            }
        except Exception as e:
            return {'error': str(e)}

    def get_process_info(self, limit: int = 10) -> List[Dict]:
        """獲取進程資訊"""
        try:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
                try:
                    pinfo = proc.info
                    processes.append({
                        'pid': pinfo['pid'],
                        'name': pinfo['name'],
                        'cpu_percent': pinfo['cpu_percent'] or 0,
                        'memory_percent': pinfo['memory_percent'] or 0,
                        'status': pinfo['status']
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            # 按 CPU 使用率排序
            processes.sort(key=lambda x: x['cpu_percent'], reverse=True)
            return processes[:limit]
        except Exception as e:
            return [{'error': str(e)}]

    def get_system_info(self) -> Dict:
        """獲取系統基本資訊"""
        try:
            boot_time = datetime.fromtimestamp(psutil.boot_time())
            uptime = datetime.now() - boot_time

            return {
                'platform': platform.system(),
                'platform_version': platform.version(),
                'architecture': platform.machine(),
                'hostname': platform.node(),
                'processor': platform.processor(),
                'boot_time': boot_time.strftime('%Y-%m-%d %H:%M:%S'),
                'uptime': str(uptime).split('.')[0]
            }
        except Exception as e:
            return {'error': str(e)}

    @staticmethod
    def format_bytes(bytes_value: int) -> str:
        """格式化位元組為人類可讀格式"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_value < 1024.0:
                return f"{bytes_value:.2f} {unit}"
            bytes_value /= 1024.0
        return f"{bytes_value:.2f} PB"

    def analyze_system_health(self) -> Dict:
        """AI 輔助：分析系統健康狀況"""
        cpu = self.get_cpu_info()
        memory = self.get_memory_info()
        disks = self.get_disk_info()

        issues = []
        recommendations = []
        health_score = 100

        # 分析 CPU
        if cpu.get('percent', 0) > 90:
            issues.append("🔴 CPU 使用率極高 (>90%)")
            recommendations.append("建議：檢查高 CPU 佔用進程，考慮優化或增加計算資源")
            health_score -= 30
        elif cpu.get('percent', 0) > 80:
            issues.append("🟡 CPU 使用率偏高 (>80%)")
            recommendations.append("建議：監控 CPU 密集型進程，考慮在非高峰時段執行")
            health_score -= 15

        # 分析記憶體
        if memory.get('percent', 0) > 90:
            issues.append("🔴 記憶體使用率極高 (>90%)")
            recommendations.append("建議：釋放記憶體或增加 RAM，檢查記憶體洩漏")
            health_score -= 30
        elif memory.get('percent', 0) > 85:
            issues.append("🟡 記憶體使用率偏高 (>85%)")
            recommendations.append("建議：關閉不必要的應用程式，清理系統快取")
            health_score -= 15

        # 分析磁碟
        for disk in disks:
            if disk.get('percent', 0) > 95:
                issues.append(f"🔴 磁碟空間嚴重不足: {disk['mountpoint']} (>{disk['percent']:.1f}%)")
                recommendations.append(f"建議：立即清理 {disk['mountpoint']}，刪除不必要的檔案")
                health_score -= 25
            elif disk.get('percent', 0) > 90:
                issues.append(f"🟡 磁碟空間不足: {disk['mountpoint']} (>{disk['percent']:.1f}%)")
                recommendations.append(f"建議：清理 {disk['mountpoint']} 中的臨時檔案和日誌")
                health_score -= 10

        # 分析 Swap
        if memory.get('swap_percent', 0) > 80:
            issues.append("🟡 Swap 使用率偏高")
            recommendations.append("建議：增加實體記憶體，減少系統負載")
            health_score -= 10

        if not issues:
            issues.append("✅ 系統運行狀況良好")
            recommendations.append("建議：保持定期監控和維護")

        return {
            'health_score': max(0, health_score),
            'issues': issues,
            'recommendations': recommendations,
            'status': self._get_health_status(health_score)
        }

    @staticmethod
    def _get_health_status(score: int) -> str:
        """根據分數獲取健康狀態"""
        if score >= 90:
            return "優秀"
        elif score >= 75:
            return "良好"
        elif score >= 60:
            return "一般"
        elif score >= 40:
            return "警告"
        else:
            return "危險"

    def display_dashboard(self, interval: int = 2, export_file: Optional[str] = None):
        """顯示監控儀表板"""
        if not RICH_AVAILABLE:
            self._display_simple_dashboard(interval, export_file)
            return

        console = Console()

        try:
            with Live(console=console, refresh_per_second=1) as live:
                while True:
                    layout = self._create_rich_layout()
                    live.update(layout)

                    if export_file:
                        self._export_snapshot(export_file)

                    time.sleep(interval)

        except KeyboardInterrupt:
            console.print("\n\n👋 監控已停止", style="bold yellow")

    def _create_rich_layout(self) -> Layout:
        """創建 Rich 布局"""
        layout = Layout()
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="body"),
            Layout(name="footer", size=8)
        )

        # 標題
        layout["header"].update(
            Panel(
                Text("🖥️  系統監控儀表板", justify="center", style="bold cyan"),
                style="cyan"
            )
        )

        # 主體內容
        body_layout = Layout()
        body_layout.split_row(
            Layout(name="left"),
            Layout(name="right")
        )

        # CPU 和記憶體
        cpu_info = self.get_cpu_info()
        mem_info = self.get_memory_info()

        cpu_table = Table(title="CPU 資訊", show_header=True, header_style="bold magenta")
        cpu_table.add_column("指標", style="cyan")
        cpu_table.add_column("數值", justify="right")
        cpu_table.add_row("使用率", f"{cpu_info['percent']:.1f}%")
        cpu_table.add_row("核心數 (物理)", str(cpu_info['count']))
        cpu_table.add_row("核心數 (邏輯)", str(cpu_info['count_logical']))
        cpu_table.add_row("頻率", f"{cpu_info['frequency']['current']:.0f} MHz")

        mem_table = Table(title="記憶體資訊", show_header=True, header_style="bold green")
        mem_table.add_column("指標", style="cyan")
        mem_table.add_column("數值", justify="right")
        mem_table.add_row("總計", self.format_bytes(mem_info['total']))
        mem_table.add_row("已使用", self.format_bytes(mem_info['used']))
        mem_table.add_row("可用", self.format_bytes(mem_info['available']))
        mem_table.add_row("使用率", f"{mem_info['percent']:.1f}%")

        body_layout["left"].split_column(
            Layout(Panel(cpu_table)),
            Layout(Panel(mem_table))
        )

        # 磁碟和進程
        disk_table = Table(title="磁碟資訊", show_header=True, header_style="bold yellow")
        disk_table.add_column("掛載點", style="cyan")
        disk_table.add_column("總計", justify="right")
        disk_table.add_column("已使用", justify="right")
        disk_table.add_column("可用", justify="right")
        disk_table.add_column("使用率", justify="right")

        for disk in self.get_disk_info():
            if 'error' not in disk:
                disk_table.add_row(
                    disk['mountpoint'],
                    self.format_bytes(disk['total']),
                    self.format_bytes(disk['used']),
                    self.format_bytes(disk['free']),
                    f"{disk['percent']:.1f}%"
                )

        proc_table = Table(title="Top 進程 (CPU)", show_header=True, header_style="bold red")
        proc_table.add_column("PID", justify="right")
        proc_table.add_column("名稱")
        proc_table.add_column("CPU%", justify="right")
        proc_table.add_column("記憶體%", justify="right")

        for proc in self.get_process_info(5):
            if 'error' not in proc:
                proc_table.add_row(
                    str(proc['pid']),
                    proc['name'][:30],
                    f"{proc['cpu_percent']:.1f}%",
                    f"{proc['memory_percent']:.1f}%"
                )

        body_layout["right"].split_column(
            Layout(Panel(disk_table)),
            Layout(Panel(proc_table))
        )

        layout["body"] = body_layout

        # AI 健康分析
        health = self.analyze_system_health()
        health_text = Text()
        health_text.append(f"健康評分: {health['health_score']}/100 ", style="bold")
        health_text.append(f"({health['status']})\n\n", style="bold green" if health['health_score'] >= 75 else "bold yellow")

        for issue in health['issues'][:3]:
            health_text.append(f"{issue}\n")

        layout["footer"].update(Panel(health_text, title="🤖 AI 系統健康分析", border_style="green"))

        return layout

    def _display_simple_dashboard(self, interval: int, export_file: Optional[str]):
        """簡單文字儀表板（無 Rich）"""
        try:
            while True:
                print("\n" + "=" * 70)
                print(f"🖥️  系統監控 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                print("=" * 70)

                # CPU
                cpu = self.get_cpu_info()
                print(f"\n📊 CPU: {cpu['percent']:.1f}%")

                # 記憶體
                mem = self.get_memory_info()
                print(f"💾 記憶體: {mem['percent']:.1f}% "
                      f"({self.format_bytes(mem['used'])} / {self.format_bytes(mem['total'])})")

                # 磁碟
                print("\n💿 磁碟:")
                for disk in self.get_disk_info():
                    if 'error' not in disk:
                        print(f"  {disk['mountpoint']}: {disk['percent']:.1f}% "
                              f"({self.format_bytes(disk['free'])} 可用)")

                # AI 分析
                health = self.analyze_system_health()
                print(f"\n🤖 健康評分: {health['health_score']}/100 ({health['status']})")
                for issue in health['issues'][:2]:
                    print(f"  {issue}")

                if export_file:
                    self._export_snapshot(export_file)

                print("\n按 Ctrl+C 停止監控...")
                time.sleep(interval)

        except KeyboardInterrupt:
            print("\n\n👋 監控已停止")

    def _export_snapshot(self, export_file: str):
        """匯出快照"""
        snapshot = {
            'timestamp': datetime.now().isoformat(),
            'system': self.get_system_info(),
            'cpu': self.get_cpu_info(),
            'memory': self.get_memory_info(),
            'disks': self.get_disk_info(),
            'network': self.get_network_info(),
            'processes': self.get_process_info(20),
            'health': self.analyze_system_health()
        }

        self.history.append(snapshot)

        # 只保留最近 100 筆記錄
        if len(self.history) > 100:
            self.history = self.history[-100:]

        try:
            with open(export_file, 'w', encoding='utf-8') as f:
                json.dump(self.history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"⚠️  無法匯出快照: {e}")

    def show_system_info(self):
        """顯示系統資訊"""
        info = self.get_system_info()

        print("\n" + "=" * 70)
        print("🖥️  系統資訊")
        print("=" * 70)
        print(f"作業系統: {info['platform']} {info['platform_version']}")
        print(f"主機名稱: {info['hostname']}")
        print(f"處理器: {info['processor']}")
        print(f"架構: {info['architecture']}")
        print(f"開機時間: {info['boot_time']}")
        print(f"運行時間: {info['uptime']}")
        print("=" * 70 + "\n")


def main():
    """主程式入口"""
    parser = argparse.ArgumentParser(
        description='🖥️  System Monitor - 系統監控工具（AI 輔助）',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
範例:
  # 啟動監控儀表板
  python sysmon.py

  # 設定更新間隔（秒）
  python sysmon.py --interval 5

  # CPU 使用率警報
  python sysmon.py --cpu-alert 80

  # 匯出監控報告
  python sysmon.py --export report.json

  # 顯示系統資訊
  python sysmon.py --info

  # AI 健康分析
  python sysmon.py --analyze
        '''
    )

    parser.add_argument(
        '-i', '--interval',
        type=int,
        default=2,
        help='更新間隔（秒，預設：2）'
    )

    parser.add_argument(
        '--cpu-alert',
        type=float,
        help='CPU 使用率警報閾值（百分比）'
    )

    parser.add_argument(
        '--memory-alert',
        type=float,
        help='記憶體使用率警報閾值（百分比）'
    )

    parser.add_argument(
        '--disk-alert',
        type=float,
        help='磁碟使用率警報閾值（百分比）'
    )

    parser.add_argument(
        '-e', '--export',
        help='匯出報告檔案路徑（JSON）'
    )

    parser.add_argument(
        '--info',
        action='store_true',
        help='顯示系統資訊'
    )

    parser.add_argument(
        '--analyze',
        action='store_true',
        help='執行 AI 健康分析'
    )

    parser.add_argument(
        '--version',
        action='version',
        version='System Monitor v1.0.0'
    )

    args = parser.parse_args()

    monitor = SystemMonitor()

    # 設定警報閾值
    if args.cpu_alert:
        monitor.alert_thresholds['cpu'] = args.cpu_alert
    if args.memory_alert:
        monitor.alert_thresholds['memory'] = args.memory_alert
    if args.disk_alert:
        monitor.alert_thresholds['disk'] = args.disk_alert

    # 執行對應功能
    if args.info:
        monitor.show_system_info()
    elif args.analyze:
        health = monitor.analyze_system_health()
        print("\n" + "=" * 70)
        print("🤖 AI 系統健康分析")
        print("=" * 70)
        print(f"\n健康評分: {health['health_score']}/100 ({health['status']})\n")
        print("發現的問題:")
        for issue in health['issues']:
            print(f"  {issue}")
        print("\n建議:")
        for rec in health['recommendations']:
            print(f"  {rec}")
        print("\n" + "=" * 70 + "\n")
    else:
        monitor.display_dashboard(args.interval, args.export)


if __name__ == '__main__':
    main()
