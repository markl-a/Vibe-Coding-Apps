#!/usr/bin/env python3
"""
api_monitor.py - API 監控工具
使用 AI 輔助開發的智能 API 健康監控腳本

功能：
- HTTP/HTTPS API 端點監控
- 響應時間追蹤
- 狀態碼檢查
- JSON 響應驗證
- 告警通知（郵件/Webhook）
- 歷史數據記錄
- 健康報告生成
"""

import os
import sys
import argparse
import logging
import json
import time
import ssl
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from urllib.parse import urlparse

try:
    import requests
    from requests.adapters import HTTPAdapter
    from requests.packages.urllib3.util.retry import Retry
except ImportError:
    print("錯誤: 需要安裝 requests 套件")
    print("請執行: pip install requests")
    sys.exit(1)

try:
    from utils import Notifier, ConfigManager, format_duration
except ImportError:
    # 如果無法導入utils，提供基本功能
    Notifier = None
    ConfigManager = None
    def format_duration(seconds):
        return f"{seconds}s"

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class APIEndpoint:
    """API 端點類"""

    def __init__(
        self,
        url: str,
        method: str = 'GET',
        headers: Optional[Dict] = None,
        data: Optional[Dict] = None,
        timeout: int = 30,
        expected_status: int = 200,
        expected_response: Optional[Dict] = None
    ):
        """
        初始化 API 端點

        Args:
            url: API URL
            method: HTTP 方法
            headers: HTTP 標頭
            data: 請求數據
            timeout: 超時時間（秒）
            expected_status: 預期狀態碼
            expected_response: 預期響應內容（JSON）
        """
        self.url = url
        self.method = method.upper()
        self.headers = headers or {}
        self.data = data
        self.timeout = timeout
        self.expected_status = expected_status
        self.expected_response = expected_response
        self.name = self._extract_name()

    def _extract_name(self) -> str:
        """從URL提取名稱"""
        parsed = urlparse(self.url)
        path = parsed.path.strip('/').replace('/', '_')
        return path if path else parsed.netloc

    def check(self) -> Dict[str, Any]:
        """
        檢查 API 端點

        Returns:
            Dict: 檢查結果
        """
        result = {
            'name': self.name,
            'url': self.url,
            'method': self.method,
            'timestamp': datetime.now().isoformat(),
            'status': 'UNKNOWN',
            'success': False
        }

        start_time = time.time()

        try:
            # 設定重試策略
            session = requests.Session()
            retry = Retry(
                total=3,
                backoff_factor=0.3,
                status_forcelist=[500, 502, 503, 504]
            )
            adapter = HTTPAdapter(max_retries=retry)
            session.mount('http://', adapter)
            session.mount('https://', adapter)

            # 發送請求
            response = session.request(
                method=self.method,
                url=self.url,
                headers=self.headers,
                json=self.data if self.method in ['POST', 'PUT', 'PATCH'] else None,
                timeout=self.timeout,
                verify=True  # 驗證 SSL 證書
            )

            # 記錄響應時間
            response_time = time.time() - start_time
            result['response_time_ms'] = round(response_time * 1000, 2)

            # 記錄狀態碼
            result['status_code'] = response.status_code

            # 檢查狀態碼
            if response.status_code == self.expected_status:
                result['status_code_match'] = True
            else:
                result['status_code_match'] = False
                result['status'] = 'WARNING'

            # 檢查響應內容
            if self.expected_response:
                try:
                    response_json = response.json()
                    result['response_content'] = response_json

                    # 檢查預期欄位
                    matches = True
                    for key, expected_value in self.expected_response.items():
                        if key not in response_json or response_json[key] != expected_value:
                            matches = False
                            break

                    result['response_match'] = matches
                    if not matches:
                        result['status'] = 'WARNING'
                except json.JSONDecodeError:
                    result['response_match'] = False
                    result['status'] = 'WARNING'
                    result['error'] = 'Invalid JSON response'

            # 如果一切正常
            if result['status_code_match'] and result.get('response_match', True):
                result['status'] = 'OK'
                result['success'] = True

            # 檢查響應時間告警
            if result['response_time_ms'] > 5000:  # 超過5秒
                result['slow_response'] = True
                if result['status'] == 'OK':
                    result['status'] = 'WARNING'

        except requests.exceptions.Timeout:
            result['status'] = 'ERROR'
            result['error'] = f'Request timeout ({self.timeout}s)'
            result['response_time_ms'] = self.timeout * 1000

        except requests.exceptions.SSLError as e:
            result['status'] = 'ERROR'
            result['error'] = f'SSL verification failed: {str(e)}'

        except requests.exceptions.ConnectionError as e:
            result['status'] = 'ERROR'
            result['error'] = f'Connection failed: {str(e)}'

        except Exception as e:
            result['status'] = 'ERROR'
            result['error'] = str(e)

        return result


