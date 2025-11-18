#!/usr/bin/env python3
"""
API Fetcher - API 資料提取工具

功能:
- RESTful API 資料提取
- 支援多種 HTTP 方法 (GET, POST, PUT, DELETE)
- 自動分頁處理
- 批次請求
- 資料轉換和儲存
- 錯誤處理和重試機制
- Rate limiting 支援
"""

import argparse
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
from urllib.parse import urljoin, urlparse
import pandas as pd

try:
    import requests
    from requests.adapters import HTTPAdapter
    from requests.packages.urllib3.util.retry import Retry
except ImportError:
    print("❌ 需要安裝 requests 套件: pip install requests")
    sys.exit(1)


class APIFetcher:
    """API 資料提取器"""

    def __init__(self, base_url: str, headers: Optional[Dict] = None):
        self.base_url = base_url
        self.headers = headers or {}
        self.session = self._create_session()
        self.data = []

    def _create_session(self) -> requests.Session:
        """創建帶重試機制的 session"""
        session = requests.Session()

        # 設定重試策略
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            method_whitelist=["HEAD", "GET", "OPTIONS", "POST"]
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        return session

    def fetch(self, endpoint: str, method: str = 'GET',
             params: Optional[Dict] = None,
             data: Optional[Dict] = None,
             timeout: int = 30) -> Dict[str, Any]:
        """提取單一 API 端點"""
        url = urljoin(self.base_url, endpoint)

        try:
            print(f"🔄 正在請求: {method} {url}")

            response = self.session.request(
                method=method,
                url=url,
                headers=self.headers,
                params=params,
                json=data,
                timeout=timeout
            )

            response.raise_for_status()

            # 嘗試解析 JSON
            try:
                result = response.json()
            except json.JSONDecodeError:
                result = {'text': response.text}

            print(f"✅ 請求成功 (狀態碼: {response.status_code})")
            return result

        except requests.exceptions.HTTPError as e:
            print(f"❌ HTTP 錯誤: {e}")
            return {'error': str(e), 'status_code': e.response.status_code if e.response else None}
        except requests.exceptions.ConnectionError as e:
            print(f"❌ 連接錯誤: {e}")
            return {'error': 'connection_error'}
        except requests.exceptions.Timeout as e:
            print(f"❌ 請求超時: {e}")
            return {'error': 'timeout'}
        except Exception as e:
            print(f"❌ 未知錯誤: {e}")
            return {'error': str(e)}

    def fetch_paginated(self, endpoint: str,
                       page_param: str = 'page',
                       per_page_param: str = 'per_page',
                       per_page: int = 100,
                       max_pages: Optional[int] = None,
                       data_key: Optional[str] = None) -> List[Dict]:
        """提取分頁資料"""
        print(f"\n📄 開始提取分頁資料...")

        all_data = []
        page = 1

        while True:
            if max_pages and page > max_pages:
                break

            params = {
                page_param: page,
                per_page_param: per_page
            }

            result = self.fetch(endpoint, params=params)

            if 'error' in result:
                print(f"⚠️  第 {page} 頁提取失敗")
                break

            # 提取資料
            if data_key and data_key in result:
                page_data = result[data_key]
            elif isinstance(result, list):
                page_data = result
            elif isinstance(result, dict) and 'data' in result:
                page_data = result['data']
            elif isinstance(result, dict) and 'results' in result:
                page_data = result['results']
            else:
                page_data = [result]

            if not page_data:
                print(f"✅ 第 {page} 頁無資料,提取完成")
                break

            all_data.extend(page_data)
            print(f"  • 第 {page} 頁: {len(page_data)} 筆資料")

            page += 1
            time.sleep(0.5)  # 避免請求過快

        print(f"\n✅ 總共提取 {len(all_data)} 筆資料")
        self.data = all_data
        return all_data

    def fetch_batch(self, endpoints: List[str],
                   method: str = 'GET',
                   delay: float = 0.5) -> List[Dict]:
        """批次提取多個端點"""
        print(f"\n📦 開始批次提取 {len(endpoints)} 個端點...")

        results = []

        for i, endpoint in enumerate(endpoints, 1):
            print(f"\n[{i}/{len(endpoints)}] {endpoint}")
            result = self.fetch(endpoint, method=method)
            results.append({
                'endpoint': endpoint,
                'data': result
            })

            if i < len(endpoints):
                time.sleep(delay)

        print(f"\n✅ 批次提取完成")
        return results

    def save_to_file(self, output_file: str, format: str = 'auto'):
        """儲存資料到檔案"""
        if not self.data:
            print("⚠️  無資料可儲存")
            return

        output_path = Path(output_file)

        # 自動偵測格式
        if format == 'auto':
            format = output_path.suffix[1:]  # 移除 .

        if format == 'json':
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2)

        elif format == 'csv':
            # 嘗試轉換為 DataFrame
            try:
                df = pd.DataFrame(self.data)
                df.to_csv(output_path, index=False, encoding='utf-8')
            except Exception as e:
                print(f"❌ 轉換為 CSV 失敗: {e}")
                return

        elif format == 'xlsx':
            try:
                df = pd.DataFrame(self.data)
                df.to_excel(output_path, index=False)
            except Exception as e:
                print(f"❌ 轉換為 Excel 失敗: {e}")
                return

        else:
            print(f"❌ 不支援的格式: {format}")
            return

        print(f"✅ 已儲存資料: {output_path} ({len(self.data)} 筆)")

    def print_summary(self):
        """列印摘要"""
        if not self.data:
            print("無資料")
            return

        print("\n" + "="*60)
        print("📊 資料摘要")
        print("="*60)
        print(f"總筆數: {len(self.data)}")

        if self.data and isinstance(self.data[0], dict):
            print(f"欄位數: {len(self.data[0].keys())}")
            print(f"欄位: {', '.join(list(self.data[0].keys())[:10])}")

            # 預覽前幾筆
            print(f"\n前 3 筆資料:")
            for i, item in enumerate(self.data[:3], 1):
                print(f"\n{i}. {json.dumps(item, ensure_ascii=False, indent=2)[:200]}...")

        print("="*60)


