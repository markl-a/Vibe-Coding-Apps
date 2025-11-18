#!/usr/bin/env python3
"""
ssl_cert_monitor.py - SSL 證書監控工具
使用 AI 輔助開發的智能 SSL 證書監控腳本

功能：
- SSL/TLS 證書過期檢查
- 證書信息提取
- 多域名監控
- 過期告警通知
- 證書鏈驗證
- 支援批量檢查
"""

import os
import sys
import argparse
import logging
import ssl
import socket
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from urllib.parse import urlparse
import json

try:
    from cryptography import x509
    from cryptography.hazmat.backends import default_backend
    HAS_CRYPTOGRAPHY = True
except ImportError:
    HAS_CRYPTOGRAPHY = False

try:
    from utils import Notifier, ConfigManager
except ImportError:
    Notifier = None
    ConfigManager = None

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SSLCertificate:
    """SSL 證書類"""

    def __init__(self, hostname: str, port: int = 443, timeout: int = 10):
        """
        初始化 SSL 證書檢查器

        Args:
            hostname: 主機名
            port: 端口
            timeout: 超時時間
        """
        self.hostname = hostname
        self.port = port
        self.timeout = timeout
        self.cert_info = None
        self.cert_der = None

    def get_certificate(self) -> bool:
        """
        獲取 SSL 證書

        Returns:
            bool: 是否成功
        """
        try:
            # 創建 SSL 上下文
            context = ssl.create_default_context()

            # 連接到服務器
            with socket.create_connection((self.hostname, self.port), timeout=self.timeout) as sock:
                with context.wrap_socket(sock, server_hostname=self.hostname) as ssock:
                    # 獲取證書（DER 格式）
                    self.cert_der = ssock.getpeercert(binary_form=True)
                    # 獲取證書信息
                    self.cert_info = ssock.getpeercert()

            return True

        except socket.gaierror:
            logger.error(f"無法解析主機名: {self.hostname}")
            return False
        except socket.timeout:
            logger.error(f"連接超時: {self.hostname}:{self.port}")
            return False
        except ssl.SSLError as e:
            logger.error(f"SSL 錯誤: {e}")
            return False
        except Exception as e:
            logger.error(f"獲取證書失敗: {e}")
            return False

    def parse_certificate(self) -> Dict[str, Any]:
        """
        解析證書信息

        Returns:
            Dict: 證書詳細信息
        """
        if not self.cert_info:
            return {}

        result = {
            'hostname': self.hostname,
            'port': self.port,
            'status': 'UNKNOWN'
        }

        try:
            # 提取基本信息
            result['subject'] = dict(x[0] for x in self.cert_info.get('subject', []))
            result['issuer'] = dict(x[0] for x in self.cert_info.get('issuer', []))

            # 解析日期
            not_before_str = self.cert_info.get('notBefore')
            not_after_str = self.cert_info.get('notAfter')

            if not_before_str:
                not_before = datetime.strptime(not_before_str, '%b %d %H:%M:%S %Y %Z')
                result['not_before'] = not_before.isoformat()

            if not_after_str:
                not_after = datetime.strptime(not_after_str, '%b %d %H:%M:%S %Y %Z')
                result['not_after'] = not_after.isoformat()
                result['expiry_date'] = not_after.strftime('%Y-%m-%d')

                # 計算剩餘天數
                days_remaining = (not_after - datetime.now()).days
                result['days_remaining'] = days_remaining

                # 判斷狀態
                if days_remaining < 0:
                    result['status'] = 'EXPIRED'
                    result['expired'] = True
                elif days_remaining <= 7:
                    result['status'] = 'CRITICAL'
                    result['warning'] = f'證書將在 {days_remaining} 天後過期'
                elif days_remaining <= 30:
                    result['status'] = 'WARNING'
                    result['warning'] = f'證書將在 {days_remaining} 天後過期'
                else:
                    result['status'] = 'OK'

            # 使用 cryptography 庫提取更多信息
            if HAS_CRYPTOGRAPHY and self.cert_der:
                cert = x509.load_der_x509_certificate(self.cert_der, default_backend())

                # 提取 SANs (Subject Alternative Names)
                try:
                    san_ext = cert.extensions.get_extension_for_class(x509.SubjectAlternativeName)
                    result['san'] = [name.value for name in san_ext.value]
                except x509.ExtensionNotFound:
                    result['san'] = []

                # 序列號
                result['serial_number'] = cert.serial_number

                # 版本
                result['version'] = cert.version.name

                # 簽名算法
                result['signature_algorithm'] = cert.signature_algorithm_oid._name

        except Exception as e:
            logger.error(f"解析證書失敗: {e}")
            result['error'] = str(e)

        return result


