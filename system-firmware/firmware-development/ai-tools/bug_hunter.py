#!/usr/bin/env python3
"""
Bug Hunter - AI Bug 檢測工具
靜態分析、常見錯誤檢測、邊界條件檢查和資源洩漏檢測
"""

import os
import sys
import json
import argparse
import anthropic
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional


class BugHunter:
    """AI 驅動的 Bug 檢測器"""

    def __init__(self, api_key: Optional[str] = None):
        """初始化 Bug 檢測器

        Args:
            api_key: Anthropic API 密鑰
        """
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("未提供 ANTHROPIC_API_KEY")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-5-20250929"

    def read_source_code(self, file_path: str) -> str:
        """讀取源代碼

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

    def static_analysis(self, code: str, language: str = "C") -> Dict:
        """靜態分析

        Args:
            code: 源代碼
            language: 編程語言

        Returns:
            靜態分析結果
        """
        prompt = f"""請對以下 {language} 代碼進行深入的靜態分析。

代碼：
```{language.lower()}
{code}
```

請檢查以下問題：
1. 語法和語義錯誤
2. 類型不匹配
3. 未使用的變量和函數
4. 死代碼
5. 不可達代碼
6. 無限循環風險
7. 遞迴深度問題
8. 控制流問題

請以 JSON 格式返回結果，包含：
- total_issues (總問題數)
- critical_issues (嚴重問題列表，每個包含:
  - severity (critical/high/medium/low)
  - type
  - line
  - description
  - code_snippet
  - fix_suggestion)
- warnings (警告列表)
- code_quality_score (0-100)
- recommendations (改進建議)
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
                "error": f"靜態分析失敗: {str(e)}",
                "total_issues": 0
            }

    def detect_common_errors(self, code: str, language: str = "C") -> Dict:
        """檢測常見錯誤

        Args:
            code: 源代碼
            language: 編程語言

        Returns:
            常見錯誤檢測結果
        """
        prompt = f"""請檢測以下 {language} 代碼中的常見錯誤。

代碼：
```{language.lower()}
{code}
```

請檢查以下常見錯誤：
1. 空指針解引用
2. 數組越界訪問
3. 緩衝區溢出
4. 整數溢出/下溢
5. 除零錯誤
6. 使用未初始化變量
7. 錯誤的運算符使用 (==/=, &&/||)
8. 格式字符串漏洞
9. 符號錯誤（有符號/無符號混用）
10. 懸空指針
11. 重複釋放記憶體
12. 類型轉換錯誤

請以 JSON 格式返回結果，包含：
- errors (錯誤列表，每個包含:
  - error_type
  - severity (critical/high/medium/low)
  - line
  - description
  - vulnerable_code
  - fix_suggestion
  - cwe_id (如適用))
- error_statistics (錯誤統計)
- most_critical (最嚴重的問題)
- fix_priority (修復優先級列表)
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
                "error": f"常見錯誤檢測失敗: {str(e)}",
                "errors": []
            }

    def check_boundary_conditions(self, code: str, language: str = "C") -> Dict:
        """檢查邊界條件

        Args:
            code: 源代碼
            language: 編程語言

        Returns:
            邊界條件檢查結果
        """
        prompt = f"""請檢查以下 {language} 代碼的邊界條件處理。

代碼：
```{language.lower()}
{code}
```

請檢查以下邊界條件：
1. 數組索引邊界
2. 循環邊界
3. 數值範圍檢查
4. 字符串長度檢查
5. 記憶體分配大小
6. 輸入參數驗證
7. 空值檢查
8. 資源限制檢查
9. 溢出保護
10. 邊緣情況處理

請以 JSON 格式返回結果，包含：
- boundary_issues (邊界問題列表，每個包含:
  - issue_type
  - severity
  - line
  - description
  - missing_check
  - recommended_check
  - test_cases)
