#!/usr/bin/env python3
"""
AI Code Analyzer - 使用 Claude API 進行代碼質量分析
支援代碼質量分析、安全漏洞檢測、性能優化建議和記憶體使用分析
"""

import os
import sys
import json
import argparse
import anthropic
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional


class CodeAnalyzer:
    """AI 驅動的代碼分析器"""

    def __init__(self, api_key: Optional[str] = None):
        """初始化代碼分析器

        Args:
            api_key: Anthropic API 密鑰，若為 None 則從環境變量讀取
        """
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("未提供 ANTHROPIC_API_KEY")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-5-20250929"

    def read_code_file(self, file_path: str) -> str:
        """讀取代碼文件

        Args:
            file_path: 文件路徑

        Returns:
            文件內容
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            raise IOError(f"無法讀取文件 {file_path}: {e}")

    def analyze_code_quality(self, code: str, language: str = "C") -> Dict:
        """分析代碼質量

        Args:
            code: 要分析的代碼
            language: 編程語言

        Returns:
            分析結果字典
        """
        prompt = f"""請分析以下 {language} 代碼的質量，提供詳細的評估報告。

代碼：
```{language.lower()}
{code}
```

請從以下方面進行分析：
1. 代碼可讀性（命名規範、註釋、結構）
2. 代碼複雜度（圈複雜度、嵌套深度）
3. 最佳實踐遵循情況
4. 潛在的代碼異味
5. 重構建議

請以 JSON 格式返回結果，包含以下字段：
- overall_score (0-100)
- readability_score (0-100)
- complexity_score (0-100)
- issues (問題列表，每個包含 severity, line, description, suggestion)
- refactoring_suggestions (重構建議列表)
- summary (總結)
"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=8000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            result_text = message.content[0].text

            # 嘗試提取 JSON
            if "```json" in result_text:
                json_start = result_text.find("```json") + 7
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()

            return json.loads(result_text)

        except Exception as e:
            return {
                "error": f"分析失敗: {str(e)}",
                "overall_score": 0
            }

    def detect_security_vulnerabilities(self, code: str, language: str = "C") -> Dict:
        """檢測安全漏洞

        Args:
            code: 要分析的代碼
            language: 編程語言

        Returns:
            安全分析結果
        """
        prompt = f"""請對以下 {language} 代碼進行安全漏洞檢測。

代碼：
```{language.lower()}
{code}
```

請檢查以下安全問題：
1. 緩衝區溢出
2. 整數溢出/下溢
3. 空指針解引用
4. 未初始化變量
5. 記憶體洩漏
6. 競態條件
7. 注入攻擊風險
8. 加密問題

請以 JSON 格式返回結果，包含：
- security_score (0-100)
- critical_issues (嚴重問題列表)
- warnings (警告列表)
- recommendations (安全建議)
- cwe_references (相關 CWE 編號)
"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=8000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            result_text = message.content[0].text

            if "```json" in result_text:
                json_start = result_text.find("```json") + 7
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()

            return json.loads(result_text)

        except Exception as e:
            return {
                "error": f"安全分析失敗: {str(e)}",
                "security_score": 0
            }

    def analyze_performance(self, code: str, language: str = "C") -> Dict:
        """分析性能並提供優化建議

        Args:
            code: 要分析的代碼
            language: 編程語言

        Returns:
            性能分析結果
        """
        prompt = f"""請分析以下 {language} 代碼的性能，並提供優化建議。

代碼：
```{language.lower()}
{code}
```

請分析：
1. 時間複雜度
2. 空間複雜度
3. 潛在的性能瓶頸
4. 循環優化機會
5. 函數調用開銷
6. 快取利用率