def main():
    parser = argparse.ArgumentParser(
        description='API Fetcher - API 資料提取工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  # 單一請求
  %(prog)s https://api.example.com /users/1

  # 分頁請求
  %(prog)s https://api.example.com /users --paginated --per-page 50

  # 帶認證標頭
  %(prog)s https://api.example.com /data --header "Authorization: Bearer TOKEN"

  # 儲存為 CSV
  %(prog)s https://api.example.com /users --paginated -o users.csv
        """
    )

    parser.add_argument('base_url', help='API 基礎 URL')
    parser.add_argument('endpoint', help='API 端點')
    parser.add_argument('--method', choices=['GET', 'POST', 'PUT', 'DELETE'],
                       default='GET', help='HTTP 方法')
    parser.add_argument('--header', action='append',
                       help='HTTP 標頭 (格式: "Key: Value")')
    parser.add_argument('--param', action='append',
                       help='查詢參數 (格式: "key=value")')
    parser.add_argument('--data', type=str,
                       help='請求資料 (JSON 字串)')
    parser.add_argument('--paginated', action='store_true',
                       help='啟用分頁提取')
    parser.add_argument('--page-param', default='page',
                       help='分頁參數名稱')
    parser.add_argument('--per-page-param', default='per_page',
                       help='每頁數量參數名稱')
    parser.add_argument('--per-page', type=int, default=100,
                       help='每頁數量')
    parser.add_argument('--max-pages', type=int,
                       help='最大頁數')
    parser.add_argument('--data-key', type=str,
                       help='資料鍵名')
    parser.add_argument('-o', '--output', type=str,
                       help='輸出檔案')
    parser.add_argument('--format', choices=['json', 'csv', 'xlsx', 'auto'],
                       default='auto', help='輸出格式')

    args = parser.parse_args()

    # 解析標頭
    headers = {}
    if args.header:
        for header in args.header:
            key, value = header.split(':', 1)
            headers[key.strip()] = value.strip()

    # 解析參數
    params = {}
    if args.param:
        for param in args.param:
            key, value = param.split('=', 1)
            params[key.strip()] = value.strip()

    # 解析資料
    data = None
    if args.data:
        try:
            data = json.loads(args.data)
        except json.JSONDecodeError as e:
            print(f"❌ 無效的 JSON 資料: {e}")
            sys.exit(1)

    # 創建提取器
    fetcher = APIFetcher(args.base_url, headers)

    # 執行提取
    if args.paginated:
        fetcher.fetch_paginated(
            endpoint=args.endpoint,
            page_param=args.page_param,
            per_page_param=args.per_page_param,
            per_page=args.per_page,
            max_pages=args.max_pages,
            data_key=args.data_key
        )
    else:
        result = fetcher.fetch(
            endpoint=args.endpoint,
            method=args.method,
            params=params,
            data=data
        )
        fetcher.data = [result] if not isinstance(result, list) else result

    # 列印摘要
    fetcher.print_summary()

    # 儲存檔案
    if args.output:
        fetcher.save_to_file(args.output, args.format)


if __name__ == '__main__':
    main()