class SSLCertMonitor:
    """SSL 證書監控器"""

    def __init__(
        self,
        hosts: List[Dict],
        alert_days: int = 30,
        notifier: Optional['Notifier'] = None
    ):
        """
        初始化監控器

        Args:
            hosts: 要監控的主機列表
            alert_days: 告警天數閾值
            notifier: 通知器
        """
        self.hosts = hosts
        self.alert_days = alert_days
        self.notifier = notifier
        self.results = []

    def check_all(self) -> List[Dict]:
        """
        檢查所有主機

        Returns:
            List[Dict]: 檢查結果
        """
        logger.info(f"開始檢查 {len(self.hosts)} 個主機的 SSL 證書...")

        results = []

        for host_config in self.hosts:
            hostname = host_config.get('hostname')
            port = host_config.get('port', 443)
            timeout = host_config.get('timeout', 10)

            logger.info(f"檢查: {hostname}:{port}")

            cert = SSLCertificate(hostname, port, timeout)

            if cert.get_certificate():
                result = cert.parse_certificate()
                results.append(result)

                # 顯示結果
                status_icon = {
                    'OK': '✓',
                    'WARNING': '⚠',
                    'CRITICAL': '🔴',
                    'EXPIRED': '❌',
                    'UNKNOWN': '?'
                }.get(result.get('status', 'UNKNOWN'), '?')

                logger.info(
                    f"  {status_icon} {result.get('status', 'UNKNOWN')} - "
                    f"過期日期: {result.get('expiry_date', 'N/A')} - "
                    f"剩餘天數: {result.get('days_remaining', 'N/A')}"
                )

                if result.get('warning'):
                    logger.warning(f"  {result['warning']}")
                if result.get('error'):
                    logger.error(f"  錯誤: {result['error']}")
            else:
                result = {
                    'hostname': hostname,
                    'port': port,
                    'status': 'ERROR',
                    'error': '無法獲取證書'
                }
                results.append(result)
                logger.error(f"  ✗ 無法獲取證書")

        self.results = results
        return results

    def get_summary(self) -> Dict:
        """獲取摘要統計"""
        if not self.results:
            return {}

        total = len(self.results)
        ok_count = sum(1 for r in self.results if r.get('status') == 'OK')
        warning_count = sum(1 for r in self.results if r.get('status') == 'WARNING')
        critical_count = sum(1 for r in self.results if r.get('status') == 'CRITICAL')
        expired_count = sum(1 for r in self.results if r.get('status') == 'EXPIRED')
        error_count = sum(1 for r in self.results if r.get('status') == 'ERROR')

        return {
            'total': total,
            'ok': ok_count,
            'warning': warning_count,
            'critical': critical_count,
            'expired': expired_count,
            'error': error_count
        }

    def print_report(self):
        """列印報告"""
        print("\n" + "=" * 80)
        print("SSL 證書監控報告")
        print("=" * 80)
        print(f"時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"檢查主機: {len(self.results)} 個")
        print("=" * 80)

        summary = self.get_summary()

        print(f"\n總覽:")
        print(f"  ✓ 正常: {summary.get('ok', 0)}")
        print(f"  ⚠ 警告: {summary.get('warning', 0)}")
        print(f"  🔴 嚴重: {summary.get('critical', 0)}")
        print(f"  ❌ 已過期: {summary.get('expired', 0)}")
        print(f"  ✗ 錯誤: {summary.get('error', 0)}")

        print("\n詳細結果:")
        print("-" * 80)

        for i, result in enumerate(self.results, 1):
            status_icon = {
                'OK': '✓',
                'WARNING': '⚠',
                'CRITICAL': '🔴',
                'EXPIRED': '❌',
                'ERROR': '✗',
                'UNKNOWN': '?'
            }.get(result.get('status', 'UNKNOWN'), '?')

            print(f"\n{i}. {result.get('hostname')}:{result.get('port', 443)}")
            print(f"   狀態: {status_icon} {result.get('status', 'UNKNOWN')}")

            if result.get('subject'):
                cn = result['subject'].get('commonName', 'N/A')
                print(f"   Common Name: {cn}")

            if result.get('issuer'):
                issuer = result['issuer'].get('organizationName', 'N/A')
                print(f"   發行者: {issuer}")

            if result.get('not_after'):
                print(f"   過期日期: {result.get('expiry_date', 'N/A')}")
                print(f"   剩餘天數: {result.get('days_remaining', 'N/A')}")

            if result.get('san'):
                print(f"   SANs: {', '.join(result['san'][:3])}")

            if result.get('warning'):
                print(f"   ⚠ {result['warning']}")

            if result.get('error'):
                print(f"   錯誤: {result['error']}")

        print("\n" + "=" * 80)

    def send_alerts(self):
        """發送告警通知"""
        if not self.notifier:
            return

        # 檢查是否有需要告警的證書
        alerts = [r for r in self.results if r.get('status') in ['WARNING', 'CRITICAL', 'EXPIRED']]

        if not alerts:
            logger.info("所有證書正常，無需發送告警")
            return

        # 構建告警消息
        summary = self.get_summary()

        message = f"""
🔒 SSL 證書監控告警

時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

總覽:
- 總主機: {summary['total']}
- 已過期: {summary['expired']}
- 嚴重: {summary['critical']}
- 警告: {summary['warning']}

需要注意的證書:
"""

        for alert in alerts:
            status_emoji = {
                'WARNING': '⚠️',
                'CRITICAL': '🔴',
                'EXPIRED': '❌'
            }.get(alert['status'], '⚠️')

            message += f"\n{status_emoji} {alert['hostname']}"
            message += f"\n   狀態: {alert['status']}"
            message += f"\n   過期日期: {alert.get('expiry_date', 'N/A')}"
            message += f"\n   剩餘天數: {alert.get('days_remaining', 'N/A')}"
            message += "\n"

        # 發送通知
        logger.info("發送告警通知...")
        self.notifier.send_slack(message)


def load_hosts_from_config(config_path: Path) -> List[Dict]:
    """從配置文件載入主機列表"""
    try:
        if ConfigManager:
            config = ConfigManager.load_config(config_path)
        else:
            with open(config_path, 'r') as f:
                config = json.load(f)

        if not config or 'hosts' not in config:
            logger.error("配置文件格式錯誤")
            return []

        return config['hosts']

    except Exception as e:
        logger.error(f"載入配置失敗: {e}")
        return []


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description='SSL 證書監控工具 - 監控 SSL/TLS 證書過期狀態',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用範例:
  # 檢查單個網站
  %(prog)s --host example.com

  # 檢查指定端口
  %(prog)s --host example.com --port 8443

  # 使用配置文件檢查多個網站
  %(prog)s --config ssl_monitor_config.json

  # 設定告警閾值（30天內過期）
  %(prog)s --config ssl_monitor_config.json --alert-days 30

  # 輸出 JSON 格式
  %(prog)s --host example.com --output json

配置文件格式 (JSON):
{
  "hosts": [
    {"hostname": "example.com", "port": 443},
    {"hostname": "api.example.com", "port": 443},
    {"hostname": "secure.example.com", "port": 8443}
  ],
  "alert_days": 30,
  "notifications": {
    "slack": {
      "webhook_url": "https://hooks.slack.com/..."
    }
  }
}
        """
    )

    parser.add_argument(
        '--host',
        help='要檢查的主機名'
    )

    parser.add_argument(
        '--port',
        type=int,
        default=443,
        help='端口（預設: 443）'
    )

    parser.add_argument(
        '--config',
        help='配置文件路徑'
    )

    parser.add_argument(
        '--alert-days',
        type=int,
        default=30,
        help='告警天數閾值（預設: 30）'
    )

    parser.add_argument(
        '--timeout',
        type=int,
        default=10,
        help='連接超時時間（秒，預設: 10）'
    )

    parser.add_argument(
        '--output',
        choices=['text', 'json'],
        default='text',
        help='輸出格式（預設: text）'
    )

    parser.add_argument(
        '--notify',
        action='store_true',
        help='發送告警通知'
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

    # 載入主機列表
    hosts = []

    if args.config:
        config_path = Path(args.config)
        if not config_path.exists():
            logger.error(f"配置文件不存在: {config_path}")
            sys.exit(1)
        hosts = load_hosts_from_config(config_path)
    elif args.host:
        hosts = [{
            'hostname': args.host,
            'port': args.port,
            'timeout': args.timeout
        }]
    else:
        parser.error('請指定 --host 或 --config')

    if not hosts:
        logger.error("沒有要檢查的主機")
        sys.exit(1)

    # 設定通知器
    notifier = None
    if args.notify and Notifier and args.config:
        config_path = Path(args.config)
        if ConfigManager:
            config = ConfigManager.load_config(config_path)
        else:
            with open(config_path, 'r') as f:
                config = json.load(f)

        if config and 'notifications' in config:
            notifier = Notifier(config['notifications'])

    # 創建監控器
    monitor = SSLCertMonitor(
        hosts=hosts,
        alert_days=args.alert_days,
        notifier=notifier
    )

    try:
        # 執行檢查
        results = monitor.check_all()

        # 輸出結果
        if args.output == 'json':
            print(json.dumps({
                'results': results,
                'summary': monitor.get_summary()
            }, indent=2, ensure_ascii=False))
        else:
            monitor.print_report()

        # 發送告警
        if args.notify:
            monitor.send_alerts()

        # 根據結果設定退出碼
        summary = monitor.get_summary()
        if summary.get('expired', 0) > 0 or summary.get('error', 0) > 0:
            sys.exit(2)
        elif summary.get('critical', 0) > 0:
            sys.exit(1)
        elif summary.get('warning', 0) > 0:
            sys.exit(1)
        else:
            sys.exit(0)

    except KeyboardInterrupt:
        logger.info("\n檢查已停止")
        sys.exit(0)
    except Exception as e:
        logger.error(f"發生錯誤: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
