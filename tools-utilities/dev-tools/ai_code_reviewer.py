#!/usr/bin/env python3
"""
ai_code_reviewer.py - AI 代碼審查工具
使用 AI 輔助進行代碼審查和質量分析
"""

import os
import sys
import argparse
import ast
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import json


@dataclass
class CodeIssue:
    """代碼問題"""
    severity: str  # 'critical', 'warning', 'info'
    category: str  # 'performance', 'security', 'style', 'bug', 'best_practice'
    line: int
    column: int
    message: str
    suggestion: Optional[str] = None
    code_snippet: Optional[str] = None


class AICodeReviewer:
    """AI 代碼審查器"""

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.issues = []
        self.metrics = {
            'total_lines': 0,
            'code_lines': 0,
            'comment_lines': 0,
            'blank_lines': 0,
            'complexity': 0,
            'maintainability_index': 0
        }

    def review_file(self, file_path: str, language: str = 'python') -> Dict:
        """審查單個檔案"""
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"檔案不存在: {file_path}")

        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        self.issues = []

        # 根據語言選擇審查方法
        if language == 'python':
            self._review_python(content, path)
        else:
            self._review_generic(content, path)

        # 計算指標
        self._calculate_metrics(content)

        return {
            'file': str(path),
            'language': language,
            'issues': [self._issue_to_dict(issue) for issue in self.issues],
            'metrics': self.metrics,
            'summary': self._generate_summary()
        }

    def review_directory(self, directory: str, pattern: str = '*.py',
                        recursive: bool = True) -> List[Dict]:
        """批次審查目錄"""
        results = []
        path = Path(directory)

        if not path.is_dir():
            raise NotADirectoryError(f"不是目錄: {directory}")

        # 查找檔案
        glob_method = path.rglob if recursive else path.glob
        for file_path in glob_method(pattern):
            if file_path.is_file() and not self._should_ignore(file_path):
                try:
                    language = self._detect_language(file_path)
                    result = self.review_file(str(file_path), language)
                    results.append(result)
                except Exception as e:
                    results.append({
                        'file': str(file_path),
                        'error': str(e)
                    })

        return results

    def _review_python(self, content: str, path: Path):
        """審查 Python 代碼"""
        lines = content.split('\n')

        try:
            tree = ast.parse(content)

            # AST 分析
            self._check_python_ast(tree, lines)

        except SyntaxError as e:
            self.issues.append(CodeIssue(
                severity='critical',
                category='bug',
                line=e.lineno or 0,
                column=e.offset or 0,
                message=f"語法錯誤: {e.msg}",
                suggestion="修復語法錯誤"
            ))

        # 靜態分析
        self._check_python_patterns(content, lines)
        self._check_security_issues(content, lines)
        self._check_performance_issues(content, lines)
        self._check_code_style(content, lines)

    def _check_python_ast(self, tree: ast.AST, lines: List[str]):
        """檢查 Python AST"""
        for node in ast.walk(tree):
            # 檢查函數複雜度
            if isinstance(node, ast.FunctionDef):
                complexity = self._calculate_complexity(node)
                if complexity > 10:
                    self.issues.append(CodeIssue(
                        severity='warning',
                        category='best_practice',
                        line=node.lineno,
                        column=node.col_offset,
                        message=f"函數 '{node.name}' 複雜度過高 ({complexity})",
                        suggestion="考慮將函數拆分成更小的函數"
                    ))

                # 檢查函數長度
                if hasattr(node, 'end_lineno') and node.end_lineno:
                    func_lines = node.end_lineno - node.lineno
                    if func_lines > 50:
                        self.issues.append(CodeIssue(
                            severity='info',
                            category='best_practice',
                            line=node.lineno,
                            column=node.col_offset,
                            message=f"函數 '{node.name}' 過長 ({func_lines} 行)",
                            suggestion="考慮重構函數以提高可讀性"
                        ))

                # 檢查缺少文檔字符串
                if not ast.get_docstring(node):
                    self.issues.append(CodeIssue(
                        severity='info',
                        category='style',
                        line=node.lineno,
                        column=node.col_offset,
                        message=f"函數 '{node.name}' 缺少文檔字符串",
                        suggestion="添加文檔字符串描述函數的目的和參數"
                    ))

            # 檢查類別
            elif isinstance(node, ast.ClassDef):
                if not ast.get_docstring(node):
                    self.issues.append(CodeIssue(
                        severity='info',
                        category='style',
                        line=node.lineno,
                        column=node.col_offset,
                        message=f"類別 '{node.name}' 缺少文檔字符串",
                        suggestion="添加文檔字符串描述類別的目的"
                    ))

            # 檢查 try-except 過於寬泛
            elif isinstance(node, ast.ExceptHandler):
                if node.type is None:
                    self.issues.append(CodeIssue(
                        severity='warning',
                        category='best_practice',
                        line=node.lineno,
                        column=node.col_offset,
                        message="使用了裸露的 except 語句",
                        suggestion="指定具體的異常類型"
                    ))

    def _check_python_patterns(self, content: str, lines: List[str]):
        """檢查 Python 代碼模式"""
        for i, line in enumerate(lines, 1):
            # 檢查 print 語句（應該使用 logging）
            if re.search(r'\bprint\s*\(', line) and 'TODO' not in line:
                self.issues.append(CodeIssue(
                    severity='info',
                    category='best_practice',
                    line=i,
                    column=0,
                    message="使用 print 語句進行調試",
                    suggestion="考慮使用 logging 模組",
                    code_snippet=line.strip()
                ))

            # 檢查過長的行
            if len(line) > 100:
                self.issues.append(CodeIssue(
                    severity='info',
                    category='style',
                    line=i,
                    column=100,
                    message=f"行過長 ({len(line)} 字符)",
                    suggestion="建議每行不超過 100 字符"
                ))

    def _check_security_issues(self, content: str, lines: List[str]):
        """檢查安全問題"""
        security_patterns = [
            (r'eval\s*\(', 'critical', '使用 eval() 可能導致代碼注入漏洞'),
            (r'exec\s*\(', 'critical', '使用 exec() 可能導致代碼注入漏洞'),
            (r'pickle\.loads?\s*\(', 'warning', '使用 pickle 可能不安全'),
            (r'subprocess\.(?:call|run|Popen).*shell\s*=\s*True', 'critical', 'shell=True 可能導致命令注入'),
            (r'password\s*=\s*["\'].*["\']', 'critical', '代碼中硬編碼密碼'),
            (r'api[_-]?key\s*=\s*["\'].*["\']', 'critical', '代碼中硬編碼 API 密鑰'),
            (r'secret\s*=\s*["\'].*["\']', 'critical', '代碼中硬編碼密鑰'),
        ]

        for i, line in enumerate(lines, 1):
            for pattern, severity, message in security_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    self.issues.append(CodeIssue(
                        severity=severity,
                        category='security',
                        line=i,
                        column=0,
                        message=message,
                        suggestion="使用環境變量或配置文件存儲敏感信息",
                        code_snippet=line.strip()
                    ))

    def _check_performance_issues(self, content: str, lines: List[str]):
        """檢查性能問題"""
        for i, line in enumerate(lines, 1):
            # 檢查列表推導中的不必要循環
            if re.search(r'for\s+\w+\s+in\s+range\(len\(', line):
                self.issues.append(CodeIssue(
                    severity='info',
                    category='performance',
                    line=i,
                    column=0,
                    message="使用 range(len()) 遍歷列表",
                    suggestion="直接遍歷列表元素或使用 enumerate()",
                    code_snippet=line.strip()
                ))

            # 檢查字符串拼接在循環中
            if '+=' in line and ('str' in line or '"' in line or "'" in line):
                # 簡單啟發式檢查
                self.issues.append(CodeIssue(
                    severity='info',
                    category='performance',
                    line=i,
                    column=0,
                    message="在循環中使用字符串拼接可能效率低下",
                    suggestion="考慮使用 ''.join() 或列表",
                    code_snippet=line.strip()
                ))

    def _check_code_style(self, content: str, lines: List[str]):
        """檢查代碼風格"""
        for i, line in enumerate(lines, 1):
            # 檢查多個語句在一行
            if ';' in line and not line.strip().startswith('#'):
                self.issues.append(CodeIssue(
                    severity='info',
                    category='style',
                    line=i,
                    column=0,
                    message="一行中有多個語句",
                    suggestion="每個語句應該獨立一行",
                    code_snippet=line.strip()
                ))

            # 檢查行尾空白
            if line.rstrip() != line.rstrip('\n'):
                self.issues.append(CodeIssue(
                    severity='info',
                    category='style',
                    line=i,
                    column=len(line.rstrip('\n')),
                    message="行尾有多餘空白",
                    suggestion="移除行尾空白"
                ))

    def _review_generic(self, content: str, path: Path):
        """通用代碼審查"""
        lines = content.split('\n')

        # 基本檢查
        self._check_security_issues(content, lines)
        self._calculate_metrics(content)

    def _calculate_complexity(self, node: ast.FunctionDef) -> int:
        """計算循環複雜度（簡化版）"""
        complexity = 1

        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.ExceptHandler)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1

        return complexity

    def _calculate_metrics(self, content: str):
        """計算代碼指標"""
        lines = content.split('\n')
        self.metrics['total_lines'] = len(lines)

        for line in lines:
            stripped = line.strip()
            if not stripped:
                self.metrics['blank_lines'] += 1
            elif stripped.startswith('#'):
                self.metrics['comment_lines'] += 1
            else:
                self.metrics['code_lines'] += 1

        # 簡化的可維護性指數
        if self.metrics['code_lines'] > 0:
            comment_ratio = self.metrics['comment_lines'] / self.metrics['code_lines']
            self.metrics['maintainability_index'] = min(100, int(
                171 - 5.2 * (len(self.issues) / max(1, self.metrics['code_lines'] / 10)) +
                0.23 * comment_ratio * 100
            ))

    def _generate_summary(self) -> Dict:
        """生成摘要"""
        summary = {
            'total_issues': len(self.issues),
            'critical': sum(1 for i in self.issues if i.severity == 'critical'),
            'warning': sum(1 for i in self.issues if i.severity == 'warning'),
            'info': sum(1 for i in self.issues if i.severity == 'info'),
            'by_category': {}
        }

        for issue in self.issues:
            summary['by_category'][issue.category] = \
                summary['by_category'].get(issue.category, 0) + 1

        return summary

    def _issue_to_dict(self, issue: CodeIssue) -> Dict:
        """轉換問題為字典"""
        return {
            'severity': issue.severity,
            'category': issue.category,
            'line': issue.line,
            'column': issue.column,
            'message': issue.message,
            'suggestion': issue.suggestion,
            'code_snippet': issue.code_snippet
        }

    def _detect_language(self, path: Path) -> str:
        """偵測程式語言"""
        ext_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
        }
        return ext_map.get(path.suffix, 'unknown')

    def _should_ignore(self, path: Path) -> bool:
        """檢查是否應該忽略此檔案"""
        ignore_patterns = [
            '__pycache__', 'node_modules', '.git', '.venv',
            'venv', 'dist', 'build', '.pytest_cache', '__init__.py'
        ]
        return any(pattern in str(path) for pattern in ignore_patterns)

    def generate_report(self, results: List[Dict], format: str = 'text',
                       output_file: Optional[str] = None):
        """生成審查報告"""
        if format == 'json':
            report = self._generate_json_report(results)
        elif format == 'html':
            report = self._generate_html_report(results)
        else:
            report = self._generate_text_report(results)

        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"\n✓ 報告已儲存至: {output_file}")
        else:
            print(report)

    def _generate_text_report(self, results: List[Dict]) -> str:
        """生成文字報告"""
        lines = [
            "\n" + "="*80,
            "AI 代碼審查報告",
            "="*80,
            f"\n生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        ]

        # 總體統計
        total_issues = sum(r.get('summary', {}).get('total_issues', 0) for r in results)
        total_critical = sum(r.get('summary', {}).get('critical', 0) for r in results)
        total_warning = sum(r.get('summary', {}).get('warning', 0) for r in results)
        total_info = sum(r.get('summary', {}).get('info', 0) for r in results)

        lines.extend([
            f"\n審查檔案數: {len(results)}",
            f"總問題數: {total_issues}",
            f"  - 嚴重: {total_critical} 🔴",
            f"  - 警告: {total_warning} 🟡",
            f"  - 資訊: {total_info} 🔵",
        ])

        # 詳細結果
        for result in results:
            if 'error' in result:
                lines.append(f"\n✗ {result['file']}: {result['error']}")
                continue

            lines.append(f"\n{'='*80}")
            lines.append(f"檔案: {result['file']}")
            lines.append(f"{'='*80}")

            summary = result.get('summary', {})
            metrics = result.get('metrics', {})

            lines.append(f"\n問題數: {summary.get('total_issues', 0)}")
            lines.append(f"  - 嚴重: {summary.get('critical', 0)}")
            lines.append(f"  - 警告: {summary.get('warning', 0)}")
            lines.append(f"  - 資訊: {summary.get('info', 0)}")

            lines.append(f"\n代碼指標:")
            lines.append(f"  - 總行數: {metrics.get('total_lines', 0)}")
            lines.append(f"  - 代碼行數: {metrics.get('code_lines', 0)}")
            lines.append(f"  - 註解行數: {metrics.get('comment_lines', 0)}")
            lines.append(f"  - 可維護性指數: {metrics.get('maintainability_index', 0)}/100")

            # 問題詳情
            issues = result.get('issues', [])
            if issues:
                lines.append(f"\n問題詳情:")
                lines.append("-"*80)

                # 按嚴重程度排序
                severity_order = {'critical': 0, 'warning': 1, 'info': 2}
                sorted_issues = sorted(issues, key=lambda x: severity_order.get(x['severity'], 99))

                for issue in sorted_issues:
                    severity_icon = {
                        'critical': '🔴',
                        'warning': '🟡',
                        'info': '🔵'
                    }.get(issue['severity'], '⚪')

                    lines.append(f"\n{severity_icon} 行 {issue['line']}:{issue['column']} - [{issue['category']}]")
                    lines.append(f"   {issue['message']}")

                    if issue.get('suggestion'):
                        lines.append(f"   💡 建議: {issue['suggestion']}")

                    if issue.get('code_snippet'):
                        lines.append(f"   📝 代碼: {issue['code_snippet']}")

        lines.append("\n" + "="*80)
        return '\n'.join(lines)

    def _generate_json_report(self, results: List[Dict]) -> str:
        """生成 JSON 報告"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'results': results,
            'summary': {
                'total_files': len(results),
                'total_issues': sum(r.get('summary', {}).get('total_issues', 0) for r in results),
                'critical': sum(r.get('summary', {}).get('critical', 0) for r in results),
                'warning': sum(r.get('summary', {}).get('warning', 0) for r in results),
                'info': sum(r.get('summary', {}).get('info', 0) for r in results),
            }
        }
        return json.dumps(report, indent=2, ensure_ascii=False)

    def _generate_html_report(self, results: List[Dict]) -> str:
        """生成 HTML 報告"""
        total_issues = sum(r.get('summary', {}).get('total_issues', 0) for r in results)
        total_critical = sum(r.get('summary', {}).get('critical', 0) for r in results)
        total_warning = sum(r.get('summary', {}).get('warning', 0) for r in results)
        total_info = sum(r.get('summary', {}).get('info', 0) for r in results)

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI 代碼審查報告</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        h1 {{ color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }}
        .summary {{ background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .stats {{ display: flex; gap: 20px; flex-wrap: wrap; }}
        .stat {{ flex: 1; min-width: 150px; padding: 15px; background: white; border-radius: 5px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
        .stat-value {{ font-size: 32px; font-weight: bold; margin: 10px 0; }}
        .critical {{ color: #f44336; }}
        .warning {{ color: #ff9800; }}
        .info {{ color: #2196F3; }}
        .file-result {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }}
        .issue {{ margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; background: #fafafa; }}
        .issue.critical {{ border-left-color: #f44336; }}
        .issue.warning {{ border-left-color: #ff9800; }}
        .issue.info {{ border-left-color: #2196F3; }}
        .code-snippet {{ background: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 3px; margin: 10px 0; font-family: monospace; overflow-x: auto; }}
        .suggestion {{ background: #e8f5e9; padding: 8px; border-radius: 3px; margin: 5px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 AI 代碼審查報告</h1>

        <div class="summary">
            <h2>總體統計</h2>
            <div class="stats">
                <div class="stat">
                    <div>審查檔案</div>
                    <div class="stat-value">{len(results)}</div>
                </div>
                <div class="stat">
                    <div>總問題數</div>
                    <div class="stat-value">{total_issues}</div>
                </div>
                <div class="stat">
                    <div class="critical">嚴重</div>
                    <div class="stat-value critical">{total_critical}</div>
                </div>
                <div class="stat">
                    <div class="warning">警告</div>
                    <div class="stat-value warning">{total_warning}</div>
                </div>
                <div class="stat">
                    <div class="info">資訊</div>
                    <div class="stat-value info">{total_info}</div>
                </div>
            </div>
        </div>
"""

        for result in results:
            if 'error' in result:
                html += f'<div class="file-result error">❌ {result["file"]}: {result["error"]}</div>'
                continue

            summary = result.get('summary', {})
            metrics = result.get('metrics', {})
            issues = result.get('issues', [])

            html += f"""
        <div class="file-result">
            <h3>📄 {result['file']}</h3>
            <p>
                問題: {summary.get('total_issues', 0)} |
                <span class="critical">嚴重: {summary.get('critical', 0)}</span> |
                <span class="warning">警告: {summary.get('warning', 0)}</span> |
                <span class="info">資訊: {summary.get('info', 0)}</span>
            </p>
            <p>
                總行數: {metrics.get('total_lines', 0)} |
                代碼行: {metrics.get('code_lines', 0)} |
                註解行: {metrics.get('comment_lines', 0)} |
                可維護性指數: {metrics.get('maintainability_index', 0)}/100
            </p>
"""

            if issues:
                for issue in issues:
                    html += f"""
            <div class="issue {issue['severity']}">
                <strong>行 {issue['line']}:{issue['column']} - [{issue['category']}]</strong>
                <p>{issue['message']}</p>
"""
                    if issue.get('suggestion'):
                        html += f'<div class="suggestion">💡 建議: {issue["suggestion"]}</div>'

                    if issue.get('code_snippet'):
                        html += f'<div class="code-snippet">{issue["code_snippet"]}</div>'

                    html += '</div>'

            html += '</div>'

        html += """
    </div>
</body>
</html>
"""
        return html


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="AI 代碼審查工具 - 使用 AI 輔助進行代碼審查",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s file.py                      # 審查單個檔案
  %(prog)s src/                         # 審查目錄
  %(prog)s src/ --format html -o report.html  # 生成 HTML 報告
  %(prog)s src/ --format json -o report.json  # 生成 JSON 報告
        """
    )

    parser.add_argument('path', help='檔案或目錄路徑')
    parser.add_argument('--language', '-l',
                       choices=['python', 'javascript', 'typescript'],
                       help='程式語言（自動偵測）')
    parser.add_argument('--format', '-f',
                       choices=['text', 'json', 'html'],
                       default='text',
                       help='報告格式')
    parser.add_argument('-o', '--output', help='輸出檔案路徑')
    parser.add_argument('--pattern', default='*.py',
                       help='檔案匹配模式（目錄模式）')
    parser.add_argument('--no-recursive', action='store_true',
                       help='不遞歸搜索子目錄')

    args = parser.parse_args()

    reviewer = AICodeReviewer()

    try:
        path = Path(args.path)

        if path.is_file():
            # 審查單個檔案
            language = args.language or reviewer._detect_language(path)
            result = reviewer.review_file(str(path), language)
            results = [result]

        elif path.is_dir():
            # 審查目錄
            results = reviewer.review_directory(
                str(path),
                pattern=args.pattern,
                recursive=not args.no_recursive
            )

        else:
            print(f"錯誤: 路徑不存在: {args.path}", file=sys.stderr)
            sys.exit(1)

        # 生成報告
        reviewer.generate_report(results, format=args.format, output_file=args.output)

        # 如果有嚴重問題，返回非零退出碼
        total_critical = sum(r.get('summary', {}).get('critical', 0) for r in results)
        if total_critical > 0:
            sys.exit(1)

    except Exception as e:
        print(f"\n錯誤: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