class APIMonitor:
    """API 監控器"""

    def __init__(
        self,
        endpoints: List[APIEndpoint],
        history_file: Optional[Path] = None,
        notifier: Optional['Notifier'] = None
    ):
        """
        初始化監控器

        Args:
            endpoints: API 端點列表
            history_file: 歷史數據文件
            notifier: 通知器
        """
        self.endpoints = endpoints
        self.history_file = history_file
        self.notifier = notifier
        self.results = []

    def check_all(self) -> List[Dict]:
        """
        檢查所有端點

        Returns:
            List[Dict]: 所有檢查結果
        """
        logger.info(f"開始檢查 {len(self.endpoints)} 個 API 端點...")

        results = []
        for endpoint in self.endpoints:
            logger.info(f"檢查: {endpoint.name} ({endpoint.url})")
            result = endpoint.check()
            results.append(result)

            # 顯示結果
            status_icon = {
                'OK': '✓',
                'WARNING': '⚠',
                'ERROR': '✗',
                'UNKNOWN': '?'
            }.get(result['status'], '?')

            logger.info(
                f"  {status_icon} {result['status']} - "
                f"狀態碼: {result.get('status_code', 'N/A')} - "
                f"響應時間: {result.get('response_time_ms', 'N/A')}ms"
            )

            if 'error' in result:
                logger.error(f"  錯誤: {result['error']}")

        self.results = results

        # 保存歷史
        if self.history_file:
            self._save_history(results)

        return results

    def _save_history(self, results: List[Dict]):
        """保存歷史數據"""
        try:
            # 讀取現有歷史
            history = []
            if self.history_file.exists():
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)

            # 添加新結果
            history.extend(results)

            # 只保留最近 1000 條記錄
            history = history[-1000:]

            # 保存
            self.history_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=2, ensure_ascii=False)

            logger.debug(f"歷史數據已保存至: {self.history_file}")

        except Exception as e:
            logger.error(f"保存歷史數據失敗: {e}")

    def get_summary(self) -> Dict:
        """
        獲取摘要統計

        Returns:
            Dict: 摘要統計
        """
        if not self.results:
            return {}

        total = len(self.results)
        ok_count = sum(1 for r in self.results if r['status'] == 'OK')
        warning_count = sum(1 for r in self.results if r['status'] == 'WARNING')
        error_count = sum(1 for r in self.results if r['status'] == 'ERROR')

        avg_response_time = sum(
            r.get('response_time_ms', 0) for r in self.results
        ) / total if total > 0 else 0

        return {
            'total_endpoints': total,
            'ok': ok_count,
            'warning': warning_count,
            'error': error_count,
            'success_rate': round((ok_count / total) * 100, 2) if total > 0 else 0,
            'avg_response_time_ms': round(avg_response_time, 2)
        }

    def print_report(self):
        """列印報告"""
        print("\n" + "=" * 80)
        print("API 監控報告")
        print("=" * 80)
        print(f"時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"檢查端點: {len(self.results)} 個")
        print("=" * 80)

        summary = self.get_summary()

        print(f"\n總覽:")
        print(f"  ✓ 正常: {summary['ok']}")
        print(f"  ⚠ 警告: {summary['warning']}")
        print(f"  ✗ 錯誤: {summary['error']}")
        print(f"  成功率: {summary['success_rate']}%")
        print(f"  平均響應時間: {summary['avg_response_time_ms']}ms")

        print("\n詳細結果:")
        print("-" * 80)

        for i, result in enumerate(self.results, 1):
            status_icon = {
                'OK': '✓',
                'WARNING': '⚠',
                'ERROR': '✗',
                'UNKNOWN': '?'
            }.get(result['status'], '?')

            print(f"\n{i}. {result['name']}")
            print(f"   URL: {result['url']}")
            print(f"   狀態: {status_icon} {result['status']}")
            print(f"   狀態碼: {result.get('status_code', 'N/A')}")
            print(f"   響應時間: {result.get('response_time_ms', 'N/A')}ms")

            if 'error' in result:
                print(f"   錯誤: {result['error']}")

            if result.get('slow_response'):
                print(f"   ⚠ 響應緩慢")

        print("\n" + "=" * 80)

    def send_alerts(self):
        """發送告警通知"""
        if not self.notifier:
            return

        # 檢查是否有錯誤或警告
        errors = [r for r in self.results if r['status'] in ['ERROR', 'WARNING']]

        if not errors:
            logger.info("所有端點正常，無需發送告警")
            return

        # 構建告警消息
        summary = self.get_summary()

        message = f"""
🚨 API 監控告警

時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

總覽:
- 總端點: {summary['total_endpoints']}
- 錯誤: {summary['error']}
- 警告: {summary['warning']}
- 成功率: {summary['success_rate']}%

問題端點:
"""

        for error in errors:
            message += f"\n❌ {error['name']}"
            message += f"\n   URL: {error['url']}"
            message += f"\n   狀態: {error['status']}"
            if 'error' in error:
                message += f"\n   錯誤: {error['error']}"
            message += "\n"

        # 發送通知
        logger.info("發送告警通知...")

        # 發送 Slack 通知
        self.notifier.send_slack(message)

        # 發送郵件通知
        # self.notifier.send_email(
        #     subject="API 監控告警",
        #     body=message,
        #     to_emails=['admin@example.com']
        # )


def load_endpoints_from_config(config_path: Path) -> List[APIEndpoint]:
    """
    從配置文件載入端點

    Args:
        config_path: 配置文件路徑

    Returns:
        List[APIEndpoint]: 端點列表
    """
    try:
        if ConfigManager:
            config = ConfigManager.load_config(config_path)
        else:
            with open(config_path, 'r') as f:
                config = json.load(f)

        if not config or 'endpoints' not in config:
            logger.error("配置文件格式錯誤")
            return []

        endpoints = []
        for ep_config in config['endpoints']:
            endpoint = APIEndpoint(
                url=ep_config['url'],
                method=ep_config.get('method', 'GET'),
                headers=ep_config.get('headers'),
                data=ep_config.get('data'),
                timeout=ep_config.get('timeout', 30),
                expected_status=ep_config.get('expected_status', 200),
                expected_response=ep_config.get('expected_response')
            )
            endpoints.append(endpoint)

        return endpoints

    except Exception as e:
        logger.error(f"載入配置失敗: {e}")
        return []


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description='API 監控工具 - 監控 API 端點健康狀態',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用範例:
  # 監控單個 API
  %(prog)s --url https://api.example.com/health

  # 使用配置文件監控多個 API
  %(prog)s --config api_monitor_config.json

  # 持續監控（每5分鐘檢查一次）
  %(prog)s --config api_monitor_config.json --interval 300

  # 輸出 JSON 格式
  %(prog)s --url https://api.example.com/status --output json

配置文件格式 (JSON):
{
  "endpoints": [
    {
      "url": "https://api.example.com/health",
      "method": "GET",
      "expected_status": 200,
      "timeout": 10
    },
    {
      "url": "https://api.example.com/data",
      "method": "POST",
      "headers": {"Content-Type": "application/json"},
      "data": {"query": "test"},
      "expected_response": {"status": "success"}
    }
  ],
  "notifications": {
    "slack": {
      "webhook_url": "https://hooks.slack.com/..."
    }
  }
}
        """
    )

    parser.add_argument(
        '--url',
        help='要監控的 API URL（單個端點）'
    )

    parser.add_argument(
        '--config',
        help='配置文件路徑（JSON/YAML）'
    )

    parser.add_argument(
        '--method',
        default='GET',
        choices=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
        help='HTTP 方法（預設: GET）'
    )

    parser.add_argument(
        '--expected-status',
        type=int,
        default=200,
        help='預期狀態碼（預設: 200）'
    )

    parser.add_argument(
        '--timeout',
        type=int,
        default=30,
        help='請求超時時間（秒，預設: 30）'
    )

    parser.add_argument(
        '--interval',
        type=int,
        help='持續監控間隔時間（秒）'
    )

    parser.add_argument(
        '--history',
        help='歷史數據文件路徑'
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
    else:
        logger.setLevel(logging.INFO)

    # 載入端點
    endpoints = []

    if args.config:
        config_path = Path(args.config)
        if not config_path.exists():
            logger.error(f"配置文件不存在: {config_path}")
            sys.exit(1)
        endpoints = load_endpoints_from_config(config_path)
    elif args.url:
        endpoint = APIEndpoint(
            url=args.url,
            method=args.method,
            timeout=args.timeout,
            expected_status=args.expected_status
        )
        endpoints = [endpoint]
    else:
        parser.error('請指定 --url 或 --config')

    if not endpoints:
        logger.error("沒有可用的端點")
        sys.exit(1)

    # 設定歷史文件
    history_file = Path(args.history) if args.history else None

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
    monitor = APIMonitor(
        endpoints=endpoints,
        history_file=history_file,
        notifier=notifier
    )

    try:
        if args.interval:
            # 持續監控模式
            logger.info(f"開始持續監控（間隔: {args.interval}秒）")
            logger.info("按 Ctrl+C 停止")

            while True:
                results = monitor.check_all()

                if args.output == 'json':
                    print(json.dumps({
                        'results': results,
                        'summary': monitor.get_summary()
                    }, indent=2, ensure_ascii=False))
                else:
                    monitor.print_report()

                if args.notify:
                    monitor.send_alerts()

                time.sleep(args.interval)
        else:
            # 單次檢查
            results = monitor.check_all()

            if args.output == 'json':
                print(json.dumps({
                    'results': results,
                    'summary': monitor.get_summary()
                }, indent=2, ensure_ascii=False))
            else:
                monitor.print_report()

            if args.notify:
                monitor.send_alerts()

            # 根據結果設定退出碼
            summary = monitor.get_summary()
            if summary['error'] > 0:
                sys.exit(2)
            elif summary['warning'] > 0:
                sys.exit(1)
            else:
                sys.exit(0)

    except KeyboardInterrupt:
        logger.info("\n監控已停止")
        sys.exit(0)
    except Exception as e:
        logger.error(f"發生錯誤: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
