#!/usr/bin/env python3
"""
test_runner.py - 測試執行器
智能測試執行和報告工具
"""

import os
import sys
import argparse
import subprocess
import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import concurrent.futures


class TestRunner:
    """測試執行器類別"""

    def __init__(self, test_dir: str = 'tests'):
        self.test_dir = Path(test_dir)
        self.results = []

    def discover_tests(self, pattern: str = 'test_*.py') -> List[Path]:
        """自動發現測試檔案"""
        if not self.test_dir.exists():
            return []

        tests = []
        for test_file in self.test_dir.rglob(pattern):
            if test_file.is_file() and not self._should_ignore(test_file):
                tests.append(test_file)

        return sorted(tests)

    def run_tests(self, test_files: Optional[List[str]] = None,
                 parallel: int = 1, coverage: bool = False,
                 retry: int = 0, failed_only: bool = False,
                 verbose: bool = False) -> Dict:
        """執行測試"""
        start_time = datetime.now()

        # 發現測試
        if test_files:
            tests = [Path(f) for f in test_files]
        elif failed_only:
            tests = self._get_failed_tests()
        else:
            tests = self.discover_tests()

        if not tests:
            return {
                'status': 'no_tests',
                'message': '未找到測試檔案',
                'total': 0
            }

        print(f"\n發現 {len(tests)} 個測試檔案\n")

        # 執行測試
        if parallel > 1:
            results = self._run_parallel(tests, parallel, coverage, verbose)
        else:
            results = self._run_sequential(tests, coverage, verbose)

        # 重試失敗的測試
        if retry > 0:
            failed_tests = [r for r in results if r['status'] == 'failed']
            for _ in range(retry):
                if not failed_tests:
                    break
                print(f"\n重試 {len(failed_tests)} 個失敗的測試...\n")
                retry_results = self._run_sequential(
                    [r['file'] for r in failed_tests],
                    coverage, verbose
                )
                # 更新結果
                for old, new in zip(failed_tests, retry_results):
                    if new['status'] == 'passed':
                        old.update(new)

        # 統計
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        passed = sum(1 for r in results if r['status'] == 'passed')
        failed = sum(1 for r in results if r['status'] == 'failed')
        skipped = sum(1 for r in results if r['status'] == 'skipped')

        summary = {
            'total': len(results),
            'passed': passed,
            'failed': failed,
            'skipped': skipped,
            'duration': duration,
            'results': results
        }

        self.results = results
        return summary

    def _run_sequential(self, tests: List[Path], coverage: bool,
                       verbose: bool) -> List[Dict]:
        """順序執行測試"""
        results = []
        for test_file in tests:
            result = self._run_single_test(test_file, coverage, verbose)
            results.append(result)
        return results

    def _run_parallel(self, tests: List[Path], workers: int,
                     coverage: bool, verbose: bool) -> List[Dict]:
        """平行執行測試"""
        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {
                executor.submit(self._run_single_test, test, coverage, verbose): test
                for test in tests
            }

            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                results.append(result)

        return results

    def _run_single_test(self, test_file: Path, coverage: bool,
                        verbose: bool) -> Dict:
        """執行單個測試"""
        cmd = ['pytest', str(test_file), '-v']

        if coverage:
            cmd.extend(['--cov=.', '--cov-report=term-missing'])

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )

            status = 'passed' if result.returncode == 0 else 'failed'

            if verbose:
                print(f"\n{'='*60}")
                print(f"測試: {test_file}")
                print(f"狀態: {status}")
                print(f"{'='*60}")
                print(result.stdout)
                if result.stderr:
                    print("錯誤輸出:")
                    print(result.stderr)

            return {
                'file': test_file,
                'status': status,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }

        except subprocess.TimeoutExpired:
            return {
                'file': test_file,
                'status': 'timeout',
                'error': '測試超時'
            }
        except Exception as e:
            return {
                'file': test_file,
                'status': 'error',
                'error': str(e)
            }

    def generate_report(self, summary: Dict, format: str = 'text',
                       output_file: Optional[str] = None):
        """生成測試報告"""
        if format == 'html':
            report = self._generate_html_report(summary)
        elif format == 'json':
            report = self._generate_json_report(summary)
        else:
            report = self._generate_text_report(summary)

        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"\n報告已儲存至: {output_file}")
        else:
            print(report)

    def _generate_text_report(self, summary: Dict) -> str:
        """生成文字報告"""
        lines = [
            "\n" + "="*60,
            "測試報告",
            "="*60,
            f"\n總計: {summary['total']}",
            f"通過: {summary['passed']} ✓",
            f"失敗: {summary['failed']} ✗",
            f"跳過: {summary['skipped']} ○",
            f"執行時間: {summary['duration']:.2f} 秒",
            "\n詳細結果:",
            "-"*60
        ]

        for result in summary['results']:
            status_symbol = {
                'passed': '✓',
                'failed': '✗',
                'skipped': '○',
                'timeout': '⏱',
                'error': '⚠'
            }.get(result['status'], '?')

            lines.append(f"{status_symbol} {result['file']}")

            if result['status'] == 'failed' and 'stderr' in result:
                lines.append(f"  錯誤: {result['stderr'][:200]}")

        lines.append("="*60)
        return '\n'.join(lines)

    def _generate_json_report(self, summary: Dict) -> str:
        """生成 JSON 報告"""
        # 轉換 Path 物件為字串
        report_data = summary.copy()
        report_data['results'] = [
            {**r, 'file': str(r['file'])} for r in summary['results']
        ]
        return json.dumps(report_data, indent=2, ensure_ascii=False)

    def _generate_html_report(self, summary: Dict) -> str:
        """生成 HTML 報告"""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>測試報告</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .summary {{ background: #f0f0f0; padding: 20px; border-radius: 5px; }}
        .passed {{ color: green; }}
        .failed {{ color: red; }}
        .skipped {{ color: gray; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
    </style>
</head>
<body>
    <h1>測試報告</h1>

    <div class="summary">
        <h2>摘要</h2>
        <p>總計: {summary['total']}</p>
        <p class="passed">通過: {summary['passed']}</p>
        <p class="failed">失敗: {summary['failed']}</p>
        <p class="skipped">跳過: {summary['skipped']}</p>
        <p>執行時間: {summary['duration']:.2f} 秒</p>
    </div>

    <h2>詳細結果</h2>
    <table>
        <tr>
            <th>狀態</th>
            <th>測試檔案</th>
        </tr>
"""

        for result in summary['results']:
            status_class = result['status']
            html += f"""
        <tr>
            <td class="{status_class}">{result['status']}</td>
            <td>{result['file']}</td>
        </tr>
"""

        html += """
    </table>
</body>
</html>
"""
        return html

    def _should_ignore(self, path: Path) -> bool:
        """檢查是否應該忽略此檔案"""
        ignore_patterns = ['__pycache__', '.pytest_cache', '__init__.py']
        return any(pattern in str(path) for pattern in ignore_patterns)

    def _get_failed_tests(self) -> List[Path]:
        """取得上次失敗的測試"""
        # 從快取中讀取失敗的測試
        cache_file = Path('.test_failures.json')
        if cache_file.exists():
            with open(cache_file, 'r') as f:
                data = json.load(f)
                return [Path(f) for f in data.get('failed_tests', [])]
        return []

    def _save_failed_tests(self, failed_tests: List[Path]):
        """儲存失敗的測試到快取"""
        cache_file = Path('.test_failures.json')
        with open(cache_file, 'w') as f:
            json.dump({
                'failed_tests': [str(f) for f in failed_tests],
                'timestamp': datetime.now().isoformat()
            }, f)


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="測試執行器 - 智能測試執行和報告",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s                              # 執行所有測試
  %(prog)s tests/test_user.py           # 執行特定測試
  %(prog)s --coverage                   # 產生覆蓋率報告
  %(prog)s --parallel 4                 # 平行執行（4 個工作）
  %(prog)s --retry 3                    # 失敗重試 3 次
  %(prog)s --failed-only                # 只執行上次失敗的測試
  %(prog)s --html report.html           # 生成 HTML 報告
        """
    )

    parser.add_argument('tests', nargs='*', help='測試檔案（可選）')
    parser.add_argument('--coverage', action='store_true',
                       help='產生覆蓋率報告')
    parser.add_argument('--parallel', type=int, default=1,
                       help='平行執行的工作數')
    parser.add_argument('--retry', type=int, default=0,
                       help='失敗重試次數')
    parser.add_argument('--failed-only', action='store_true',
                       help='只執行上次失敗的測試')
    parser.add_argument('--html', metavar='FILE',
                       help='生成 HTML 報告')
    parser.add_argument('--json', metavar='FILE',
                       help='生成 JSON 報告')
    parser.add_argument('--xml', metavar='FILE',
                       help='生成 XML 報告（JUnit 格式）')
    parser.add_argument('-v', '--verbose', action='store_true',
                       help='詳細輸出')
    parser.add_argument('--test-dir', default='tests',
                       help='測試目錄（預設：tests）')

    args = parser.parse_args()

    runner = TestRunner(test_dir=args.test_dir)

    try:
        # 執行測試
        summary = runner.run_tests(
            test_files=args.tests if args.tests else None,
            parallel=args.parallel,
            coverage=args.coverage,
            retry=args.retry,
            failed_only=args.failed_only,
            verbose=args.verbose
        )

        if summary['total'] == 0:
            print(summary['message'])
            sys.exit(0)

        # 生成報告
        if args.html:
            runner.generate_report(summary, format='html', output_file=args.html)
        elif args.json:
            runner.generate_report(summary, format='json', output_file=args.json)
        else:
            runner.generate_report(summary, format='text')

        # 儲存失敗的測試
        if summary['failed'] > 0:
            failed_tests = [
                r['file'] for r in summary['results']
                if r['status'] == 'failed'
            ]
            runner._save_failed_tests(failed_tests)

        # 退出碼
        sys.exit(0 if summary['failed'] == 0 else 1)

    except Exception as e:
        print(f"\n錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
