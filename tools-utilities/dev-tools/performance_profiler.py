#!/usr/bin/env python3
"""
performance_profiler.py - 性能分析工具
分析程式碼性能並提供優化建議
"""

import os
import sys
import argparse
import cProfile
import pstats
import io
import time
import json
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from datetime import datetime
import tracemalloc
import linecache


@dataclass
class PerformanceMetric:
    """性能指標"""
    function_name: str
    calls: int
    total_time: float
    cumulative_time: float
    per_call_time: float
    filename: str
    line_number: int


@dataclass
class MemorySnapshot:
    """內存快照"""
    current: float  # MB
    peak: float  # MB
    top_allocations: List[Dict]


class PerformanceProfiler:
    """性能分析器"""

    def __init__(self):
        self.profiler = None
        self.results = {}
        self.memory_enabled = False

    def profile_function(self, func: Callable, *args, **kwargs) -> Dict:
        """分析單個函數的性能"""
        # CPU 分析
        profiler = cProfile.Profile()

        # 內存追蹤
        if self.memory_enabled:
            tracemalloc.start()

        start_time = time.perf_counter()

        # 執行函數
        profiler.enable()
        try:
            result = func(*args, **kwargs)
            success = True
            error = None
        except Exception as e:
            result = None
            success = False
            error = str(e)
        finally:
            profiler.disable()

        end_time = time.perf_counter()
        execution_time = end_time - start_time

        # 收集統計
        stats = self._extract_stats(profiler)

        # 內存統計
        memory_stats = None
        if self.memory_enabled:
            memory_stats = self._get_memory_stats()
            tracemalloc.stop()

        return {
            'function': func.__name__,
            'success': success,
            'error': error,
            'execution_time': execution_time,
            'cpu_stats': stats,
            'memory_stats': memory_stats,
            'result': result
        }

    def profile_script(self, script_path: str) -> Dict:
        """分析整個腳本的性能"""
        path = Path(script_path)

        if not path.exists():
            raise FileNotFoundError(f"腳本不存在: {script_path}")

        # 讀取腳本
        with open(path, 'r', encoding='utf-8') as f:
            code = f.read()

        # 創建命名空間
        namespace = {
            '__name__': '__main__',
            '__file__': str(path)
        }

        # 啟用分析器
        profiler = cProfile.Profile()

        if self.memory_enabled:
            tracemalloc.start()

        start_time = time.perf_counter()

        # 執行腳本
        profiler.enable()
        try:
            exec(code, namespace)
            success = True
            error = None
        except Exception as e:
            success = False
            error = str(e)
            traceback.print_exc()
        finally:
            profiler.disable()

        end_time = time.perf_counter()
        execution_time = end_time - start_time

        # 收集統計
        stats = self._extract_stats(profiler)

        # 內存統計
        memory_stats = None
        if self.memory_enabled:
            memory_stats = self._get_memory_stats()
            tracemalloc.stop()

        # 性能建議
        recommendations = self._generate_recommendations(stats, execution_time)

        return {
            'script': str(path),
            'success': success,
            'error': error,
            'execution_time': execution_time,
            'cpu_stats': stats,
            'memory_stats': memory_stats,
            'recommendations': recommendations
        }

    def profile_module(self, module_name: str, function_name: Optional[str] = None) -> Dict:
        """分析模組的性能"""
        try:
            # 動態導入模組
            import importlib
            module = importlib.import_module(module_name)

            if function_name:
                # 分析特定函數
                func = getattr(module, function_name)
                return self.profile_function(func)
            else:
                # 分析整個模組
                profiler = cProfile.Profile()
                profiler.enable()

                # 重新加載模組
                importlib.reload(module)

                profiler.disable()

                stats = self._extract_stats(profiler)

                return {
                    'module': module_name,
                    'cpu_stats': stats
                }

        except ImportError as e:
            return {
                'module': module_name,
                'error': f"無法導入模組: {e}"
            }
        except AttributeError as e:
            return {
                'module': module_name,
                'function': function_name,
                'error': f"函數不存在: {e}"
            }

    def benchmark(self, func: Callable, iterations: int = 100,
                 warmup: int = 10, *args, **kwargs) -> Dict:
        """基準測試"""
        print(f"執行基準測試: {func.__name__}")
        print(f"熱身迭代: {warmup}, 測試迭代: {iterations}")

        # 熱身
        for _ in range(warmup):
            func(*args, **kwargs)

        # 基準測試
        times = []
        for i in range(iterations):
            start = time.perf_counter()
            func(*args, **kwargs)
            end = time.perf_counter()
            times.append(end - start)

            if (i + 1) % 10 == 0:
                print(f"進度: {i + 1}/{iterations}")

        # 統計
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)

        # 計算標準差
        variance = sum((t - avg_time) ** 2 for t in times) / len(times)
        std_dev = variance ** 0.5

        return {
            'function': func.__name__,
            'iterations': iterations,
            'warmup': warmup,
            'average_time': avg_time,
            'min_time': min_time,
            'max_time': max_time,
            'std_dev': std_dev,
            'total_time': sum(times),
            'throughput': 1.0 / avg_time if avg_time > 0 else 0
        }

    def compare_functions(self, functions: List[Callable],
                         iterations: int = 100, *args, **kwargs) -> Dict:
        """比較多個函數的性能"""
        results = []

        for func in functions:
            benchmark_result = self.benchmark(func, iterations, *args, **kwargs)
            results.append(benchmark_result)

        # 找出最快的函數
        best = min(results, key=lambda x: x['average_time'])

        # 計算相對性能
        for result in results:
            result['relative_performance'] = result['average_time'] / best['average_time']
            result['speedup'] = best['average_time'] / result['average_time']

        return {
            'results': results,
            'best_function': best['function'],
            'comparison': results
        }

    def _extract_stats(self, profiler: cProfile.Profile) -> List[Dict]:
        """提取統計信息"""
        stream = io.StringIO()
        stats = pstats.Stats(profiler, stream=stream)
        stats.strip_dirs()
        stats.sort_stats('cumulative')

        # 獲取前 20 個最耗時的函數
        metrics = []
        for func, (cc, nc, tt, ct, callers) in stats.stats.items():
            filename, line, func_name = func

            metrics.append({
                'function': func_name,
                'filename': filename,
                'line': line,
                'calls': nc,
                'total_time': tt,
                'cumulative_time': ct,
                'per_call_time': tt / nc if nc > 0 else 0
            })

        # 按累積時間排序
        metrics.sort(key=lambda x: x['cumulative_time'], reverse=True)

        return metrics[:20]  # 返回前 20 個

    def _get_memory_stats(self) -> Dict:
        """獲取內存統計"""
        current, peak = tracemalloc.get_traced_memory()

        # 獲取前 10 個內存分配
        snapshot = tracemalloc.take_snapshot()
        top_stats = snapshot.statistics('lineno')

        top_allocations = []
        for stat in top_stats[:10]:
            top_allocations.append({
                'file': stat.traceback.format()[0] if stat.traceback else 'unknown',
                'size_mb': stat.size / 1024 / 1024,
                'count': stat.count
            })

        return {
            'current_mb': current / 1024 / 1024,
            'peak_mb': peak / 1024 / 1024,
            'top_allocations': top_allocations
        }

    def _generate_recommendations(self, stats: List[Dict],
                                  execution_time: float) -> List[Dict]:
        """生成性能優化建議"""
        recommendations = []

        # 檢查慢函數
        for metric in stats[:5]:  # 檢查前 5 個最慢的函數
            if metric['cumulative_time'] > 1.0:  # 超過 1 秒
                recommendations.append({
                    'severity': 'high',
                    'category': 'performance',
                    'function': metric['function'],
                    'message': f"函數 '{metric['function']}' 耗時 {metric['cumulative_time']:.2f} 秒",
                    'suggestion': "考慮優化此函數的實現或使用緩存"
                })

        # 檢查頻繁調用
        for metric in stats:
            if metric['calls'] > 1000:
                recommendations.append({
                    'severity': 'medium',
                    'category': 'performance',
                    'function': metric['function'],
                    'message': f"函數 '{metric['function']}' 被調用 {metric['calls']} 次",
                    'suggestion': "考慮減少調用次數或使用緩存機制"
                })

        # 檢查總執行時間
        if execution_time > 10.0:
            recommendations.append({
                'severity': 'high',
                'category': 'performance',
                'message': f"總執行時間過長: {execution_time:.2f} 秒",
                'suggestion': "考慮使用並行處理或優化算法"
            })

        return recommendations

    def generate_report(self, profile_result: Dict, format: str = 'text',
                       output_file: Optional[str] = None):
        """生成性能報告"""
        if format == 'json':
            report = self._generate_json_report(profile_result)
        elif format == 'html':
            report = self._generate_html_report(profile_result)
        else:
            report = self._generate_text_report(profile_result)

        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"\n✓ 報告已儲存至: {output_file}")
        else:
            print(report)

    def _generate_text_report(self, result: Dict) -> str:
        """生成文字報告"""
        lines = [
            "\n" + "="*80,
            "性能分析報告",
            "="*80,
            f"\n生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        ]

        # 基本信息
        if 'script' in result:
            lines.append(f"\n腳本: {result['script']}")
        elif 'function' in result:
            lines.append(f"\n函數: {result['function']}")

        lines.append(f"執行狀態: {'成功' if result.get('success', True) else '失敗'}")

        if result.get('error'):
            lines.append(f"錯誤: {result['error']}")

        lines.append(f"執行時間: {result.get('execution_time', 0):.4f} 秒")

        # CPU 統計
        if 'cpu_stats' in result and result['cpu_stats']:
            lines.append(f"\n{'='*80}")
            lines.append("CPU 性能統計 (前 10 個最耗時的函數)")
            lines.append("="*80)
            lines.append(f"{'函數':<40} {'調用次數':>10} {'總時間(秒)':>15} {'累積時間(秒)':>15}")
            lines.append("-"*80)

            for stat in result['cpu_stats'][:10]:
                lines.append(
                    f"{stat['function'][:40]:<40} "
                    f"{stat['calls']:>10} "
                    f"{stat['total_time']:>15.4f} "
                    f"{stat['cumulative_time']:>15.4f}"
                )

        # 內存統計
        if result.get('memory_stats'):
            mem = result['memory_stats']
            lines.append(f"\n{'='*80}")
            lines.append("內存使用統計")
            lines.append("="*80)
            lines.append(f"當前內存: {mem['current_mb']:.2f} MB")
            lines.append(f"峰值內存: {mem['peak_mb']:.2f} MB")

            if mem.get('top_allocations'):
                lines.append("\n內存分配前 5 名:")
                for i, alloc in enumerate(mem['top_allocations'][:5], 1):
                    lines.append(f"{i}. {alloc['file']}")
                    lines.append(f"   大小: {alloc['size_mb']:.2f} MB, 次數: {alloc['count']}")

        # 性能建議
        if result.get('recommendations'):
            lines.append(f"\n{'='*80}")
            lines.append("性能優化建議")
            lines.append("="*80)

            for i, rec in enumerate(result['recommendations'], 1):
                severity_icon = {
                    'high': '🔴',
                    'medium': '🟡',
                    'low': '🔵'
                }.get(rec['severity'], '⚪')

                lines.append(f"\n{i}. {severity_icon} [{rec['category']}]")
                lines.append(f"   {rec['message']}")
                if rec.get('suggestion'):
                    lines.append(f"   💡 建議: {rec['suggestion']}")

        # 基準測試結果
        if 'iterations' in result:
            lines.append(f"\n{'='*80}")
            lines.append("基準測試結果")
            lines.append("="*80)
            lines.append(f"迭代次數: {result['iterations']}")
            lines.append(f"平均時間: {result['average_time']*1000:.4f} ms")
            lines.append(f"最小時間: {result['min_time']*1000:.4f} ms")
            lines.append(f"最大時間: {result['max_time']*1000:.4f} ms")
            lines.append(f"標準差: {result['std_dev']*1000:.4f} ms")
            lines.append(f"吞吐量: {result['throughput']:.2f} ops/sec")

        lines.append("\n" + "="*80)
        return '\n'.join(lines)

    def _generate_json_report(self, result: Dict) -> str:
        """生成 JSON 報告"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'profile_result': result
        }
        return json.dumps(report, indent=2, ensure_ascii=False)

    def _generate_html_report(self, result: Dict) -> str:
        """生成 HTML 報告"""
        execution_time = result.get('execution_time', 0)

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>性能分析報告</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }}
        h1 {{ color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }}
        .summary {{ background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        tr:nth-child(even) {{ background-color: #f9f9f9; }}
        .recommendation {{ margin: 10px 0; padding: 15px; border-left: 4px solid #ddd; background: #fafafa; }}
        .high {{ border-left-color: #f44336; }}
        .medium {{ border-left-color: #ff9800; }}
        .low {{ border-left-color: #2196F3; }}
        .metric {{ display: inline-block; margin: 10px; padding: 15px; background: #e8f5e9; border-radius: 5px; min-width: 150px; text-align: center; }}
        .metric-value {{ font-size: 24px; font-weight: bold; color: #4CAF50; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>⚡ 性能分析報告</h1>

        <div class="summary">
            <h2>執行摘要</h2>
            <div class="metric">
                <div>執行時間</div>
                <div class="metric-value">{execution_time:.4f}s</div>
            </div>
"""

        if result.get('memory_stats'):
            mem = result['memory_stats']
            html += f"""
            <div class="metric">
                <div>峰值內存</div>
                <div class="metric-value">{mem['peak_mb']:.2f} MB</div>
            </div>
"""

        html += "</div>"

        # CPU 統計表
        if result.get('cpu_stats'):
            html += """
        <h2>CPU 性能統計</h2>
        <table>
            <tr>
                <th>函數</th>
                <th>調用次數</th>
                <th>總時間 (秒)</th>
                <th>累積時間 (秒)</th>
                <th>每次調用 (秒)</th>
            </tr>
"""
            for stat in result['cpu_stats'][:15]:
                html += f"""
            <tr>
                <td>{stat['function']}</td>
                <td>{stat['calls']}</td>
                <td>{stat['total_time']:.6f}</td>
                <td>{stat['cumulative_time']:.6f}</td>
                <td>{stat['per_call_time']:.6f}</td>
            </tr>
"""
            html += "</table>"

        # 優化建議
        if result.get('recommendations'):
            html += "<h2>性能優化建議</h2>"
            for rec in result['recommendations']:
                severity_class = rec['severity']
                html += f"""
        <div class="recommendation {severity_class}">
            <strong>[{rec['category']}] {rec['message']}</strong>
            <p>💡 建議: {rec.get('suggestion', 'N/A')}</p>
        </div>
"""

        html += """
    </div>
</body>
</html>
"""
        return html


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="性能分析工具 - 分析程式碼性能並提供優化建議",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s script.py                    # 分析腳本性能
  %(prog)s script.py --memory           # 啟用內存追蹤
  %(prog)s script.py -f html -o report.html  # 生成 HTML 報告
        """
    )

    parser.add_argument('script', nargs='?', help='要分析的腳本')
    parser.add_argument('--memory', action='store_true',
                       help='啟用內存追蹤')
    parser.add_argument('--format', '-f',
                       choices=['text', 'json', 'html'],
                       default='text',
                       help='報告格式')
    parser.add_argument('-o', '--output', help='輸出檔案路徑')

    args = parser.parse_args()

    profiler = PerformanceProfiler()
    profiler.memory_enabled = args.memory

    try:
        if args.script:
            # 分析腳本
            result = profiler.profile_script(args.script)
            profiler.generate_report(result, format=args.format, output_file=args.output)
        else:
            parser.print_help()
            sys.exit(1)

    except Exception as e:
        print(f"\n錯誤: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
