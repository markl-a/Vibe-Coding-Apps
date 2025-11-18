#!/usr/bin/env python3
"""
security_scanner.py - 安全掃描工具
全面的代碼安全掃描和漏洞檢測
"""

import os
import sys
import argparse
import re
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import hashlib


@dataclass
class SecurityIssue:
    """安全問題"""
    severity: str  # 'critical', 'high', 'medium', 'low'
    category: str  # 'injection', 'xss', 'auth', 'crypto', 'secret', 'file', 'config'
    file: str
    line: int
    code: str
    description: str
    recommendation: str
    cwe_id: Optional[str] = None  # CWE 編號


class SecurityScanner:
    """安全掃描器"""

    def __init__(self):
        self.issues = []
        self.scanned_files = 0
        self.patterns = self._init_security_patterns()

    def _init_security_patterns(self) -> Dict:
        """初始化安全模式"""
        return {
            # SQL 注入
            'sql_injection': [
                (r'execute\s*\(\s*["\'].*%s.*["\']\s*%', 'SQL 注入風險：使用字符串格式化'),
                (r'execute\s*\(\s*.*\+.*\)', 'SQL 注入風險：使用字符串拼接'),
                (r'\.raw\s*\(\s*["\'].*\+', 'SQL 注入風險：使用原始 SQL 查詢'),
            ],
            # 命令注入
            'command_injection': [
                (r'os\.system\s*\(.*\+', '命令注入風險：使用 os.system 與字符串拼接'),
                (r'subprocess\.(call|run|Popen).*shell\s*=\s*True', '命令注入風險：使用 shell=True'),
                (r'eval\s*\(', '代碼注入風險：使用 eval()'),
                (r'exec\s*\(', '代碼注入風險：使用 exec()'),
            ],
            # XSS
            'xss': [
                (r'innerHTML\s*=', 'XSS 風險：直接設置 innerHTML'),
                (r'document\.write\s*\(', 'XSS 風險：使用 document.write'),
                (r'render_template_string\s*\(.*\+', 'XSS 風險：模板注入'),
            ],
            # 硬編碼密鑰
            'hardcoded_secrets': [
                (r'password\s*=\s*["\'][^"\']{8,}["\']', '硬編碼密碼'),
                (r'api[_-]?key\s*=\s*["\'][^"\']{20,}["\']', '硬編碼 API 密鑰'),
                (r'secret[_-]?key\s*=\s*["\'][^"\']{20,}["\']', '硬編碼密鑰'),
                (r'aws[_-]?access[_-]?key', 'AWS 訪問密鑰'),
                (r'(private[_-]?key|-----BEGIN (RSA |EC )?PRIVATE KEY-----)', '私鑰洩露'),
            ],
            # 加密問題
            'weak_crypto': [
                (r'hashlib\.(md5|sha1)\s*\(', '弱加密算法：MD5/SHA1 已不安全'),
                (r'DES|RC4', '弱加密算法：DES/RC4 已過時'),
                (r'random\.random\(\)', '不安全的隨機數生成器（用於安全目的）'),
            ],
            # 反序列化
            'deserialization': [
                (r'pickle\.(loads?|dump)', 'pickle 反序列化風險'),
                (r'yaml\.load\s*\((?!.*Loader=)', 'YAML 不安全加載'),
            ],
            # 文件操作
            'file_operations': [
                (r'open\s*\(.*\+', '文件路徑遍歷風險'),
                (r'os\.path\.join\s*\(.*input', '路徑注入風險'),
            ],
            # CSRF
            'csrf': [
                (r'csrf_exempt', 'CSRF 保護已禁用'),
            ],
            # 調試模式
            'debug_mode': [
                (r'DEBUG\s*=\s*True', '生產環境中啟用調試模式'),
                (r'app\.debug\s*=\s*True', 'Flask 調試模式啟用'),
            ],
        }

    def scan_file(self, file_path: str) -> List[SecurityIssue]:
        """掃描單個文件"""
        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"文件不存在: {file_path}")

        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()

        file_issues = []

        # 掃描每一行
        for line_num, line in enumerate(lines, 1):
            for category, patterns in self.patterns.items():
                for pattern, description in patterns:
                    if re.search(pattern, line, re.IGNORECASE):
                        severity = self._determine_severity(category)
                        cwe_id = self._get_cwe_id(category)

                        issue = SecurityIssue(
                            severity=severity,
                            category=category,
                            file=str(path),
                            line=line_num,
                            code=line.strip(),
                            description=description,
                            recommendation=self._get_recommendation(category),
                            cwe_id=cwe_id
                        )
                        file_issues.append(issue)

        # 檢查文件權限
        file_issues.extend(self._check_file_permissions(path))

        # 檢查敏感文件
        file_issues.extend(self._check_sensitive_files(path))

        self.issues.extend(file_issues)
        self.scanned_files += 1

        return file_issues

    def scan_directory(self, directory: str, pattern: str = '*',
                      recursive: bool = True, exclude: Optional[List[str]] = None) -> Dict:
        """掃描目錄"""
        path = Path(directory)

        if not path.is_dir():
            raise NotADirectoryError(f"不是目錄: {directory}")

        exclude = exclude or ['__pycache__', 'node_modules', '.git', 'venv', '.venv', 'dist', 'build']

        # 查找文件
        glob_method = path.rglob if recursive else path.glob

        for file_path in glob_method(pattern):
            if file_path.is_file():
                # 檢查是否應該排除
                if any(exc in str(file_path) for exc in exclude):
                    continue

                try:
                    self.scan_file(str(file_path))
                except Exception as e:
                    print(f"警告: 無法掃描 {file_path}: {e}", file=sys.stderr)

        return self._generate_summary()

    def _check_file_permissions(self, path: Path) -> List[SecurityIssue]:
        """檢查文件權限"""
        issues = []

        try:
            stat = path.stat()
            mode = stat.st_mode

            # 檢查是否對所有人可寫
            if mode & 0o002:
                issues.append(SecurityIssue(
                    severity='medium',
                    category='file',
                    file=str(path),
                    line=0,
                    code='',
                    description='文件對所有人可寫',
                    recommendation='移除其他用戶的寫權限: chmod o-w',
                    cwe_id='CWE-732'
                ))

            # 檢查是否可執行（如果是配置文件）
            if path.suffix in ['.yml', '.yaml', '.json', '.ini', '.env'] and mode & 0o111:
                issues.append(SecurityIssue(
                    severity='low',
                    category='file',
                    file=str(path),
                    line=0,
                    code='',
                    description='配置文件不應該可執行',
                    recommendation='移除執行權限: chmod -x',
                    cwe_id='CWE-732'
                ))

        except Exception:
            pass

        return issues

    def _check_sensitive_files(self, path: Path) -> List[SecurityIssue]:
        """檢查敏感文件"""
        issues = []

        sensitive_files = [
            '.env', '.secret', 'secrets.yml', 'credentials.json',
            'id_rsa', 'id_dsa', 'id_ecdsa', 'id_ed25519',
            '.aws/credentials', '.ssh/id_rsa'
        ]

        if any(sensitive in str(path) for sensitive in sensitive_files):
            issues.append(SecurityIssue(
                severity='high',
                category='secret',
                file=str(path),
                line=0,
                code='',
                description='敏感文件檢測',
                recommendation='確保此文件不會被提交到版本控制系統，添加到 .gitignore',
                cwe_id='CWE-540'
            ))

        return issues

    def _determine_severity(self, category: str) -> str:
        """確定嚴重程度"""
        severity_map = {
            'sql_injection': 'critical',
            'command_injection': 'critical',
            'hardcoded_secrets': 'critical',
            'xss': 'high',
            'deserialization': 'high',
            'weak_crypto': 'medium',
            'file_operations': 'medium',
            'csrf': 'medium',
            'debug_mode': 'low',
        }
        return severity_map.get(category, 'medium')

    def _get_cwe_id(self, category: str) -> Optional[str]:
        """獲取 CWE 編號"""
        cwe_map = {
            'sql_injection': 'CWE-89',
            'command_injection': 'CWE-78',
            'xss': 'CWE-79',
            'hardcoded_secrets': 'CWE-798',
            'weak_crypto': 'CWE-327',
            'deserialization': 'CWE-502',
            'file_operations': 'CWE-22',
            'csrf': 'CWE-352',
        }
        return cwe_map.get(category)

    def _get_recommendation(self, category: str) -> str:
        """獲取修復建議"""
        recommendations = {
            'sql_injection': '使用參數化查詢或 ORM，避免字符串拼接',
            'command_injection': '使用 subprocess 的列表參數，避免 shell=True',
            'xss': '使用模板引擎的自動轉義功能，驗證和過濾用戶輸入',
            'hardcoded_secrets': '使用環境變量或密鑰管理服務（如 AWS Secrets Manager）',
            'weak_crypto': '使用 SHA-256 或更強的算法，使用 secrets 模組生成隨機數',
            'deserialization': '使用 JSON 或其他安全的序列化格式，驗證數據來源',
            'file_operations': '驗證文件路徑，使用白名單，禁止 ../ 等路徑遍歷',
            'csrf': '啟用 CSRF 保護，使用 CSRF token',
            'debug_mode': '在生產環境中禁用調試模式',
        }
        return recommendations.get(category, '查看安全最佳實踐')

    def _generate_summary(self) -> Dict:
        """生成摘要"""
        summary = {
            'scanned_files': self.scanned_files,
            'total_issues': len(self.issues),
            'by_severity': {
                'critical': sum(1 for i in self.issues if i.severity == 'critical'),
                'high': sum(1 for i in self.issues if i.severity == 'high'),
                'medium': sum(1 for i in self.issues if i.severity == 'medium'),
                'low': sum(1 for i in self.issues if i.severity == 'low'),
            },
            'by_category': {}
        }

        for issue in self.issues:
            summary['by_category'][issue.category] = \
                summary['by_category'].get(issue.category, 0) + 1

        return summary

    def generate_report(self, format: str = 'text', output_file: Optional[str] = None):
        """生成報告"""
        if format == 'json':
            report = self._generate_json_report()
        elif format == 'html':
            report = self._generate_html_report()
        elif format == 'sarif':
            report = self._generate_sarif_report()
        else:
            report = self._generate_text_report()

        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"\n✓ 報告已儲存至: {output_file}")
        else:
            print(report)

    def _generate_text_report(self) -> str:
        """生成文字報告"""
        summary = self._generate_summary()

        lines = [
            "\n" + "="*80,
            "🔒 安全掃描報告",
            "="*80,
            f"\n生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"\n掃描檔案數: {summary['scanned_files']}",
            f"發現問題數: {summary['total_issues']}",
            f"\n按嚴重程度:",
            f"  🔴 嚴重 (Critical): {summary['by_severity']['critical']}",
            f"  🟠 高 (High):      {summary['by_severity']['high']}",
            f"  🟡 中 (Medium):    {summary['by_severity']['medium']}",
            f"  🔵 低 (Low):       {summary['by_severity']['low']}",
        ]

        if summary['by_category']:
            lines.append("\n按類別:")
            for category, count in sorted(summary['by_category'].items(), key=lambda x: -x[1]):
                lines.append(f"  - {category}: {count}")

        # 詳細問題
        if self.issues:
            lines.append(f"\n{'='*80}")
            lines.append("問題詳情:")
            lines.append("="*80)

            # 按嚴重程度排序
            severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
            sorted_issues = sorted(self.issues, key=lambda x: severity_order.get(x.severity, 99))

            for i, issue in enumerate(sorted_issues, 1):
                severity_icon = {
                    'critical': '🔴',
                    'high': '🟠',
                    'medium': '🟡',
                    'low': '🔵'
                }.get(issue.severity, '⚪')

                lines.append(f"\n{i}. {severity_icon} [{issue.severity.upper()}] {issue.category}")
                lines.append(f"   文件: {issue.file}:{issue.line}")
                lines.append(f"   問題: {issue.description}")

                if issue.cwe_id:
                    lines.append(f"   CWE: {issue.cwe_id}")

                if issue.code:
                    lines.append(f"   代碼: {issue.code[:100]}")

                lines.append(f"   💡 建議: {issue.recommendation}")

        lines.append("\n" + "="*80)

        # 總結建議
        if summary['by_severity']['critical'] > 0:
            lines.append("\n⚠️  發現嚴重安全問題，建議立即修復！")
        elif summary['by_severity']['high'] > 0:
            lines.append("\n⚠️  發現高危安全問題，建議儘快修復。")
        elif summary['total_issues'] > 0:
            lines.append("\n✓ 未發現嚴重安全問題，但仍有一些改進空間。")
        else:
            lines.append("\n✓ 未發現安全問題，代碼看起來安全！")

        lines.append("="*80)
        return '\n'.join(lines)

    def _generate_json_report(self) -> str:
        """生成 JSON 報告"""
        summary = self._generate_summary()

        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': summary,
            'issues': [
                {
                    'severity': issue.severity,
                    'category': issue.category,
                    'file': issue.file,
                    'line': issue.line,
                    'code': issue.code,
                    'description': issue.description,
                    'recommendation': issue.recommendation,
                    'cwe_id': issue.cwe_id
                }
                for issue in self.issues
            ]
        }

        return json.dumps(report, indent=2, ensure_ascii=False)

    def _generate_html_report(self) -> str:
        """生成 HTML 報告"""
        summary = self._generate_summary()

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>安全掃描報告</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }}
        h1 {{ color: #333; border-bottom: 3px solid #e74c3c; padding-bottom: 10px; }}
        .summary {{ background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .stats {{ display: flex; gap: 20px; flex-wrap: wrap; }}
        .stat {{ flex: 1; min-width: 120px; padding: 15px; border-radius: 5px; text-align: center; color: white; }}
        .stat-value {{ font-size: 32px; font-weight: bold; margin: 10px 0; }}
        .critical {{ background: #e74c3c; }}
        .high {{ background: #ff9800; }}
        .medium {{ background: #ffc107; }}
        .low {{ background: #2196F3; }}
        .issue {{ margin: 15px 0; padding: 15px; border-left: 4px solid #ddd; background: #fafafa; border-radius: 3px; }}
        .issue.critical {{ border-left-color: #e74c3c; background: #ffebee; }}
        .issue.high {{ border-left-color: #ff9800; background: #fff3e0; }}
        .issue.medium {{ border-left-color: #ffc107; background: #fffde7; }}
        .issue.low {{ border-left-color: #2196F3; background: #e3f2fd; }}
        .code {{ background: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 3px; margin: 10px 0; font-family: monospace; overflow-x: auto; }}
        .recommendation {{ background: #e8f5e9; padding: 10px; border-radius: 3px; margin: 10px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🔒 安全掃描報告</h1>

        <div class="summary">
            <h2>掃描摘要</h2>
            <p>掃描檔案數: {summary['scanned_files']}</p>
            <p>發現問題數: {summary['total_issues']}</p>

            <div class="stats">
                <div class="stat critical">
                    <div>嚴重</div>
                    <div class="stat-value">{summary['by_severity']['critical']}</div>
                </div>
                <div class="stat high">
                    <div>高</div>
                    <div class="stat-value">{summary['by_severity']['high']}</div>
                </div>
                <div class="stat medium">
                    <div>中</div>
                    <div class="stat-value">{summary['by_severity']['medium']}</div>
                </div>
                <div class="stat low">
                    <div>低</div>
                    <div class="stat-value">{summary['by_severity']['low']}</div>
                </div>
            </div>
        </div>

        <h2>問題詳情</h2>
"""

        # 按嚴重程度排序
        severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        sorted_issues = sorted(self.issues, key=lambda x: severity_order.get(x.severity, 99))

        for issue in sorted_issues:
            html += f"""
        <div class="issue {issue.severity}">
            <h3>[{issue.severity.upper()}] {issue.category}</h3>
            <p><strong>文件:</strong> {issue.file}:{issue.line}</p>
            <p><strong>問題:</strong> {issue.description}</p>
"""
            if issue.cwe_id:
                html += f'<p><strong>CWE:</strong> {issue.cwe_id}</p>'

            if issue.code:
                html += f'<div class="code">{issue.code}</div>'

            html += f'<div class="recommendation">💡 建議: {issue.recommendation}</div>'
            html += '</div>'

        html += """
    </div>
</body>
</html>
"""
        return html

    def _generate_sarif_report(self) -> str:
        """生成 SARIF 格式報告（用於 GitHub Security）"""
        results = []

        for issue in self.issues:
            results.append({
                'ruleId': issue.cwe_id or issue.category,
                'level': {'critical': 'error', 'high': 'error', 'medium': 'warning', 'low': 'note'}.get(issue.severity, 'warning'),
                'message': {
                    'text': issue.description
                },
                'locations': [{
                    'physicalLocation': {
                        'artifactLocation': {
                            'uri': issue.file
                        },
                        'region': {
                            'startLine': issue.line
                        }
                    }
                }]
            })

        sarif = {
            'version': '2.1.0',
            '$schema': 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
            'runs': [{
                'tool': {
                    'driver': {
                        'name': 'Security Scanner',
                        'version': '1.0.0',
                        'informationUri': 'https://github.com/your-repo/security-scanner'
                    }
                },
                'results': results
            }]
        }

        return json.dumps(sarif, indent=2, ensure_ascii=False)


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="安全掃描工具 - 全面的代碼安全掃描和漏洞檢測",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s file.py                          # 掃描單個檔案
  %(prog)s src/                             # 掃描目錄
  %(prog)s src/ -f html -o security_report.html  # 生成 HTML 報告
  %(prog)s src/ -f sarif -o results.sarif   # 生成 SARIF 報告（GitHub）
  %(prog)s src/ --pattern "*.py" --exclude venv,tests  # 自訂掃描
        """
    )

    parser.add_argument('path', help='檔案或目錄路徑')
    parser.add_argument('--format', '-f',
                       choices=['text', 'json', 'html', 'sarif'],
                       default='text',
                       help='報告格式')
    parser.add_argument('-o', '--output', help='輸出檔案路徑')
    parser.add_argument('--pattern', default='*',
                       help='檔案匹配模式')
    parser.add_argument('--exclude', help='排除的目錄（逗號分隔）')
    parser.add_argument('--no-recursive', action='store_true',
                       help='不遞歸搜索子目錄')

    args = parser.parse_args()

    scanner = SecurityScanner()

    try:
        path = Path(args.path)
        exclude = args.exclude.split(',') if args.exclude else None

        if path.is_file():
            # 掃描單個文件
            scanner.scan_file(str(path))

        elif path.is_dir():
            # 掃描目錄
            scanner.scan_directory(
                str(path),
                pattern=args.pattern,
                recursive=not args.no_recursive,
                exclude=exclude
            )

        else:
            print(f"錯誤: 路徑不存在: {args.path}", file=sys.stderr)
            sys.exit(1)

        # 生成報告
        scanner.generate_report(format=args.format, output_file=args.output)

        # 如果有嚴重或高危問題，返回非零退出碼
        summary = scanner._generate_summary()
        if summary['by_severity']['critical'] > 0 or summary['by_severity']['high'] > 0:
            sys.exit(1)

    except Exception as e:
        print(f"\n錯誤: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