- unchecked_inputs (未檢查的輸入)
- missing_validations (缺失的驗證)
- edge_cases (需要處理的邊緣情況)
- recommendations (建議)
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
                "error": f"邊界條件檢查失敗: {str(e)}",
                "boundary_issues": []
            }

    def detect_resource_leaks(self, code: str, language: str = "C") -> Dict:
        """檢測資源洩漏

        Args:
            code: 源代碼
            language: 編程語言

        Returns:
            資源洩漏檢測結果
        """
        prompt = f"""請檢測以下 {language} 代碼中的資源洩漏。

代碼：
```{language.lower()}
{code}
```

請檢查以下資源洩漏：
1. 記憶體洩漏（malloc/free 不匹配）
2. 文件句柄洩漏
3. 互斥鎖未釋放
4. 信號量洩漏
5. 套接字未關閉
6. 定時器未停止
7. 中斷未禁用
8. DMA 通道未釋放
9. GPIO 引腳未釋放
10. 電源域未關閉

請以 JSON 格式返回結果，包含：
- resource_leaks (資源洩漏列表，每個包含:
  - resource_type
  - severity
  - allocation_line
  - missing_release
  - leak_path
  - fix_suggestion
  - impact)
- allocation_tracking (資源分配追蹤)
- cleanup_recommendations (清理建議)
- best_practices (最佳實踐建議)
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
                "error": f"資源洩漏檢測失敗: {str(e)}",
                "resource_leaks": []
            }

    def generate_bug_report(self, file_path: str, language: str = "C",
                          include_static: bool = True,
                          include_common_errors: bool = True,
                          include_boundary: bool = True,
                          include_leaks: bool = True) -> Dict:
        """生成 Bug 檢測報告

        Args:
            file_path: 源文件路徑
            language: 編程語言
            include_static: 包含靜態分析
            include_common_errors: 包含常見錯誤檢測
            include_boundary: 包含邊界條件檢查
            include_leaks: 包含資源洩漏檢測

        Returns:
            完整的 Bug 檢測報告
        """
        code = self.read_source_code(file_path)

        print(f"正在檢測文件中的 Bug: {file_path}")
        print("=" * 60)

        report = {
            "file": file_path,
            "timestamp": datetime.now().isoformat(),
            "language": language,
            "code_length": len(code),
            "line_count": len(code.splitlines()),
            "analysis_results": {}
        }

        if include_static:
            print("1. 正在進行靜態分析...")
            report["analysis_results"]["static_analysis"] = self.static_analysis(code, language)

        if include_common_errors:
            print("2. 正在檢測常見錯誤...")
            report["analysis_results"]["common_errors"] = self.detect_common_errors(code, language)

        if include_boundary:
            print("3. 正在檢查邊界條件...")
            report["analysis_results"]["boundary_conditions"] = self.check_boundary_conditions(code, language)

        if include_leaks:
            print("4. 正在檢測資源洩漏...")
            report["analysis_results"]["resource_leaks"] = self.detect_resource_leaks(code, language)

        # 計算總體統計
        total_issues = 0
        critical_count = 0

        for analysis_type, results in report["analysis_results"].items():
            if "total_issues" in results:
                total_issues += results["total_issues"]
            if "critical_issues" in results:
                critical_count += len(results.get("critical_issues", []))
            if "errors" in results:
                total_issues += len(results.get("errors", []))

        report["summary"] = {
            "total_issues": total_issues,
            "critical_issues": critical_count,
            "analysis_timestamp": datetime.now().isoformat()
        }

        print("=" * 60)
        print(f"Bug 檢測完成！發現 {total_issues} 個問題，其中 {critical_count} 個嚴重問題")

        return report

    def save_report(self, report: Dict, output_file: str, format: str = "json"):
        """保存報告

        Args:
            report: Bug 檢測報告
            output_file: 輸出文件路徑
            format: 輸出格式
        """
        if format == "json":
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
        elif format == "html":
            html_content = self._generate_html_report(report)
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html_content)

        print(f"Bug 報告已保存至: {output_file}")

    def _generate_html_report(self, report: Dict) -> str:
        """生成 HTML 格式的 Bug 報告"""
        summary = report.get("summary", {})

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bug 檢測報告 - {report.get('file', 'Unknown')}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .header {{
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
        }}
        .summary {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .summary h2 {{
            color: #ff6b6b;
            margin-top: 0;
        }}
        .stat {{
            display: inline-block;
            margin: 10px 20px;
            padding: 15px;
            background: #fff5f5;
            border-left: 4px solid #ff6b6b;
            border-radius: 4px;
        }}
        .stat-value {{
            font-size: 32px;
            font-weight: bold;
            color: #ff6b6b;
        }}
        .stat-label {{
            color: #666;
            font-size: 14px;
        }}
        .section {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .section h2 {{
            color: #ff6b6b;
            border-bottom: 2px solid #ff6b6b;
            padding-bottom: 10px;
        }}
        .issue {{
            background: #fff5f5;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #ff6b6b;
            border-radius: 4px;
        }}
        .critical {{
            background: #ffe0e0;
            border-left-color: #dc3545;
        }}
        .high {{
            background: #fff0e0;
            border-left-color: #fd7e14;
        }}
        .medium {{
            background: #fffbe0;
            border-left-color: #ffc107;
        }}
        .low {{
            background: #f0f8ff;
            border-left-color: #17a2b8;
        }}
        pre {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
        }}
        .meta-info {{
            color: #f0f0f0;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Bug 檢測報告</h1>
        <div class="meta-info">
            <p>文件: {report.get('file', 'N/A')}</p>
            <p>時間: {report.get('timestamp', 'N/A')}</p>
            <p>語言: {report.get('language', 'N/A')}</p>
            <p>代碼行數: {report.get('line_count', 'N/A')}</p>
        </div>
    </div>

    <div class="summary">
        <h2>檢測摘要</h2>
        <div class="stat">
            <div class="stat-value">{summary.get('total_issues', 0)}</div>
            <div class="stat-label">總問題數</div>
        </div>
        <div class="stat">
            <div class="stat-value">{summary.get('critical_issues', 0)}</div>
            <div class="stat-label">嚴重問題</div>
        </div>
    </div>

    <div class="section">
        <h2>靜態分析</h2>
        <pre>{json.dumps(report.get('analysis_results', {}).get('static_analysis', {}), indent=2, ensure_ascii=False)}</pre>
    </div>

    <div class="section">
        <h2>常見錯誤</h2>
        <pre>{json.dumps(report.get('analysis_results', {}).get('common_errors', {}), indent=2, ensure_ascii=False)}</pre>
    </div>

    <div class="section">
        <h2>邊界條件</h2>
        <pre>{json.dumps(report.get('analysis_results', {}).get('boundary_conditions', {}), indent=2, ensure_ascii=False)}</pre>
    </div>

    <div class="section">
        <h2>資源洩漏</h2>
        <pre>{json.dumps(report.get('analysis_results', {}).get('resource_leaks', {}), indent=2, ensure_ascii=False)}</pre>
    </div>
</body>
</html>
"""
        return html


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="AI Bug 檢測工具 - 靜態分析和常見錯誤檢測",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 完整的 Bug 檢測
  %(prog)s source.c -o bug_report.json

  # 僅進行靜態分析
  %(prog)s source.c --static-only -o static_analysis.json

  # 檢測常見錯誤和資源洩漏
  %(prog)s source.c --common-errors --leaks -o report.json

  # 生成 HTML 格式報告
  %(prog)s source.c -o bug_report.html -f html

  # 檢查邊界條件
  %(prog)s source.c --boundary-only -o boundary_check.json
        """
    )

    parser.add_argument("input", help="要檢測的源文件")
    parser.add_argument("-o", "--output", help="輸出報告文件路徑")
    parser.add_argument("-f", "--format", choices=["json", "html"], default="json",
                       help="輸出格式 (默認: json)")
    parser.add_argument("-l", "--language", default="C",
                       help="編程語言 (默認: C)")
    parser.add_argument("--static-only", action="store_true",
                       help="僅進行靜態分析")
    parser.add_argument("--common-errors", action="store_true",
                       help="檢測常見錯誤")
    parser.add_argument("--boundary-only", action="store_true",
                       help="僅檢查邊界條件")
    parser.add_argument("--leaks", action="store_true",
                       help="檢測資源洩漏")
    parser.add_argument("--api-key", help="Anthropic API 密鑰")

    args = parser.parse_args()

    try:
        # 創建 Bug 檢測器
        hunter = BugHunter(api_key=args.api_key)

        # 決定要進行哪些檢測
        detect_all = not (args.static_only or args.common_errors or
                         args.boundary_only or args.leaks)

        # 生成 Bug 報告
        report = hunter.generate_bug_report(
            args.input,
            language=args.language,
            include_static=detect_all or args.static_only,
            include_common_errors=detect_all or args.common_errors,
            include_boundary=detect_all or args.boundary_only,
            include_leaks=detect_all or args.leaks
        )

        # 輸出結果
        if args.output:
            hunter.save_report(report, args.output, args.format)
        else:
            print(json.dumps(report, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
