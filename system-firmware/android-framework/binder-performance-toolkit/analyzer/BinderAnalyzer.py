#!/usr/bin/env python3
"""
Binder IPC 性能分析器

分析 Android Binder 通訊的性能，提供延遲分析、吞吐量統計和 AI 輔助優化建議
"""

import re
import sys
import argparse
import json
from collections import defaultdict, Counter
from datetime import datetime
from typing import List, Dict, Tuple
import statistics

class BinderTransaction:
    """Binder 交易記錄"""
    def __init__(self, timestamp, trans_id, from_proc, to_proc, code, size=0):
        self.timestamp = timestamp
        self.trans_id = trans_id
        self.from_proc = from_proc
        self.to_proc = to_proc
        self.code = code
        self.size = size
        self.latency = None
        self.reply_timestamp = None

    def set_reply(self, reply_timestamp):
        """設置回復時間戳並計算延遲"""
        self.reply_timestamp = reply_timestamp
        self.latency = (reply_timestamp - self.timestamp) * 1000  # 轉換為 ms

class BinderAnalyzer:
    """Binder 性能分析器"""

    def __init__(self, trace_file, verbose=False):
        self.trace_file = trace_file
        self.verbose = verbose

        # 數據存儲
        self.transactions = {}  # trans_id -> BinderTransaction
        self.completed_transactions = []
        self.pending_transactions = {}

        # 統計資訊
        self.stats = {
            'total_transactions': 0,
            'completed_transactions': 0,
            'pending_transactions': 0,
            'total_latency': 0.0,
            'max_latency': 0.0,
            'min_latency': float('inf'),
            'avg_latency': 0.0,
            'by_interface': defaultdict(list),
            'by_process': defaultdict(list),
            'by_size': defaultdict(int),
        }

        # 追蹤模式
        self.trace_patterns = {
            # Perfetto/Systrace 格式
            'perfetto': re.compile(
                r'(\d+\.\d+)\s+.*binder_transaction:\s+'
                r'transaction=(\d+)\s+'
                r'from=(\d+):(\d+)\s+'
                r'to=(\d+):(\d+)\s+'
                r'code=(\w+)\s+'
                r'(?:data_size=(\d+))?'
            ),
            # ftrace 格式
            'ftrace': re.compile(
                r'^\s*[\w\-/]+\s+(\d+)\s+\[(\d+)\]\s+(\d+\.\d+):\s+'
                r'binder_transaction:\s+transaction=(\d+)'
            ),
            # logcat binder 格式
            'logcat': re.compile(
                r'(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+).*'
                r'Binder.*trans.*(\d+)'
            ),
        }

    def parse(self):
        """解析追蹤文件"""
        print(f"[*] 解析 Binder 追蹤文件: {self.trace_file}")

        try:
            with open(self.trace_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line_num, line in enumerate(f, 1):
                    self._parse_line(line, line_num)

            # 配對請求和回復
            self._match_requests_and_replies()

            print(f"[+] 解析完成")
            print(f"    總交易數: {self.stats['total_transactions']}")
            print(f"    完成交易: {self.stats['completed_transactions']}")
            print(f"    等待回復: {self.stats['pending_transactions']}")

        except FileNotFoundError:
            print(f"[!] 錯誤: 找不到文件 {self.trace_file}")
            sys.exit(1)
        except Exception as e:
            print(f"[!] 解析錯誤: {e}")
            if self.verbose:
                import traceback
                traceback.print_exc()
            sys.exit(1)

    def _parse_line(self, line, line_num):
        """解析單行追蹤"""
        # 嘗試不同的格式
        for format_name, pattern in self.trace_patterns.items():
            match = pattern.search(line)
            if match:
                if format_name == 'perfetto':
                    self._parse_perfetto_line(match, line_num)
                elif format_name == 'ftrace':
                    self._parse_ftrace_line(match, line_num)
                elif format_name == 'logcat':
                    self._parse_logcat_line(match, line_num)
                return

    def _parse_perfetto_line(self, match, line_num):
        """解析 Perfetto 格式"""
        timestamp = float(match.group(1))
        trans_id = match.group(2)
        from_pid = match.group(3)
        from_tid = match.group(4)
        to_pid = match.group(5)
        to_tid = match.group(6)
        code = match.group(7)
        size = int(match.group(8)) if match.group(8) else 0

        transaction = BinderTransaction(
            timestamp, trans_id,
            f"{from_pid}:{from_tid}",
            f"{to_pid}:{to_tid}",
            code, size
        )

        self.transactions[trans_id] = transaction
        self.stats['total_transactions'] += 1

        if self.verbose:
            print(f"[DEBUG] Line {line_num}: Transaction {trans_id} "
                  f"from {from_pid} to {to_pid}, code={code}")

    def _parse_ftrace_line(self, match, line_num):
        """解析 ftrace 格式"""
        pid = match.group(1)
        cpu = match.group(2)
        timestamp = float(match.group(3))
        trans_id = match.group(4)

        # 簡化處理
        self.stats['total_transactions'] += 1

    def _parse_logcat_line(self, match, line_num):
        """解析 logcat 格式"""
        timestamp_str = match.group(1)
        trans_id = match.group(2)

        # 簡化處理
        self.stats['total_transactions'] += 1

    def _match_requests_and_replies(self):
        """配對請求和回復，計算延遲"""
        print("[*] 配對請求和回復...")

        # 簡化實作：基於時間順序配對
        sorted_trans = sorted(self.transactions.values(),
                            key=lambda t: t.timestamp)

        for i, trans in enumerate(sorted_trans):
            # 尋找回復（同一 trans_id，稍後的時間戳）
            for j in range(i + 1, min(i + 10, len(sorted_trans))):
                next_trans = sorted_trans[j]
                if (next_trans.trans_id == trans.trans_id and
                    next_trans.timestamp > trans.timestamp):

                    trans.set_reply(next_trans.timestamp)
                    self.completed_transactions.append(trans)
                    break

        self.stats['completed_transactions'] = len(self.completed_transactions)
        self.stats['pending_transactions'] = (
            self.stats['total_transactions'] - self.stats['completed_transactions']
        )

    def analyze(self):
        """分析 Binder 性能"""
        if not self.completed_transactions:
            print("[!] 警告: 沒有完成的交易可供分析")
            return

        print("\n[*] 分析 Binder 性能...")

        # 計算延遲統計
        latencies = [t.latency for t in self.completed_transactions if t.latency]

        if latencies:
            self.stats['total_latency'] = sum(latencies)
            self.stats['max_latency'] = max(latencies)
            self.stats['min_latency'] = min(latencies)
            self.stats['avg_latency'] = statistics.mean(latencies)
            self.stats['median_latency'] = statistics.median(latencies)
            self.stats['stdev_latency'] = statistics.stdev(latencies) if len(latencies) > 1 else 0

            # 計算百分位數
            sorted_latencies = sorted(latencies)
            self.stats['p50_latency'] = sorted_latencies[len(sorted_latencies) // 2]
            self.stats['p90_latency'] = sorted_latencies[int(len(sorted_latencies) * 0.9)]
            self.stats['p95_latency'] = sorted_latencies[int(len(sorted_latencies) * 0.95)]
            self.stats['p99_latency'] = sorted_latencies[int(len(sorted_latencies) * 0.99)]

        # 按介面碼分組
        for trans in self.completed_transactions:
            if trans.code and trans.latency:
                self.stats['by_interface'][trans.code].append(trans.latency)

        # 按進程分組
        for trans in self.completed_transactions:
            if trans.latency:
                self.stats['by_process'][trans.from_proc].append(trans.latency)
                self.stats['by_process'][trans.to_proc].append(trans.latency)

        # 按大小分組
        for trans in self.completed_transactions:
            if trans.size > 0:
                size_bucket = self._get_size_bucket(trans.size)
                self.stats['by_size'][size_bucket] += 1

        print("[+] 分析完成")

    def _get_size_bucket(self, size):
        """獲取大小區間"""
        if size < 1024:
            return "< 1KB"
        elif size < 4096:
            return "1-4KB"
        elif size < 16384:
            return "4-16KB"
        elif size < 65536:
            return "16-64KB"
        else:
            return "> 64KB"

    def print_report(self):
        """打印分析報告"""
        print("\n" + "="*70)
        print("Binder Performance Analysis Report")
        print("="*70)

        # 基本統計
        print(f"\n總交易數: {self.stats['total_transactions']}")
        print(f"完成交易: {self.stats['completed_transactions']}")
        print(f"等待回復: {self.stats['pending_transactions']}")

        # 延遲統計
        if self.stats['completed_transactions'] > 0:
            print(f"\n延遲統計 (ms):")
            print(f"  平均延遲: {self.stats['avg_latency']:.2f}")
            print(f"  中位延遲: {self.stats['median_latency']:.2f}")
            print(f"  最大延遲: {self.stats['max_latency']:.2f}")
            print(f"  最小延遲: {self.stats['min_latency']:.2f}")
            print(f"  標準差:   {self.stats['stdev_latency']:.2f}")

            print(f"\n百分位延遲 (ms):")
            print(f"  P50: {self.stats['p50_latency']:.2f}")
            print(f"  P90: {self.stats['p90_latency']:.2f}")
            print(f"  P95: {self.stats['p95_latency']:.2f}")
            print(f"  P99: {self.stats['p99_latency']:.2f}")

        # 前 10 個最慢的介面
        if self.stats['by_interface']:
            print("\n" + "-"*70)
            print("前 10 個最慢的介面:")
            print("-"*70)

            interface_stats = []
            for code, latencies in self.stats['by_interface'].items():
                interface_stats.append((
                    code,
                    statistics.mean(latencies),
                    max(latencies),
                    len(latencies)
                ))

            interface_stats.sort(key=lambda x: x[1], reverse=True)

            for code, avg, max_lat, count in interface_stats[:10]:
                print(f"  Code {code:8s}: avg={avg:6.2f}ms, "
                      f"max={max_lat:6.2f}ms, count={count:5d}")

        # 前 10 個最活躍的進程
        if self.stats['by_process']:
            print("\n" + "-"*70)
            print("前 10 個最活躍的進程:")
            print("-"*70)

            process_stats = []
            for proc, latencies in self.stats['by_process'].items():
                process_stats.append((
                    proc,
                    statistics.mean(latencies),
                    len(latencies)
                ))

            process_stats.sort(key=lambda x: x[2], reverse=True)

            for proc, avg, count in process_stats[:10]:
                print(f"  {proc:20s}: avg={avg:6.2f}ms, count={count:5d}")

        # 按大小分布
        if self.stats['by_size']:
            print("\n" + "-"*70)
            print("交易大小分布:")
            print("-"*70)

            for size_bucket, count in sorted(self.stats['by_size'].items()):
                print(f"  {size_bucket:10s}: {count:5d}")

        # AI 優化建議
        suggestions = self._get_ai_suggestions()
        if suggestions:
            print("\n" + "-"*70)
            print("AI 優化建議:")
            print("-"*70)

            for i, suggestion in enumerate(suggestions, 1):
                print(f"  {i}. {suggestion}")

        print("\n" + "="*70)

    def _get_ai_suggestions(self):
        """獲取 AI 優化建議"""
        suggestions = []

        # 基於平均延遲的建議
        if self.stats.get('avg_latency', 0) > 10.0:
            suggestions.append(
                f"平均延遲較高 ({self.stats['avg_latency']:.2f}ms)，建議："
                "\n     - 減少 Binder 調用次數"
                "\n     - 使用批次操作"
                "\n     - 考慮使用共享記憶體傳輸大數據"
            )

        # 基於 P99 延遲的建議
        if self.stats.get('p99_latency', 0) > 50.0:
            suggestions.append(
                f"P99 延遲過高 ({self.stats['p99_latency']:.2f}ms)，存在性能尾延遲問題，建議："
                "\n     - 檢查是否有鎖競爭"
                "\n     - 避免在 Binder 調用中執行耗時操作"
                "\n     - 使用 oneway 異步調用"
            )

        # 基於標準差的建議
        if self.stats.get('stdev_latency', 0) > self.stats.get('avg_latency', 0):
            suggestions.append(
                "延遲波動較大，性能不穩定，建議："
                "\n     - 檢查 GC 是否影響性能"
                "\n     - 避免在主線程進行 Binder 調用"
                "\n     - 使用工作隊列處理後台任務"
            )

        # 基於交易大小的建議
        large_trans = self.stats['by_size'].get("> 64KB", 0)
        total_trans = sum(self.stats['by_size'].values()) or 1

        if large_trans / total_trans > 0.1:
            suggestions.append(
                f"大型交易比例較高 ({large_trans*100//total_trans}%)，建議："
                "\n     - 使用 Parcelable 而非 Serializable"
                "\n     - 對大數據使用共享記憶體 (Ashmem)"
                "\n     - 分批傳輸大型數據"
            )

        # 基於調用頻率的建議
        if self.stats['completed_transactions'] > 10000:
            suggestions.append(
                f"Binder 調用頻率很高 ({self.stats['completed_transactions']} 次)，建議："
                "\n     - 實作本地快取減少調用"
                "\n     - 合併相關的小操作"
                "\n     - 考慮使用觀察者模式而非輪詢"
            )

        return suggestions

    def export_json(self, output_file):
        """導出為 JSON 格式"""
        data = {
            'metadata': {
                'source_file': self.trace_file,
                'analyzed_at': datetime.now().isoformat(),
            },
            'statistics': {
                'total_transactions': self.stats['total_transactions'],
                'completed_transactions': self.stats['completed_transactions'],
                'pending_transactions': self.stats['pending_transactions'],
                'latency': {
                    'avg': self.stats.get('avg_latency', 0),
                    'median': self.stats.get('median_latency', 0),
                    'max': self.stats.get('max_latency', 0),
                    'min': self.stats.get('min_latency', float('inf')),
                    'stdev': self.stats.get('stdev_latency', 0),
                    'p50': self.stats.get('p50_latency', 0),
                    'p90': self.stats.get('p90_latency', 0),
                    'p95': self.stats.get('p95_latency', 0),
                    'p99': self.stats.get('p99_latency', 0),
                },
            },
            'by_interface': {
                k: {
                    'avg': statistics.mean(v),
                    'max': max(v),
                    'count': len(v)
                } for k, v in self.stats['by_interface'].items()
            },
            'by_process': {
                k: {
                    'avg': statistics.mean(v),
                    'count': len(v)
                } for k, v in self.stats['by_process'].items()
            },
            'by_size': dict(self.stats['by_size']),
            'suggestions': self._get_ai_suggestions(),
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"[+] JSON 已導出: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description='Android Binder IPC 性能分析器',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例:
  # 分析 Perfetto 追蹤文件
  %(prog)s binder_trace.txt

  # 詳細模式
  %(prog)s binder_trace.txt -v

  # 導出為 JSON
  %(prog)s binder_trace.txt --json report.json
        '''
    )

    parser.add_argument('trace_file', help='Binder 追蹤文件')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='詳細輸出')
    parser.add_argument('--json', metavar='FILE',
                        help='導出為 JSON 格式')

    args = parser.parse_args()

    # 創建分析器並執行分析
    analyzer = BinderAnalyzer(args.trace_file, args.verbose)
    analyzer.parse()
    analyzer.analyze()
    analyzer.print_report()

    # 導出 JSON (如果需要)
    if args.json:
        analyzer.export_json(args.json)

    print("\n[+] 分析完成!")


if __name__ == '__main__':
    main()
