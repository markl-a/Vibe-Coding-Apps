#!/usr/bin/env python3
"""
system_health_check.py - 系統健康檢查工具

定期檢查系統狀態並生成報告，支援 CPU、記憶體、磁碟、網路等檢查。
"""

import os
import sys
import argparse
import json
import logging
import subprocess
import platform
from datetime import datetime
from typing import Dict, List, Any
from pathlib import Path

try:
    import psutil
except ImportError:
    print("錯誤: 需要安裝 psutil 套件")
    print("請執行: pip install psutil")
    sys.exit(1)

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SystemHealthChecker:
    """系統健康檢查器"""

    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'hostname': platform.node(),
            'platform': platform.platform(),
            'checks': {}
        }
        self.alerts = []

    def check_cpu(self, alert_threshold: int = 80) -> Dict[str, Any]:
        """
        檢查 CPU 使用率

        Args:
            alert_threshold: 告警閾值（百分比）

        Returns:
            Dict: CPU 檢查結果
        """
        logger.info("檢查 CPU 使用率...")

        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            cpu_count_logical = psutil.cpu_count(logical=True)
            cpu_freq = psutil.cpu_freq()

            result = {
                'status': 'OK',
                'usage_percent': cpu_percent,
                'physical_cores': cpu_count,
                'logical_cores': cpu_count_logical,
                'frequency_mhz': {
                    'current': cpu_freq.current if cpu_freq else None,
                    'min': cpu_freq.min if cpu_freq else None,
                    'max': cpu_freq.max if cpu_freq else None
                },
                'per_cpu_percent': psutil.cpu_percent(interval=1, percpu=True)
            }

            # 檢查告警
            if cpu_percent >= alert_threshold:
                result['status'] = 'WARNING'
                alert = f"CPU 使用率過高: {cpu_percent}% (閾值: {alert_threshold}%)"
                result['alert'] = alert
                self.alerts.append(alert)

            return result
        except Exception as e:
            logger.error(f"CPU 檢查失敗: {e}")
            return {'status': 'ERROR', 'error': str(e)}

    def check_memory(self, alert_threshold: int = 90) -> Dict[str, Any]:
        """
        檢查記憶體使用率

        Args:
            alert_threshold: 告警閾值（百分比）

        Returns:
            Dict: 記憶體檢查結果
        """
        logger.info("檢查記憶體使用率...")

        try:
            mem = psutil.virtual_memory()
            swap = psutil.swap_memory()

            result = {
                'status': 'OK',
                'virtual': {
                    'total_gb': round(mem.total / (1024**3), 2),
                    'available_gb': round(mem.available / (1024**3), 2),
                    'used_gb': round(mem.used / (1024**3), 2),
                    'percent': mem.percent
                },
                'swap': {
                    'total_gb': round(swap.total / (1024**3), 2),
                    'used_gb': round(swap.used / (1024**3), 2),
                    'free_gb': round(swap.free / (1024**3), 2),
                    'percent': swap.percent
                }
            }

            # 檢查告警
            if mem.percent >= alert_threshold:
                result['status'] = 'WARNING'
                alert = f"記憶體使用率過高: {mem.percent}% (閾值: {alert_threshold}%)"
                result['alert'] = alert
                self.alerts.append(alert)

            if swap.percent >= alert_threshold:
                alert = f"Swap 使用率過高: {swap.percent}% (閾值: {alert_threshold}%)"
                if 'alert' not in result:
                    result['alert'] = alert
                else:
                    result['alert'] += f"; {alert}"
                self.alerts.append(alert)

            return result
        except Exception as e:
            logger.error(f"記憶體檢查失敗: {e}")
            return {'status': 'ERROR', 'error': str(e)}

    def check_disk(self, alert_threshold: int = 85) -> Dict[str, Any]:
        """
        檢查磁碟使用率

        Args:
            alert_threshold: 告警閾值（百分比）

        Returns:
            Dict: 磁碟檢查結果
        """
        logger.info("檢查磁碟使用率...")

        try:
            partitions = []
            has_warning = False

            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    part_info = {
                        'device': partition.device,
                        'mountpoint': partition.mountpoint,
                        'fstype': partition.fstype,
                        'total_gb': round(usage.total / (1024**3), 2),
                        'used_gb': round(usage.used / (1024**3), 2),
                        'free_gb': round(usage.free / (1024**3), 2),
                        'percent': usage.percent,
                        'status': 'OK'
                    }

                    # 檢查告警
                    if usage.percent >= alert_threshold:
                        part_info['status'] = 'WARNING'
                        has_warning = True
                        alert = f"磁碟 {partition.mountpoint} 使用率過高: {usage.percent}% (閾值: {alert_threshold}%)"
                        part_info['alert'] = alert
                        self.alerts.append(alert)

                    partitions.append(part_info)
                except PermissionError:
                    continue

            result = {
                'status': 'WARNING' if has_warning else 'OK',
                'partitions': partitions
            }

            return result
        except Exception as e:
            logger.error(f"磁碟檢查失敗: {e}")
            return {'status': 'ERROR', 'error': str(e)}

    def check_network(self) -> Dict[str, Any]:
        """
        檢查網路狀態

        Returns:
            Dict: 網路檢查結果
        """
        logger.info("檢查網路狀態...")

        try:
            net_io = psutil.net_io_counters()
            net_connections = len(psutil.net_connections())

            result = {
                'status': 'OK',
                'io_counters': {
                    'bytes_sent_mb': round(net_io.bytes_sent / (1024**2), 2),
                    'bytes_recv_mb': round(net_io.bytes_recv / (1024**2), 2),
                    'packets_sent': net_io.packets_sent,
                    'packets_recv': net_io.packets_recv,
                    'errors_in': net_io.errin,
                    'errors_out': net_io.errout,
                    'drops_in': net_io.dropin,
                    'drops_out': net_io.dropout
                },
                'connections': net_connections
            }

            # 檢查是否有網路錯誤
            if net_io.errin > 0 or net_io.errout > 0:
                result['status'] = 'WARNING'
                alert = f"偵測到網路錯誤: IN={net_io.errin}, OUT={net_io.errout}"
                result['alert'] = alert
                self.alerts.append(alert)

            return result
        except Exception as e:
            logger.error(f"網路檢查失敗: {e}")
            return {'status': 'ERROR', 'error': str(e)}

    def check_processes(self, top_n: int = 10) -> Dict[str, Any]:
        """
        檢查進程狀態

        Args:
            top_n: 顯示前 N 個進程

        Returns:
            Dict: 進程檢查結果
        """
        logger.info("檢查進程狀態...")

        try:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    pinfo = proc.info
                    processes.append({
                        'pid': pinfo['pid'],
                        'name': pinfo['name'],
                        'cpu_percent': pinfo['cpu_percent'],
                        'memory_percent': round(pinfo['memory_percent'], 2)
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            # 按 CPU 使用率排序
            processes.sort(key=lambda x: x['cpu_percent'] or 0, reverse=True)

            result = {
                'status': 'OK',
                'total_processes': len(processes),
                'top_by_cpu': processes[:top_n]
            }

            return result
        except Exception as e:
            logger.error(f"進程檢查失敗: {e}")
            return {'status': 'ERROR', 'error': str(e)}

    def check_uptime(self) -> Dict[str, Any]:
        """
        檢查系統運行時間

        Returns:
            Dict: 運行時間檢查結果
        """
        logger.info("檢查系統運行時間...")

        try:
            boot_time = datetime.fromtimestamp(psutil.boot_time())
            uptime = datetime.now() - boot_time

            result = {
                'status': 'OK',
                'boot_time': boot_time.isoformat(),
                'uptime_days': uptime.days,
                'uptime_hours': uptime.seconds // 3600,
                'uptime_minutes': (uptime.seconds % 3600) // 60
            }

            return result
        except Exception as e:
            logger.error(f"運行時間檢查失敗: {e}")
            return {'status': 'ERROR', 'error': str(e)}

    def run_checks(
        self,
        checks: List[str] = None,
        cpu_alert: int = 80,
        mem_alert: int = 90,
        disk_alert: int = 85
    ):
        """
        執行所有檢查

        Args:
            checks: 要執行的檢查列表
            cpu_alert: CPU 告警閾值
            mem_alert: 記憶體告警閾值
            disk_alert: 磁碟告警閾值
        """
        all_checks = {
            'cpu': lambda: self.check_cpu(cpu_alert),
            'memory': lambda: self.check_memory(mem_alert),
            'disk': lambda: self.check_disk(disk_alert),
            'network': self.check_network,
            'processes': self.check_processes,
            'uptime': self.check_uptime
        }

        if checks is None:
            checks = list(all_checks.keys())

        for check_name in checks:
            if check_name in all_checks:
                self.results['checks'][check_name] = all_checks[check_name]()
            else:
                logger.warning(f"未知的檢查項目: {check_name}")

    def get_overall_status(self) -> str:
        """
        獲取整體狀態

        Returns:
            str: 整體狀態（OK, WARNING, ERROR）
        """
        statuses = [check.get('status', 'UNKNOWN') for check in self.results['checks'].values()]

        if 'ERROR' in statuses:
            return 'ERROR'
        elif 'WARNING' in statuses:
            return 'WARNING'
        else:
            return 'OK'

    def print_report(self):
        """列印文字報告"""
        print("\n" + "=" * 80)
        print(f"系統健康檢查報告")
        print("=" * 80)
        print(f"時間: {self.results['timestamp']}")
        print(f"主機: {self.results['hostname']}")
        print(f"平台: {self.results['platform']}")
        print(f"整體狀態: {self.get_overall_status()}")
        print("=" * 80)

        for check_name, check_result in self.results['checks'].items():
            print(f"\n[{check_name.upper()}] - {check_result['status']}")
            print("-" * 80)

            if check_name == 'cpu':
                print(f"使用率: {check_result.get('usage_percent', 'N/A')}%")
                print(f"核心數: {check_result.get('physical_cores', 'N/A')} 物理 / {check_result.get('logical_cores', 'N/A')} 邏輯")

            elif check_name == 'memory':
                vm = check_result.get('virtual', {})
                print(f"記憶體: {vm.get('used_gb', 'N/A')}GB / {vm.get('total_gb', 'N/A')}GB ({vm.get('percent', 'N/A')}%)")
                swap = check_result.get('swap', {})
                print(f"Swap: {swap.get('used_gb', 'N/A')}GB / {swap.get('total_gb', 'N/A')}GB ({swap.get('percent', 'N/A')}%)")

            elif check_name == 'disk':
                for part in check_result.get('partitions', []):
                    print(f"{part['mountpoint']}: {part['used_gb']}GB / {part['total_gb']}GB ({part['percent']}%)")

            elif check_name == 'network':
                io = check_result.get('io_counters', {})
                print(f"發送: {io.get('bytes_sent_mb', 'N/A')}MB, 接收: {io.get('bytes_recv_mb', 'N/A')}MB")
                print(f"連接數: {check_result.get('connections', 'N/A')}")

            elif check_name == 'processes':
                print(f"總進程數: {check_result.get('total_processes', 'N/A')}")
                print(f"\n前 {len(check_result.get('top_by_cpu', []))} 個 CPU 使用率最高的進程:")
                for proc in check_result.get('top_by_cpu', []):
                    print(f"  PID {proc['pid']}: {proc['name']} - CPU: {proc['cpu_percent']}%, MEM: {proc['memory_percent']}%")

            elif check_name == 'uptime':
                print(f"開機時間: {check_result.get('boot_time', 'N/A')}")
                print(f"運行時間: {check_result.get('uptime_days', 0)} 天 {check_result.get('uptime_hours', 0)} 小時 {check_result.get('uptime_minutes', 0)} 分鐘")

            if 'alert' in check_result:
                print(f"\n⚠️  告警: {check_result['alert']}")

        if self.alerts:
            print("\n" + "=" * 80)
            print(f"告警摘要 ({len(self.alerts)} 個告警)")
            print("=" * 80)
            for i, alert in enumerate(self.alerts, 1):
                print(f"{i}. {alert}")

        print("\n" + "=" * 80)

    def get_json_report(self) -> str:
        """
        獲取 JSON 格式的報告

        Returns:
            str: JSON 格式的報告
        """
        self.results['overall_status'] = self.get_overall_status()
        self.results['alerts'] = self.alerts
        return json.dumps(self.results, indent=2, ensure_ascii=False)


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description='系統健康檢查工具 - 檢查系統狀態並生成報告',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用範例:
  # 執行所有檢查
  %(prog)s

  # 只檢查 CPU 和記憶體
  %(prog)s --check cpu,memory

  # 設定自定義告警閾值
  %(prog)s --cpu-alert 90 --mem-alert 95 --disk-alert 90

  # 輸出 JSON 格式
  %(prog)s --output json

  # 儲存報告到檔案
  %(prog)s --output json > health_report.json
        """
    )

    parser.add_argument(
        '--check',
        help='要檢查的項目（逗號分隔）: cpu,memory,disk,network,processes,uptime'
    )

    parser.add_argument(
        '--cpu-alert',
        type=int,
        default=80,
        help='CPU 使用率告警閾值（百分比，預設: 80）'
    )

    parser.add_argument(
        '--mem-alert',
        type=int,
        default=90,
        help='記憶體使用率告警閾值（百分比，預設: 90）'
    )

    parser.add_argument(
        '--disk-alert',
        type=int,
        default=85,
        help='磁碟使用率告警閾值（百分比，預設: 85）'
    )

    parser.add_argument(
        '--output',
        choices=['text', 'json'],
        default='text',
        help='輸出格式（預設: text）'
    )

    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='顯示詳細資訊'
    )

    args = parser.parse_args()

    # 設定日誌級別
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    else:
        logger.setLevel(logging.WARNING)

    # 解析檢查項目
    checks = None
    if args.check:
        checks = [c.strip() for c in args.check.split(',')]

    try:
        # 創建檢查器並執行檢查
        checker = SystemHealthChecker()
        checker.run_checks(
            checks=checks,
            cpu_alert=args.cpu_alert,
            mem_alert=args.mem_alert,
            disk_alert=args.disk_alert
        )

        # 輸出報告
        if args.output == 'json':
            print(checker.get_json_report())
        else:
            checker.print_report()

        # 根據狀態設定退出碼
        overall_status = checker.get_overall_status()
        if overall_status == 'ERROR':
            sys.exit(2)
        elif overall_status == 'WARNING':
            sys.exit(1)
        else:
            sys.exit(0)

    except KeyboardInterrupt:
        logger.info("\n操作已被用戶中斷")
        sys.exit(0)
    except Exception as e:
        logger.error(f"發生錯誤: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