請以 JSON 格式返回結果，包含：
- performance_score (0-100)
- time_complexity (估算)
- space_complexity (估算)
- bottlenecks (瓶頸列表)
- optimization_suggestions (優化建議，包含 before/after 代碼示例)
"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=8000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            result_text = message.content[0].text

            if "```json" in result_text:
                json_start = result_text.find("```json") + 7
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()

            return json.loads(result_text)

        except Exception as e:
            return {
                "error": f"性能分析失敗: {str(e)}",
                "performance_score": 0
            }

    def analyze_memory_usage(self, code: str, language: str = "C") -> Dict:
        """分析記憶體使用情況

        Args:
            code: 要分析的代碼
            language: 編程語言

        Returns:
            記憶體分析結果
        """
        prompt = f"""請分析以下 {language} 代碼的記憶體使用情況。

代碼：
```{language.lower()}
{code}
```

請分析：
1. 靜態記憶體使用（全局變量、常量）
2. 堆疊記憶體使用（局部變量）
3. 堆記憶體使用（動態分配）
4. 記憶體洩漏風險
5. 記憶體對齊問題
6. 記憶體優化建議

請以 JSON 格式返回結果，包含：
- memory_score (0-100)
- static_memory_estimate (位元組)
- stack_memory_estimate (位元組)
- heap_allocations (動態分配列表)
- memory_leaks (潛在洩漏)
- optimization_tips (優化建議)
"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=8000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            result_text = message.content[0].text

            if "```json" in result_text:
                json_start = result_text.find("```json") + 7
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()

            return json.loads(result_text)

        except Exception as e:
            return {
                "error": f"記憶體分析失敗: {str(e)}",
                "memory_score": 0
            }

    def generate_comprehensive_report(self, file_path: str, language: str = "C") -> Dict:
        """生成綜合分析報告

        Args:
            file_path: 要分析的文件路徑
            language: 編程語言

        Returns:
            完整的分析報告
        """
        code = self.read_code_file(file_path)

        print(f"正在分析文件: {file_path}")
        print("=" * 60)

        report = {
            "file": file_path,
            "timestamp": datetime.now().isoformat(),
            "language": language,
            "code_length": len(code),
            "line_count": len(code.splitlines())
        }

        # 代碼質量分析
        print("1. 正在進行代碼質量分析...")
        report["code_quality"] = self.analyze_code_quality(code, language)

        # 安全漏洞檢測
        print("2. 正在進行安全漏洞檢測...")
        report["security"] = self.detect_security_vulnerabilities(code, language)

        # 性能分析
        print("3. 正在進行性能分析...")
        report["performance"] = self.analyze_performance(code, language)

        # 記憶體分析
        print("4. 正在進行記憶體使用分析...")
        report["memory"] = self.analyze_memory_usage(code, language)

        # 計算總體評分
        scores = []
        if "overall_score" in report["code_quality"]:
            scores.append(report["code_quality"]["overall_score"])
        if "security_score" in report["security"]:
            scores.append(report["security"]["security_score"])
        if "performance_score" in report["performance"]:
            scores.append(report["performance"]["performance_score"])
        if "memory_score" in report["memory"]:
            scores.append(report["memory"]["memory_score"])

        report["overall_score"] = sum(scores) / len(scores) if scores else 0

        print("=" * 60)
        print(f"分析完成！總體評分: {report['overall_score']:.1f}/100")

        return report

    def save_report(self, report: Dict, output_file: str, format: str = "json"):
        """保存報告

        Args:
            report: 分析報告
            output_file: 輸出文件路徑
            format: 輸出格式 (json 或 html)
        """
        if format == "json":
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
        elif format == "html":
            html_content = self._generate_html_report(report)
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html_content)

        print(f"報告已保存至: {output_file}")

    def _generate_html_report(self, report: Dict) -> str:
        """生成 HTML 格式的報告"""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>代碼分析報告 - {report.get('file', 'Unknown')}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
        }}
        .score-card {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .score {{
            font-size: 48px;
            font-weight: bold;
            color: #667eea;
        }}
        .section {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .section h2 {{
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
        .issue {{
            background: #fff3cd;
            padding: 10px;
            margin: 10px 0;
            border-left: 4px solid #ffc107;
            border-radius: 4px;
        }}
        .critical {{
            background: #f8d7da;
            border-left-color: #dc3545;
        }}
        .suggestion {{
            background: #d1ecf1;
            padding: 10px;
            margin: 10px 0;
            border-left: 4px solid #17a2b8;
            border-radius: 4px;
        }}
        pre {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }}
        .meta-info {{
            color: #666;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>AI 代碼分析報告</h1>
        <div class="meta-info">
            <p>文件: {report.get('file', 'N/A')}</p>
            <p>時間: {report.get('timestamp', 'N/A')}</p>
            <p>語言: {report.get('language', 'N/A')}</p>
            <p>代碼行數: {report.get('line_count', 'N/A')}</p>
        </div>
    </div>

    <div class="score-card">
        <h2>總體評分</h2>
        <div class="score">{report.get('overall_score', 0):.1f}/100</div>
    </div>

    <div class="section">
        <h2>代碼質量分析</h2>
        <pre>{json.dumps(report.get('code_quality', {}), indent=2, ensure_ascii=False)}</pre>
    </div>

    <div class="section">
        <h2>安全漏洞檢測</h2>
        <pre>{json.dumps(report.get('security', {}), indent=2, ensure_ascii=False)}</pre>
    </div>

    <div class="section">
        <h2>性能分析</h2>
        <pre>{json.dumps(report.get('performance', {}), indent=2, ensure_ascii=False)}</pre>
    </div>

    <div class="section">
        <h2>記憶體使用分析</h2>
        <pre>{json.dumps(report.get('memory', {}), indent=2, ensure_ascii=False)}</pre>
    </div>
</body>
</html>
"""
        return html


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="AI 代碼分析工具 - 使用 Claude API 進行代碼質量分析",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 分析單個文件並生成 JSON 報告
  %(prog)s input.c -o report.json

  # 分析 C++ 文件並生成 HTML 報告
  %(prog)s main.cpp -l cpp -o report.html -f html

  # 僅進行安全分析
  %(prog)s code.c --security-only

  # 僅進行性能分析
  %(prog)s code.c --performance-only
        """
    )

    parser.add_argument("input", help="要分析的源代碼文件")
    parser.add_argument("-o", "--output", help="輸出報告文件路徑")
    parser.add_argument("-f", "--format", choices=["json", "html"], default="json",
                       help="輸出格式 (默認: json)")
    parser.add_argument("-l", "--language", default="C",
                       help="編程語言 (默認: C)")
    parser.add_argument("--quality-only", action="store_true",
                       help="僅進行代碼質量分析")
    parser.add_argument("--security-only", action="store_true",
                       help="僅進行安全分析")
    parser.add_argument("--performance-only", action="store_true",
                       help="僅進行性能分析")
    parser.add_argument("--memory-only", action="store_true",
                       help="僅進行記憶體分析")
    parser.add_argument("--api-key", help="Anthropic API 密鑰")

    args = parser.parse_args()

    try:
        # 創建分析器
        analyzer = CodeAnalyzer(api_key=args.api_key)

        # 讀取代碼
        code = analyzer.read_code_file(args.input)

        # 根據參數執行相應的分析
        if args.quality_only:
            result = analyzer.analyze_code_quality(code, args.language)
        elif args.security_only:
            result = analyzer.detect_security_vulnerabilities(code, args.language)
        elif args.performance_only:
            result = analyzer.analyze_performance(code, args.language)
        elif args.memory_only:
            result = analyzer.analyze_memory_usage(code, args.language)
        else:
            # 完整分析
            result = analyzer.generate_comprehensive_report(args.input, args.language)

        # 輸出結果
        if args.output:
            analyzer.save_report(result, args.output, args.format)
        else:
            print(json.dumps(result, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
